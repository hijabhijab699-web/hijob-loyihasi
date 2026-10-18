import { useState } from 'react';
import { Alert, FlatList, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';

type OrderStatus = 'new' | 'preparing' | 'shipping' | 'delivered';

interface OrderItem {
  name: string;
  color?: string;
  size?: string;
  qty: number;
  imageUrl?: string;
}

interface SellerOrder {
  id: string;
  code: string;
  customerName: string;
  time: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  tracking?: string;
}

const STATUS_TABS: { key: OrderStatus; label: string }[] = [
  { key: 'new', label: 'Yangi' },
  { key: 'preparing', label: 'Tayyorlanm.' },
  { key: 'shipping', label: "Yo'lda" },
  { key: 'delivered', label: 'Yetkazildi' },
];

const STATUS_BADGE: Record<OrderStatus, { bg: string; color: string; label: string }> = {
  new: { bg: 'rgba(217,162,75,0.12)', color: '#D9A24B', label: 'Yangi' },
  preparing: { bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B', label: 'Tayyorlanmoqda' },
  shipping: { bg: 'rgba(95,122,148,0.12)', color: '#5F7A94', label: "Yo'lda" },
  delivered: { bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B', label: 'Yetkazildi' },
};

const ITEM_BG = ['#EDE5D0', '#D9D0BE', '#EDE5D0', '#D9D0BE'];

export default function SellerOrdersScreen() {
  const { colors, theme } = useTheme();
  const { i18n } = useTranslation();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<OrderStatus>('new');
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  // Fetch once; filter in memory by tab so the badge counts stay in sync
  // without extra round trips.
  const { data: orders } = useQuery<SellerOrder[]>({
    queryKey: ['seller', 'orders'],
    queryFn: async () => (await api.get<SellerOrder[]>('/seller/orders')).data,
    staleTime: 15_000,
  });

  // Seller order-status endpoints aren't yet wired on the backend. Instead
  // of pretending to work and leaving the UI stale, we surface a one-line
  // explanation so sellers know these actions are coming.
  const comingSoon = () => {
    Alert.alert(
      isRu ? 'Скоро' : 'Tez orada',
      isRu
        ? 'Эта функция будет добавлена в следующей версии.'
        : "Bu funksiya keyingi versiyada qo'shiladi.",
    );
  };

  const all = orders ?? [];
  const filtered = all.filter((o) => o.status === activeTab);
  const counts: Record<OrderStatus, number> = {
    new: all.filter((o) => o.status === 'new').length,
    preparing: all.filter((o) => o.status === 'preparing').length,
    shipping: all.filter((o) => o.status === 'shipping').length,
    delivered: all.filter((o) => o.status === 'delivered').length,
  };

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
            {isRu ? 'Заказы' : 'Buyurtmalar'}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {counts.new + counts.preparing + counts.shipping}{' '}
            {isRu ? 'активных заказов' : 'ta faol buyurtma'}
          </Text>
        </View>
        <Pressable
          onPress={() => qc.invalidateQueries({ queryKey: ['seller', 'orders'] })}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.rule,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="refresh" size={18} color={colors.ink} />
        </Pressable>
      </View>

      {/* Status Tabs */}
      <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 20, paddingBottom: 12 }}>
        {STATUS_TABS.map((tab) => {
          const active = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: 'center',
                borderRadius: 10,
                backgroundColor: active ? colors.oliveDeep : colors.surface,
                borderWidth: active ? 0 : 1,
                borderColor: colors.rule,
              }}
            >
              <Text
                variant="displayLarge"
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 18,
                  fontWeight: '700',
                  color: active ? colors.goldSoft : colors.oliveDeep,
                }}
              >
                {counts[tab.key]}
              </Text>
              <Text
                variant="caption"
                style={{
                  fontSize: 10,
                  color: active ? colors.goldSoft : colors.muted,
                  marginTop: 2,
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Order List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Ionicons name="receipt-outline" size={48} color={colors.muted} />
            <Text variant="body" color="muted">{isRu ? 'Заказов нет' : "Buyurtma yo'q"}</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const badge = STATUS_BADGE[item.status];
          return (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 14,
                padding: 14,
                borderWidth: 1,
                borderColor: colors.rule,
              }}
            >
              {/* Order Header */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 10,
                }}
              >
                <View>
                  <Text
                    variant="bodySmall"
                    color="ink"
                    style={{ fontSize: 14, fontWeight: '600' }}
                  >
                    {item.code}
                  </Text>
                  <Text
                    variant="caption"
                    color="muted"
                    style={{ fontSize: 11, marginTop: 2 }}
                  >
                    {item.time} · {item.customerName}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: badge.bg,
                    borderRadius: 20,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{ fontSize: 11, fontWeight: '500', color: badge.color }}
                  >
                    {badge.label}
                  </Text>
                </View>
              </View>

              {/* Product Items */}
              {item.status !== 'shipping' && (
                <View style={{ gap: 8, marginBottom: 12 }}>
                  {item.items.map((prod, i) => (
                    <View
                      key={i}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        padding: 8,
                        backgroundColor: colors.surfaceAlt,
                        borderRadius: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          backgroundColor: ITEM_BG[index % ITEM_BG.length],
                          flexShrink: 0,
                        }}
                      />
                      <View>
                        <Text
                          variant="bodySmall"
                          color="ink"
                          style={{ fontSize: 12, fontWeight: '500' }}
                        >
                          {prod.name}
                        </Text>
                        <Text variant="caption" color="muted" style={{ fontSize: 11 }}>
                          {[prod.color, prod.size, `${prod.qty} dona`]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Footer */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  variant="displayLarge"
                  color="oliveDeep"
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 18,
                    fontWeight: '700',
                  }}
                >
                  ${item.total}
                </Text>

                {item.status === 'new' && (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <Pressable
                      onPress={comingSoon}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: colors.danger,
                      }}
                    >
                      <Text
                        variant="caption"
                        style={{ fontSize: 12, fontWeight: '500', color: colors.danger }}
                      >
                        {isRu ? 'Отклонить' : 'Rad etish'}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={comingSoon}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 8,
                        backgroundColor: colors.oliveDeep,
                      }}
                    >
                      <Text
                        variant="caption"
                        style={{ fontSize: 12, fontWeight: '500', color: colors.goldSoft }}
                      >
                        {isRu ? 'Принять' : 'Qabul qilish'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {item.status === 'preparing' && (
                  <Pressable
                    onPress={comingSoon}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: '#7A8A5B',
                    }}
                  >
                    <Text
                      variant="caption"
                      style={{ fontSize: 12, fontWeight: '500', color: '#fff' }}
                    >
                      {isRu ? 'Готово к отправке' : "Jo'natishga tayyor"}
                    </Text>
                  </Pressable>
                )}

                {item.status === 'shipping' && item.tracking && (
                  <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                    Tracking: {item.tracking}
                  </Text>
                )}
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
