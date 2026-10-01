import { ScrollView, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
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

function useSellerStats() {
  return useQuery<SellerStats>({
    queryKey: ['seller', 'stats'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/seller/stats');
        return data;
      } catch {
        return { totalProducts: 0, activeOrders: 0, revenue: 0, tryOnCount: 0 };
      }
    },
  });
}

const STATS_CONFIG = [
  { key: 'totalProducts', icon: 'pricetag-outline' as const, color: 'olive' as const },
  { key: 'activeOrders', icon: 'receipt-outline' as const, color: 'gold' as const },
  { key: 'revenue', icon: 'cash-outline' as const, color: 'oliveDeep' as const },
  { key: 'tryOnCount', icon: 'body-outline' as const, color: 'olive' as const },
] as const;

const QUICK_ACTIONS = [
  { key: 'addProduct', icon: 'add-circle-outline' as const, route: '/seller/add-product' },
  { key: 'viewOrders', icon: 'receipt-outline' as const, tab: 'orders' },
  { key: 'viewStats', icon: 'bar-chart-outline' as const, tab: 'analytics' },
] as const;

export default function SellerDashboard() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { data: stats } = useSellerStats();

  const statValues = [
    stats?.totalProducts ?? 0,
    stats?.activeOrders ?? 0,
    `$${stats?.revenue ?? 0}`,
    stats?.tryOnCount ?? 0,
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="displayLarge" color="oliveDeep">
              {t('seller.dashboard.title')}
            </Text>
            <Text variant="bodySmall" color="muted">
              {user?.fullName ?? '—'}
            </Text>
          </View>
          <Ionicons name="notifications-outline" size={24} color={colors.ink} />
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {STATS_CONFIG.map((item, idx) => (
            <View
              key={item.key}
              style={{
                flex: 1,
                minWidth: '45%',
                backgroundColor: colors.surface,
                borderRadius: theme.radii.xl,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.rule,
                gap: 8,
              }}
            >
              <Ionicons name={item.icon} size={22} color={colors[item.color]} />
              <Text variant="displayMedium" color="oliveDeep">
                {String(statValues[idx])}
              </Text>
              <Text variant="caption" color="muted">
                {t(`seller.dashboard.stats.${item.key}`)}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text variant="titleMedium" color="oliveDeep">
          {t('seller.dashboard.quickActions')}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              onPress={() => {
                if ('route' in action) router.push(action.route as any);
              }}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderRadius: theme.radii.xl,
                padding: 16,
                alignItems: 'center',
                gap: 8,
                borderWidth: 1,
                borderColor: colors.rule,
              }}
            >
              <Ionicons name={action.icon} size={24} color={colors.oliveDeep} />
              <Text variant="caption" color="ink" style={{ textAlign: 'center' }}>
                {t(`seller.dashboard.actions.${action.key}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
