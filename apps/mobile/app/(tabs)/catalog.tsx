import { useState, useCallback } from 'react';
import { Alert, Dimensions, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { safeBack } from '../../src/lib/safe-back';
import { formatUsdAsUzs, useUzsRate } from '../../src/lib/currency';
import { sceneById } from '../../src/lib/scenes';

const { width: SCREEN_W } = Dimensions.get('window');
const DECOR_SILK_TOP = require('../../assets/decor/silk-top.png');
const DECOR_JASMINE = require('../../assets/decor/jasmine.webp');
const DECOR_WAVE_BOTTOM = require('../../assets/decor/wave-bottom.webp');

type CategoryId = 'scarves' | 'dresses' | 'shoes' | 'bags' | 'accessories';

interface Product {
  id: string;
  title: { ru: string; uz: string };
  basePriceUsd: number;
  coverUrl: string;
  seller: { brandName: string; rating: number; reviewsCount: number };
  attributes?: Record<string, unknown> | null;
  // Needed so the "+" quick-add can pick the first variant without a
  // product-detail round trip.
  variants?: Array<{ id: string }>;
}

// Same hero webp images the website and the home-tab tiles use, so the pill
// chip, the big tiles on the home tab, and the website homepage all agree
// on how a category looks.
const CATEGORY_IMAGES: Record<CategoryId, number> = {
  scarves: require('../../assets/category-ipak.webp'),
  dresses: require('../../assets/category-shoyi.webp'),
  bags: require('../../assets/category-pashmina.webp'),
  accessories: require('../../assets/category-shifon.webp'),
};

const COLORS: Array<{ key: string; hex: string }> = [
  { key: 'yellow', hex: '#F4D06F' },
  { key: 'white', hex: '#F8F5EE' },
  { key: 'beige', hex: '#D4C3A0' },
  { key: 'pink', hex: '#E8B0B0' },
  { key: 'gray', hex: '#B0AEA7' },
  { key: 'green', hex: '#7A8A5B' },
  { key: 'lightgreen', hex: '#B5CDA3' },
  { key: 'khaki', hex: '#8F7E4F' },
  { key: 'blue', hex: '#5F7A94' },
  { key: 'purple', hex: '#8B5CF6' },
  { key: 'orange', hex: '#F5894A' },
  { key: 'black', hex: '#1A1A1A' },
  { key: 'brown', hex: '#8B6E4E' },
  { key: 'burgundy', hex: '#722F37' },
  { key: 'multicolor', hex: '#E8E3D4' },
  { key: 'unusual', hex: '#D4B86A' },
];

export default function CatalogScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: CategoryId }>();
  const queryClient = useQueryClient();
  const lang = (i18n.language?.slice(0, 2) ?? 'uz') as 'uz' | 'ru';

  const [category, setCategory] = useState<CategoryId>(params.category ?? 'scarves');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [bodyFit, setBodyFit] = useState<'slim' | 'regular' | 'plus' | null>(null);

  const { data, isError, refetch } = useQuery({
    queryKey: ['products', category, selectedColor, bodyFit],
    queryFn: async () =>
      (await api.get('/catalog/products', {
        params: {
          category,
          ...(selectedColor && { color: selectedColor }),
          ...(bodyFit && { bodyFit }),
          pageSize: 20,
        },
      })).data,
  });

  const products: Product[] = data?.items ?? [];

  // Wishlist toggle — the catalog card hearts share one mutation to avoid
  // one in-flight request per card and keep wishlist count queries in sync.
  const addWishlist = useMutation({
    mutationFn: async (productId: string) =>
      (await api.post(`/wishlist/${productId}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile-wishlist-count'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (e) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  // Add first variant to cart — the card's "+" is a one-tap convenience;
  // size/color pickers live on the product detail screen.
  const addCart = useMutation({
    mutationFn: async (variantId: string) =>
      (await api.post('/cart', { variantId, quantity: 1 })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      const title = lang === 'ru' ? 'Готово' : 'Qo\'shildi';
      const msg = lang === 'ru' ? 'Товар добавлен в корзину' : 'Mahsulot savatga qo\'shildi';
      Alert.alert(title, msg);
    },
    onError: (e) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  const renderProduct = useCallback(
    ({ item, index }: { item: Product; index: number }) => (
      <ProductCard
        product={item}
        index={index}
        onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
        onAddToWishlist={() => addWishlist.mutate(item.id)}
        onAddToCart={() => {
          const firstVariantId = item.variants?.[0]?.id;
          if (firstVariantId) addCart.mutate(firstVariantId);
        }}
        isLeft={index % 2 === 0}
      />
    ),
    // mutations are stable singletons from react-query; router captured once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router],
  );

  const listHeader = (
    <>
      {/* Welcome: kicker + "Каталог 24:31" matches the mockup, with the
          "24:31" italic in jade and the swoosh underline. Jasmine branch
          sits in the top-right corner of this block, scrolls with it. */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 4, position: 'relative' }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text
            style={{
              letterSpacing: 3,
              textTransform: 'uppercase',
              fontSize: 10,
              fontWeight: '600',
              color: '#8f6a2d',
            }}
          >
            {lang === 'ru' ? 'Добро пожаловать' : 'Xush kelibsiz'}
          </Text>
          <Svg width={12} height={12} viewBox="0 0 10 10">
            <Path d="M5 0.5 L9.5 5 L5 9.5 L0.5 5 Z" fill="#c9a861" />
          </Svg>
        </View>
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
            {lang === 'ru' ? 'Каталог ' : 'Katalog '}
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
              24:31
            </Text>
            <Svg
              width="100%" height={10} viewBox="0 0 120 10"
              style={{ position: 'absolute', left: 2, right: 8, bottom: -4 }}
              pointerEvents="none"
            >
              <Path
                d="M2 7 Q 30 1 60 5 T 118 4"
                stroke="#5a8c74" strokeWidth={1.4} strokeLinecap="round" fill="none"
              />
            </Svg>
          </View>
        </View>
      </View>

      {/* Search bar — pill shape, jade search icon on left, scan-code
          square on the right. Matches the mockup .search rule. */}
      <View
        style={{
          marginHorizontal: 20,
          marginTop: 14,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#fff',
          borderRadius: 999,
          borderWidth: 1,
          borderColor: 'rgba(201,168,97,0.18)',
          shadowColor: '#2a2a1f',
          shadowOpacity: 0.1,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
        }}
      >
        <Ionicons name="search-outline" size={18} color="#487a62" />
        <Pressable
          onPress={() => router.push('/search')}
          style={{ flex: 1 }}
          hitSlop={6}
        >
          <Text style={{ fontSize: 14, color: '#857e6e' }}>
            {lang === 'ru' ? 'Поиск по каталогу' : "Katalogdan izlash"}
          </Text>
        </Pressable>
        <View
          style={{
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: '#f8f3e5',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="scan-outline" size={18} color="#3a6451" />
        </View>
      </View>

      {/* Category Tabs — adds an "All" chip in forest green at the
          start to match the mockup's 24:31 brand chip. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 14, gap: 10 }}
      >
        {(['scarves', 'dresses', 'bags', 'accessories'] as CategoryId[]).map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingLeft: 6,
                paddingRight: 16,
                height: 42,
                borderRadius: 21,
                backgroundColor: active ? colors.oliveDeep : colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: colors.rule,
              }}
            >
              <Image
                source={CATEGORY_IMAGES[c]}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  borderWidth: 1.5,
                  borderColor: active ? colors.goldSoft : 'rgba(0,0,0,0.08)',
                }}
                resizeMode="cover"
              />
              <Text
                variant="bodySmall"
                style={{
                  color: active ? colors.goldSoft : colors.ink,
                  fontWeight: active ? '600' : '400',
                }}
              >
                {t(`home.categories.${c}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>


      {/* Filter Panel */}
      {showFilters && (
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            padding: 14,
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text variant="titleSmall" color="ink">
              {t('catalog.color')}
            </Text>
            {selectedColor && (
              <Pressable onPress={() => setSelectedColor(null)}>
                <Text variant="caption" color="oliveDeep" style={{ fontWeight: '500' }}>
                  {t('common.reset')}
                </Text>
              </Pressable>
            )}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
            {COLORS.map((c) => {
              const active = c.key === selectedColor;
              return (
                <Pressable
                  key={c.key}
                  onPress={() => setSelectedColor(active ? null : c.key)}
                  style={{ alignItems: 'center', gap: 4, width: 44 }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: c.hex,
                      borderWidth: active ? 2.5 : 1,
                      borderColor: active ? colors.oliveDeep : colors.rule,
                    }}
                  />
                  <Text
                    variant="caption"
                    style={{
                      color: active ? colors.oliveDeep : colors.muted,
                      fontSize: 9,
                      fontWeight: active ? '600' : '400',
                    }}
                  >
                    {t(`catalog.colors.${c.key}` as never, { defaultValue: c.key })}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Body fit filter — ozg'iz / o'rtacha / to'la odamga */}
          <View style={{ marginTop: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="titleSmall" color="ink">
                {t('catalog.bodyFit.title')}
              </Text>
              {bodyFit && (
                <Pressable onPress={() => setBodyFit(null)}>
                  <Text variant="caption" color="oliveDeep" style={{ fontWeight: '500' }}>
                    {t('common.reset')}
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              {(['slim', 'regular', 'plus'] as const).map((key) => {
                const active = bodyFit === key;
                return (
                  <Pressable
                    key={key}
                    onPress={() => setBodyFit(active ? null : key)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: active ? colors.oliveDeep : colors.rule,
                      backgroundColor: active ? colors.oliveDeep : colors.surface,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{
                        color: active ? colors.goldSoft : colors.ink,
                        fontSize: 12,
                        fontWeight: '600',
                      }}
                    >
                      {t(`catalog.bodyFit.${key}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </>
  );

  return (
    <Screen>
      {/* Shared silk + jasmine decor — identical to home.tsx so every
          tab reads as the same brand surface. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: SCREEN_W * 0.5,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <Image
          source={DECOR_SILK_TOP}
          style={{ width: '110%', height: '100%', marginLeft: '-5%', opacity: 1 }}
          resizeMode="cover"
        />
      </View>
      {/* Scarf-like green silk wave anchored above the tab bar — matches
          the fabric motif the client wanted on every screen. */}
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

      <View style={{ flex: 1 }}>
        <FlashList
          data={products}
          numColumns={2}
          estimatedItemSize={280}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListHeaderComponent={listHeader}
          renderItem={renderProduct}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => refetch()}
              tintColor={colors.oliveDeep}
              colors={[colors.oliveDeep]}
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Ionicons
                name={isError ? 'cloud-offline-outline' : 'search-outline'}
                size={48}
                color={colors.muted}
              />
              <Text variant="body" color="muted">
                {isError
                  ? (lang === 'ru' ? 'Не удалось загрузить товары' : "Mahsulotlar yuklanmadi")
                  : (lang === 'ru' ? 'Товары не найдены' : 'Mahsulot topilmadi')}
              </Text>
            </View>
          }
        />
      </View>
    </Screen>
  );
}

const PLACEHOLDER_BG = [
  '#B5B891', '#E4CE9A', '#D4C3A0', '#C4C88C', '#D9D0BE', '#E8DFCC',
];

function ProductCard({
  product,
  index,
  onPress,
  onAddToWishlist,
  onAddToCart,
  isLeft,
}: {
  product: Product;
  index: number;
  onPress: () => void;
  onAddToWishlist: () => void;
  onAddToCart: () => void;
  isLeft: boolean;
}) {
  const { colors, theme } = useTheme();
  const [imgError, setImgError] = useState(!product.coverUrl);
  const bg = PLACEHOLDER_BG[index % PLACEHOLDER_BG.length];
  const uzsRate = useUzsRate();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        marginRight: isLeft ? 6 : 16,
        marginLeft: isLeft ? 16 : 6,
        marginBottom: 12,
        backgroundColor: colors.surface,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.rule,
        opacity: pressed ? 0.92 : 1,
      })}
    >
      {/* Image */}
      <View style={{ height: 200, backgroundColor: bg, position: 'relative' }}>
        {(() => {
          const scene = sceneById((product.attributes as any)?.sceneId);
          if (!scene) return null;
          return (
            <Image
              source={scene.source}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          );
        })()}
        {!imgError && product.coverUrl ? (
          <Image
            source={{ uri: product.coverUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="contain"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="ribbon-outline" size={40} color="rgba(255,255,255,0.35)" />
          </View>
        )}
        {/* Wishlist */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onAddToWishlist();
          }}
          hitSlop={8}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: 'rgba(0,0,0,0.45)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="heart-outline" size={16} color="#fff" />
        </Pressable>
        {/* TRY-ON Badge */}
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
      <View style={{ padding: 10, gap: 4 }}>
        <Text variant="bodySmall" color="ink" numberOfLines={1}>
          {product.title.ru}
        </Text>

        <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
          {product.seller.brandName} · <Text variant="caption" style={{ color: colors.gold, fontSize: 11 }}>★</Text> {product.seller.rating}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 2,
          }}
        >
          <Text variant="titleSmall" color="oliveDeep" style={{ fontWeight: '700' }}>
            {formatUsdAsUzs(product.basePriceUsd, uzsRate)}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              onAddToCart();
            }}
            hitSlop={8}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.olive,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
