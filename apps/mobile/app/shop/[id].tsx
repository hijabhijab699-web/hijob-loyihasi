import { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { safeBack } from '../../src/lib/safe-back';

const { width: SCREEN_W } = Dimensions.get('window');
const DECOR_SILK_TOP = require('../../assets/decor/silk-ribbon.webp');
const DECOR_JASMINE = require('../../assets/decor/jasmine.webp');

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
  const insets = useSafeAreaInsets();
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

  // Shared cream silk ribbon with jasmine branch tucked into the top
  // right — matches the mockup's single combined header decoration. The
  // ribbon reaches above the safe area so its curves meet the actual
  // top of the device.
  const silkRibbon = (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: SCREEN_W * 0.55 + insets.top,
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <Image
        source={DECOR_SILK_TOP}
        style={{
          position: 'absolute',
          top: 0,
          left: -SCREEN_W * 0.05,
          width: SCREEN_W * 1.1,
          aspectRatio: 1847 / 851,
        }}
        resizeMode="cover"
      />
      <Image
        source={DECOR_JASMINE}
        style={{
          position: 'absolute',
          top: insets.top + 60,
          right: -30,
          width: 180, height: 160,
          opacity: 0.95,
          transform: [{ rotate: '-6deg' }],
        }}
        resizeMode="contain"
      />
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(255,255,255,0.75)', '#ffffff']}
        locations={[0, 0.45, 0.75, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );

  if (!store) {
    return (
      <Screen topDecoration={silkRibbon}>
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen topDecoration={silkRibbon}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Header — back pill + "Магазин" label matches the mockup. */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => safeBack()}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: '#ffffff',
              borderWidth: 1, borderColor: 'rgba(201,168,97,0.18)',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#2a2a1f', shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 2 }, shadowRadius: 6,
            }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </Pressable>
          <Text variant="body" color="muted" style={{ fontSize: 14, color: '#857e6e' }}>
            {isRu ? 'Магазин' : "Do'kon"}
          </Text>
        </View>

        {/* Profile card — big avatar with gold ring, serif name with
            verified check, muted subtitle, and star rating centered. */}
        <View style={{ paddingHorizontal: 20, alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
          <View style={{
            width: 136, height: 136, borderRadius: 68,
            alignItems: 'center', justifyContent: 'center',
            padding: 4,
          }}>
            <View style={{
              width: '100%', height: '100%', borderRadius: 68,
              backgroundColor: colors.oliveDeep,
              alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
              borderWidth: 2.5,
              borderColor: '#c9a861',
              shadowColor: '#2a2a1f',
              shadowOpacity: 0.25,
              shadowOffset: { width: 0, height: 10 },
              shadowRadius: 18,
            }}>
              {store.logoUrl ? (
                <Image source={{ uri: store.logoUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 56, lineHeight: 60,
                  color: '#c9a861', fontWeight: '600',
                  fontStyle: 'italic',
                }}>
                  {store.brandName.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Text style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 30, lineHeight: 34,
              fontWeight: '600',
              color: '#1f2a16',
            }}>
              {store.brandName}
            </Text>
            {store.verified && (
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: '#c9a861',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="checkmark" size={14} color="#ffffff" />
              </View>
            )}
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
            <Text style={{ marginTop: 4, fontSize: 14, color: '#857e6e' }}>
              {store.ownerName}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }}>
            <Ionicons name="star" size={16} color="#c9a861" />
            <Text style={{ fontSize: 14, color: '#4a4a3b', fontWeight: '500' }}>
              {store.rating.toFixed(1)} · {store.reviewsCount} {isRu ? 'отзывов' : 'baho'}
            </Text>
          </View>

          {store.description && (
            <Text variant="body" color="muted" style={{ marginTop: 10, textAlign: 'center', fontSize: 13, lineHeight: 19 }}>
              {store.description}
            </Text>
          )}
        </View>

        {/* Contact + Address — pill action buttons (filled vs outlined)
            and a tap-to-open phone row with a chevron. */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={async () => {
                try {
                  const res = await api.post(`/chats/open/${store.id}`);
                  router.push({ pathname: '/chat/[id]', params: { id: res.data.id } });
                } catch (e: any) {
                  // Error handled silently; user can retry
                }
              }}
              style={({ pressed }) => ({
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                backgroundColor: colors.oliveDeep,
                paddingVertical: 18,
                borderRadius: 999,
                opacity: pressed ? 0.9 : 1,
                shadowColor: '#1f2a16',
                shadowOpacity: 0.25,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 10,
              })}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: 'rgba(255,255,255,0.18)',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="chatbubble-ellipses" size={14} color="#ffffff" />
              </View>
              <Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>
                {isRu ? 'Написать' : 'Yozish'}
              </Text>
            </Pressable>
            {store.phone && (
              <Pressable
                onPress={() => Linking.openURL(`tel:${store.phone}`)}
                style={({ pressed }) => ({
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  backgroundColor: '#ffffff',
                  paddingVertical: 18,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,97,0.22)',
                  opacity: pressed ? 0.9 : 1,
                  shadowColor: '#2a2a1f',
                  shadowOpacity: 0.08,
                  shadowOffset: { width: 0, height: 4 },
                  shadowRadius: 8,
                })}
              >
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: 'rgba(90,140,116,0.14)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="call" size={14} color={colors.oliveDeep} />
                </View>
                <Text style={{ color: '#1f2a16', fontWeight: '600', fontSize: 15 }}>
                  {isRu ? 'Позвонить' : "Qo'ng'iroq"}
                </Text>
              </Pressable>
            )}
          </View>
          {store.phone && (
            <Pressable
              onPress={() => Linking.openURL(`tel:${store.phone}`)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 14,
                backgroundColor: '#ffffff', padding: 16, borderRadius: 20,
                borderWidth: 1, borderColor: 'rgba(201,168,97,0.18)',
                shadowColor: '#2a2a1f', shadowOpacity: 0.06,
                shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: '#f5efe3',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="call" size={18} color="#3a6451" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#857e6e' }}>
                  {isRu ? 'Телефон' : 'Telefon'}
                </Text>
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#1f2a16', marginTop: 2 }}>
                  {store.phone}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#c9a861" />
            </Pressable>
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

        {/* Products count card — olive-deep hero rail with a grid chip
            on the left and a decorative jasmine + bag illustration tucked
            into the right edge, matches the "8 товаров" card in the mockup. */}
        <View style={{
          marginTop: 20, marginHorizontal: 20,
          paddingHorizontal: 18, paddingVertical: 20,
          borderRadius: 22,
          backgroundColor: colors.oliveDeep,
          flexDirection: 'row', alignItems: 'center', gap: 14,
          overflow: 'hidden',
          shadowColor: '#1f2a16',
          shadowOpacity: 0.25,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 16,
        }}>
          <View style={{
            width: 48, height: 48, borderRadius: 14,
            backgroundColor: 'rgba(255,255,255,0.14)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="grid" size={22} color="#f1dfa4" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{
              color: '#f1dfa4', fontWeight: '700', fontSize: 18,
              fontFamily: theme.fontFamilies.display,
            }}>
              {store.productsCount} {isRu ? 'товаров' : 'ta mahsulot'}
            </Text>
            <Text style={{ color: 'rgba(241,223,164,0.65)', fontSize: 12, marginTop: 2 }}>
              {isRu ? 'Каталог магазина' : "Do'kon katalogi"}
            </Text>
          </View>
          <Image
            source={DECOR_JASMINE}
            style={{
              position: 'absolute',
              right: -22, top: -4,
              width: 120, height: 90,
              opacity: 0.9,
              transform: [{ rotate: '8deg' }],
            }}
            resizeMode="contain"
            pointerEvents="none"
          />
        </View>

        {/* Category breakdown — larger pills with soft shadow, active
            state in olive-deep with gold text, matches the "Все · 8" row. */}
        {store.productsByCategory.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, gap: 10 }}
          >
            <Pressable
              onPress={() => { setCategory(null); setProductsOpen(true); }}
              style={{
                paddingHorizontal: 18, height: 40, borderRadius: 20,
                backgroundColor: category === null ? colors.oliveDeep : '#ffffff',
                borderWidth: 1,
                borderColor: category === null ? colors.oliveDeep : 'rgba(201,168,97,0.18)',
                alignItems: 'center', justifyContent: 'center',
                shadowColor: '#2a2a1f',
                shadowOpacity: category === null ? 0.18 : 0.06,
                shadowOffset: { width: 0, height: 4 },
                shadowRadius: 8,
              }}
            >
              <Text style={{
                color: category === null ? '#f1dfa4' : '#1f2a16',
                fontWeight: '600', fontSize: 13,
              }}>
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
                    paddingHorizontal: 18, height: 40, borderRadius: 20,
                    backgroundColor: active ? colors.oliveDeep : '#ffffff',
                    borderWidth: 1,
                    borderColor: active ? colors.oliveDeep : 'rgba(201,168,97,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#2a2a1f',
                    shadowOpacity: active ? 0.18 : 0.06,
                    shadowOffset: { width: 0, height: 4 },
                    shadowRadius: 8,
                  }}
                >
                  <Text style={{
                    color: active ? '#f1dfa4' : '#1f2a16',
                    fontWeight: '600', fontSize: 13,
                  }}>
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
            {/* Sort pills — each with its own icon (crown / sparkle /
                diamond) and a gold-filled active chip for popularity. */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 12 }}>
              {([
                { key: 'popularity', uz: 'Ommaboplik', ru: 'Популярные', icon: 'star' },
                { key: 'new', uz: 'Yangi', ru: 'Новые', icon: 'sparkles' },
                { key: 'priceLow', uz: 'Arzon', ru: 'Дешёвые', icon: 'pricetag' },
                { key: 'priceHigh', uz: 'Qimmat', ru: 'Дорогие', icon: 'diamond' },
              ] as Array<{ key: SortKey; uz: string; ru: string; icon: React.ComponentProps<typeof Ionicons>['name'] }>).map((s) => {
                const active = sort === s.key;
                return (
                  <Pressable
                    key={s.key}
                    onPress={() => setSort(s.key)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 14, height: 36, borderRadius: 18,
                      backgroundColor: active ? '#f1dfa4' : '#ffffff',
                      borderWidth: 1,
                      borderColor: active ? '#c9a861' : 'rgba(201,168,97,0.18)',
                      shadowColor: '#2a2a1f',
                      shadowOpacity: active ? 0.12 : 0.05,
                      shadowOffset: { width: 0, height: 3 },
                      shadowRadius: 6,
                    }}
                  >
                    <Ionicons name={s.icon} size={13} color={active ? '#8f6a2d' : '#487a62'} />
                    <Text style={{ color: active ? '#8f6a2d' : '#1f2a16', fontWeight: '600', fontSize: 12 }}>
                      {s[lang]}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Color pills — "Все цвета" filled olive, each color pill
                shows a swatch disc + label. */}
            {availableColors.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 14 }}>
                <Pressable
                  onPress={() => setColor(null)}
                  style={{
                    paddingHorizontal: 14, height: 36, borderRadius: 18,
                    backgroundColor: color === null ? colors.oliveDeep : '#ffffff',
                    borderWidth: 1,
                    borderColor: color === null ? colors.oliveDeep : 'rgba(201,168,97,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    shadowColor: '#2a2a1f',
                    shadowOpacity: color === null ? 0.15 : 0.05,
                    shadowOffset: { width: 0, height: 3 },
                    shadowRadius: 6,
                  }}
                >
                  <Text style={{
                    color: color === null ? '#f1dfa4' : '#1f2a16',
                    fontSize: 12, fontWeight: '600',
                  }}>
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
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                        paddingHorizontal: 12, height: 36, borderRadius: 18,
                        backgroundColor: active ? colors.oliveDeep : '#ffffff',
                        borderWidth: 1,
                        borderColor: active ? colors.oliveDeep : 'rgba(201,168,97,0.18)',
                        shadowColor: '#2a2a1f',
                        shadowOpacity: active ? 0.15 : 0.05,
                        shadowOffset: { width: 0, height: 3 },
                        shadowRadius: 6,
                      }}
                    >
                      <View style={{
                        width: 18, height: 18, borderRadius: 9,
                        backgroundColor: c.hex,
                        borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)',
                      }} />
                      <Text style={{
                        color: active ? '#f1dfa4' : '#1f2a16',
                        fontSize: 12, fontWeight: '600',
                      }}>
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
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 }}>
                {products.map((p) => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.push({ pathname: '/product/[id]', params: { id: p.id } })}
                    style={{ width: '50%', padding: 6 }}
                  >
                    <View style={{
                      backgroundColor: '#ffffff', borderRadius: 20, overflow: 'hidden',
                      borderWidth: 1, borderColor: 'rgba(201,168,97,0.14)',
                      shadowColor: '#2a2a1f', shadowOpacity: 0.08,
                      shadowOffset: { width: 0, height: 4 }, shadowRadius: 10,
                    }}>
                      <View style={{ position: 'relative' }}>
                        <Image source={{ uri: p.coverUrl }} style={{ width: '100%', aspectRatio: 0.78 }} resizeMode="cover" />
                        <View style={{
                          position: 'absolute', top: 10, right: 10,
                          width: 32, height: 32, borderRadius: 16,
                          backgroundColor: 'rgba(255,255,255,0.9)',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ionicons name="heart-outline" size={16} color="#3a6451" />
                        </View>
                      </View>
                      <View style={{ padding: 12 }}>
                        <Text numberOfLines={1} style={{
                          fontSize: 13, fontWeight: '600',
                          color: '#1f2a16',
                          fontFamily: theme.fontFamilies.display,
                        }}>
                          {p.title[lang] || p.title.uz || p.title.ru}
                        </Text>
                        <Text style={{
                          color: '#3a6451', fontWeight: '700',
                          marginTop: 4, fontSize: 14,
                        }}>
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
