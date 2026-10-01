import { useState } from 'react';
import { FlatList, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

type ProductStatus = 'live' | 'draft' | 'pending';

interface SellerProduct {
  id: string;
  name: string;
  price: number;
  status: ProductStatus;
  variantCount: number;
  stock: number;
  imageUrl?: string;
}

const STATUS_FILTERS: (ProductStatus | 'all')[] = ['all', 'live', 'draft', 'pending'];

function useSellerProducts(status: ProductStatus | 'all') {
  return useQuery<SellerProduct[]>({
    queryKey: ['seller', 'products', status],
    queryFn: async () => {
      try {
        const params = status !== 'all' ? { status } : {};
        const { data } = await api.get('/seller/products', { params });
        return data;
      } catch {
        return [];
      }
    },
  });
}

const STATUS_COLORS: Record<ProductStatus, { bg: string; text: string }> = {
  live: { bg: 'rgba(122,138,91,0.12)', text: '#7A8A5B' },
  draft: { bg: 'rgba(133,126,110,0.12)', text: '#857E6E' },
  pending: { bg: 'rgba(201,169,110,0.12)', text: '#C9A96E' },
};

export default function SellerProductsScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<ProductStatus | 'all'>('all');
  const { data: products = [] } = useSellerProducts(filter);

  return (
    <Screen>
      <View style={{ padding: 20, gap: 16, flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text variant="displayLarge" color="oliveDeep">
            {t('seller.products.title')}
          </Text>
          <Pressable
            onPress={() => router.push('/seller/add-product' as any)}
            style={{
              backgroundColor: colors.oliveDeep,
              borderRadius: theme.radii.pill,
              paddingHorizontal: 16,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Ionicons name="add" size={18} color={colors.goldSoft} />
            <Text variant="button" color="surface">
              {t('seller.products.add')}
            </Text>
          </Pressable>
        </View>

        {/* Status Filters */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {STATUS_FILTERS.map((s) => (
            <Pressable
              key={s}
              onPress={() => setFilter(s)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: theme.radii.pill,
                backgroundColor: filter === s ? colors.oliveDeep : colors.surface,
                borderWidth: filter === s ? 0 : 1,
                borderColor: colors.rule,
              }}
            >
              <Text
                variant="caption"
                color={filter === s ? 'surface' : 'ink'}
                style={{ fontWeight: '500' }}
              >
                {t(`seller.products.status.${s}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Products List */}
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Ionicons name="pricetag-outline" size={48} color={colors.muted} />
              <Text variant="body" color="muted">{t('seller.products.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/seller/product/${item.id}` as any)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: theme.radii.xl,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.rule,
                flexDirection: 'row',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.radii.lg,
                  backgroundColor: colors.surfaceAlt,
                }}
              />
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <Text variant="body" color="ink" numberOfLines={1}>{item.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text variant="titleSmall" color="oliveDeep">${item.price}</Text>
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: theme.radii.sm,
                      backgroundColor: STATUS_COLORS[item.status].bg,
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ color: STATUS_COLORS[item.status].text, fontWeight: '600', fontSize: 10 }}
                    >
                      {t(`seller.products.status.${item.status}`)}
                    </Text>
                  </View>
                </View>
                <Text variant="caption" color="muted">
                  {item.variantCount} {t('seller.products.variants')} · {t('seller.products.stock')}: {item.stock}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} style={{ alignSelf: 'center' }} />
            </Pressable>
          )}
        />
      </View>
    </Screen>
  );
}
