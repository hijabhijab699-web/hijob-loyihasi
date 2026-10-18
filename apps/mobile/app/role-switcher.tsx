import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../src/components/Screen';
import { Text } from '../src/components/Text';
import { useTheme } from '../src/theme/ThemeProvider';
import { useAuth } from '../src/store/auth';

const COPY = {
  uz: {
    title: 'Rolni tanlang',
    subtitle: 'Hijob ilovasida xaridor yoki sotuvchi sifatida foydalaning',
    buyer: 'Xaridor',
    buyerDesc: "Mahsulotlarni ko'ring, xarid qiling va virtual primerka sinab ko'ring",
    seller: 'Sotuvchi',
    sellerDesc: 'Mahsulotlaringizni joylashtiring, buyurtmalarni boshqaring va statistikani kuzating',
    choose: 'Tanlash',
    sellerBlockedTitle: 'Sotuvchi rejimi mavjud emas',
    sellerBlockedMsg: "Sizning akkauntingiz xaridor sifatida ro'yxatdan o'tgan. Sotuvchi bo'lish uchun bizga murojaat qiling.",
    ok: 'Tushundim',
  },
  ru: {
    title: 'Выберите роль',
    subtitle: 'Используйте Hijob как покупатель или продавец',
    buyer: 'Покупатель',
    buyerDesc: 'Смотрите товары, покупайте и примеряйте виртуально',
    seller: 'Продавец',
    sellerDesc: 'Размещайте товары, управляйте заказами и смотрите аналитику',
    choose: 'Выбрать',
    sellerBlockedTitle: 'Режим продавца недоступен',
    sellerBlockedMsg: 'Ваш аккаунт зарегистрирован как покупатель. Чтобы стать продавцом, обратитесь в поддержку.',
    ok: 'Понятно',
  },
};

export default function RoleSwitcherScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const lang = (i18n.language?.slice(0, 2) ?? 'uz') as 'uz' | 'ru';
  const t = COPY[lang] ?? COPY.uz;

  const isSeller = user?.role === 'seller' || user?.role === 'admin';

  const goBuyer = () => router.replace('/(tabs)/home');
  const goSeller = () => {
    if (!isSeller) {
      Alert.alert(t.sellerBlockedTitle, t.sellerBlockedMsg, [{ text: t.ok }]);
      return;
    }
    router.replace('/(seller-tabs)/dashboard');
  };

  const roles = [
    {
      id: 'buyer' as const,
      label: t.buyer,
      description: t.buyerDesc,
      icon: 'bag-handle-outline' as const,
      color: '#8A8D5B',
      bg: 'rgba(138,141,91,0.1)',
      onPress: goBuyer,
      disabled: false,
    },
    {
      id: 'seller' as const,
      label: t.seller,
      description: t.sellerDesc,
      icon: 'storefront-outline' as const,
      color: '#C9A96E',
      bg: 'rgba(201,169,110,0.1)',
      onPress: goSeller,
      disabled: !isSeller,
    },
  ];

  return (
    <Screen>
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <Text variant="displayLarge" color="oliveDeep" style={{ fontSize: 26, fontWeight: '700', fontFamily: theme.fontFamilies.display, marginBottom: 8 }}>
            {t.title}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ fontSize: 14, textAlign: 'center' }}>
            {t.subtitle}
          </Text>
        </View>

        <View style={{ gap: 14 }}>
          {roles.map((role) => (
            <Pressable
              key={role.id}
              onPress={role.onPress}
              style={{
                backgroundColor: colors.surface, borderRadius: 22,
                borderWidth: 1, borderColor: colors.rule,
                padding: 24, alignItems: 'center', gap: 14,
                opacity: role.disabled ? 0.55 : 1,
              }}
            >
              <View style={{
                width: 64, height: 64, borderRadius: 20,
                backgroundColor: role.bg, alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name={role.icon} size={28} color={role.color} />
              </View>
              <Text variant="displayLarge" color="oliveDeep" style={{ fontSize: 18, fontWeight: '700', fontFamily: theme.fontFamilies.display }}>
                {role.label}
              </Text>
              <Text variant="caption" color="muted" style={{ fontSize: 13, textAlign: 'center', lineHeight: 19 }}>
                {role.description}
              </Text>
              <View style={{
                marginTop: 4, paddingVertical: 10, paddingHorizontal: 28,
                backgroundColor: role.disabled ? colors.muted : colors.oliveDeep, borderRadius: 12,
              }}>
                <Text variant="bodySmall" style={{ fontSize: 13, fontWeight: '700', color: colors.goldSoft }}>
                  {role.disabled && role.id === 'seller' ? '🔒' : t.choose}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
