import { useState } from 'react';
import { FlatList, Image, Pressable, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

// Backend product status enum (prisma ProductStatus). "published" is what the
// UI used to call "live"; "archived" and "rejected" are grouped under
// "pending" so the filter chip set stays manageable.
type BackendStatus = 'draft' | 'pending' | 'published' | 'archived' | 'rejected';
type FilterKey = 'all' | 'draft' | 'pending' | 'published';

interface SellerProduct {
  id: string;
  titleRu: string;
  titleUz: string | null;
  basePriceUsd: number;
  coverUrl: string | null;
  status: BackendStatus;
  variantCount: number;
  totalStock: number;
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'published', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'pending', label: 'Kutmoqda' },
];

const STATUS_STYLE: Record<BackendStatus, { bg: string; color: string; label: string }> = {
  published: { bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B', label: 'Live' },
  draft: { bg: 'rgba(133,126,110,0.1)', color: '#857E6E', label: 'Draft' },
  pending: { bg: 'rgba(217,162,75,0.12)', color: '#D9A24B', label: 'Kutmoqda' },
  archived: { bg: 'rgba(133,126,110,0.1)', color: '#857E6E', label: 'Arxiv' },
  rejected: { bg: 'rgba(184,84,80,0.08)', color: '#B85450', label: 'Rad' },
};

const PLACEHOLDER_BG = ['#EDE5D0', '#D9D0BE', '#E4CE9A', '#D9D0BE', '#EDE5D0'];

export default function SellerProductsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const [filter, setFilter] = useState<FilterKey>('all');
  const [search, setSearch] = useState('');

  // Backend returns the full list; we filter client-side so switching tabs
  // is instant and the badge counts stay in sync with real data.
  const { data: products } = useQuery<SellerProduct[]>({
    queryKey: ['seller', 'products'],
    queryFn: async () => (await api.get<SellerProduct[]>('/seller/products')).data,
    staleTime: 15_000,
  });

  const items = (products ?? []).filter(
    (p) =>
      (filter === 'all' || p.status === filter) &&
      (!search || p.titleRu.toLowerCase().includes(search.toLowerCase())),
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
            {isRu ? 'Товары' : 'Mahsulotlar'}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {items.length} {isRu ? 'товара' : 'ta mahsulot'}
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
            placeholder={isRu ? 'Поиск...' : 'Qidirish...'}
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
                {f.key === 'all'
                  ? (isRu ? 'Все' : 'Barchasi')
                  : f.key === 'pending'
                  ? (isRu ? 'Ожидает' : 'Kutmoqda')
                  : f.label}
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
              {isRu ? 'Товары не найдены' : 'Mahsulot topilmadi'}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const st = STATUS_STYLE[item.status] ?? STATUS_STYLE.draft;
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
                  overflow: 'hidden',
                }}
              >
                {item.coverUrl ? (
                  <Image source={{ uri: item.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <Ionicons name="ribbon-outline" size={24} color="rgba(255,255,255,0.35)" />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  variant="bodySmall"
                  color="ink"
                  numberOfLines={1}
                  style={{ fontSize: 14, fontWeight: '500' }}
                >
                  {item.titleRu || item.titleUz || "Nomsiz mahsulot"}
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
                    ${item.basePriceUsd.toFixed(2)}
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
                    Zaxira: {item.totalStock}
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
