import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { safeBack } from '../../src/lib/safe-back';
import { formatUzs, usdToUzs, useUzsRate } from '../../src/lib/currency';

type Plan = 'monthly' | 'halfyear' | 'yearly';
type Status = 'pending' | 'active' | 'expired' | 'cancelled';

interface PlanSpec {
  plan: Plan;
  months: number;
  priceUsd: number;
  priceUzs?: number;
  labelUz: string;
  labelRu: string;
}

interface Current {
  sellerId: string;
  isActive: boolean;
  current: {
    id: string;
    plan: Plan;
    status: Status;
    priceUsd: number;
    priceUzs: string | null;
    startAt: string | null;
    endAt: string | null;
    createdAt: string;
  } | null;
  plans: PlanSpec[];
}

export default function SubscriptionScreen() {
  const { colors, theme } = useTheme();
  const qc = useQueryClient();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const { data, isLoading } = useQuery<Current>({
    queryKey: ['seller-subscription'],
    queryFn: async () => (await api.get<Current>('/seller/subscription')).data,
  });

  const [selected, setSelected] = useState<Plan>('monthly');
  const uzsRate = useUzsRate();

  const purchase = useMutation({
    mutationFn: async (plan: Plan) => {
      return (await api.post('/seller/subscription/purchase', { plan })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seller-subscription'] });
      Alert.alert(
        isRu ? 'Запрос отправлен' : 'So\'rov yuborildi',
        isRu
          ? 'Оплатите через Click/Payme на реквизиты администратора, подтверждение активирует подписку.'
          : "Admin rekvizitiga Click/Payme orqali to'lang. Tasdiqlangach obuna faollashadi.",
      );
    },
    onError: (e: any) => Alert.alert(errorTitle(), errorMessage(e)),
  });

  if (isLoading || !data) {
    return (
      <Screen>
        <View style={{ padding: 40, alignItems: 'center' }}>
          <ActivityIndicator color={colors.oliveDeep} />
        </View>
      </Screen>
    );
  }

  const current = data.current;
  const endsAt = current?.endAt ? new Date(current.endAt) : null;
  const daysLeft = endsAt ? Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => safeBack()}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceGlass, borderWidth: 1, borderColor: colors.rule, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </Pressable>
          <Text variant="displayLarge" color="oliveDeep" style={{ fontSize: 22, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
            {isRu ? 'Подписка' : 'Obuna'}
          </Text>
        </View>

        {/* Current status card */}
        <View style={{ marginHorizontal: 20, padding: 18, borderRadius: 18, backgroundColor: data.isActive ? colors.oliveDeep : colors.surface, borderWidth: 1, borderColor: data.isActive ? colors.gold : colors.rule, marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: data.isActive ? colors.gold : colors.rule, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={data.isActive ? 'checkmark-circle' : 'time-outline'} size={22} color={data.isActive ? colors.oliveDeep : colors.muted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ color: data.isActive ? colors.goldSoft : colors.ink, fontWeight: '700', fontSize: 15 }}>
                {data.isActive
                  ? (isRu ? 'Подписка активна' : 'Obuna faol')
                  : current?.status === 'pending'
                    ? (isRu ? 'Ожидает оплаты' : 'To\'lov kutilmoqda')
                    : (isRu ? 'Подписка не активна' : 'Obuna faol emas')}
              </Text>
              {data.isActive && endsAt && (
                <Text variant="caption" style={{ color: 'rgba(245,241,232,0.7)', fontSize: 12, marginTop: 2 }}>
                  {isRu ? `Осталось ${daysLeft} дн · до ${endsAt.toLocaleDateString('ru-RU')}` : `${daysLeft} kun qoldi · ${endsAt.toLocaleDateString('uz-UZ')}`}
                </Text>
              )}
              {!data.isActive && current?.status !== 'pending' && (
                <Text variant="caption" color="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  {isRu ? 'Выберите план чтобы продолжить' : 'Davom etish uchun tarif tanlang'}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Benefits */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <Text variant="caption" color="muted" style={{ fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 10 }}>
            {isRu ? 'ПРЕИМУЩЕСТВА' : 'IMKONIYATLAR'}
          </Text>
          {[
            isRu ? 'Личный кабинет магазина' : "Shaxsiy do'kon kabineti",
            isRu ? 'Добавление и редактирование товаров' : "Mahsulot qo'shish/tahrir",
            isRu ? 'Управление заказами' : 'Buyurtmalarni boshqarish',
            isRu ? 'Чат с клиентами' : 'Mijozlar bilan chat',
            isRu ? 'Статистика продаж' : 'Sotuv statistikasi',
          ].map((text) => (
            <View key={text} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={18} color={colors.gold} />
              <Text variant="body" color="ink" style={{ fontSize: 14 }}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Plans */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text variant="caption" color="muted" style={{ fontSize: 11, letterSpacing: 1, fontWeight: '600', marginBottom: 10 }}>
            {isRu ? 'ТАРИФЫ' : 'TARIFLAR'}
          </Text>
          {data.plans.map((p) => {
            const isSelected = selected === p.plan;
            const isPopular = p.plan === 'halfyear';
            const isBest = p.plan === 'yearly';
            const perMonth = Math.round(p.priceUsd / p.months);
            return (
              <Pressable
                key={p.plan}
                onPress={() => setSelected(p.plan)}
                style={{
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 10,
                  backgroundColor: isSelected ? colors.oliveDeep : colors.surface,
                  borderWidth: isSelected ? 0 : 1,
                  borderColor: colors.rule,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View style={{
                  width: 24, height: 24, borderRadius: 12,
                  borderWidth: 2,
                  borderColor: isSelected ? colors.gold : colors.rule,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text variant="body" style={{ color: isSelected ? colors.goldSoft : colors.ink, fontWeight: '700', fontSize: 15 }}>
                      {isRu ? p.labelRu : p.labelUz}
                    </Text>
                    {isPopular && (
                      <View style={{ backgroundColor: colors.gold, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: colors.oliveDeep, fontWeight: '700' }}>POPULYAR</Text>
                      </View>
                    )}
                    {isBest && (
                      <View style={{ backgroundColor: '#D4B86A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                        <Text style={{ fontSize: 9, color: colors.oliveDeep, fontWeight: '700' }}>FOYDALI</Text>
                      </View>
                    )}
                  </View>
                  <Text variant="caption" style={{ color: isSelected ? 'rgba(245,241,232,0.7)' : colors.muted, fontSize: 12, marginTop: 2 }}>
                    ~{formatUzs(usdToUzs(perMonth, uzsRate))}/{isRu ? 'мес' : 'oy'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="body" style={{ color: isSelected ? colors.goldSoft : colors.ink, fontWeight: '800', fontSize: 16 }}>
                    {formatUzs(p.priceUzs ?? usdToUzs(p.priceUsd, uzsRate))}
                  </Text>
                  <Text variant="caption" style={{ color: isSelected ? 'rgba(245,241,232,0.5)' : colors.muted, fontSize: 10, marginTop: 2 }}>
                    ≈ ${p.priceUsd}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 20, marginTop: 10 }}>
          <Pressable
            onPress={() => purchase.mutate(selected)}
            disabled={purchase.isPending || current?.status === 'pending'}
            style={{
              height: 54,
              borderRadius: 16,
              backgroundColor: colors.gold,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: purchase.isPending || current?.status === 'pending' ? 0.5 : 1,
            }}
          >
            {purchase.isPending ? (
              <ActivityIndicator color={colors.oliveDeep} />
            ) : (
              <Text variant="body" style={{ color: colors.oliveDeep, fontWeight: '800', fontSize: 15 }}>
                {current?.status === 'pending'
                  ? (isRu ? 'Ожидает подтверждения оплаты' : "To'lov tasdiqlanishini kuting")
                  : data.isActive
                    ? (isRu ? 'Продлить подписку' : 'Obunani yangilash')
                    : (isRu ? 'Оплатить и активировать' : "To'lov qilish")}
              </Text>
            )}
          </Pressable>
          <Text variant="caption" color="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 10, lineHeight: 16 }}>
            {isRu
              ? 'Оплата принимается Click / Payme / Humo. Админ проверяет оплату и активирует подписку в течение суток.'
              : "To'lov Click / Payme / Humo orqali qabul qilinadi. Admin to'lovni 24 soat ichida tekshirib faollashtiradi."}
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
