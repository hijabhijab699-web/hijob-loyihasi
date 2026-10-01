import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

interface ProductDetail {
  id: string;
  title: { ru: string; uz: string };
  basePriceUsd: number;
  coverUrl: string;
  gallery: string[];
  description: string;
  seller: { brandName: string; rating: number; reviewsCount: number };
  colors: Array<{ key: string; hex: string; label: string }>;
  sizes: string[];
  variants: Array<{
    id: string;
    color: string;
    colorHex: string;
    size: string;
    priceUsd: number;
    stock: number;
    images: string[];
  }>;
}

const MOCK_PRODUCT: ProductDetail = {
  id: '1',
  title: { ru: 'Ipak ro\'mol Premium', uz: 'Ipak ro\'mol Premium' },
  basePriceUsd: 45,
  coverUrl: '',
  gallery: [],
  description:
    "100% tabiiy ipakdan tayyorlangan premium sifatli ro'mol. Nafis dizayn va yuqori sifat kafolati. Har qanday mavsumda kiyish uchun mos. O'zbek ipakchilik an'analarining eng yaxshi namunasi.",
  seller: { brandName: 'SilkWay Collection', rating: 4.8, reviewsCount: 1200 },
  colors: [
    { key: 'red', hex: '#C0504D', label: 'Qizil' },
    { key: 'black', hex: '#2A2820', label: 'Qora' },
    { key: 'white', hex: '#FDFAF3', label: 'Oq' },
    { key: 'olive', hex: '#8A8D5B', label: 'Zaytun' },
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  variants: [
    { id: 'v1', color: 'red', colorHex: '#C0504D', size: 'M', priceUsd: 45, stock: 5, images: [] },
  ],
};

const IMAGE_BG = ['#E4CE9A', '#D9D0BE', '#C9A96E', '#A88848'];

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const { data } = useQuery<ProductDetail>({
    queryKey: ['product', id],
    queryFn: async () => {
      try {
        return (await api.get(`/catalog/products/${id}`)).data;
      } catch {
        return MOCK_PRODUCT;
      }
    },
    enabled: !!id,
  });

  const product = data ?? MOCK_PRODUCT;

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(1);
  const [liked, setLiked] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const addToCart = useMutation({
    mutationFn: async (variantId: string) => {
      await api.post('/cart', { variantId, quantity: 1 });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert('✓', 'Savatga qo\'shildi');
    },
  });

  const productColors = product.colors ?? MOCK_PRODUCT.colors;
  const productSizes = product.sizes ?? MOCK_PRODUCT.sizes;
  const currentColor = productColors[selectedColor];

  return (
    <Screen>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Product Image Area */}
          <View style={{ width: '100%', height: 400, position: 'relative' }}>
            {product.coverUrl ? (
              <Image
                source={{ uri: product.coverUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  background: undefined,
                  backgroundColor: IMAGE_BG[activeImage % IMAGE_BG.length],
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="ribbon-outline" size={64} color="rgba(255,255,255,0.35)" />
              </View>
            )}

            {/* Top Controls */}
            <View
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                right: 16,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  backgroundColor: colors.surfaceGlass,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="chevron-back" size={18} color={colors.oliveDeep} />
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  hitSlop={8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceGlass,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="share-outline" size={18} color={colors.oliveDeep} />
                </Pressable>
                <Pressable
                  onPress={() => setLiked((v) => !v)}
                  hitSlop={8}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceGlass,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={18}
                    color={liked ? colors.danger : colors.oliveDeep}
                  />
                </Pressable>
              </View>
            </View>

            {/* Carousel Dots */}
            <View
              style={{
                position: 'absolute',
                bottom: 16,
                alignSelf: 'center',
                flexDirection: 'row',
                gap: 6,
                left: 0,
                right: 0,
                justifyContent: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <View
                  key={i}
                  style={{
                    width: i === activeImage ? 24 : 8,
                    height: 4,
                    borderRadius: 999,
                    backgroundColor:
                      i === activeImage ? colors.oliveDeep : 'rgba(54,57,36,0.3)',
                  }}
                />
              ))}
            </View>
          </View>

          {/* Product Content */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            {/* Brand Row */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  backgroundColor: colors.olive,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  variant="caption"
                  style={{ fontSize: 11, fontWeight: '600', color: '#FDFAF3' }}
                >
                  {product.seller.brandName.slice(0, 1)}
                </Text>
              </View>
              <Text variant="bodySmall" color="muted" style={{ fontSize: 13, flex: 1 }}>
                {product.seller.brandName}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={14} color={colors.gold} />
                <Text
                  variant="bodySmall"
                  color="ink"
                  style={{ fontSize: 13, fontWeight: '500' }}
                >
                  {product.seller.rating}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text
              variant="displayLarge"
              color="oliveDeep"
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 24,
                fontWeight: '700',
                lineHeight: 29,
                marginBottom: 8,
              }}
            >
              {product.title.uz ?? product.title.ru}
            </Text>

            {/* Price */}
            <Text
              variant="displayLarge"
              color="oliveDeep"
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 28,
                fontWeight: '700',
                marginBottom: 16,
              }}
            >
              ${product.basePriceUsd}
            </Text>

            {/* Divider */}
            <View
              style={{
                height: 1,
                backgroundColor: colors.rule,
                marginBottom: 18,
              }}
            />

            {/* Color Selector */}
            <View style={{ marginBottom: 20 }}>
              <Text variant="bodySmall" color="ink" style={{ fontSize: 13, fontWeight: '500', marginBottom: 10 }}>
                Rang: <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>{currentColor?.label}</Text>
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {productColors.map((c, i) => (
                  <Pressable
                    key={c.key}
                    onPress={() => setSelectedColor(i)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      backgroundColor: c.hex,
                      borderWidth: i === selectedColor ? 2.5 : c.key === 'white' ? 1 : 2.5,
                      borderColor:
                        i === selectedColor
                          ? colors.oliveDeep
                          : c.key === 'white'
                            ? colors.rule
                            : 'transparent',
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Size Selector */}
            <View style={{ marginBottom: 22 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}
              >
                <Text variant="bodySmall" color="ink" style={{ fontSize: 13, fontWeight: '500' }}>
                  O'lcham
                </Text>
                <Pressable>
                  <Text variant="bodySmall" style={{ fontSize: 12, color: colors.gold }}>
                    O'lcham jadvali
                  </Text>
                </Pressable>
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {productSizes.map((size, i) => {
                  const active = i === selectedSize;
                  return (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(i)}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: active ? colors.oliveDeep : colors.surface,
                        borderWidth: active ? 0 : 1,
                        borderColor: colors.rule,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        variant="bodySmall"
                        style={{
                          fontSize: 14,
                          fontWeight: active ? '600' : '500',
                          color: active ? colors.goldSoft : colors.ink,
                        }}
                      >
                        {size}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Try-On CTA Card */}
            <Pressable
              onPress={() => router.push('/(tabs)/tryon')}
              style={{
                backgroundColor: colors.oliveDeep,
                borderRadius: 16,
                padding: 18,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                marginBottom: 22,
              }}
            >
              <Ionicons name="body-outline" size={36} color={colors.goldSoft} />
              <View style={{ flex: 1 }}>
                <Text
                  variant="bodySmall"
                  style={{ fontSize: 14, fontWeight: '600', color: colors.goldSoft, marginBottom: 3 }}
                >
                  AI bilan kiyib ko'ring
                </Text>
                <Text
                  variant="caption"
                  style={{ fontSize: 12, color: 'rgba(228,206,154,0.5)', lineHeight: 16 }}
                >
                  Sotib olishdan oldin virtual primerka
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.goldSoft} />
            </Pressable>

            {/* Description */}
            <View style={{ marginBottom: 20 }}>
              <Text
                variant="bodySmall"
                color="ink"
                style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}
              >
                Tavsif
              </Text>
              <Text
                variant="bodySmall"
                color="muted"
                style={{ fontSize: 13, lineHeight: 21 }}
              >
                {product.description ?? MOCK_PRODUCT.description}
              </Text>
            </View>

            {/* Delivery Info */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                paddingVertical: 14,
              }}
            >
              <Ionicons name="car-outline" size={20} color={colors.ink} />
              <Text
                variant="bodySmall"
                color="ink"
                style={{ fontSize: 13, flex: 1 }}
              >
                1-2 kun ichida yetkazib berish
              </Text>
              <View
                style={{
                  backgroundColor: 'rgba(122,138,91,0.12)',
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                }}
              >
                <Text
                  variant="caption"
                  style={{ fontSize: 11, fontWeight: '600', color: '#7A8A5B' }}
                >
                  Bepul
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Bar */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.rule,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 28,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          <Pressable
            onPress={() => router.push('/(tabs)/tryon')}
            style={{
              flex: 1,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.surfaceAlt,
              borderWidth: 1,
              borderColor: colors.rule,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="body-outline" size={20} color={colors.oliveDeep} />
            <Text
              variant="bodySmall"
              style={{ fontSize: 14, fontWeight: '600', color: colors.oliveDeep }}
            >
              Sinab ko'rish
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              const v = product.variants?.[0];
              if (v) addToCart.mutate(v.id);
            }}
            style={({ pressed }) => ({
              flex: 1.3,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.oliveDeep,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Ionicons name="bag-outline" size={20} color={colors.goldSoft} />
            <Text
              variant="bodySmall"
              style={{ fontSize: 14, fontWeight: '600', color: colors.goldSoft }}
            >
              Savatga qo'shish
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
