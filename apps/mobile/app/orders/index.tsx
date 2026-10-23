import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, View, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { safeBack } from '../../src/lib/safe-back';

interface OrderSummary {
  id: string;
  status: string;
  paymentStatus: string;
  totalUsd: number;
  createdAt: string;
  items: Array<{ title: string; image: string; quantity: number }>;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Kutilmoqda',
  confirmed: 'Tasdiqlandi',
  processing: 'Tayyorlanmoqda',
  shipped: "Yo'lda",
  proba_scheduled: 'Proba jo\'natildi',
  delivered: 'Yetkazildi',
  cancelled: 'Bekor qilindi',
  returned: 'Qaytarildi',
};

const STATUS_TONE: Record<string, 'gold' | 'success' | 'muted' | 'danger'> = {
  pending: 'muted',
  confirmed: 'gold',
  processing: 'gold',
  shipped: 'gold',
  proba_scheduled: 'gold',
  delivered: 'success',
  cancelled: 'danger',
  returned: 'danger',
};

export default function OrdersList() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const { data, isLoading, refetch } = useQuery<OrderSummary[]>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data,
  });

  return (
    <Screen>
      <View
        style={{
          paddingTop: 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Pressable onPress={() => safeBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.ink} />
        </Pressable>
        <Text variant="displayMedium" color="oliveDeep">{isRu ? 'Заказы' : 'Buyurtmalar'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => refetch()}
            tintColor={colors.oliveDeep}
            colors={[colors.oliveDeep]}
          />
        }
      >
        {isLoading && (
          <Text variant="body" color="muted" style={{ textAlign: 'center', padding: 40 }}>
            {isRu ? 'Загрузка…' : 'Yuklanmoqda…'}
          </Text>
        )}

        {data && data.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center', gap: 8 }}>
            <Ionicons name="receipt-outline" size={48} color={colors.muted} />
            <Text variant="titleMedium" color="muted">{isRu ? 'Пока нет заказов' : "Hali buyurtma yo'q"}</Text>
          </View>
        )}

        {data?.map((o) => (
          <Pressable
            key={o.id}
            onPress={() => router.push({ pathname: '/orders/[id]', params: { id: o.id } })}
            style={{
              backgroundColor: colors.surface,
              borderRadius: theme.radii.lg,
              borderWidth: 1,
              borderColor: colors.rule,
              padding: 16,
              gap: 12,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="caption" color="muted">
                #{o.id.slice(0, 8)} · {new Date(o.createdAt).toLocaleDateString('ru-RU')}
              </Text>
              <StatusPill status={o.status} />
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              {o.items.slice(0, 3).map((it, i) => (
                <View
                  key={i}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radii.sm,
                    backgroundColor: colors.surfaceAlt,
                    overflow: 'hidden',
                  }}
                >
                  {it.image && (
                    <Image source={{ uri: it.image }} style={{ width: '100%', height: '100%' }} />
                  )}
                </View>
              ))}
              {o.items.length > 3 && (
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: theme.radii.sm,
                    backgroundColor: colors.surfaceAlt,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text variant="caption" color="muted">+{o.items.length - 3}</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Text variant="bodySmall" color="muted">
                {o.items.length} tovar
              </Text>
              <Text variant="titleMedium" color="oliveDeep">${o.totalUsd.toFixed(0)}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

function StatusPill({ status }: { status: string }) {
  const { colors, theme } = useTheme();
  const tone = STATUS_TONE[status] ?? 'muted';
  const map = {
    gold: { bg: colors.goldSoft, fg: colors.oliveDeep },
    success: { bg: colors.success + '22', fg: colors.success },
    muted: { bg: colors.rule, fg: colors.muted },
    danger: { bg: colors.danger + '22', fg: colors.danger },
  }[tone];
  return (
    <View
      style={{
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.radii.pill,
        backgroundColor: map.bg,
      }}
    >
      <Text variant="caption" style={{ color: map.fg, fontWeight: '600' }}>
        {STATUS_LABEL[status] ?? status}
      </Text>
    </View>
  );
}
