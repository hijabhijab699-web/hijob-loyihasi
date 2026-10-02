import { useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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

const MOCK_PRODUCTS: SellerProduct[] = [
  { id: '1', name: "Ipak ro'mol Premium", price: 45, status: 'live', variantCount: 3, stock: 48 },
  { id: '2', name: "Shoyi ko'ylak Elegant", price: 89, status: 'live', variantCount: 5, stock: 22 },
  { id: '3', name: 'Charm sumka Classic', price: 120, status: 'pending', variantCount: 2, stock: 15 },
  { id: '4', name: "Taqinchoq to'plami", price: 35, status: 'draft', variantCount: 4, stock: 60 },
  { id: '5', name: "Paxta ro'mol Natural", price: 28, status: 'live', variantCount: 6, stock: 130 },
];

const FILTERS: { key: ProductStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Kutmoqda' },
];

const STATUS_STYLE: Record<ProductStatus, { bg: string; color: string; label: string }> = {
  live: { bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B', label: 'Live' },
  draft: { bg: 'rgba(133,126,110,0.1)', color: '#857E6E', label: 'Draft' },
  pending: { bg: 'rgba(217,162,75,0.12)', color: '#D9A24B', label: 'Kutmoqda' },
};

const PLACEHOLDER_BG = ['#EDE5D0', '#D9D0BE', '#E4CE9A', '#D9D0BE', '#EDE5D0'];

export default function SellerProductsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [filter, setFilter] = useState<ProductStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const { data: products } = useQuery<SellerProduct[]>({
    queryKey: ['seller', 'products', filter],
    queryFn: async () => {
      try {
        const params = filter !== 'all' ? { status: filter } : {};
        return (await api.get('/seller/products', { params })).data;
      } catch {
        return MOCK_PRODUCTS;
      }
    },
  });

  const items = (products ?? MOCK_PRODUCTS).filter(
    (p) =>
      (filter === 'all' || p.status === filter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <View>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 26,
              fontWeight: '700',
            }}
          >
            Mahsulotlar
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {items.length} ta mahsulot
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/seller/add-product' as any)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.oliveDeep,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color={colors.goldSoft} />
        </Pressable>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <Ionicons name="search-outline" size={18} color={colors.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Qidirish..."
            placeholderTextColor={colors.muted}
            style={{ flex: 1, fontSize: 14, color: colors.ink, padding: 0 }}
          />
        </View>
      </View>

      {/* Filter Pills */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 12 }}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: active ? colors.oliveDeep : colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: colors.rule,
              }}
            >
              <Text
                variant="caption"
                style={{
                  fontSize: 12,
                  fontWeight: '500',
                  color: active ? colors.goldSoft : colors.muted,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Product List */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Ionicons name="pricetag-outline" size={48} color={colors.muted} />
            <Text variant="body" color="muted">
              Mahsulot topilmadi
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const st = STATUS_STYLE[item.status];
          return (
            <Pressable
              onPress={() => router.push(`/seller/product/${item.id}` as any)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                backgroundColor: colors.surface,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.rule,
                opacity: pressed ? 0.92 : 1,
              })}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 12,
                  backgroundColor: PLACEHOLDER_BG[index % PLACEHOLDER_BG.length],
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Ionicons name="ribbon-outline" size={24} color="rgba(255,255,255,0.35)" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  variant="bodySmall"
                  color="ink"
                  numberOfLines={1}
                  style={{ fontSize: 14, fontWeight: '500' }}
                >
                  {item.name}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  <Text
                    variant="bodySmall"
                    color="oliveDeep"
                    style={{
                      fontFamily: theme.fontFamilies.display,
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                  >
                    ${item.price}
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                    · {item.variantCount} variant
                  </Text>
                </View>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 4,
                  }}
                >
                  <View
                    style={{
                      backgroundColor: st.bg,
                      borderRadius: 10,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ fontSize: 10, fontWeight: '500', color: st.color }}
                    >
                      {st.label}
                    </Text>
                  </View>
                  <Text variant="caption" color="muted" style={{ fontSize: 10 }}>
                    Zaxira: {item.stock}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
