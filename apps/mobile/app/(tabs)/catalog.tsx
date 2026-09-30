import { useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

type CategoryId = 'scarves' | 'dresses' | 'bags' | 'accessories';

interface Product {
  id: string;
  title: { ru: string };
  basePriceUsd: number;
  coverUrl: string;
  seller: { brandName: string; rating: number; reviewsCount: number };
}

const COLORS: Array<{ key: string; hex: string; label: string }> = [
  { key: 'yellow', hex: '#F4D06F', label: 'yellow' },
  { key: 'white', hex: '#F8F5EE', label: 'white' },
  { key: 'beige', hex: '#D4C3A0', label: 'beige' },
  { key: 'pink', hex: '#E8B0B0', label: 'pink' },
  { key: 'gray', hex: '#B0AEA7', label: 'gray' },
  { key: 'green', hex: '#7A8A5B', label: 'green' },
  { key: 'blue', hex: '#5F7A94', label: 'blue' },
  { key: 'black', hex: '#1A1A1A', label: 'black' },
];

export default function CatalogScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: CategoryId }>();

  const [category, setCategory] = useState<CategoryId>(params.category ?? 'scarves');
  const [showFilters, setShowFilters] = useState(true);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ['products', category, selectedColor],
    queryFn: async () =>
      (
        await api.get('/catalog/products', {
          params: {
            category,
            ...(selectedColor && { color: selectedColor }),
            pageSize: 20,
          },
        })
      ).data,
  });

  const products: Product[] = data?.items ?? [];

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.ink} />
        </Pressable>
        <Logo size={60} label={false} />
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Ionicons name="heart-outline" size={22} color={colors.ink} />
          <Ionicons name="bag-outline" size={22} color={colors.ink} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
        <Text variant="displayLarge" color="oliveDeep">
          {t(`catalog.${category === 'scarves' ? 'scarves' : 'dresses'}.title`)}
        </Text>
        <Text variant="bodySmall" color="muted" style={{ marginTop: 4 }}>
          {t(`catalog.${category === 'scarves' ? 'scarves' : 'dresses'}.subtitle`)}
        </Text>
      </View>

      {/* Category chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 14, gap: 12 }}
      >
        {(['scarves', 'dresses', 'bags', 'accessories'] as CategoryId[]).map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: theme.radii.pill,
              backgroundColor: c === category ? colors.oliveDeep : colors.surface,
              borderWidth: 1,
              borderColor: c === category ? colors.oliveDeep : colors.rule,
            }}
          >
            <Text variant="bodySmall" color={c === category ? 'surface' : 'ink'}>
              {t(`home.categories.${c}`)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filter toggle */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12 }}>
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            height: 44,
            borderRadius: theme.radii.pill,
            backgroundColor: colors.oliveDeep,
          }}
        >
          <Ionicons name="options-outline" size={18} color={colors.surface} />
          <Text variant="bodySmall" color="surface">
            {t('catalog.filters')}
          </Text>
          <Ionicons
            name={showFilters ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.surface}
          />
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingHorizontal: 16,
            height: 44,
            borderRadius: theme.radii.pill,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.rule,
            flex: 1,
          }}
        >
          <Ionicons name="swap-vertical-outline" size={16} color={colors.ink} />
          <Text variant="bodySmall" color="ink" style={{ flex: 1 }}>
            {t('catalog.sort.popularity')}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.ink} />
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text variant="titleSmall" color="ink">
              {t('catalog.color')}
            </Text>
            <Pressable onPress={() => setSelectedColor(null)}>
              <Text variant="caption" color="oliveDeep">
                {t('common.reset')}
              </Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {COLORS.map((c) => (
                <Pressable
                  key={c.key}
                  onPress={() => setSelectedColor(c.key === selectedColor ? null : c.key)}
                  style={{ alignItems: 'center', gap: 4 }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: c.hex,
                      borderWidth: c.key === selectedColor ? 2 : 1,
                      borderColor: c.key === selectedColor ? colors.oliveDeep : colors.rule,
                    }}
                  />
                  <Text variant="caption" color="muted">
                    {t(`catalog.colors.${c.label}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Product grid */}
      <View style={{ flex: 1, marginTop: 16, paddingHorizontal: 16 }}>
        <FlashList
          data={products}
          numColumns={2}
          estimatedItemSize={280}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item, index }) => (
            <ProductCard
              product={item}
              onPress={() => router.push({ pathname: '/product/[id]', params: { id: item.id } })}
              isLeft={index % 2 === 0}
            />
          )}
        />
      </View>
    </Screen>
  );
}

function ProductCard({
  product,
  onPress,
  isLeft,
}: {
  product: Product;
  onPress: () => void;
  isLeft: boolean;
}) {
  const { colors, theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        marginRight: isLeft ? 6 : 0,
        marginLeft: isLeft ? 0 : 6,
        marginBottom: 12,
        backgroundColor: colors.surface,
        borderRadius: theme.radii.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.rule,
      }}
    >
      <View style={{ height: 220, position: 'relative' }}>
        <Image source={{ uri: product.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: colors.surfaceGlass,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="heart-outline" size={18} color={colors.ink} />
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.oliveDark,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.gold,
          }}
        >
          <Ionicons name="body-outline" size={22} color={colors.goldSoft} />
        </View>
      </View>
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: colors.olive,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="caption" color="surface" style={{ fontSize: 9 }}>
              {product.seller.brandName.slice(0, 1)}
            </Text>
          </View>
          <Text variant="caption" color="ink" numberOfLines={1}>
            {product.seller.brandName}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
          <Ionicons name="star" size={11} color={colors.gold} />
          <Text variant="caption" color="muted">
            {product.seller.rating.toFixed(1)} ({product.seller.reviewsCount})
          </Text>
        </View>
        <Text variant="bodySmall" color="ink" style={{ marginTop: 4 }} numberOfLines={1}>
          {product.title.ru}
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
          <Text variant="titleSmall" color="ink">
            ${product.basePriceUsd}
          </Text>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: colors.oliveDeep,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="bag-add-outline" size={14} color={colors.surface} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}
