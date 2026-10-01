import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, View, Image, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { api } from '../../src/api/client';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE = 20;

interface HomeFeed {
  stores: Array<{ id: string; brandName: string; logoUrl: string | null }>;
  categories: Array<{ id: string; nameRu: string; nameUz: string; iconUrl: string | null }>;
  newArrivals: Array<{
    id: string;
    title: { ru: string; uz: string };
    basePriceUsd: number;
    coverUrl: string;
    seller?: { brandName: string; rating: number };
    variants: Array<{ id: string }>;
  }>;
}

const MOCK_STORES = [
  { id: 's1', brandName: 'Amani', logoUrl: null },
  { id: 's2', brandName: 'Zahra Collection', logoUrl: null },
  { id: 's3', brandName: 'Noor Hijab', logoUrl: null },
  { id: 's4', brandName: 'Hija House', logoUrl: null },
  { id: 's5', brandName: 'Sabr', logoUrl: null },
];

const MOCK_ARRIVALS = [
  { id: '1', title: { ru: 'Хиджаб «Нежность»', uz: 'Hijob «Noziklik»' }, basePriceUsd: 22, coverUrl: '', seller: { brandName: 'Amani', rating: 4.8 }, variants: [{ id: 'v1' }] },
  { id: '2', title: { ru: 'Хиджаб «Олива»', uz: 'Hijob «Zaytun»' }, basePriceUsd: 24, coverUrl: '', seller: { brandName: 'Zahra', rating: 4.6 }, variants: [{ id: 'v1' }] },
  { id: '3', title: { ru: 'Шарф «Классика»', uz: "Ro'mol «Klassik»" }, basePriceUsd: 35, coverUrl: '', seller: { brandName: 'Noor', rating: 4.9 }, variants: [{ id: 'v1' }] },
  { id: '4', title: { ru: 'Платок «Жемчуг»', uz: "Ro'mol «Marvarid»" }, basePriceUsd: 28, coverUrl: '', seller: { brandName: 'Hija', rating: 4.7 }, variants: [{ id: 'v1' }] },
];

const STORE_COLORS = ['#C9A96E', '#8A8D5B', '#B85450', '#5F7A94', '#D9A24B'];

const CATEGORY_DATA = [
  { id: 'scarves', icon: 'ribbon-outline' as const, gradient: ['#E4CE9A', '#C9A96E'] as const },
  { id: 'dresses', icon: 'shirt-outline' as const, gradient: ['#B5B891', '#8A8D5B'] as const },
  { id: 'bags', icon: 'bag-handle-outline' as const, gradient: ['#D9D0BE', '#857E6E'] as const },
  { id: 'accessories', icon: 'diamond-outline' as const, gradient: ['#E8DFCC', '#C9A96E'] as const },
];

const PLACEHOLDER_BG = ['#B5B891', '#E4CE9A', '#D4C3A0', '#C4C88C', '#D9D0BE', '#E8DFCC'];

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const lang = i18n.language as 'ru' | 'uz';

  const { data } = useQuery<HomeFeed>({
    queryKey: ['home'],
    queryFn: async () => {
      try {
        return (await api.get('/catalog/home')).data;
      } catch {
        return { stores: MOCK_STORES, categories: [], newArrivals: MOCK_ARRIVALS };
      }
    },
  });

  const stores = data?.stores?.length ? data.stores : MOCK_STORES;
  const arrivals = data?.newArrivals?.length ? data.newArrivals : MOCK_ARRIVALS;

  return (
    <Screen gradient>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* ── Header ── */}
        <View
          style={{
            paddingHorizontal: SIDE,
            paddingTop: 4,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ width: 40 }}>
            <Pressable
              hitSlop={12}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceGlass,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.ruleSoft,
              }}
            >
              <Ionicons name="menu-outline" size={20} color={colors.ink} />
            </Pressable>
          </View>

          <Logo size={52} label={false} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceGlass,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.ruleSoft,
              }}
            >
              <Ionicons name="search-outline" size={18} color={colors.ink} />
            </Pressable>
            <Pressable
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.surfaceGlass,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.ruleSoft,
              }}
            >
              <Ionicons name="notifications-outline" size={18} color={colors.ink} />
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.danger,
                  borderWidth: 2,
                  borderColor: colors.bg,
                }}
              />
            </Pressable>
          </View>
        </View>

        {/* ── Welcome ── */}
        <View style={{ paddingHorizontal: SIDE, marginTop: 20 }}>
          <Text
            variant="bodySmall"
            color="muted"
            style={{ letterSpacing: 2, textTransform: 'uppercase', fontSize: 11 }}
          >
            {lang === 'ru' ? 'Добро пожаловать' : 'Xush kelibsiz'}
          </Text>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{ marginTop: 4, fontSize: 30, lineHeight: 36 }}
          >
            {user?.fullName
              ? `${lang === 'ru' ? 'Привет' : 'Salom'}, ${user.fullName.split(' ')[0]}`
              : (lang === 'ru' ? 'Откройте свой стиль' : "O'z uslubingizni toping")}
          </Text>
        </View>

        {/* ── Hero Try-On Banner ── */}
        <Pressable
          onPress={() => router.push('/(tabs)/tryon')}
          style={{ marginHorizontal: SIDE, marginTop: 20 }}
        >
          <LinearGradient
            colors={[colors.oliveDeep, '#4E5230']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: theme.radii['2xl'],
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              overflow: 'hidden',
              minHeight: 110,
            }}
          >
            <View style={{ flex: 1, gap: 8 }}>
              <View
                style={{
                  backgroundColor: colors.gold,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: theme.radii.sm,
                  alignSelf: 'flex-start',
                }}
              >
                <Text variant="caption" style={{ color: '#fff', fontWeight: '700', fontSize: 10, letterSpacing: 1 }}>
                  AI POWERED
                </Text>
              </View>
              <Text
                variant="titleMedium"
                style={{ color: colors.goldSoft, fontSize: 18, lineHeight: 24 }}
              >
                {lang === 'ru' ? 'Виртуальная\nпримерка' : 'Virtual\nprimerka'}
              </Text>
              <Text
                variant="caption"
                style={{ color: 'rgba(228,206,154,0.7)', fontSize: 11, lineHeight: 15 }}
              >
                {lang === 'ru'
                  ? 'Примерьте перед покупкой'
                  : "Xarid qilishdan oldin kiyib ko'ring"}
              </Text>
            </View>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: 'rgba(201,169,110,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: 'rgba(201,169,110,0.3)',
              }}
            >
              <Ionicons name="body-outline" size={34} color={colors.goldSoft} />
            </View>
          </LinearGradient>
        </Pressable>

        {/* ── Stores ── */}
        <View style={{ marginTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: SIDE,
            }}
          >
            <Text variant="titleMedium" color="oliveDeep" style={{ fontSize: 18 }}>
              {t('home.stores')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/catalog')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text variant="caption" color="gold" style={{ fontWeight: '600' }}>
                {t('home.allStores')}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.gold} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE, paddingTop: 14, paddingBottom: 4, gap: 14 }}
          >
            {stores.map((store, idx) => {
              const ringColor = STORE_COLORS[idx % STORE_COLORS.length];
              return (
                <Pressable key={store.id} style={{ alignItems: 'center', gap: 6, width: 72 }}>
                  {/* Ring */}
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      borderWidth: 2.5,
                      borderColor: ringColor,
                      padding: 3,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 28,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      {store.logoUrl ? (
                        <Image
                          source={{ uri: store.logoUrl }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text
                          variant="titleSmall"
                          style={{
                            color: ringColor,
                            fontWeight: '800',
                            fontSize: 14,
                            letterSpacing: 0.5,
                          }}
                        >
                          {store.brandName.slice(0, 2).toUpperCase()}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Text
                    variant="caption"
                    color="ink"
                    numberOfLines={1}
                    style={{ fontSize: 10, fontWeight: '500', textAlign: 'center' }}
                  >
                    {store.brandName.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}

            {/* Add store */}
            <Pressable style={{ alignItems: 'center', gap: 6, width: 72 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  borderWidth: 1.5,
                  borderColor: colors.rule,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={22} color={colors.muted} />
              </View>
              <Text variant="caption" color="muted" style={{ fontSize: 10 }}>
                {lang === 'ru' ? 'Ещё' : "Qo'shish"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── Categories ── */}
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: SIDE, marginBottom: 14 }}>
            <Text variant="titleMedium" color="oliveDeep" style={{ fontSize: 18 }}>
              {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE, gap: 12 }}
          >
            {CATEGORY_DATA.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/catalog', params: { category: cat.id } })
                }
                style={({ pressed }) => ({
                  width: (SCREEN_W - SIDE * 2 - 36) / 4,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <LinearGradient
                  colors={[...cat.gradient]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    aspectRatio: 0.85,
                    borderRadius: theme.radii.xl,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...theme.shadows.sm,
                  }}
                >
                  <Ionicons name={cat.icon} size={28} color="#fff" />
                </LinearGradient>
                <Text
                  variant="caption"
                  color="ink"
                  numberOfLines={1}
                  style={{
                    textAlign: 'center',
                    marginTop: 8,
                    fontWeight: '500',
                    fontSize: 11,
                  }}
                >
                  {t(`home.categories.${cat.id}`)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── New Arrivals ── */}
        <View style={{ marginTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: SIDE,
            }}
          >
            <Text variant="titleMedium" color="oliveDeep" style={{ fontSize: 18 }}>
              {t('home.newArrivals')}
            </Text>
            <Pressable
              onPress={() => router.push('/(tabs)/catalog')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
            >
              <Text variant="caption" color="gold" style={{ fontWeight: '600' }}>
                {t('common.seeAll')}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.gold} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE, paddingTop: 14, gap: 14 }}
          >
            {arrivals.map((p, idx) => {
              const bg = PLACEHOLDER_BG[idx % PLACEHOLDER_BG.length];
              return (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push({ pathname: '/product/[id]', params: { id: p.id } })
                  }
                  style={({ pressed }) => ({
                    width: 170,
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: colors.rule,
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  {/* Image */}
                  <View style={{ height: 210, backgroundColor: bg, position: 'relative' }}>
                    {p.coverUrl ? (
                      <Image
                        source={{ uri: p.coverUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="ribbon-outline" size={36} color="rgba(255,255,255,0.3)" />
                      </View>
                    )}
                    {/* Wishlist */}
                    <Pressable
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(255,255,255,0.85)',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="heart-outline" size={16} color={colors.ink} />
                    </Pressable>
                    {/* Try-on badge */}
                    <View
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: colors.olive,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                      }}
                    >
                      <Text
                        variant="caption"
                        style={{ color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 }}
                      >
                        TRY-ON
                      </Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={{ padding: 12, gap: 4 }}>
                    {p.seller && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <View
                          style={{
                            width: 16,
                            height: 16,
                            borderRadius: 8,
                            backgroundColor: colors.olive,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Text
                            variant="caption"
                            style={{ color: '#fff', fontSize: 7, fontWeight: '800' }}
                          >
                            {p.seller.brandName[0]}
                          </Text>
                        </View>
                        <Text
                          variant="caption"
                          color="muted"
                          numberOfLines={1}
                          style={{ fontSize: 10 }}
                        >
                          {p.seller.brandName}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            marginLeft: 'auto',
                          }}
                        >
                          <Ionicons name="star" size={9} color={colors.gold} />
                          <Text variant="caption" color="muted" style={{ fontSize: 9 }}>
                            {p.seller.rating}
                          </Text>
                        </View>
                      </View>
                    )}
                    <Text variant="bodySmall" color="ink" numberOfLines={1}>
                      {lang === 'ru' ? p.title.ru : (p.title.uz ?? p.title.ru)}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: 2,
                      }}
                    >
                      <Text
                        variant="titleSmall"
                        color="oliveDeep"
                        style={{ fontWeight: '700', fontSize: 16 }}
                      >
                        ${p.basePriceUsd}
                      </Text>
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          backgroundColor: colors.olive,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="add" size={16} color="#fff" />
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Popular Collections ── */}
        <View style={{ marginTop: 28 }}>
          <View style={{ paddingHorizontal: SIDE, marginBottom: 14 }}>
            <Text variant="titleMedium" color="oliveDeep" style={{ fontSize: 18 }}>
              {lang === 'ru' ? 'Популярные коллекции' : 'Mashhur kolleksiyalar'}
            </Text>
          </View>

          <View style={{ paddingHorizontal: SIDE, gap: 12 }}>
            {/* Collection 1 */}
            <Pressable
              onPress={() =>
                router.push({ pathname: '/(tabs)/catalog', params: { category: 'scarves' } })
              }
            >
              <LinearGradient
                colors={['#363924', '#4E5230']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0.5 }}
                style={{
                  borderRadius: theme.radii.xl,
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  minHeight: 90,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text variant="caption" style={{ color: colors.goldSoft, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                    {lang === 'ru' ? 'Коллекция' : 'Kolleksiya'}
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={{ color: '#fff', marginTop: 4, fontSize: 16 }}
                  >
                    {lang === 'ru' ? 'Шёлковые платки' : "Ipak ro'mollar"}
                  </Text>
                  <Text variant="caption" style={{ color: 'rgba(255,255,255,0.5)', marginTop: 2, fontSize: 11 }}>
                    24 {lang === 'ru' ? 'товара' : 'mahsulot'}
                  </Text>
                </View>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: 'rgba(201,169,110,0.15)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="ribbon-outline" size={24} color={colors.goldSoft} />
                </View>
              </LinearGradient>
            </Pressable>

            {/* Collection row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(tabs)/catalog', params: { category: 'dresses' } })
                }
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#B5B891', '#8A8D5B']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: theme.radii.xl,
                    padding: 16,
                    aspectRatio: 1,
                    justifyContent: 'space-between',
                  }}
                >
                  <Ionicons name="shirt-outline" size={26} color="rgba(255,255,255,0.8)" />
                  <View>
                    <Text variant="titleSmall" style={{ color: '#fff', fontSize: 13 }}>
                      {lang === 'ru' ? 'Платья' : "Ko'ylaklar"}
                    </Text>
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 }}>
                      18 {lang === 'ru' ? 'товаров' : 'mahsulot'}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={() =>
                  router.push({ pathname: '/(tabs)/catalog', params: { category: 'bags' } })
                }
                style={{ flex: 1 }}
              >
                <LinearGradient
                  colors={['#C9A96E', '#A88848']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: theme.radii.xl,
                    padding: 16,
                    aspectRatio: 1,
                    justifyContent: 'space-between',
                  }}
                >
                  <Ionicons name="bag-handle-outline" size={26} color="rgba(255,255,255,0.8)" />
                  <View>
                    <Text variant="titleSmall" style={{ color: '#fff', fontSize: 13 }}>
                      {lang === 'ru' ? 'Сумки' : 'Sumkalar'}
                    </Text>
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 1 }}>
                      12 {lang === 'ru' ? 'товаров' : 'mahsulot'}
                    </Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
