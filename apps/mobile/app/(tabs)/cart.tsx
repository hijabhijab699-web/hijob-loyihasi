import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
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

export default function CartScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const qc = useQueryClient();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState<'courier' | 'pickup' | 'proba'>('courier');
  const [promoCode, setPromoCode] = useState('');

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

  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  // Clear the whole cart. Backend doesn't expose a bulk-delete endpoint, so
  // fan out individual DELETEs — small cart sizes keep this cheap.
  const clearCart = () => {
    if (!items?.length) return;
    Alert.alert(
      isRu ? 'Очистить корзину?' : 'Savatni tozalashmi?',
      isRu ? 'Все товары будут удалены.' : "Barcha mahsulotlar o'chiriladi.",
      [
        { text: isRu ? 'Отмена' : 'Bekor qilish', style: 'cancel' },
        {
          text: isRu ? 'Очистить' : 'Tozalash',
          style: 'destructive',
          onPress: async () => {
            try {
              await Promise.all(items.map((it) => api.delete(`/cart/${it.id}`)));
            } finally {
              qc.invalidateQueries({ queryKey: ['cart'] });
            }
          },
        },
      ],
    );
  };

  const applyPromo = () => {
    if (!promoCode.trim()) return;
    // Backend promo codes aren't implemented yet; be upfront with the user
    // rather than silently swallowing the tap.
    Alert.alert(
      isRu ? 'Промокоды пока недоступны' : "Promo kodlar hali mavjud emas",
      isRu ? 'Эта функция в разработке.' : "Bu funksiya ishlab chiqilmoqda.",
    );
  };

  const items = data?.items ?? [];
  const itemCount = data?.itemCount ?? items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = data?.subtotalUsd ?? items.reduce((sum, i) => sum + i.priceUsd * i.quantity, 0);

  const PLACEHOLDER_BG = [
    'linear-gradient(135deg, #E4CE9A 0%, #C9A96E 50%, #A88848 100%)',
    'linear-gradient(135deg, #FDFAF3 0%, #E4CE9A 50%, #C9A96E 100%)',
  ];

  return (
    <Screen>
      {/* Header */}
      <View
        style={{
          paddingTop: 8,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{ fontSize: 26, fontWeight: '700' }}
          >
            {isRu ? 'Корзина' : 'Savat'}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 13, marginTop: 2 }}>
            {itemCount} {isRu ? 'товара' : 'ta mahsulot'}
          </Text>
        </View>
        {items.length > 0 && (
          <Pressable onPress={clearCart} style={{ paddingBottom: 4 }}>
            <Text variant="bodySmall" style={{ color: colors.danger, fontSize: 12 }}>
              {isRu ? 'Очистить' : 'Tozalash'}
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40, gap: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty state */}
        {items.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 8 }}>
            <Ionicons name="bag-outline" size={48} color={colors.muted} />
            <Text variant="titleMedium" color="muted">{t('cart.empty')}</Text>
          </View>
        )}

        {/* Cart Items */}
        {items.map((item, idx) => (
          <View
            key={item.id}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.rule,
              borderRadius: 16,
              padding: 14,
              flexDirection: 'row',
              gap: 14,
              marginBottom: idx === items.length - 1 ? 16 : 12,
            }}
          >
            {/* Image */}
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 12,
                backgroundColor: idx === 0 ? colors.gold : colors.goldSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.productImage ? (
                <Image
                  source={{ uri: item.productImage }}
                  style={{ width: 90, height: 90, borderRadius: 12 }}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons name="ribbon-outline" size={28} color="rgba(255,255,255,0.5)" />
              )}
            </View>

            {/* Details */}
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Text
                  variant="bodySmall"
                  color="ink"
                  style={{ fontWeight: '500', lineHeight: 18 }}
                >
                  {item.productTitle}
                </Text>
                <Text
                  variant="caption"
                  color="muted"
                  style={{ fontSize: 12, marginTop: 3 }}
                >
                  {item.color} · {item.size}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
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
                  ${item.priceUsd}
                </Text>

                {/* Quantity Stepper */}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable
                    onPress={() =>
                      item.quantity > 1
                        ? updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })
                        : removeItem.mutate(item.id)
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: colors.rule,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="remove" size={14} color={colors.muted} />
                  </Pressable>
                  <View
                    style={{
                      width: 36,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      variant="bodySmall"
                      color="ink"
                      style={{ fontSize: 14, fontWeight: '600' }}
                    >
                      {item.quantity}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      updateQty.mutate({ id: item.id, quantity: item.quantity + 1 })
                    }
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: colors.surfaceAlt,
                      borderWidth: 1,
                      borderColor: colors.rule,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={14} color={colors.oliveDeep} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        ))}

        {items.length > 0 && (
          <>
            {/* Delivery Section */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text
                variant="bodySmall"
                color="ink"
                style={{ fontSize: 14, fontWeight: '600', marginBottom: 14 }}
              >
                {isRu ? 'Способ доставки' : 'Yetkazish usuli'}
              </Text>

              {/* Courier (delivery) */}
              <Pressable
                onPress={() => setDeliveryMethod('courier')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    borderWidth: deliveryMethod === 'courier' ? 2 : 1.5,
                    borderColor:
                      deliveryMethod === 'courier' ? colors.oliveDeep : colors.rule,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {deliveryMethod === 'courier' && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: colors.oliveDeep,
                      }}
                    />
                  )}
                </View>
                <Ionicons
                  name="car-outline"
                  size={20}
                  color={
                    deliveryMethod === 'courier' ? colors.oliveDeep : colors.muted
                  }
                />
                <Text
                  variant="bodySmall"
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '500',
                    color:
                      deliveryMethod === 'courier' ? colors.ink : colors.muted,
                  }}
                >
                  Yetkazib berish
                </Text>
                <View
                  style={{
                    backgroundColor: 'rgba(122,138,91,0.12)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 999,
                  }}
                >
                  <Text
                    variant="caption"
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: colors.success,
                    }}
                  >
                    Bepul
                  </Text>
                </View>
              </Pressable>

              {/* Pickup */}
              <Pressable
                onPress={() => setDeliveryMethod('pickup')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    borderWidth: deliveryMethod === 'pickup' ? 2 : 1.5,
                    borderColor:
                      deliveryMethod === 'pickup' ? colors.oliveDeep : colors.rule,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {deliveryMethod === 'pickup' && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: colors.oliveDeep,
                      }}
                    />
                  )}
                </View>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={
                    deliveryMethod === 'pickup' ? colors.oliveDeep : colors.muted
                  }
                />
                <Text
                  variant="bodySmall"
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: '500',
                    color:
                      deliveryMethod === 'pickup' ? colors.ink : colors.muted,
                  }}
                >
                  O'zi olib ketish
                </Text>
              </Pressable>

              {/* Proba */}
              <Pressable
                onPress={() => setDeliveryMethod('proba')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    borderWidth: deliveryMethod === 'proba' ? 2 : 1.5,
                    borderColor:
                      deliveryMethod === 'proba' ? colors.oliveDeep : colors.rule,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {deliveryMethod === 'proba' && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 999,
                        backgroundColor: colors.oliveDeep,
                      }}
                    />
                  )}
                </View>
                <Ionicons
                  name="body-outline"
                  size={20}
                  color={
                    deliveryMethod === 'proba' ? colors.oliveDeep : colors.muted
                  }
                />
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodySmall"
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color:
                        deliveryMethod === 'proba' ? colors.ink : colors.muted,
                    }}
                  >
                    Proba
                  </Text>
                  <Text
                    variant="caption"
                    style={{ fontSize: 11, color: colors.muted, marginTop: 1 }}
                  >
                    Avval kiyib ko'ring
                  </Text>
                </View>
              </Pressable>
            </View>

            {/* Promo Code */}
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.rule,
                  borderRadius: 12,
                  justifyContent: 'center',
                  paddingHorizontal: 14,
                }}
              >
                <TextInput
                  placeholder="Promo kod"
                  placeholderTextColor={colors.muted}
                  value={promoCode}
                  onChangeText={setPromoCode}
                  style={{
                    fontSize: 13,
                    color: colors.ink,
                    fontFamily: 'Inter',
                    padding: 0,
                  }}
                />
              </View>
              <Pressable
                onPress={applyPromo}
                style={{
                  height: 44,
                  paddingHorizontal: 20,
                  backgroundColor: colors.oliveDeep,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: promoCode.trim() ? 1 : 0.5,
                }}
              >
                <Text
                  variant="bodySmall"
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: colors.goldSoft,
                  }}
                >
                  {isRu ? 'Применить' : "Qo'llash"}
                </Text>
              </Pressable>
            </View>

            {/* Order Summary */}
            <View
              style={{
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 10,
                }}
              >
                <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>
                  Mahsulotlar ({itemCount})
                </Text>
                <Text
                  variant="bodySmall"
                  color="ink"
                  style={{ fontSize: 13, fontWeight: '500' }}
                >
                  ${subtotal.toFixed(2)}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 12,
                }}
              >
                <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>
                  Yetkazib berish
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ fontSize: 13, fontWeight: '500', color: colors.success }}
                >
                  Bepul
                </Text>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.rule,
                  marginBottom: 12,
                }}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Text
                  variant="bodySmall"
                  color="ink"
                  style={{ fontSize: 14, fontWeight: '600' }}
                >
                  Jami
                </Text>
                <Text
                  variant="displayLarge"
                  color="oliveDeep"
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 22,
                    fontWeight: '700',
                  }}
                >
                  ${subtotal.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Checkout Button */}
            <Pressable
              onPress={() => {
                if (!items || items.length === 0) return;
                router.push({
                  pathname: '/checkout',
                  params: { deliveryMethod },
                });
              }}
              style={({ pressed }) => ({
                height: 54,
                borderRadius: 14,
                backgroundColor: colors.oliveDeep,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 8,
                opacity: pressed ? 0.9 : 1,
              })}
            >
              <Text
                variant="body"
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.goldSoft,
                }}
              >
                Buyurtma berish
              </Text>
              <Ionicons name="arrow-forward" size={18} color={colors.goldSoft} />
            </Pressable>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
