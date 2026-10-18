import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Text } from '../src/components/Text';
import { useTheme } from '../src/theme/ThemeProvider';
import { api } from '../src/api/client';
import { safeBack } from '../src/lib/safe-back';

type NotifKind = 'order_update' | 'style_job_done' | 'promo' | 'system';

interface Notification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  data: Record<string, any> | null;
  read: boolean;
  createdAt: string;
}

const ICON_MAP: Record<NotifKind, { name: React.ComponentProps<typeof Ionicons>['name']; color: string; bg: string }> = {
  order_update: { name: 'receipt-outline', color: '#8A8D5B', bg: 'rgba(138,141,91,0.1)' },
  style_job_done: { name: 'sparkles-outline', color: '#C9A96E', bg: 'rgba(201,169,110,0.1)' },
  promo: { name: 'pricetag-outline', color: '#B85450', bg: 'rgba(184,84,80,0.08)' },
  system: { name: 'information-circle-outline', color: '#5F7A94', bg: 'rgba(95,122,148,0.1)' },
};

export default function NotificationsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get<Notification[]>('/notifications')).data,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await api.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: async () => {
      await api.patch('/notifications/read-all');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const items = data ?? [];
  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const openNotif = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    // Deep-link into the referenced entity when the notification carries one.
    if (n.data?.orderId) router.push({ pathname: '/orders/[id]', params: { id: n.data.orderId } });
    else if (n.data?.productId) router.push(`/product/${n.data.productId}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
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
          <Text variant="displayLarge" color="oliveDeep" style={{ flex: 1, fontSize: 22, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
            Bildirishnomalar
          </Text>
          {unreadCount > 0 && (
            <Pressable onPress={() => markAll.mutate()} hitSlop={8}>
              <Text variant="caption" style={{ fontSize: 12, color: colors.gold, fontWeight: '600' }}>
                Hammasini o'qilgan
              </Text>
            </Pressable>
          )}
        </View>

        {isLoading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={colors.oliveDeep} />
          </View>
        ) : isError ? (
          <EmptyBlock icon="cloud-offline-outline" title="Yuklab bo'lmadi" onRetry={() => refetch()} />
        ) : items.length === 0 ? (
          <EmptyBlock icon="notifications-off-outline" title="Hali bildirishnomalar yo'q" subtitle="Yangi yangiliklar bu yerda ko'rinadi" />
        ) : (
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {items.map((n) => {
              const icon = ICON_MAP[n.kind] ?? ICON_MAP.system;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => openNotif(n)}
                  style={{
                    flexDirection: 'row', gap: 12, padding: 14,
                    backgroundColor: n.read ? colors.surfaceAlt : colors.surface,
                    borderRadius: 16,
                    borderWidth: 1, borderColor: n.read ? colors.rule : colors.oliveDeep + '40',
                    opacity: n.read ? 0.7 : 1,
                  }}
                >
                  <View style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: icon.bg,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                      <Text variant="bodySmall" color="ink" style={{ flex: 1, fontSize: 14, fontWeight: n.read ? '500' : '600' }} numberOfLines={1}>
                        {n.title}
                      </Text>
                      {!n.read && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.oliveDeep }} />}
                    </View>
                    <Text variant="caption" color="muted" style={{ fontSize: 12, marginTop: 2 }} numberOfLines={3}>
                      {n.body}
                    </Text>
                    <Text variant="caption" color="muted" style={{ fontSize: 11, marginTop: 6 }}>
                      {relativeTime(n.createdAt)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'hozirgina';
  if (minutes < 60) return `${minutes} daqiqa oldin`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} kun oldin`;
  return new Date(iso).toLocaleDateString();
}

interface EmptyBlockProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  onRetry?: () => void;
}

function EmptyBlock({ icon, title, subtitle, onRetry }: EmptyBlockProps) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: 40, alignItems: 'center', gap: 10 }}>
      <Ionicons name={icon} size={48} color={colors.muted} />
      <Text variant="body" color="ink" style={{ fontSize: 15, fontWeight: '600', textAlign: 'center' }}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="caption" color="muted" style={{ fontSize: 12, textAlign: 'center' }}>
          {subtitle}
        </Text>
      )}
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={{
            marginTop: 8, paddingHorizontal: 16, paddingVertical: 10,
            borderRadius: 10, backgroundColor: colors.oliveDeep,
          }}
        >
          <Text variant="bodySmall" style={{ fontSize: 13, fontWeight: '600', color: colors.goldSoft }}>
            Qaytadan urinish
          </Text>
        </Pressable>
      )}
    </View>
  );
}
