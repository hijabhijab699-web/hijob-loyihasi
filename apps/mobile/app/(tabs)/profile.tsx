import { Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { api } from '../../src/api/client';

interface MenuItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  iconBg: string;
  route?: string;
  badge?: { text: string; bg: string; color: string };
  secondary?: string;
}

export default function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();
  const lang = (i18n.language?.slice(0, 2) ?? 'uz') as 'uz' | 'ru';
  const qc = useQueryClient();

  // Fetch real counts instead of showing hardcoded 12/8/3 that make a
  // freshly registered account look populated. Each query runs under the
  // user's token; empty responses render as 0 without blocking the UI.
  const { data: ordersData } = useQuery<any>({
    queryKey: ['profile-orders-count'],
    queryFn: async () => (await api.get('/orders')).data,
  });
  const { data: wishlistData } = useQuery<any>({
    queryKey: ['profile-wishlist-count'],
    queryFn: async () => (await api.get('/wishlist')).data,
  });
  const { data: addressesData } = useQuery<any>({
    queryKey: ['profile-addresses-count'],
    queryFn: async () => (await api.get('/addresses')).data,
  });

  const countOf = (d: any): number => {
    if (!d) return 0;
    if (Array.isArray(d)) return d.length;
    if (Array.isArray(d.items)) return d.items.length;
    if (Array.isArray(d.data)) return d.data.length;
    if (typeof d.total === 'number') return d.total;
    if (typeof d.count === 'number') return d.count;
    return 0;
  };
  const ordersCount = countOf(ordersData);
  const wishlistCount = countOf(wishlistData);
  const addressesCount = countOf(addressesData);

  const DICT: Record<'uz' | 'ru' | 'en' | 'ar', Record<string, string>> = {
    uz: {
      myOrders: 'Buyurtmalarim', wishlist: 'Sevimlilar', myAddresses: 'Manzillarim',
      myMeasurements: "O'lchovlarim", faceTemplate: 'Yuz shablonim', ready: 'Tayyor',
      notifications: 'Bildirishnomalar', language: 'Til', languageValue: "O'zbekcha", help: 'Yordam',
      messages: 'Xabarlar', appearance: "Ko'rinish",
      orders: 'Buyurtmalar', favorites: 'Sevimlilar', addresses: 'Manzillar',
      profile: 'Profil', user: 'Foydalanuvchi', switchSeller: "Sotuvchi rejimiga o'tish",
      sectionOrders: 'Buyurtmalar va tanlangan', sectionTryon: 'Primerka sozlamalari',
      sectionApp: 'Ilova', logout: 'Chiqish',
    },
    ru: {
      myOrders: 'Мои заказы', wishlist: 'Избранное', myAddresses: 'Мои адреса',
      myMeasurements: 'Мои размеры', faceTemplate: 'Шаблон лица', ready: 'Готово',
      notifications: 'Уведомления', language: 'Язык', languageValue: 'Русский', help: 'Помощь',
      messages: 'Сообщения', appearance: 'Внешний вид',
      orders: 'Заказы', favorites: 'Избранное', addresses: 'Адреса',
      profile: 'Профиль', user: 'Пользователь', switchSeller: 'Перейти в режим продавца',
      sectionOrders: 'Заказы и избранное', sectionTryon: 'Настройки примерки',
      sectionApp: 'Приложение', logout: 'Выйти',
    },
    en: {
      myOrders: 'My orders', wishlist: 'Favorites', myAddresses: 'My addresses',
      myMeasurements: 'My measurements', faceTemplate: 'Face template', ready: 'Ready',
      notifications: 'Notifications', language: 'Language', languageValue: 'English', help: 'Help',
      messages: 'Messages', appearance: 'Appearance',
      orders: 'Orders', favorites: 'Favorites', addresses: 'Addresses',
      profile: 'Profile', user: 'User', switchSeller: 'Switch to seller mode',
      sectionOrders: 'Orders & favorites', sectionTryon: 'Try-on settings',
      sectionApp: 'App', logout: 'Log out',
    },
    ar: {
      myOrders: 'طلباتي', wishlist: 'المفضلة', myAddresses: 'عناويني',
      myMeasurements: 'مقاساتي', faceTemplate: 'قالب الوجه', ready: 'جاهز',
      notifications: 'الإشعارات', language: 'اللغة', languageValue: 'العربية', help: 'المساعدة',
      messages: 'الرسائل', appearance: 'المظهر',
      orders: 'الطلبات', favorites: 'المفضلة', addresses: 'العناوين',
      profile: 'الملف الشخصي', user: 'المستخدم', switchSeller: 'التحويل إلى وضع البائع',
      sectionOrders: 'الطلبات والمفضلة', sectionTryon: 'إعدادات التجربة',
      sectionApp: 'التطبيق', logout: 'تسجيل الخروج',
    },
  };
  const L = DICT[lang] ?? DICT.uz;

  const SECTION_1: MenuItem[] = [
    {
      label: L.myOrders,
      icon: 'receipt-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/orders',
      ...(ordersCount > 0
        ? { badge: { text: String(ordersCount), bg: colors.danger, color: '#fff' } }
        : {}),
    },
    {
      label: L.wishlist,
      icon: 'heart-outline',
      iconColor: '#B85450',
      iconBg: 'rgba(184,84,80,0.1)',
      route: '/wishlist',
    },
    {
      label: L.messages,
      icon: 'chatbubbles-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/chats',
    },
    {
      label: L.appearance,
      icon: 'moon-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/settings/theme',
    },
    {
      label: L.myAddresses,
      icon: 'location-outline',
      iconColor: '#C9A96E',
      iconBg: 'rgba(201,169,110,0.1)',
      route: '/settings/addresses',
    },
  ];

  const faceReady = Boolean((user as any)?.faceTemplateReady);

  const SECTION_2: MenuItem[] = [
    {
      label: L.myMeasurements,
      icon: 'body-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/(onboarding)/body',
    },
    {
      label: L.faceTemplate,
      icon: 'scan-outline',
      iconColor: '#5F7A94',
      iconBg: 'rgba(95,122,148,0.1)',
      route: '/(onboarding)/face',
      ...(faceReady
        ? { badge: { text: L.ready, bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B' } }
        : {}),
    },
  ];

  const SECTION_3: MenuItem[] = [
    {
      label: L.notifications,
      icon: 'notifications-outline',
      iconColor: '#C9A96E',
      iconBg: 'rgba(201,169,110,0.1)',
      route: '/notifications',
    },
    {
      label: L.language,
      icon: 'globe-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/settings/language',
      secondary: L.languageValue,
    },
    {
      label: L.help,
      icon: 'help-circle-outline',
      iconColor: '#857E6E',
      iconBg: 'rgba(133,126,110,0.1)',
      route: '/settings/help',
    },
  ];

  const STATS = [
    { value: String(ordersCount), label: L.orders },
    { value: String(wishlistCount), label: L.favorites },
    { value: String(addressesCount), label: L.addresses },
  ];

  const renderMenuSection = (items: MenuItem[]) => (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.rule,
        overflow: 'hidden',
      }}
    >
      {items.map((item, idx) => (
        <Pressable
          key={item.label}
          onPress={() => item.route && router.push(item.route as any)}
          android_ripple={{ color: 'rgba(0,0,0,0.05)' }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            paddingHorizontal: 16,
            backgroundColor: pressed ? 'rgba(0,0,0,0.04)' : 'transparent',
            borderBottomWidth: idx < items.length - 1 ? 1 : 0,
            borderBottomColor: colors.rule,
          })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: item.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={item.icon} size={18} color={item.iconColor} />
          </View>
          <Text
            variant="bodySmall"
            color="ink"
            style={{ flex: 1, fontSize: 14, fontWeight: '500' }}
          >
            {item.label}
          </Text>
          {item.badge && (
            <View
              style={{
                backgroundColor: item.badge.bg,
                borderRadius: 10,
                paddingHorizontal: 8,
                paddingVertical: 2,
                marginRight: 4,
              }}
            >
              <Text
                variant="caption"
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  color: item.badge.color,
                }}
              >
                {item.badge.text}
              </Text>
            </View>
          )}
          {item.secondary && (
            <Text
              variant="caption"
              color="muted"
              style={{ fontSize: 12, marginRight: 4 }}
            >
              {item.secondary}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.muted} />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              qc.invalidateQueries({ queryKey: ['profile-orders-count'] });
              qc.invalidateQueries({ queryKey: ['profile-wishlist-count'] });
              qc.invalidateQueries({ queryKey: ['profile-addresses-count'] });
            }}
            tintColor={colors.oliveDeep}
            colors={[colors.oliveDeep]}
          />
        }
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{ fontSize: 26, fontWeight: '700' }}
          >
            {L.profile}
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceGlass,
              borderWidth: 1,
              borderColor: colors.rule,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="settings-outline" size={20} color={colors.oliveDeep} />
          </Pressable>
        </View>

        {/* User Card */}
        <Pressable
          onPress={() => router.push('/settings/profile-details')}
          style={{
            marginHorizontal: 20,
            marginTop: 12,
            marginBottom: 16,
            backgroundColor: colors.surface,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.rule,
            padding: 20,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.oliveDeep,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text
                variant="displayLarge"
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 24,
                  fontWeight: '700',
                  color: colors.goldSoft,
                }}
              >
                {user?.fullName?.slice(0, 1).toUpperCase() ?? 'U'}
              </Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              variant="body"
              color="ink"
              style={{ fontSize: 16, fontWeight: '600', marginBottom: 2 }}
            >
              {user?.fullName ?? L.user}
            </Text>
            <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>
              @{user?.username ?? '—'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.muted} />
        </Pressable>

        {/* Seller Switch */}
        {user?.role === 'seller' && (
          <Pressable
            onPress={() => router.replace('/(seller-tabs)/dashboard')}
            style={{
              marginHorizontal: 20,
              marginBottom: 16,
              backgroundColor: colors.oliveDeep,
              borderRadius: 16,
              padding: 16,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Ionicons name="storefront-outline" size={22} color={colors.goldSoft} />
            <Text
              variant="bodySmall"
              style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.goldSoft }}
            >
              {L.switchSeller}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.gold} />
          </Pressable>
        )}

        {/* Stats Row */}
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 20,
            marginBottom: 16,
          }}
        >
          {STATS.map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 14,
                paddingVertical: 14,
                paddingHorizontal: 10,
                alignItems: 'center',
              }}
            >
              <Text
                variant="displayLarge"
                color="oliveDeep"
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 20,
                  fontWeight: '700',
                  marginBottom: 2,
                }}
              >
                {stat.value}
              </Text>
              <Text
                variant="caption"
                color="muted"
                style={{ fontSize: 10, fontWeight: '500' }}
              >
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Section 1: Buyurtmalar va tanlangan */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text
            variant="caption"
            color="muted"
            style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {L.sectionOrders}
          </Text>
          {renderMenuSection(SECTION_1)}
        </View>

        {/* Section 2: Primerka sozlamalari */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text
            variant="caption"
            color="muted"
            style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {L.sectionTryon}
          </Text>
          {renderMenuSection(SECTION_2)}
        </View>

        {/* Section 3: Ilova */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Text
            variant="caption"
            color="muted"
            style={{
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 8,
              paddingLeft: 4,
            }}
          >
            {L.sectionApp}
          </Text>
          {renderMenuSection(SECTION_3)}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={async () => {
              // Await the async token clear BEFORE navigating so the
              // splash sees `isAuthed=false` and routes to /welcome.
              // Without the await, router.replace('/') fired while the
              // store was still authed and bounced back to home — the
              // user had to tap "Chiqish" a second time to actually
              // log out.
              await logout();
              router.replace('/(auth)/welcome');
            }}
            style={{
              height: 48,
              borderRadius: 999,
              backgroundColor: colors.surface,
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
              style={{ fontSize: 14, fontWeight: '600', color: colors.danger }}
            >
              {L.logout}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
