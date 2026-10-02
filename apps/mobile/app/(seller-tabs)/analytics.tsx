import { useState } from 'react';
import { ScrollView, View, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

type Period = 'today' | 'week' | 'month' | 'year';

interface AnalyticsData {
  revenue: number;
  revenueChange: number;
  orders: number;
  ordersToday: number;
  tryOns: number;
  tryOnsToday: number;
  conversion: number;
  conversionChange: number;
  avgCheck: number;
  avgCheckChange: number;
  chartBars: number[];
  topProducts: { name: string; tryOns: number }[];
}

const MOCK_DATA: AnalyticsData = {
  revenue: 1247,
  revenueChange: 18,
  orders: 12,
  ordersToday: 3,
  tryOns: 156,
  tryOnsToday: 24,
  conversion: 7.7,
  conversionChange: 1.2,
  avgCheck: 104,
  avgCheckChange: -8,
  chartBars: [35, 50, 40, 70, 55, 85, 100],
  topProducts: [
    { name: "Ipak ro'mol Premium", tryOns: 48 },
    { name: "Shoyi ko'ylak Elegant", tryOns: 36 },
    { name: 'Charm sumka Classic', tryOns: 28 },
  ],
};

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: 'Hafta' },
  { key: 'month', label: 'Oy' },
  { key: 'year', label: 'Yil' },
];

const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

const BAR_COLORS = [
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.2)',
  'rgba(228,206,154,0.3)',
  '#E4CE9A',
];

const PRODUCT_BAR_COLORS = ['#363924', '#8A8D5B', '#C9A96E'];

export default function SellerAnalyticsScreen() {
  const { colors, theme } = useTheme();
  const [period, setPeriod] = useState<Period>('week');

  const { data } = useQuery<AnalyticsData>({
    queryKey: ['seller', 'analytics', period],
    queryFn: async () => {
      try {
        return (await api.get('/seller/analytics', { params: { period } })).data;
      } catch {
        return MOCK_DATA;
      }
    },
  });

  const d = data ?? MOCK_DATA;
  const maxTryOns = Math.max(...d.topProducts.map((p) => p.tryOns), 1);

  const STATS = [
    { label: 'Buyurtmalar', value: String(d.orders), change: `+${d.ordersToday} bugun`, positive: true },
    { label: 'Primerka', value: String(d.tryOns), change: `+${d.tryOnsToday} bugun`, positive: true },
    { label: 'Konversiya', value: `${d.conversion}%`, change: `${d.conversionChange > 0 ? '+' : ''}${d.conversionChange}% haftada`, positive: d.conversionChange >= 0 },
    { label: "O'rtacha chek", value: `$${d.avgCheck}`, change: `${d.avgCheckChange > 0 ? '+' : d.avgCheckChange < 0 ? '-' : ''}$${Math.abs(d.avgCheckChange)} haftada`, positive: d.avgCheckChange >= 0 },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 26,
              fontWeight: '700',
            }}
          >
            Statistika
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
            Do'kon ko'rsatgichlari
          </Text>
        </View>

        {/* Period Toggle */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 14,
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.rule,
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
                  flex: 1,
                  paddingVertical: 8,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: active ? colors.oliveDeep : 'transparent',
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
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ paddingHorizontal: 20, gap: 14 }}>
          {/* Revenue Card */}
          <View
            style={{
              backgroundColor: colors.oliveDeep,
              borderRadius: 16,
              padding: 20,
            }}
          >
            <Text
              variant="caption"
              style={{
                fontSize: 11,
                color: colors.oliveSoft,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Haftalik daromad
            </Text>
            <Text
              variant="displayLarge"
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 36,
                fontWeight: '700',
                color: colors.goldSoft,
                marginTop: 4,
              }}
            >
              ${d.revenue.toLocaleString()}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                marginTop: 6,
              }}
            >
              <Ionicons name="trending-up" size={14} color="#7A8A5B" />
              <Text variant="caption" style={{ fontSize: 12, color: '#7A8A5B', fontWeight: '500' }}>
                +{d.revenueChange}% o'tgan haftaga nisbatan
              </Text>
            </View>

            {/* Mini Bar Chart */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'flex-end',
                gap: 6,
                height: 60,
                marginTop: 16,
              }}
            >
              {d.chartBars.map((height, i) => (
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
              {DAY_LABELS.map((day, i) => (
                <Text
                  key={day}
                  variant="caption"
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    fontSize: 9,
                    color: i === DAY_LABELS.length - 1 ? colors.goldSoft : colors.oliveSoft,
                    fontWeight: i === DAY_LABELS.length - 1 ? '600' : '400',
                  }}
                >
                  {day}
                </Text>
              ))}
            </View>
          </View>

          {/* Stats Grid 2x2 */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            {STATS.map((stat) => (
              <View
                key={stat.label}
                style={{
                  width: '48%',
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: colors.rule,
                }}
              >
                <Text
                  variant="caption"
                  style={{
                    fontSize: 10,
                    color: colors.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  {stat.label}
                </Text>
                <Text
                  variant="displayLarge"
                  color="oliveDeep"
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 28,
                    fontWeight: '700',
                    marginTop: 4,
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  variant="caption"
                  style={{
                    fontSize: 11,
                    color: stat.positive ? '#7A8A5B' : colors.danger,
                    marginTop: 2,
                  }}
                >
                  {stat.change}
                </Text>
              </View>
            ))}
          </View>

          {/* Top Try-On Products */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.rule,
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600', marginBottom: 12 }}
            >
              Top sinab ko'rilgan
            </Text>

            <View style={{ gap: 8 }}>
              {d.topProducts.map((product, idx) => (
                <View key={product.name}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 6,
                      marginTop: idx > 0 ? 4 : 0,
                    }}
                  >
                    <Text
                      variant="bodySmall"
                      style={{
                        width: 24,
                        fontFamily: theme.fontFamilies.display,
                        fontSize: 14,
                        fontWeight: '700',
                        color: colors.gold,
                      }}
                    >
                      {idx + 1}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color="ink"
                      style={{ flex: 1, fontSize: 13, fontWeight: '500' }}
                    >
                      {product.name}
                    </Text>
                    <Text
                      variant="bodySmall"
                      color="oliveDeep"
                      style={{ fontSize: 13, fontWeight: '600' }}
                    >
                      {product.tryOns}
                    </Text>
                  </View>
                  <View
                    style={{
                      height: 4,
                      backgroundColor: '#EDE5D0',
                      borderRadius: 2,
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        width: `${(product.tryOns / maxTryOns) * 100}%`,
                        height: 4,
                        backgroundColor: PRODUCT_BAR_COLORS[idx] ?? colors.olive,
                        borderRadius: 2,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
