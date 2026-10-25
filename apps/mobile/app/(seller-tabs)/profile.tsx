import { Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';

interface MenuItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  // Either a route to navigate to, or a one-shot action. Seller features
  // that don't yet have a backend endpoint use the action form so the tap
  // tells the user instead of landing on a buyer-only screen (e.g. the
  // buyer "addresses" page would mislead a seller tapping "Delivery").
  route?: string;
  action?: () => void;
}

export default function SellerProfileScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const lang = (i18n.language?.slice(0, 2) ?? 'uz') as 'uz' | 'ru' | 'en' | 'ar';
  const L = (uz: string, ru: string, en: string, ar: string) => ({ uz, ru, en, ar }[lang] ?? uz);

  // Payment/delivery seller controls aren't backed yet. Tell the seller
  // outright rather than silently dropping them onto buyer-only screens.
  const comingSoon = (what: string) => {
    Alert.alert(
      L('Tez orada', 'Скоро', 'Coming soon', 'قريبًا'),
      isRu
        ? `Раздел «${what}» будет добавлен в следующей версии.`
        : `«${what}» bo'limi keyingi versiyada qo'shiladi.`,
    );
  };

  const storeMenu: MenuItem[] = [
    {
      label: L("Do'kon ma'lumotlari", 'Данные магазина', 'Shop info', 'معلومات المتجر'),
      icon: 'storefront-outline',
      route: '/seller/shop-profile',
    },
    {
      label: L('Obuna', 'Подписка', 'Subscription', 'الاشتراك'),
      icon: 'star-outline',
      route: '/seller/subscription',
    },
    {
      label: L("To'lov rekvizitlari", 'Платежные реквизиты', 'Payment details', 'بيانات الدفع'),
      icon: 'card-outline',
      action: () => comingSoon(L("To'lov rekvizitlari", 'Платежные реквизиты', 'Payment details', 'بيانات الدفع')),
    },
    {
      label: L('Yetkazib berish va topshirish', 'Доставка и выдача', 'Delivery & pickup', 'التوصيل والاستلام'),
      icon: 'car-outline',
      action: () => comingSoon(L('Yetkazib berish', 'Доставка и выдача', 'Delivery', 'التوصيل')),
    },
    {
      label: L('Xabarlar', 'Сообщения', 'Messages', 'الرسائل'),
      icon: 'chatbubbles-outline',
      route: '/chats',
    },
    {
      label: L("Ko'rinish", 'Внешний вид', 'Appearance', 'المظهر'),
      icon: 'moon-outline',
      route: '/settings/theme',
    },
    {
      label: L('Bildirishnomalar', 'Уведомления', 'Notifications', 'الإشعارات'),
      icon: 'notifications-outline',
      route: '/notifications',
    },
    {
      label: L('Til', 'Язык', 'Language', 'اللغة'),
      icon: 'language-outline',
      route: '/settings/language',
    },
  ];

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => router.replace('/(seller-tabs)/profile')}
            tintColor={colors.oliveDeep}
            colors={[colors.oliveDeep]}
          />
        }
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 }}>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 26,
              fontWeight: '700',
            }}
          >
            {L('Profil', 'Профиль', 'Profile', 'الملف الشخصي')}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* User Card */}
          <Pressable
            onPress={() => router.push('/settings/profile-details')}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.rule,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.oliveDeep,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                variant="displayLarge"
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 22,
                  fontWeight: '700',
                  color: colors.goldSoft,
                }}
              >
                {user?.fullName?.slice(0, 1).toUpperCase() ?? 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                variant="body"
                color="ink"
                style={{ fontSize: 16, fontWeight: '600' }}
              >
                {user?.fullName ?? L('Sotuvchi', 'Продавец', 'Seller', 'بائع')}
              </Text>
              <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>
                @{user?.username ?? '—'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          {/* Role Switcher */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.rule,
              overflow: 'hidden',
            }}
          >
            <Text
              variant="caption"
              color="muted"
              style={{
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 10,
              }}
            >
              {L('Rejim tanlash', 'Режим', 'Mode', 'الوضع')}
            </Text>

            <View style={{ paddingHorizontal: 12, paddingBottom: 12, gap: 8 }}>
              {/* Buyer Mode */}
              <Pressable
                onPress={() => router.replace('/(tabs)/home')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  backgroundColor: colors.surfaceAlt,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.rule,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surface2,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="bag-outline" size={22} color={colors.muted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodySmall"
                    color="ink"
                    style={{ fontSize: 14, fontWeight: '600' }}
                  >
                    {L('Xaridor rejimi', 'Режим покупателя', 'Buyer mode', 'وضع المشتري')}
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                    {L("Mahsulotlarni ko'rish va xarid qilish", 'Просмотр и покупка товаров', 'Browse and shop', 'تصفح وشراء')}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: colors.rule,
                  }}
                />
              </Pressable>

              {/* Seller Mode — Active */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  backgroundColor: 'rgba(54,57,36,0.06)',
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.oliveDeep,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.oliveDeep,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="briefcase-outline" size={22} color={colors.goldSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodySmall"
                    color="ink"
                    style={{ fontSize: 14, fontWeight: '600' }}
                  >
                    {L('Sotuvchi rejimi', 'Режим продавца', 'Seller mode', 'وضع البائع')}
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                    {L("Do'kon boshqaruvi va sotish", 'Управление магазином и продажи', 'Manage shop & sales', 'إدارة المتجر والمبيعات')}
                  </Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: colors.oliveDeep,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: colors.oliveDeep,
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Store Settings Menu */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.rule,
              overflow: 'hidden',
            }}
          >
            <Text
              variant="caption"
              color="muted"
              style={{
                fontSize: 12,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                paddingHorizontal: 16,
                paddingTop: 14,
                paddingBottom: 10,
              }}
            >
              {L("Do'kon sozlamalari", 'Настройки магазина', 'Shop settings', 'إعدادات المتجر')}
            </Text>

            {storeMenu.map((item, idx) => (
              <Pressable
                key={item.label}
                onPress={() => {
                  if (item.action) item.action();
                  else if (item.route) router.push(item.route as any);
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: idx < storeMenu.length - 1 ? 1 : 0,
                  borderBottomColor: colors.rule,
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name={item.icon} size={20} color={colors.oliveDark} />
                <Text
                  variant="bodySmall"
                  color="ink"
                  style={{ flex: 1, fontSize: 14 }}
                >
                  {item.label}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.muted} />
              </Pressable>
            ))}
          </View>

          {/* Help */}
          <Pressable
            onPress={() => router.push('/settings/help' as any)}
            style={({ pressed }) => ({
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: colors.rule,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.oliveDark} />
            <Text
              variant="bodySmall"
              color="ink"
              style={{ flex: 1, fontSize: 14 }}
            >
              {L('Yordam markazi', 'Центр помощи', 'Help center', 'مركز المساعدة')}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          {/* Logout */}
          <Pressable
            onPress={async () => {
              await logout();
              router.replace('/(auth)/welcome');
            }}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              borderWidth: 1,
              borderColor: colors.rule,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text
              variant="body"
              style={{ fontSize: 14, fontWeight: '500', color: colors.danger }}
            >
              {L('Chiqish', 'Выйти', 'Log out', 'تسجيل الخروج')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
