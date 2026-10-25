import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { safeBack } from '../../src/lib/safe-back';

interface StoreDetail {
  id: string;
  brandName: string;
  ownerName: string | null;
  phone: string | null;
  logoUrl: string | null;
  description: string | null;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  isTop: boolean;
  isPremium: boolean;
  country: string | null;
  city: string | null;
  district: string | null;
  addressLine: string | null;
  latitude: number | null;
  longitude: number | null;
  productsCount: number;
  productsByCategory: Array<{ categoryId: string; count: number }>;
  createdAt: string;
}

interface Product {
  id: string;
  categoryId: string;
  title: { ru: string; uz: string };
  basePriceUsd: number;
  coverUrl: string;
  variants: Array<{ color: string; colorHex: string }>;
}

type SortKey = 'popularity' | 'priceLow' | 'priceHigh' | 'new';

const CATEGORY_LABELS: Record<string, { uz: string; ru: string }> = {
  scarves: { uz: "Ro'mollar", ru: 'Платки' },
  dresses: { uz: "Ko'ylaklar", ru: 'Платья' },
  shoes: { uz: 'Poyabzallar', ru: 'Обувь' },
  bags: { uz: 'Sumkalar', ru: 'Сумки' },
  accessories: { uz: 'Aksessuarlar', ru: 'Аксессуары' },
};

export default function ShopDetailScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const lang: 'uz' | 'ru' = isRu ? 'ru' : 'uz';

  const [category, setCategory] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('popularity');
  // Products list stays open — the toggle used to collapse it, but buyers
  // land on this screen to see what's for sale, so hiding the catalog
  // behind a chevron just forced an extra tap on every open.
  const productsOpen = true;
  const setProductsOpen = (_: boolean) => {};

  const storeQ = useQuery<StoreDetail>({
    queryKey: ['store', id],
    queryFn: async () => (await api.get<StoreDetail>(`/catalog/stores/${id}`)).data,
    enabled: !!id,
  });

  const productsQ = useQuery<{ items: Product[] }>({
    queryKey: ['store-products', id, { category, color, sort }],
    queryFn: async () => (await api.get(`/catalog/products`, {
      params: {
        sellerId: id,
        ...(category && { category }),
        ...(color && { color }),
        sort,
        pageSize: 50,
      },
    })).data,
    enabled: !!id && productsOpen,
  });

  const store = storeQ.data;
  const products = productsQ.data?.items ?? [];
  const availableColors = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of products) {
      for (const v of p.variants) {
        if (!seen.has(v.color)) seen.set(v.color, v.colorHex);
      }
    }
    return Array.from(seen.entries()).map(([color, hex]) => ({ color, hex }));
  }, [products]);

  if (!store) {
    return (
      <Screen>
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => safeBack()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </Pressable>
          <Text variant="body" color="muted" style={{ fontSize: 12 }}>
            {isRu ? 'Магазин' : "Do'kon"}
          </Text>
        </View>

        {/* Profile card */}
        <View style={{ paddingHorizontal: 20, alignItems: 'center', marginBottom: 20 }}>
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: colors.oliveDeep,
            alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden',
            borderWidth: store.isPremium ? 3 : store.isTop ? 2 : 0,
            borderColor: store.isPremium ? colors.gold : colors.oliveDeep,
          }}>
            {store.logoUrl ? (
              <Image source={{ uri: store.logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text variant="displayLarge" style={{ fontFamily: theme.fontFamilies.display, fontSize: 36, color: colors.goldSoft, fontWeight: '700' }}>
                {store.brandName.slice(0, 1).toUpperCase()}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Text variant="displayLarge" color="ink" style={{ fontSize: 22, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
              {store.brandName}
            </Text>
            {store.verified && <Ionicons name="checkmark-circle" size={18} color={colors.gold} />}
            {store.isPremium && (
              <View style={{ backgroundColor: colors.gold, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text variant="caption" style={{ fontSize: 10, color: colors.oliveDeep, fontWeight: '700' }}>PREMIUM</Text>
              </View>
            )}
            {store.isTop && !store.isPremium && (
              <View style={{ backgroundColor: colors.oliveDeep, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text variant="caption" style={{ fontSize: 10, color: colors.goldSoft, fontWeight: '700' }}>TOP</Text>
              </View>
            )}
          </View>

          {store.ownerName && (
            <Text variant="caption" color="muted" style={{ marginTop: 4, fontSize: 12 }}>
              {store.ownerName}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
            <Ionicons name="star" size={14} color={colors.gold} />
            <Text variant="caption" color="muted" style={{ fontSize: 13 }}>
              {store.rating.toFixed(1)} · {store.reviewsCount} {isRu ? 'отзывов' : 'baho'}
            </Text>
          </View>

          {store.description && (
            <Text variant="body" color="muted" style={{ marginTop: 10, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>
              {store.description}
            </Text>
          )}
        </View>

        {/* Contact + Address */}
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {/* TZ Phase 5.2: Chat (Yozish) + Qo'ng'iroq buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={async () => {
                try {
                  const res = await api.post(`/chats/open/${store.id}`);
                  router.push({ pathname: '/chat/[id]', params: { id: res.data.id } });
                } catch (e: any) {
                  // Error handled silently; user can retry
                }
              }}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.oliveDeep, padding: 14, borderRadius: 14 }}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.goldSoft} />
              <Text variant="body" style={{ color: colors.goldSoft, fontWeight: '700', fontSize: 14 }}>
                {isRu ? 'Написать' : 'Yozish'}
              </Text>
            </Pressable>
            {store.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${store.phone}`)}
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.oliveDeep }}
              >
                <Ionicons name="call" size={18} color={colors.oliveDeep} />
                <Text variant="body" style={{ color: colors.oliveDeep, fontWeight: '700', fontSize: 14 }}>
                  {isRu ? 'Позвонить' : "Qo'ng'iroq"}
                </Text>
              </Pressable>
            )}
          </View>
          {store.phone && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.rule }}>
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.oliveDeep, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="call" size={16} color={colors.goldSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                  {isRu ? 'Телефон' : 'Telefon'}
                </Text>
                <Text variant="body" color="ink" style={{ fontWeight: '600', fontSize: 14 }}>{store.phone}</Text>
              </View>
            </View>
          )}

          {(store.city || store.district || store.addressLine) && (
            <Pressable
              onPress={() => {
                if (store.latitude != null && store.longitude != null) {
                  Linking.openURL(`https://maps.google.com/?q=${store.latitude},${store.longitude}`);
                }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.rule }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.oliveDeep, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="location" size={16} color={colors.goldSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                  {isRu ? 'Адрес' : 'Manzil'}
                </Text>
                <Text variant="body" color="ink" style={{ fontWeight: '600', fontSize: 14 }}>
                  {[store.city, store.district].filter(Boolean).join(', ') || store.country}
                </Text>
                {store.addressLine && (
                  <Text variant="caption" color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                    {store.addressLine}
                  </Text>
                )}
              </View>
              {store.latitude != null && <Ionicons name="map" size={16} color={colors.gold} />}
            </Pressable>
          )}
        </View>

        {/* Products count card (always-open — no toggle) */}
        <View style={{
          marginTop: 20, marginHorizontal: 20,
          padding: 18, borderRadius: 18,
          backgroundColor: colors.oliveDeep,
          flexDirection: 'row', alignItems: 'center', gap: 14,
        }}>
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="grid" size={22} color={colors.goldSoft} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="body" style={{ color: colors.goldSoft, fontWeight: '700', fontSize: 15 }}>
              {store.productsCount} {isRu ? 'товаров' : 'ta mahsulot'}
            </Text>
            <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 }}>
              {isRu ? 'Каталог магазина' : "Do'kon katalogi"}
            </Text>
          </View>
        </View>

        {/* Category breakdown */}
        {store.productsByCategory.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, gap: 8 }}
          >
            <Pressable
              onPress={() => { setCategory(null); setProductsOpen(true); }}
              style={{
                paddingHorizontal: 14, height: 34, borderRadius: 17,
                backgroundColor: category === null ? colors.oliveDeep : colors.surface,
                borderWidth: 1, borderColor: category === null ? colors.oliveDeep : colors.rule,
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Text variant="caption" style={{ color: category === null ? colors.goldSoft : colors.ink, fontWeight: '600', fontSize: 12 }}>
                {isRu ? 'Все' : 'Barchasi'} · {store.productsCount}
              </Text>
            </Pressable>
            {store.productsByCategory.map((b) => {
              const label = CATEGORY_LABELS[b.categoryId]?.[lang] ?? b.categoryId;
              const active = category === b.categoryId;
              return (
                <Pressable
                  key={b.categoryId}
                  onPress={() => { setCategory(b.categoryId); setProductsOpen(true); }}
                  style={{
                    paddingHorizontal: 14, height: 34, borderRadius: 17,
                    backgroundColor: active ? colors.oliveDeep : colors.surface,
                    borderWidth: 1, borderColor: active ? colors.oliveDeep : colors.rule,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" style={{ color: active ? colors.goldSoft : colors.ink, fontWeight: '600', fontSize: 12 }}>
                    {label} · {b.count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        {/* Products panel */}
        {productsOpen && (
          <View style={{ marginTop: 14, paddingHorizontal: 20 }}>
            {/* Sort pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
              {([
                { key: 'popularity', uz: 'Ommaboplik', ru: 'Популярные' },
                { key: 'new', uz: 'Yangi', ru: 'Новые' },
                { key: 'priceLow', uz: 'Arzon', ru: 'Дешёвые' },
                { key: 'priceHigh', uz: 'Qimmat', ru: 'Дорогие' },
              ] as Array<{ key: SortKey; uz: string; ru: string }>).map((s) => {
                const active = sort === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSort(s.key)}
                    style={{
                      paddingHorizontal: 14, height: 32, borderRadius: 16,
                      backgroundColor: active ? colors.gold : colors.surface,
                      borderWidth: 1, borderColor: active ? colors.gold : colors.rule,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Text variant="caption" style={{ color: active ? colors.oliveDeep : colors.ink, fontWeight: '700', fontSize: 11 }}>
                      {s[lang]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Color pills */}
            {availableColors.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 12 }}>
                <Pressable
                  onPress={() => setColor(null)}
                  style={{
                    paddingHorizontal: 12, height: 30, borderRadius: 15,
                    backgroundColor: color === null ? colors.oliveDeep : colors.surface,
                    borderWidth: 1, borderColor: color === null ? colors.oliveDeep : colors.rule,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" style={{ color: color === null ? colors.goldSoft : colors.ink, fontSize: 11, fontWeight: '600' }}>
                    {isRu ? 'Все цвета' : 'Barcha rang'}
                  </Text>
                </Pressable>
                {availableColors.map((c) => {
                  const active = color === c.color;
                  return (
                    <Pressable
                      key={c.color}
                      onPress={() => setColor(c.color)}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                        paddingHorizontal: 10, height: 30, borderRadius: 15,
                        backgroundColor: active ? colors.oliveDeep : colors.surface,
                        borderWidth: 1, borderColor: active ? colors.oliveDeep : colors.rule,
                      }}
                    >
                      <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c.hex, borderWidth: 1, borderColor: colors.rule }} />
                      <Text variant="caption" style={{ color: active ? colors.goldSoft : colors.ink, fontSize: 11, fontWeight: '600' }}>
                        {c.color}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {/* Grid */}
            {productsQ.isLoading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.oliveDeep} />
              </View>
            ) : products.length === 0 ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Ionicons name="basket-outline" size={40} color={colors.muted} />
                <Text variant="caption" color="muted" style={{ marginTop: 10 }}>
                  {isRu ? 'Товары не найдены' : 'Mahsulot topilmadi'}
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }}>
                {products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                    style={{ width: '50%', padding: 4 }}
                  >
                    <View style={{ backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.rule }}>
                      <Image source={{ uri: p.coverUrl }} style={{ width: '100%', aspectRatio: 0.75 }} resizeMode="cover" />
                      <View style={{ padding: 10 }}>
                        <Text variant="caption" color="ink" numberOfLines={1} style={{ fontSize: 12, fontWeight: '600' }}>
                          {p.title[lang] || p.title.uz || p.title.ru}
                        </Text>
                        <Text variant="caption" color="gold" style={{ fontWeight: '700', marginTop: 2, fontSize: 13 }}>
                          ${p.basePriceUsd}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
