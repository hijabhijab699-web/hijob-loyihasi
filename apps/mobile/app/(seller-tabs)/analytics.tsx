import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

type Period = 'today' | 'week' | 'month' | 'year';

// Shape that /seller/analytics actually returns. The UI used to assume a
// different shape (with revenueChange, chartBars, topProducts) and crashed
// as soon as the backend data arrived because `topProducts.map` ran on
// undefined.
interface AnalyticsResponse {
  totals: {
    products: number;
    variants: number;
    stock: number;
    tryOnSessions: number;
    orderItems: number;
    orderUnits: number;
    grossUsd: number;
  };
  tryOnTrend7d: Array<{ day: string; count: number }>;
  topVariants: Array<{ variantId: string; title: string; color: string; count: number }>;
}

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
  { key: 'year', label: 'Yil' },
];

const DAY_SHORT = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];

const BAR_COLORS = [
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.3)',
  'rgba(228,206,154,0.5)',
  '#E4CE9A',
];

const PRODUCT_BAR_COLORS = ['#363924', '#8A8D5B', '#C9A96E', '#A88848', '#7A8A5B'];

export default function SellerAnalyticsScreen() {
  const { colors, theme } = useTheme();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const [period, setPeriod] = useState<Period>('week');

  const { data, isLoading, isError, refetch } = useQuery<AnalyticsResponse>({
    queryKey: ['seller', 'analytics', period],
    queryFn: async () => (await api.get<AnalyticsResponse>('/seller/analytics')).data,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      </Screen>
    );
  }

  if (isError || !data) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text variant="body" color="ink" style={{ fontSize: 15, fontWeight: '600' }}>
            {isRu ? 'Не удалось загрузить статистику' : "Statistikani yuklab bo'lmadi"}
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={{
              marginTop: 8, paddingHorizontal: 16, paddingVertical: 10,
              borderRadius: 10, backgroundColor: colors.oliveDeep,
            }}
          >
            <Text variant="bodySmall" style={{ fontSize: 13, fontWeight: '600', color: colors.goldSoft }}>
              {isRu ? 'Повторить' : 'Qaytadan urinish'}
            </Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const trend = data.tryOnTrend7d ?? [];
  const topVariants = data.topVariants ?? [];
  // Normalise trend into a 0-100 height scale for the mini-bars.
  const maxTrend = Math.max(...trend.map((t) => t.count), 1);
  const chartBars = trend.map((t) => Math.max(5, Math.round((t.count / maxTrend) * 100)));
  const trendLabels = trend.map((t) => {
    const d = new Date(t.day);
    return DAY_SHORT[d.getDay()] ?? '';
  });
  const maxTopCount = Math.max(...topVariants.map((p) => p.count), 1);

  const STATS = [
    { label: isRu ? 'Товары' : 'Mahsulotlar', value: String(data.totals.products) },
    { label: isRu ? 'Варианты' : 'Variantlar', value: String(data.totals.variants) },
    { label: isRu ? 'Примерки' : 'Primerka', value: String(data.totals.tryOnSessions) },
    { label: isRu ? 'Заказы' : 'Buyurtma', value: String(data.totals.orderItems) },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={colors.oliveDeep}
            colors={[colors.oliveDeep]}
          />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{ fontFamily: theme.fontFamilies.display, fontSize: 26, fontWeight: '700' }}
          >
            {isRu ? 'Статистика' : 'Statistika'}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {isRu ? 'Показатели магазина' : "Do'kon ko'rsatgichlari"}
          </Text>
        </View>

        {/* Period toggle — purely visual; backend returns a lifetime window
            today, so switching tabs does not re-fetch yet. Kept so the
            layout is familiar and we can wire period filters later. */}
        <View
          style={{
            marginHorizontal: 20, marginBottom: 14,
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: 10,
            borderWidth: 1, borderColor: colors.rule,
            padding: 3,
          }}
        >
          {PERIOD_TABS.map((tab) => {
            const active = tab.key === period;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setPeriod(tab.key)}
                style={{
                  flex: 1, paddingVertical: 8, alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: active ? colors.oliveDeep : 'transparent',
                }}
              >
                <Text
                  variant="caption"
                  style={{ fontSize: 12, fontWeight: '500', color: active ? colors.goldSoft : colors.muted }}
                >
                  {tab.key === 'today'
                  ? (isRu ? 'Сегодня' : 'Bugun')
                  : tab.key === 'week'
                  ? (isRu ? 'Неделя' : 'Hafta')
                  : tab.key === 'month'
                  ? (isRu ? 'Месяц' : 'Oy')
                  : (isRu ? 'Год' : 'Yil')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {/* Revenue card */}
          <View style={{ backgroundColor: colors.oliveDeep, borderRadius: 16, padding: 20 }}>
            <Text
              variant="caption"
              style={{ fontSize: 11, color: colors.oliveSoft, textTransform: 'uppercase', letterSpacing: 0.5 }}
            >
              {isRu ? 'Общий доход' : 'Umumiy daromad'}
            </Text>
            <Text
              variant="displayLarge"
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 36, fontWeight: '700', color: colors.goldSoft, marginTop: 4,
              }}
            >
              ${data.totals.grossUsd.toLocaleString()}
            </Text>
            <Text variant="caption" style={{ fontSize: 12, color: colors.oliveSoft, marginTop: 6 }}>
              {data.totals.orderUnits} {isRu ? 'шт · ' : "ta dona · "}
              {data.totals.orderItems} {isRu ? 'заказов' : 'ta buyurtma'}
            </Text>

            {chartBars.length > 0 ? (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 60, marginTop: 16 }}>
                  {chartBars.map((height, i) => (
                    <View
                      key={i}
                      style={{
                        flex: 1,
                        height: `${height}%`,
                        backgroundColor: BAR_COLORS[i] ?? BAR_COLORS[0],
                        borderTopLeftRadius: 4,
                        borderTopRightRadius: 4,
                      }}
                    />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                  {trendLabels.map((day, i) => (
                    <Text
                      key={`${day}-${i}`}
                      variant="caption"
                      style={{
                        flex: 1, textAlign: 'center', fontSize: 9,
                        color: i === trendLabels.length - 1 ? colors.goldSoft : colors.oliveSoft,
                        fontWeight: i === trendLabels.length - 1 ? '600' : '400',
                      }}
                    >
                      {day}
                    </Text>
                  ))}
                </View>
              </>
            ) : (
              <Text variant="caption" style={{ fontSize: 11, color: colors.oliveSoft, marginTop: 16 }}>
                {isRu ? 'Данных примерок за 7 дней пока нет' : "7 kunlik primerka ma'lumoti hali yo'q"}
              </Text>
            )}
          </View>

          {/* Stats grid 2x2 */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {STATS.map((stat) => (
              <View
                key={stat.label}
                style={{
                  width: '48%',
                  backgroundColor: colors.surface,
                  borderRadius: 14, padding: 14,
                  borderWidth: 1, borderColor: colors.rule,
                }}
              >
                <Text
                  variant="caption"
                  style={{ fontSize: 10, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}
                >
                  {stat.label}
                </Text>
                <Text
                  variant="displayLarge"
                  color="oliveDeep"
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 28, fontWeight: '700', marginTop: 4,
                  }}
                >
                  {stat.value}
                </Text>
              </View>
            ))}
          </View>

          {/* Top try-on variants */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: colors.rule,
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600', marginBottom: 12 }}
            >
              {isRu ? 'Топ примеренных' : "Top sinab ko'rilgan"}
            </Text>

            {topVariants.length === 0 ? (
              <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                {isRu ? 'Пока никто не примерял товары' : "Hali primerka qilingan mahsulot yo'q"}
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {topVariants.map((v, idx) => (
                  <View key={v.variantId}>
                    <View
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10,
                        marginBottom: 6, marginTop: idx > 0 ? 4 : 0,
                      }}
                    >
                      <Text
                        variant="bodySmall"
                        style={{
                          width: 24,
                          fontFamily: theme.fontFamilies.display,
                          fontSize: 14, fontWeight: '700', color: colors.gold,
                        }}
                      >
                        {idx + 1}
                      </Text>
                      <Text
                        variant="bodySmall"
                        color="ink"
                        style={{ flex: 1, fontSize: 13, fontWeight: '500' }}
                        numberOfLines={1}
                      >
                        {v.title} · {v.color}
                      </Text>
                      <Text
                        variant="bodySmall"
                        color="oliveDeep"
                        style={{ fontSize: 13, fontWeight: '600' }}
                      >
                        {v.count}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: '#EDE5D0', borderRadius: 2, overflow: 'hidden' }}>
                      <View
                        style={{
                          width: `${(v.count / maxTopCount) * 100}%`,
                          height: 4,
                          backgroundColor: PRODUCT_BAR_COLORS[idx % PRODUCT_BAR_COLORS.length],
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
