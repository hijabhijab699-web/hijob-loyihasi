import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Image, Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

interface CartResponse {
  items: Array<{
    id: string;
    productTitle: string;
    productImage: string;
    sellerBrand: string;
    color: string;
    colorHex: string;
    size: string;
    priceUsd: number;
    quantity: number;
    availableColors: Array<{ color: string; colorHex: string }>;
    availableSizes: Array<{ size: string; inStock: boolean }>;
  }>;
  subtotalUsd: number;
  itemCount: number;
}

const DELIVERY_METHODS = [
  { key: 'courier', icon: 'car-outline' as const },
  { key: 'pickup', icon: 'storefront-outline' as const },
  { key: 'proba', icon: 'cube-outline' as const },
];

const SPEEDS = [
  { key: 'today', icon: 'flash' as const, fee: 5 },
  { key: 'tomorrow', icon: 'calendar-outline' as const, fee: 3 },
  { key: 'scheduled', icon: 'time-outline' as const, fee: null },
];

const PAYMENTS = ['click', 'payme', 'visa', 'mastercard'];

export default function CartScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const qc = useQueryClient();

  const { data } = useQuery<CartResponse>({
    queryKey: ['cart'],
    queryFn: async () => (await api.get('/cart')).data,
  });

  const updateQty = useMutation({
    mutationFn: async (vars: { id: string; quantity: number }) => {
      await api.patch(`/cart/${vars.id}`, { quantity: vars.quantity });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/cart/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const items = data?.items ?? [];
  const deliveryFee = 5;
  const subtotal = data?.subtotalUsd ?? 0;
  const total = subtotal + deliveryFee;

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          paddingTop: 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color={colors.ink} />
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="bag-outline" size={22} color={colors.gold} />
          <Text
            variant="labelUppercase"
            color="gold"
            style={{ fontFamily: theme.fontFamilies.display, fontSize: 20, letterSpacing: 3 }}
          >
            {t('cart.title').toUpperCase()}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <Ionicons name="heart-outline" size={22} color={colors.ink} />
          <Ionicons name="bag-outline" size={22} color={colors.ink} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
        {items.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
            <Ionicons name="bag-outline" size={48} color={colors.muted} />
            <Text variant="titleMedium" color="muted">{t('cart.empty')}</Text>
          </View>
        )}

        {items.map((item) => (
          <View
            key={item.id}
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 12,
              backgroundColor: colors.surface,
              borderRadius: theme.radii.lg,
              borderWidth: 1,
              borderColor: colors.rule,
            }}
          >
            <Image
              source={{ uri: item.productImage }}
              style={{ width: 100, height: 130, borderRadius: theme.radii.md }}
            />
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text variant="titleSmall" color="ink" style={{ flex: 1 }}>
                  {item.productTitle}
                </Text>
                <Ionicons name="heart-outline" size={18} color={colors.muted} />
              </View>
              <Text variant="caption" color="muted">
                {t('cart.brand')}: {item.sellerBrand}
              </Text>
              <Text variant="caption" color="muted">
                {t('cart.color')}: {item.color}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 2 }}>
                {item.availableColors.slice(0, 5).map((c, i) => (
                  <View
                    key={i}
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: c.colorHex,
                      borderWidth: c.color === item.color ? 2 : 1,
                      borderColor: c.color === item.color ? colors.gold : colors.rule,
                    }}
                  />
                ))}
              </View>
              <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                {t('cart.size')}: {item.size}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <Text variant="titleMedium" color="gold">
                  ${item.priceUsd}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    borderWidth: 1,
                    borderColor: colors.rule,
                    borderRadius: theme.radii.pill,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Pressable
                    onPress={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })}
                    hitSlop={8}
                  >
                    <Ionicons name="remove" size={16} color={colors.ink} />
                  </Pressable>
                  <Text variant="titleSmall" color="ink">{item.quantity}</Text>
                  <Pressable
                    onPress={() => updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })}
                    hitSlop={8}
                  >
                    <Ionicons name="add" size={16} color={colors.ink} />
                  </Pressable>
                </View>
                <Pressable onPress={() => removeItem.mutate(item.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={20} color={colors.muted} />
                </Pressable>
              </View>
            </View>
          </View>
        ))}

        {/* Delivery */}
        {items.length > 0 && (
          <>
            <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: colors.rule, gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={20} color={colors.gold} />
                <Text variant="titleSmall" color="ink" style={{ flex: 1, marginLeft: 10 }}>
                  {t('cart.delivery.title')}
                </Text>
                <Text variant="caption" color="gold">
                  {t('cart.delivery.details')}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {DELIVERY_METHODS.map((m, i) => (
                  <View
                    key={m.key}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: theme.radii.md,
                      backgroundColor: i === 0 ? colors.goldSoft + '40' : colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: i === 0 ? colors.gold : colors.rule,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Ionicons name={m.icon} size={20} color={i === 0 ? colors.gold : colors.muted} />
                      <View
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 7,
                          borderWidth: 2,
                          borderColor: i === 0 ? colors.gold : colors.rule,
                        }}
                      />
                    </View>
                    <Text variant="bodySmall" color="ink" style={{ marginTop: 6, fontWeight: '600' }}>
                      {t(`cart.delivery.${m.key}`)}
                    </Text>
                    <Text variant="caption" color="muted" style={{ marginTop: 2 }}>
                      {t(`cart.delivery.${m.key}Desc`)}
                    </Text>
                    {m.key === 'proba' && (
                      <Text variant="caption" color="gold" style={{ marginTop: 4 }}>
                        {t('cart.delivery.probaNote')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                {SPEEDS.map((s, i) => (
                  <View
                    key={s.key}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRadius: theme.radii.md,
                      backgroundColor: i === 0 ? colors.goldSoft + '40' : colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: i === 0 ? colors.gold : colors.rule,
                    }}
                  >
                    <Ionicons name={s.icon} size={18} color={i === 0 ? colors.gold : colors.muted} />
                    <Text variant="bodySmall" color="ink" style={{ marginTop: 6, fontWeight: '600' }}>
                      {t(`cart.delivery.${s.key}`)}
                    </Text>
                    {s.fee !== null ? (
                      <Text variant="caption" color="muted">${s.fee}</Text>
                    ) : (
                      <Text variant="caption" color="muted">
                        {t('cart.delivery.scheduledDesc')}
                      </Text>
                    )}
                  </View>
                ))}
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: theme.radii.md,
                }}
              >
                <Ionicons name="location-outline" size={20} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color="ink" style={{ fontWeight: '600' }}>
                    {t('cart.address.title')}
                  </Text>
                  <Text variant="caption" color="muted">
                    г. Ташкент, Мирзо-Улугбекский район, ул. Буюк Ипак Йули, 25
                  </Text>
                </View>
                <Text variant="caption" color="gold">{t('cart.address.change')}</Text>
              </View>
            </View>

            {/* Summary */}
            <View style={{ padding: 16, backgroundColor: colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: colors.rule, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodySmall" color="muted">
                  {t('cart.summary.items', { count: data?.itemCount ?? 0 })}
                </Text>
                <Text variant="bodySmall" color="ink">${subtotal.toFixed(0)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="bodySmall" color="muted">
                  {t('cart.summary.delivery', { when: t('cart.delivery.today') })}
                </Text>
                <Text variant="bodySmall" color="ink">${deliveryFee}</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.rule, marginVertical: 4 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <Text variant="titleMedium" color="ink">
                  {t('cart.summary.total')}
                </Text>
                <Text variant="displayMedium" color="gold">${total.toFixed(0)}</Text>
              </View>

              <View style={{ marginTop: 8 }}>
                <Text variant="caption" color="muted">{t('cart.payment.title')}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  {PAYMENTS.map((p) => (
                    <View
                      key={p}
                      style={{
                        flex: 1,
                        height: 36,
                        borderRadius: theme.radii.sm,
                        backgroundColor: colors.surfaceAlt,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderWidth: 1,
                        borderColor: colors.rule,
                      }}
                    >
                      <Text variant="caption" color="ink">{p.toUpperCase()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Checkout bar */}
      {items.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
            paddingBottom: 34,
            backgroundColor: colors.bg,
          }}
        >
          <Button
            label={`${t('cart.checkout')}  $${total.toFixed(0)}`}
            variant="gold"
            icon={<Ionicons name="lock-closed-outline" size={18} color={colors.ink} />}
            iconRight={<Ionicons name="chevron-forward" size={20} color={colors.ink} />}
            onPress={() => Alert.alert('TODO', 'Payment integration')}
          />
        </View>
      )}
    </Screen>
  );
}
