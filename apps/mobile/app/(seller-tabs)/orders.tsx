import { useState } from 'react';
import { FlatList, View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

type OrderStatus = 'new' | 'preparing' | 'shipping' | 'delivered';

interface SellerOrder {
  id: string;
  customerName: string;
  items: { name: string; qty: number }[];
  total: number;
  status: OrderStatus;
  createdAt: string;
}

const ORDER_STATUSES: OrderStatus[] = ['new', 'preparing', 'shipping', 'delivered'];

function useSellerOrders(status?: OrderStatus) {
  return useQuery<SellerOrder[]>({
    queryKey: ['seller', 'orders', status],
    queryFn: async () => {
      try {
        const params = status ? { status } : {};
        const { data } = await api.get('/seller/orders', { params });
        return data;
      } catch {
        return [];
      }
    },
  });
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; text: string; icon: string }> = {
  new: { bg: 'rgba(201,169,110,0.12)', text: '#C9A96E', icon: 'time-outline' },
  preparing: { bg: 'rgba(95,122,148,0.12)', text: '#5F7A94', icon: 'construct-outline' },
  shipping: { bg: 'rgba(138,141,91,0.12)', text: '#8A8D5B', icon: 'car-outline' },
  delivered: { bg: 'rgba(122,138,91,0.12)', text: '#7A8A5B', icon: 'checkmark-circle-outline' },
};

export default function SellerOrdersScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const [activeStatus, setActiveStatus] = useState<OrderStatus | undefined>();
  const { data: orders = [] } = useSellerOrders(activeStatus);

  return (
    <Screen>
      <View style={{ padding: 20, gap: 16, flex: 1 }}>
        <Text variant="displayLarge" color="oliveDeep">
          {t('seller.orders.title')}
        </Text>

        {/* Status Tabs */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {ORDER_STATUSES.map((s) => {
            const active = activeStatus === s;
            return (
              <Pressable
                key={s}
                onPress={() => setActiveStatus(active ? undefined : s)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: theme.radii.lg,
                  backgroundColor: active ? colors.oliveDeep : colors.surface,
                  borderWidth: active ? 0 : 1,
                  borderColor: colors.rule,
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Ionicons
                  name={STATUS_STYLES[s].icon as any}
                  size={18}
                  color={active ? colors.goldSoft : STATUS_STYLES[s].text}
                />
                <Text
                  variant="caption"
                  style={{
                    color: active ? colors.goldSoft : colors.ink,
                    fontWeight: '500',
                    fontSize: 10,
                  }}
                >
                  {t(`seller.orders.status.${s}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Orders List */}
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
              <Ionicons name="receipt-outline" size={48} color={colors.muted} />
              <Text variant="body" color="muted">{t('seller.orders.empty')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: theme.radii.xl,
                padding: 16,
                borderWidth: 1,
                borderColor: colors.rule,
                gap: 10,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="titleSmall" color="ink">#{item.id.slice(-6)}</Text>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: theme.radii.sm,
                    backgroundColor: STATUS_STYLES[item.status].bg,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{ color: STATUS_STYLES[item.status].text, fontWeight: '600', fontSize: 10 }}
                  >
                    {t(`seller.orders.status.${item.status}`)}
                  </Text>
                </View>
              </View>
              <Text variant="body" color="ink">{item.customerName}</Text>
              {item.items.map((p, idx) => (
                <Text key={idx} variant="bodySmall" color="muted">
                  {p.name} × {p.qty}
                </Text>
              ))}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text variant="titleSmall" color="oliveDeep">${item.total}</Text>
                {item.status === 'new' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: theme.radii.pill,
                        backgroundColor: colors.oliveDeep,
                      }}
                    >
                      <Text variant="button" color="surface">{t('seller.orders.accept')}</Text>
                    </Pressable>
                    <Pressable
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: theme.radii.pill,
                        borderWidth: 1,
                        borderColor: colors.danger,
                      }}
                    >
                      <Text variant="button" color="danger">{t('seller.orders.reject')}</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      </View>
    </Screen>
  );
}
