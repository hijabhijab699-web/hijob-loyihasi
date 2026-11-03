import { useCallback, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Pressable, RefreshControl, ScrollView, View, Image, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { useTryonCollection } from '../../src/store/tryon-collection';
import { sceneById } from '../../src/lib/scenes';
import { api } from '../../src/api/client';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { formatUsdAsUzs, useUzsRate } from '../../src/lib/currency';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE = 20;

// Decorative premium hijab aesthetic — jasmine branch + beige silk ribbon
// pulled from the mockup the client approved. They sit absolutely over the
// scrolling home feed and never intercept touches.
const DECOR_JASMINE = require('../../assets/decor/jasmine.webp');
const DECOR_SILK_TOP = require('../../assets/decor/silk-ribbon.webp');
const DECOR_WAVE_BOTTOM = require('../../assets/decor/wave-bottom.webp');
const DECOR_HERO_HOME = require('../../assets/decor/hero-home.webp');

interface HomeFeed {
  stores: Array<{ id: string; brandName: string; logoUrl: string | null }>;
  categories: Array<{ id: string; nameRu: string; nameUz: string; iconUrl: string | null }>;
  newArrivals: Array<{
    id: string;
    title: { ru: string; uz: string };
    basePriceUsd: number;
    coverUrl: string;
    attributes?: Record<string, unknown> | null;
    seller?: { brandName: string; rating: number };
    variants: Array<{ id: string }>;
  }>;
}

// Mockup shop-circle palette: gold / forest / jade / warm — each avatar
// gets a matched tinted fill + bordered ring.
const STORE_PALETTE = [
  { ring: '#c9a861', fill: '#f1dfa4', ink: '#8f6a2d' }, // gold
  { ring: '#4e663a', fill: '#cfe0b0', ink: '#2a3a1f' }, // forest
  { ring: '#5a8c74', fill: '#c7e2d1', ink: '#3a6451' }, // jade
  { ring: '#B85450', fill: '#f0cfcf', ink: '#7a2e2a' }, // coral
  { ring: '#D9A24B', fill: '#f5dcae', ink: '#8f6a2d' }, // amber
];
const STORE_COLORS = STORE_PALETTE.map((p) => p.ring);

// Same category hero images the website uses on its homepage, bundled with
// the app so there's no network dependency and the layout matches cross-
// platform. Slug → scarf type mapping mirrors apps/website/src/lib/categories.ts.
const CATEGORY_DATA = [
  { id: 'scarves', image: require('../../assets/decor/cat-platki.webp'), fit: 'cover' },
  { id: 'dresses', image: require('../../assets/decor/cat-platya.webp'), fit: 'cover' },
  // The abaya shot is a tall full-figure on a white background —
  // cover would chop the head and hem. Contain keeps the whole figure
  // visible; the surrounding card already supplies the cream backdrop.
  { id: 'abaya', image: require('../../assets/decor/cat-abaya.webp'), fit: 'contain' },
  { id: 'bags', image: require('../../assets/decor/cat-sumki.webp'), fit: 'cover' },
  { id: 'accessories', image: require('../../assets/decor/cat-aksess.webp'), fit: 'cover' },
] as const;

const PLACEHOLDER_BG = ['#B5B891', '#E4CE9A', '#D4C3A0', '#C4C88C', '#D9D0BE', '#E8DFCC'];

type Ad = { id: string; imageUrl: string; linkUrl: string | null; title: string | null };

/**
 * Horizontal paginated carousel of admin-curated banners, shown as the
 * hero section just below the welcome header. If no admin ads exist,
 * returns null so the caller falls back to the static Virtual primerka
 * banner. Includes pagination dots that mirror the current page.
 */
function AdsCarousel({ onEmpty }: { onEmpty?: () => void } = {}) {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { data } = useQuery<Ad[]>({
    queryKey: ['ads'],
    queryFn: async () => {
      const res = await api.get<Ad[]>('/ads');
      return res.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
  const [page, setPage] = useState(0);

  if (!data || data.length === 0) {
    onEmpty?.();
    return null;
  }

  const screenW = Dimensions.get('window').width;
  const cardW = screenW - 2 * 20;

  return (
    <View style={{ marginTop: 20 }}>
      <ScrollView
        horizontal
        pagingEnabled
        decelerationRate="fast"
        snapToInterval={cardW + 12}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (cardW + 12));
          if (idx !== page) setPage(idx);
        }}
      >
        {data.map((ad) => (
          <Pressable
            key={ad.id}
            onPress={() => {
              if (ad.linkUrl) router.push(ad.linkUrl as any);
            }}
            style={{
              width: cardW,
              aspectRatio: 16 / 9,
              borderRadius: theme.radii.xl,
              overflow: 'hidden',
              backgroundColor: colors.surface2,
            }}
          >
            <Image
              source={{ uri: ad.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>
      {data.length > 1 && (
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            justifyContent: 'center',
            marginTop: 10,
          }}
        >
          {data.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === page ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === page ? colors.oliveDeep : colors.rule,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const tryonCount = useTryonCollection((s) => s.items.length);
  const insets = useSafeAreaInsets();
  const lang = i18n.language as 'ru' | 'uz';
  const uzsRate = useUzsRate();

  const queryClient = useQueryClient();

  // Reuse the ads query here so we know whether to render the Virtual
  // primerka fallback hero below the carousel. Same queryKey as the
  // AdsCarousel component means it hits the cache instead of re-fetching.
  const { data: adsData } = useQuery<Ad[]>({
    queryKey: ['ads'],
    queryFn: async () => (await api.get<Ad[]>('/ads')).data ?? [],
    staleTime: 5 * 60 * 1000,
  });
  const adsExist = (adsData?.length ?? 0) > 0;

  // Surface network/API failures to the UI instead of silently swapping in
  // mock rows — a mocked home feed hides real breakage (bad token, backend
  // down, schema drift) behind an impression of working data.
  const { data, isLoading, isError, refetch } = useQuery<HomeFeed>({
    queryKey: ['home'],
    queryFn: async () => (await api.get('/catalog/home')).data,
  });

  const addWishlist = useMutation({
    mutationFn: async (productId: string) =>
      (await api.post(`/wishlist/${productId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-wishlist-count'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (e) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  const addCart = useMutation({
    mutationFn: async (variantId: string) =>
      (await api.post('/cart', { variantId, quantity: 1 })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert(
        lang === 'ru' ? 'Готово' : "Qo'shildi",
        lang === 'ru' ? 'Товар добавлен в корзину' : "Mahsulot savatga qo'shildi",
      );
    },
    onError: (e) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  const stores = data?.stores ?? [];

  // TZ Phase 4: swap the "Yangi kelgan kiyimlar" strip for products from the
  // buyer's nearest stores. Falls back to the home-feed newArrivals when the
  // nearby endpoint has nothing (first run / no sellers nearby).
  const nearbyQuery = useQuery<{ items: typeof data extends { newArrivals: infer A } ? A : never[] }>({
    queryKey: ['home-nearby'],
    queryFn: async () => (await api.get('/catalog/nearby-products')).data,
  });
  const arrivals = (nearbyQuery.data?.items?.length ? nearbyQuery.data.items : data?.newArrivals) ?? [];

  // Backend offline / token invalid — tell the user instead of leaving them
  // with an empty "Welcome" shell and no visible stores or arrivals.
  if (isError) {
    return (
      <Screen gradient>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text variant="body" color="ink" style={{ fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
            {lang === 'ru' ? 'Не удалось загрузить ленту' : "Ma'lumotlar yuklanmadi"}
          </Text>
          <Text variant="caption" color="muted" style={{ fontSize: 13, textAlign: 'center' }}>
            {lang === 'ru' ? 'Проверьте подключение и попробуйте ещё раз.' : "Internet ulanishini tekshirib, qayta urining."}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{
              marginTop: 8, paddingHorizontal: 20, paddingVertical: 12,
              borderRadius: 12, backgroundColor: colors.oliveDeep,
            }}
          >
            <Text variant="bodySmall" style={{ fontSize: 13, fontWeight: '600', color: colors.goldSoft }}>
              {lang === 'ru' ? 'Повторить' : 'Qaytadan urinish'}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const silkRibbon = (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: SCREEN_W * 0.5 + insets.top,
        zIndex: 0,
        overflow: 'hidden',
        backgroundColor: '#f6ede0',
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
      {/* Multi-stop fade so the silk pattern dissolves into pure
          white without a visible seam at the ribbon's bottom. */}
      <LinearGradient
        colors={[
          'transparent',
          'transparent',
          'rgba(255,255,255,0.35)',
          'rgba(255,255,255,0.70)',
          'rgba(255,255,255,0.92)',
          '#ffffff',
        ]}
        locations={[0, 0.25, 0.45, 0.65, 0.85, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
    </View>
  );

  const bottomWave = (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        bottom: 100, left: 0, right: 0,
        height: SCREEN_W * 0.4,
        zIndex: 0,
        opacity: 0.75,
      }}
    >
      <Image
        source={DECOR_WAVE_BOTTOM}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
      />
    </View>
  );

  return (
    <Screen gradient topDecoration={silkRibbon} bottomDecoration={bottomWave}>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              queryClient.invalidateQueries({ queryKey: ['home'] });
              refetch();
            }}
            tintColor={colors.oliveDeep}
            colors={[colors.oliveDeep]}
          />
        }
      >
        {/* ── Header ── menu + logo cluster LEFT, utility icons RIGHT.
            Matches the approved mockup where the brand mark sits next to
            the burger instead of floating in the middle of the row. */}
        <View
          style={{
            paddingHorizontal: SIDE,
            paddingTop: 4,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/settings')}
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable
              onPress={() => router.push('/(tabs)/tryon' as any)}
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
              <Ionicons name="sparkles-outline" size={18} color={colors.ink} />
              {tryonCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    minWidth: 20,
                    height: 20,
                    paddingHorizontal: 5,
                    borderRadius: 10,
                    backgroundColor: '#C8102E',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: colors.surface,
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 11,
                      lineHeight: 13,
                      fontWeight: '800',
                      color: '#FFFFFF',
                      textAlign: 'center',
                    }}
                  >
                    {tryonCount > 9 ? '9+' : String(tryonCount)}
                  </Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable
              onPress={() => router.push('/search')}
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
              onPress={() => router.push('/notifications')}
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
            </Pressable>
          </View>
        </View>

        {/* ── Welcome ── exact match to the HTML mockup: 32 px Playfair
            headline, italic jade "Muslima" with the SVG swoosh, gold
            kicker + diamond. Jasmine branch tucks into the top-right of
            this block only — scrolls with the welcome, out of the way. */}
        <View style={{ paddingHorizontal: SIDE + 4, paddingTop: 16, paddingBottom: 12, position: 'relative' }}>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: -8, right: -36,
              width: 160, height: 110,
              transform: [{ rotate: '-8deg' }],
            }}
          >
            <Image
              source={DECOR_JASMINE}
              style={{ width: '100%', height: '100%', opacity: 0.95 }}
              resizeMode="contain"
            />
          </View>
          {(() => {
            // Brand voice: the greeting always says "Muslima" — the
            // design pins this name regardless of the signed-in user.
            const greet = lang === 'ru' ? 'Привет' : 'Salom';
            const name = 'Muslima';
            return (
              <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Text
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 32,
                    lineHeight: 36,
                    fontWeight: '500',
                    color: '#1f2a16',
                  }}
                >
                  {greet},{' '}
                </Text>
                <View style={{ position: 'relative' }}>
                  <Text
                    style={{
                      fontFamily: 'PlayfairDisplay-Italic',
                      fontSize: 34,
                      lineHeight: 38,
                      fontWeight: '600',
                      color: '#487a62',
                    }}
                  >
                    {name}
                  </Text>
                  <Svg
                    width="100%"
                    height={10}
                    viewBox="0 0 120 10"
                    style={{ position: 'absolute', left: 2, right: 8, bottom: -4 }}
                    pointerEvents="none"
                  >
                    <Path
                      d="M2 7 Q 30 1 60 5 T 118 4"
                      stroke="#5a8c74"
                      strokeWidth={1.4}
                      strokeLinecap="round"
                      fill="none"
                    />
                  </Svg>
                </View>
              </View>
            );
          })()}
        </View>

        {/* ── Hero carousel ── admin-curated banners replace the static
            Virtual primerka hero when they exist; otherwise the hero
            below is the fallback so the home screen never has a hole. */}
        <AdsCarousel />
        {!adsExist && (
          <Pressable
            onPress={() => router.push('/(tabs)/tryon')}
            style={{ marginHorizontal: SIDE, marginTop: 20 }}
          >
            {/* Fallback hero when no admin banners are set: a single
                illustrative Hijab-collection image that doubles as the CTA
                into the Virtual primerka screen. Image already contains the
                headline and features baked in, so no overlay text here. */}
            <Image
              source={DECOR_HERO_HOME}
              style={{
                width: '100%',
                aspectRatio: 16 / 9,
                borderRadius: theme.radii['2xl'],
              }}
              resizeMode="cover"
            />
          </Pressable>
        )}

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
            {/* Premium pill title — cream pill with a gold frame and a
                jasmine blossom perched over its top-left corner so the
                flower reads as a decorative stamp spilling off the
                badge. */}
            <View style={{ flexShrink: 1, position: 'relative' }}>
              <View
                style={{
                  height: 30,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingLeft: 36,
                  paddingRight: 16,
                  borderRadius: 999,
                  backgroundColor: '#faf2e1',
                  borderWidth: 1,
                  borderColor: '#c9a861',
                  shadowColor: '#1f2a16',
                  shadowOpacity: 0.08,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 5,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 13,
                    lineHeight: 15,
                    fontWeight: '700',
                    color: colors.oliveDeep,
                    textAlignVertical: 'center',
                    includeFontPadding: false,
                  }}
                >
                  {t('home.stores')}
                </Text>
              </View>
              <Image
                source={DECOR_JASMINE}
                style={{
                  position: 'absolute',
                  left: -18,
                  top: -16,
                  width: 54,
                  height: 48,
                  transform: [{ rotate: '-14deg' }],
                }}
                resizeMode="contain"
                pointerEvents="none"
              />
            </View>
            <Pressable
              onPress={() => router.push('/stores')}
              hitSlop={6}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: colors.oliveDeep,
                borderWidth: 1,
                borderColor: '#c9a861',
                shadowColor: '#1f2a16',
                shadowOpacity: 0.22,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 5,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#f1dfa4',
                letterSpacing: 0.2,
              }}>
                {t('home.allStores')}
              </Text>
              <Ionicons name="arrow-forward" size={11} color="#f1dfa4" />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE, paddingTop: 14, paddingBottom: 4, gap: 14 }}
          >
            {stores.map((store, idx) => {
              const p = STORE_PALETTE[idx % STORE_PALETTE.length] ?? STORE_PALETTE[0]!;
              return (
                <Pressable
                  key={store.id}
                  onPress={() =>
                    router.push({ pathname: '/shop/[id]', params: { id: store.id } })
                  }
                  style={{ alignItems: 'center', gap: 6, width: 76 }}
                >
                  {/* Mockup avatar: full-size tinted disc with a hairline
                      colored border — exactly the shop.a1/a2/a3 look. */}
                  <View
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 38,
                      backgroundColor: p.fill,
                      borderWidth: 1.5,
                      borderColor: p.ring,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      shadowColor: p.ink,
                      shadowOpacity: 0.18,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 8,
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
                        style={{
                          color: p.ink,
                          fontFamily: theme.fontFamilies.display,
                          fontWeight: '600',
                          fontSize: 22,
                          letterSpacing: 1,
                        }}
                      >
                        {store.brandName.slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 11,
                      fontWeight: '500',
                      textAlign: 'center',
                      color: '#4a4a3b',
                    }}
                  >
                    {store.brandName.split(' ')[0]}
                  </Text>
                </Pressable>
              );
            })}

            {/* Add-shop — dashed jade ring, same disc size. */}
            <Pressable
              onPress={() => router.push('/(tabs)/catalog')}
              style={{ alignItems: 'center', gap: 6, width: 76 }}
            >
              <View
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: 38,
                  borderWidth: 1.5,
                  borderColor: 'rgba(90,140,116,0.5)',
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="add" size={28} color="#487a62" />
              </View>
              <Text style={{ fontSize: 11, color: '#857e6e' }}>
                {lang === 'ru' ? 'Ещё' : "Qo'shish"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* ── Categories ── */}
        <View style={{ marginTop: 24 }}>
          <View style={{ paddingHorizontal: SIDE, marginBottom: 14, flexDirection: 'row' }}>
            {/* Premium pill title — mirrors the "Новые магазины" badge
                with a jasmine blossom spilling off the top-left. */}
            <View style={{ position: 'relative' }}>
              <View
                style={{
                  height: 30,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingLeft: 36,
                  paddingRight: 16,
                  borderRadius: 999,
                  backgroundColor: '#faf2e1',
                  borderWidth: 1,
                  borderColor: '#c9a861',
                  shadowColor: '#1f2a16',
                  shadowOpacity: 0.08,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 5,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 13,
                    lineHeight: 15,
                    fontWeight: '700',
                    color: colors.oliveDeep,
                    textAlignVertical: 'center',
                    includeFontPadding: false,
                  }}
                >
                  {lang === 'ru' ? 'Категории' : 'Kategoriyalar'}
                </Text>
              </View>
              <Image
                source={DECOR_JASMINE}
                style={{
                  position: 'absolute',
                  left: -18,
                  top: -16,
                  width: 54,
                  height: 48,
                  transform: [{ rotate: '-14deg' }],
                }}
                resizeMode="contain"
                pointerEvents="none"
              />
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SIDE, gap: 12 }}
          >
            {CATEGORY_DATA.map((cat) => {
              // 3.3 cards visible per screen: enough room for full Uzbek
              // category labels ("Aksessuarlar") without truncation while
              // the 4th hints that the row scrolls — matches the mockup.
              const cellW = (SCREEN_W - SIDE - 10) / 3.3;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/catalog', params: { category: cat.id } })
                  }
                  style={({ pressed }) => ({
                    width: cellW,
                    opacity: pressed ? 0.85 : 1,
                    gap: 10,
                  })}
                >
                  {/* Rounded squircle card holding the category photo. The
                      caption sits BELOW the card as a serif label with a
                      vector diamond gem — matches the final mockup. */}
                  <View
                    style={{
                      width: '100%',
                      aspectRatio: 1,
                      borderRadius: 20,
                      overflow: 'hidden',
                      backgroundColor: colors.surface,
                      ...theme.shadows.sm,
                    }}
                  >
                    <Image
                      source={cat.image}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode={cat.fit as 'cover' | 'contain'}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 2,
                    }}
                  >
                    {/* Gold disc holding a real SVG diamond. The unicode ◆
                        glyph rendered as a hooded silhouette on iOS at
                        this font size, so we draw the gem ourselves. */}
                    <View
                      style={{
                        width: 16, height: 16, borderRadius: 8,
                        backgroundColor: colors.gold,
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Svg width={8} height={8} viewBox="0 0 10 10">
                        <Path d="M5 0.5 L9.5 5 L5 9.5 L0.5 5 Z" fill="#ffffff" />
                      </Svg>
                    </View>
                    <Text
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontFamily: theme.fontFamilies.display,
                        fontSize: 13,
                        fontWeight: '500',
                        color: colors.oliveDeep,
                      }}
                    >
                      {t(`home.categories.${cat.id}` as never, { defaultValue: cat.id })}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Favorites (TZ Phase 4) ── 2-column grid of nearby/arrival
            products styled to match the mockup's "Избранные магазины"
            fav-card look: shop chip on the image, heart top-right, serif
            title, bold price and star rating. Data still comes from the
            same nearbyQuery / newArrivals fallback as before. */}
        <View style={{ marginTop: 28 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: SIDE,
            }}
          >
            {/* Premium pill title — same cream+gold badge with a
                jasmine blossom spilling off the top-left corner. */}
            <View style={{ flexShrink: 1, position: 'relative' }}>
              <View
                style={{
                  height: 30,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingLeft: 36,
                  paddingRight: 16,
                  borderRadius: 999,
                  backgroundColor: '#faf2e1',
                  borderWidth: 1,
                  borderColor: '#c9a861',
                  shadowColor: '#1f2a16',
                  shadowOpacity: 0.08,
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 5,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 13,
                    lineHeight: 15,
                    fontWeight: '700',
                    color: colors.oliveDeep,
                    textAlignVertical: 'center',
                    includeFontPadding: false,
                  }}
                >
                  {lang === 'ru' ? 'Избранные магазины' : "Yaqin atrofdagi do'konlar"}
                </Text>
              </View>
              <Image
                source={DECOR_JASMINE}
                style={{
                  position: 'absolute',
                  left: -18,
                  top: -16,
                  width: 54,
                  height: 48,
                  transform: [{ rotate: '-14deg' }],
                }}
                resizeMode="contain"
                pointerEvents="none"
              />
            </View>
            <Pressable
              onPress={() => router.push('/(tabs)/catalog')}
              hitSlop={6}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
                backgroundColor: colors.oliveDeep,
                borderWidth: 1,
                borderColor: '#c9a861',
                shadowColor: '#1f2a16',
                shadowOpacity: 0.22,
                shadowOffset: { width: 0, height: 2 },
                shadowRadius: 5,
                transform: [{ scale: pressed ? 0.96 : 1 }],
              })}
            >
              <Text style={{
                fontSize: 10,
                fontWeight: '700',
                color: '#f1dfa4',
                letterSpacing: 0.2,
              }}>
                {t('common.seeAll')}
              </Text>
              <Ionicons name="arrow-forward" size={11} color="#f1dfa4" />
            </Pressable>
          </View>

          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 14,
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            {arrivals.map((p) => {
              const scene = sceneById((p.attributes as any)?.sceneId);
              return (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push({ pathname: '/product/[id]', params: { id: p.id } })
                  }
                  style={({ pressed }) => ({
                    width: (SCREEN_W - 16 * 2 - 12) / 2,
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: 'rgba(201,168,97,0.15)',
                    opacity: pressed ? 0.92 : 1,
                  })}
                >
                  {/* Image — taller portrait aspect so the full
                      mannequin (head to feet) fits inside the card
                      instead of getting cropped at the waist. Contain
                      the image so the model is never clipped. */}
                  <View style={{ aspectRatio: 3 / 4, backgroundColor: colors.surfaceGlass, position: 'relative' }}>
                    {scene && (
                      <Image
                        source={scene.source}
                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                    )}
                    {p.coverUrl ? (
                      <Image
                        source={{ uri: p.coverUrl }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
                      />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="ribbon-outline" size={36} color="rgba(0,0,0,0.1)" />
                      </View>
                    )}
                    {/* Wishlist heart top-right (shop chip removed —
                        designer wanted the mannequin to carry the card). */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        addWishlist.mutate(p.id);
                      }}
                      hitSlop={8}
                      style={{
                        position: 'absolute',
                        top: 8, right: 8,
                        width: 28, height: 28, borderRadius: 14,
                        backgroundColor: 'rgba(255,255,255,0.92)',
                        alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="heart-outline" size={14} color="#3a6451" />
                    </Pressable>
                  </View>

                  {/* Info */}
                  <View style={{ padding: 10 }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: theme.fontFamilies.display,
                        fontSize: 13,
                        fontWeight: '500',
                        color: colors.oliveDeep,
                        marginBottom: 4,
                      }}
                    >
                      {lang === 'ru' ? p.title.ru : (p.title.uz ?? p.title.ru)}
                    </Text>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: theme.fontFamilies.display,
                          fontWeight: '700',
                          fontSize: 13,
                          color: '#3a6451',
                          letterSpacing: -0.3,
                        }}
                      >
                        {formatUsdAsUzs(p.basePriceUsd, uzsRate)}
                      </Text>
                      {p.seller && p.seller.rating > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Ionicons name="star" size={10} color={colors.gold} />
                          <Text style={{ fontSize: 10, fontWeight: '600', color: '#8f6a2d' }}>
                            {p.seller.rating.toFixed(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

      </ScrollView>
    </Screen>
  );
}
