import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

type Period = 'today' | 'week' | 'month' | 'year';

interface AnalyticsData {
  revenue: number;
  orders: number;
  tryOns: number;
  conversion: number;
  avgCheck: number;
  topProducts: { name: string; tryOns: number; maxTryOns: number }[];
}

function useAnalytics(period: Period) {
  return useQuery<AnalyticsData>({
    queryKey: ['seller', 'analytics', period],
    queryFn: async () => {
      try {
        const { data } = await api.get('/seller/analytics', { params: { period } });
        return data;
      } catch {
        return {
          revenue: 0,
          orders: 0,
          tryOns: 0,
          conversion: 0,
          avgCheck: 0,
          topProducts: [],
        };
      }
    },
  });
}

const PERIODS: Period[] = ['today', 'week', 'month', 'year'];

export default function SellerAnalyticsScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [period, setPeriod] = useState<Period>('week');
  const { data } = useAnalytics(period);

  const metrics = [
    { key: 'orders', value: data?.orders ?? 0, icon: 'receipt-outline' as const },
    { key: 'tryOns', value: data?.tryOns ?? 0, icon: 'body-outline' as const },
    { key: 'conversion', value: `${data?.conversion ?? 0}%`, icon: 'trending-up-outline' as const },
    { key: 'avgCheck', value: `$${data?.avgCheck ?? 0}`, icon: 'cash-outline' as const },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text variant="displayLarge" color="oliveDeep">
          {t('seller.analytics.title')}
        </Text>

        {/* Period Toggle */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PERIODS.map((p) => (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: theme.radii.pill,
                backgroundColor: period === p ? colors.oliveDeep : colors.surface,
                borderWidth: period === p ? 0 : 1,
                borderColor: colors.rule,
                alignItems: 'center',
              }}
            >
              <Text
                variant="caption"
                style={{ color: period === p ? colors.goldSoft : colors.ink, fontWeight: '500' }}
              >
                {t(`seller.analytics.period.${p}`)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Revenue Card */}
        <View
          style={{
            backgroundColor: colors.oliveDeep,
            borderRadius: theme.radii.xl,
            padding: 20,
            gap: 8,
          }}
        >
          <Text variant="caption" style={{ color: colors.goldSoft }}>
            {t('seller.analytics.revenue')}
          </Text>
          <Text variant="displayLarge" style={{ color: colors.goldSoft }}>
            ${data?.revenue ?? 0}
          </Text>
        </View>

        {/* Metrics Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {metrics.map((m) => (
            <View
              key={m.key}
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: colors.surface,
                borderRadius: theme.radii.xl,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.rule,
                gap: 6,
              }}
            >
              <Ionicons name={m.icon} size={20} color={colors.olive} />
              <Text variant="titleMedium" color="oliveDeep">{String(m.value)}</Text>
              <Text variant="caption" color="muted">{t(`seller.analytics.metrics.${m.key}`)}</Text>
            </View>
          ))}
        </View>

        {/* Top Try-On Products */}
        <Text variant="titleMedium" color="oliveDeep">
          {t('seller.analytics.topProducts')}
        </Text>
        {(data?.topProducts ?? []).map((product, idx) => (
          <View
            key={idx}
            style={{
              backgroundColor: colors.surface,
              borderRadius: theme.radii.lg,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.rule,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="body" color="ink">{product.name}</Text>
              <Text variant="bodySmall" color="muted">{product.tryOns} primerka</Text>
            </View>
            <View style={{ height: 6, backgroundColor: colors.surfaceAlt, borderRadius: 3 }}>
              <View
                style={{
                  height: 6,
                  width: `${product.maxTryOns > 0 ? (product.tryOns / product.maxTryOns) * 100 : 0}%`,
                  backgroundColor: colors.olive,
                  borderRadius: 3,
                }}
              />
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}
