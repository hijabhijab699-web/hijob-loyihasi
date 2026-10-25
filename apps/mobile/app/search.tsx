import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Text } from '../src/components/Text';
import { useTheme } from '../src/theme/ThemeProvider';
import { api } from '../src/api/client';
import { safeBack } from '../src/lib/safe-back';

const POPULAR = [
  { id: 'scarves', labelUz: "Ro'mollar", labelRu: 'Платки', icon: 'ribbon-outline' as const },
  { id: 'dresses', labelUz: "Ko'ylaklar", labelRu: 'Платья', icon: 'shirt-outline' as const },
  { id: 'shoes', labelUz: 'Poyabzallar', labelRu: 'Обувь', icon: 'footsteps-outline' as const },
  { id: 'bags', labelUz: 'Sumkalar', labelRu: 'Сумки', icon: 'bag-handle-outline' as const },
  { id: 'accessories', labelUz: 'Aksessuarlar', labelRu: 'Аксессуары', icon: 'diamond-outline' as const },
];

interface SearchHit {
  id: string;
  title: { ru: string; uz: string; en?: string };
  basePriceUsd: number;
  coverUrl: string | null;
  seller: { brandName: string } | null;
}
interface SearchResponse {
  items: SearchHit[];
  total: number;
}

export default function SearchScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recent, setRecent] = useState<string[]>([]);

  // Debounce the query so each keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery<SearchResponse>({
    queryKey: ['search', debounced],
    queryFn: async () =>
      (await api.get<SearchResponse>('/catalog/products', { params: { q: debounced, pageSize: 20 } })).data,
    enabled: debounced.length >= 2,
  });

  const openProduct = (id: string, label?: string) => {
    if (label) setRecent((prev) => [label, ...prev.filter((x) => x !== label)].slice(0, 5));
    router.push(`/product/${id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => safeBack()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.rule,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </Pressable>
          <View
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.rule,
              paddingHorizontal: 14, height: 44,
            }}
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={isRu ? 'Поиск...' : 'Qidirish...'}
              placeholderTextColor={colors.muted}
              style={{
                flex: 1, fontSize: 14, fontFamily: theme.fontFamilies.body, color: colors.ink,
              }}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {debounced.length >= 2 ? (
          <View style={{ paddingHorizontal: 20 }}>
            {isFetching ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={colors.oliveDeep} />
              </View>
            ) : (data?.items ?? []).length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
                <Ionicons name="search-outline" size={40} color={colors.muted} />
                <Text variant="body" color="muted" style={{ fontSize: 14 }}>
                  {isRu ? `По запросу "${debounced}" ничего не найдено` : `"${debounced}" uchun hech narsa topilmadi`}
                </Text>
              </View>
            ) : (
              <>
                <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                  {data?.total ?? 0} {isRu ? 'результатов' : 'ta natija'}
                </Text>
                {(data?.items ?? []).map((hit) => (
                  <Pressable
                    key={hit.id}
                    onPress={() => openProduct(hit.id, hit.title.ru)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      padding: 12, marginBottom: 10,
                      backgroundColor: colors.surface,
                      borderRadius: 14, borderWidth: 1, borderColor: colors.rule,
                    }}
                  >
                    <View style={{
                      width: 56, height: 56, borderRadius: 10,
                      backgroundColor: 'rgba(138,141,91,0.12)',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ionicons name="shirt-outline" size={20} color={colors.olive} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodySmall" color="ink" style={{ fontSize: 14, fontWeight: '500' }} numberOfLines={1}>
                        {hit.title.ru}
                      </Text>
                      <Text variant="caption" color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                        {hit.seller?.brandName ?? ''}
                      </Text>
                    </View>
                    <Text variant="bodySmall" color="oliveDeep" style={{ fontSize: 14, fontWeight: '700' }}>
                      ${hit.basePriceUsd.toFixed(2)}
                    </Text>
                  </Pressable>
                ))}
              </>
            )}
          </View>
        ) : (
          <>
            {recent.length > 0 && (
              <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' }}>
                    {isRu ? 'Недавние поиски' : "So'nggi qidiruvlar"}
                  </Text>
                  <Pressable onPress={() => setRecent([])}>
                    <Text variant="caption" style={{ fontSize: 12, color: colors.gold }}>{isRu ? 'Очистить' : 'Tozalash'}</Text>
                  </Pressable>
                </View>
                {recent.map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setQuery(item)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.rule,
                    }}
                  >
                    <Ionicons name="time-outline" size={18} color={colors.muted} />
                    <Text variant="bodySmall" color="ink" style={{ flex: 1, fontSize: 14 }}>{item}</Text>
                    <Ionicons name="arrow-forward-outline" size={16} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            )}

            <View style={{ paddingHorizontal: 20 }}>
              <Text variant="caption" color="muted" style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>
                {isRu ? 'Категории' : 'Kategoriyalar'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                {POPULAR.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => router.push({ pathname: '/(tabs)/catalog', params: { category: cat.id } })}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.rule,
                      borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
                    }}
                  >
                    <Ionicons name={cat.icon} size={18} color={colors.oliveDeep} />
                    <Text variant="bodySmall" color="ink" style={{ fontSize: 13, fontWeight: '500' }}>{isRu ? cat.labelRu : cat.labelUz}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
