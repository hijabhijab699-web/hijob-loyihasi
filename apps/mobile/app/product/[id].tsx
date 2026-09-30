import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

interface ProductDetail {
  id: string;
  title: { ru: string };
  basePriceUsd: number;
  coverUrl: string;
  gallery: string[];
  seller: { brandName: string; rating: number; reviewsCount: number };
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

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const { data } = useQuery<ProductDetail>({
    queryKey: ['product', id],
    queryFn: async () => (await api.get(`/catalog/products/${id}`)).data,
    enabled: !!id,
  });

  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);

  const addToCart = useMutation({
    mutationFn: async (variantId: string) => {
      await api.post('/cart', { variantId, quantity: 1 });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      Alert.alert('✓', 'Added to cart');
    },
  });

  if (!data) return <Screen />;

  const variant = data.variants[selectedVariantIdx] ?? data.variants[0];
  const image = variant?.images[0] ?? data.coverUrl;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ position: 'relative' }}>
          <Image source={{ uri: image }} style={{ width: '100%', height: 480 }} resizeMode="cover" />
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              top: 60,
              left: 20,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceGlass,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.ink} />
          </Pressable>
          <View
            style={{
              position: 'absolute',
              top: 60,
              right: 20,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <Pressable
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.surfaceGlass,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="heart-outline" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push('/(tabs)/tryon')}
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: theme.radii.pill,
              backgroundColor: colors.oliveDeep,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 2,
              borderColor: colors.gold,
            }}
          >
            <Ionicons name="body-outline" size={20} color={colors.goldSoft} />
            <Text variant="button" color="surface">
              {t('tryon.title')}
            </Text>
          </Pressable>
        </View>

        <View style={{ padding: 20, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: colors.olive,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="caption" color="surface" style={{ fontSize: 10 }}>
                {data.seller.brandName.slice(0, 1)}
              </Text>
            </View>
            <Text variant="bodySmall" color="ink">{data.seller.brandName}</Text>
            <Ionicons name="star" size={12} color={colors.gold} />
            <Text variant="caption" color="muted">
              {data.seller.rating.toFixed(1)} ({data.seller.reviewsCount})
            </Text>
          </View>

          <Text variant="displayLarge" color="oliveDeep">
            {data.title.ru}
          </Text>

          <Text variant="displayMedium" color="gold">
            ${variant?.priceUsd ?? data.basePriceUsd}
          </Text>

          {/* Colors */}
          <View style={{ marginTop: 8 }}>
            <Text variant="titleSmall" color="ink">
              {t('catalog.color')}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 8 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {data.variants.map((v, i) => (
                <Pressable
                  key={v.id}
                  onPress={() => setSelectedVariantIdx(i)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: v.colorHex,
                    borderWidth: i === selectedVariantIdx ? 3 : 1,
                    borderColor: i === selectedVariantIdx ? colors.gold : colors.rule,
                  }}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 34,
          backgroundColor: colors.bg,
        }}
      >
        <Button
          label={t('tryon.addToCart')}
          variant="gold"
          onPress={() => variant && addToCart.mutate(variant.id)}
          loading={addToCart.isPending}
          icon={<Ionicons name="bag-add-outline" size={20} color={colors.ink} />}
        />
      </View>
    </Screen>
  );
}
