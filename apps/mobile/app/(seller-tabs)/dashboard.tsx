import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { api } from '../../src/api/client';

interface SellerStats {
  totalProducts: number;
  activeOrders: number;
  revenue: number;
  tryOnCount: number;
}

const MOCK_STATS: SellerStats = {
  totalProducts: 24,
  activeOrders: 8,
  revenue: 1200,
  tryOnCount: 156,
};

const MOCK_ORDERS = [
  {
    id: '1',
    title: "Ipak ro'mol — Qizil",
    qty: 2,
    time: 'Bugun 14:30',
    status: 'Yangi' as const,
    statusBg: 'rgba(217,162,75,0.12)',
    statusColor: '#D9A24B',
  },
  {
    id: '2',
    title: "Shoyi ko'ylak — Oq",
    qty: 1,
    time: 'Kecha 18:05',
    status: 'Tayyor' as const,
    statusBg: 'rgba(122,138,91,0.12)',
    statusColor: '#7A8A5B',
  },
  {
    id: '3',
    title: 'Charm sumka — Jigar',
    qty: 1,
    time: '28-sen',
    status: "Yo'lda" as const,
    statusBg: 'rgba(95,122,148,0.12)',
    statusColor: '#5F7A94',
  },
];

const TOP_PRODUCTS = [
  { name: "Ipak ro'mol", price: '$45', bg: ['#EDE5D0', '#D9D0BE'] },
  { name: "Shoyi ko'ylak", price: '$89', bg: ['#D9D0BE', '#EDE5D0'] },
];

export default function SellerDashboard() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();

  const { data: stats } = useQuery<SellerStats>({
    queryKey: ['seller', 'stats'],
    queryFn: async () => {
      try {
        return (await api.get('/seller/stats')).data;
      } catch {
        return MOCK_STATS;
      }
    },
  });

  const s = stats ?? MOCK_STATS;
  const revenue = s.revenue >= 1000 ? `$${(s.revenue / 1000).toFixed(1)}k` : `$${s.revenue}`;

  const STAT_CARDS = [
    {
      label: 'Mahsulotlar',
      value: String(s.totalProducts),
      icon: 'grid-outline' as const,
      iconColor: colors.oliveDeep,
      iconBg: 'rgba(54,57,36,0.08)',
    },
    {
      label: 'Buyurtmalar',
      value: String(s.activeOrders),
      icon: 'cube-outline' as const,
      iconColor: '#A88848',
      iconBg: 'rgba(201,169,110,0.15)',
    },
    {
      label: 'Daromad',
      value: revenue,
      icon: 'trending-up-outline' as const,
      iconColor: '#7A8A5B',
      iconBg: 'rgba(122,138,91,0.12)',
    },
    {
      label: 'Primerka',
      value: String(s.tryOnCount),
      icon: 'body-outline' as const,
      iconColor: colors.oliveDeep,
      iconBg: 'rgba(54,57,36,0.08)',
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 30 }}
        showsVerticalScrollIndicator={false}
      >
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
              Bosh sahifa
            </Text>
            <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
              Do'koningiz holati
            </Text>
          </View>
          <Pressable
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.oliveDeep,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="person-outline" size={20} color={colors.goldSoft} />
          </Pressable>
        </View>

        {/* Stat Cards Grid */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          {STAT_CARDS.map((card) => (
            <View
              key={card.label}
              style={{
                width: '47%',
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.rule,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View>
                  <Text
                    variant="caption"
                    color="muted"
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {card.label}
                  </Text>
                  <Text
                    variant="displayLarge"
                    color="oliveDeep"
                    style={{
                      fontFamily: theme.fontFamilies.display,
                      fontSize: 32,
                      fontWeight: '700',
                      marginTop: 4,
                    }}
                  >
                    {card.value}
                  </Text>
                </View>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: card.iconBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={card.icon} size={18} color={card.iconColor} />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
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
            Tezkor amallar
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={() => router.push('/seller/add-product' as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 8,
                backgroundColor: colors.oliveDeep,
                borderRadius: 12,
              }}
            >
              <Ionicons name="add" size={22} color={colors.goldSoft} />
              <Text
                variant="caption"
                style={{ fontSize: 11, fontWeight: '500', color: colors.goldSoft }}
              >
                Yangi mahsulot
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(seller-tabs)/orders' as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 8,
                backgroundColor: '#EDE5D0',
                borderRadius: 12,
              }}
            >
              <Ionicons name="cube-outline" size={22} color={colors.oliveDeep} />
              <Text
                variant="caption"
                style={{ fontSize: 11, fontWeight: '500', color: colors.oliveDeep }}
              >
                Buyurtmalar
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/(seller-tabs)/analytics' as any)}
              style={{
                flex: 1,
                alignItems: 'center',
                gap: 8,
                paddingVertical: 14,
                paddingHorizontal: 8,
                backgroundColor: '#EDE5D0',
                borderRadius: 12,
              }}
            >
              <Ionicons name="bar-chart-outline" size={22} color={colors.oliveDeep} />
              <Text
                variant="caption"
                style={{ fontSize: 11, fontWeight: '500', color: colors.oliveDeep }}
              >
                Statistika
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Orders */}
        <View
          style={{
            marginHorizontal: 20,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              So'nggi buyurtmalar
            </Text>
            <Pressable onPress={() => router.push('/(seller-tabs)/orders' as any)}>
              <Text variant="bodySmall" style={{ fontSize: 12, color: colors.gold }}>
                Barchasi →
              </Text>
            </Pressable>
          </View>
          <View style={{ gap: 10 }}>
            {MOCK_ORDERS.map((order) => (
              <View
                key={order.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 10,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 10,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: '#EDE5D0',
                  }}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodySmall"
                    color="ink"
                    style={{ fontSize: 13, fontWeight: '500' }}
                  >
                    {order.title}
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                    {order.qty} dona · {order.time}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: order.statusBg,
                    borderRadius: 20,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{ fontSize: 11, fontWeight: '500', color: order.statusColor }}
                  >
                    {order.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Top Products */}
        <View
          style={{
            marginHorizontal: 20,
            backgroundColor: colors.surface,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <Text
              variant="bodySmall"
              color="oliveDeep"
              style={{ fontSize: 13, fontWeight: '600' }}
            >
              Top mahsulotlar
            </Text>
            <Pressable onPress={() => router.push('/(seller-tabs)/products' as any)}>
              <Text variant="bodySmall" style={{ fontSize: 12, color: colors.gold }}>
                Barchasi →
              </Text>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {TOP_PRODUCTS.map((prod, i) => (
              <View
                key={prod.name}
                style={{
                  flex: 1,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 12,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    height: 100,
                    backgroundColor: prod.bg[0],
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="ribbon-outline" size={32} color="rgba(255,255,255,0.3)" />
                </View>
                <View style={{ padding: 10 }}>
                  <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                    {prod.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    color="oliveDeep"
                    style={{
                      fontFamily: theme.fontFamilies.display,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {prod.price}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
