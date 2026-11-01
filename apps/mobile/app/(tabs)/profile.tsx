import { Image, Pressable, RefreshControl, ScrollView, View, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';
import { api } from '../../src/api/client';

const { width: SCREEN_W } = Dimensions.get('window');
const SIDE = 20;

// Shared decorative premium Hijab assets. Each tab reuses the same silk
// ribbon + jasmine so the brand language stays coherent across screens.
const DECOR_SILK_TOP = require('../../assets/decor/silk-top.png');
const DECOR_JASMINE = require('../../assets/decor/jasmine.webp');
const DECOR_WAVE_BOTTOM = require('../../assets/decor/wave-bottom.webp');
const DECOR_PROFILE_BG = require('../../assets/decor/profile-bg.webp');

interface MenuItem {
  label: string;
  sub?: string;
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
      kicker: 'MENING PROFILIM', title: 'Profil',
      tier: 'Doimiy mijoz',
      myOrders: 'Buyurtmalarim', myOrdersSub: 'Kuzatuv, tarix va buyurtmalarni takrorlash',
      wishlist: 'Sevimlilar', wishlistSub: "Saqlangan mahsulotlar va to'plamlar",
      myAddresses: 'Manzillarim', myAddressesSub: 'Yetkazib berish va olish manzillari',
      myMeasurements: "O'lchovlarim", myMeasurementsSub: "Primerka uchun o'lchov va parametrlar",
      faceTemplate: 'Yuz shabloni', faceTemplateSub: 'Virtual primerka uchun yuz tasviri',
      ready: 'Tayyor',
      notifications: 'Bildirishnomalar', notificationsSub: 'Buyurtma va chegirmalar haqida',
      language: 'Til', languageValue: "O'zbekcha", languageSub: 'Ilova tilini tanlash',
      help: 'Yordam', helpSub: 'Savollar, qo\'llanma va aloqa',
      messages: 'Xabarlar', messagesSub: "Sotuvchilar bilan suhbat",
      appearance: "Ko'rinish", appearanceSub: "Tun / kun rejimi",
      user: 'Foydalanuvchi', switchSeller: "Sotuvchi rejimiga o'tish",
      sectionOrders: 'Buyurtmalar va tanlangan', sectionTryon: 'Primerka sozlamalari',
      sectionApp: 'Ilova', logout: 'Chiqish',
    },
    ru: {
      kicker: 'МОЙ ПРОФИЛЬ', title: 'Профиль',
      tier: 'Постоянный клиент',
      myOrders: 'Мои заказы', myOrdersSub: 'Отслеживание, история и повтор заказов',
      wishlist: 'Избранное', wishlistSub: 'Сохранённые товары и коллекции',
      myAddresses: 'Адреса', myAddressesSub: 'Адреса доставки и получения',
      myMeasurements: 'Мои размеры', myMeasurementsSub: 'Параметры для примерки',
      faceTemplate: 'Шаблон лица', faceTemplateSub: 'Используется для виртуальной примерки',
      ready: 'Готово',
      notifications: 'Уведомления', notificationsSub: 'О заказах и акциях',
      language: 'Язык', languageValue: 'Русский', languageSub: 'Язык интерфейса',
      help: 'Поддержка', helpSub: 'Помощь, вопросы и обратная связь',
      messages: 'Сообщения', messagesSub: 'Переписка с продавцами',
      appearance: 'Внешний вид', appearanceSub: 'Светлая / тёмная тема',
      user: 'Пользователь', switchSeller: 'Перейти в режим продавца',
      sectionOrders: 'Заказы и избранное', sectionTryon: 'Настройки примерки',
      sectionApp: 'Приложение', logout: 'Выйти',
    },
    en: {
      kicker: 'MY PROFILE', title: 'Profile',
      tier: 'Regular customer',
      myOrders: 'My orders', myOrdersSub: 'Tracking, history and reorders',
      wishlist: 'Favorites', wishlistSub: 'Saved items and collections',
      myAddresses: 'Addresses', myAddressesSub: 'Delivery and pickup addresses',
      myMeasurements: 'My measurements', myMeasurementsSub: 'Fitting parameters',
      faceTemplate: 'Face template', faceTemplateSub: 'Used for virtual try-on',
      ready: 'Ready',
      notifications: 'Notifications', notificationsSub: 'Orders and promotions',
      language: 'Language', languageValue: 'English', languageSub: 'Interface language',
      help: 'Support', helpSub: 'Help, questions and feedback',
      messages: 'Messages', messagesSub: 'Chat with sellers',
      appearance: 'Appearance', appearanceSub: 'Light / dark theme',
      user: 'User', switchSeller: 'Switch to seller mode',
      sectionOrders: 'Orders & favorites', sectionTryon: 'Try-on settings',
      sectionApp: 'App', logout: 'Log out',
    },
    ar: {
      kicker: 'ملفي الشخصي', title: 'الملف الشخصي',
      tier: 'عميل دائم',
      myOrders: 'طلباتي', myOrdersSub: 'التتبع والسجل وإعادة الطلب',
      wishlist: 'المفضلة', wishlistSub: 'الحفظ والمجموعات',
      myAddresses: 'العناوين', myAddressesSub: 'عناوين التوصيل والاستلام',
      myMeasurements: 'مقاساتي', myMeasurementsSub: 'معاملات التجربة',
      faceTemplate: 'قالب الوجه', faceTemplateSub: 'يستخدم للتجربة الافتراضية',
      ready: 'جاهز',
      notifications: 'الإشعارات', notificationsSub: 'الطلبات والعروض',
      language: 'اللغة', languageValue: 'العربية', languageSub: 'لغة الواجهة',
      help: 'المساعدة', helpSub: 'المساعدة والأسئلة والتعليقات',
      messages: 'الرسائل', messagesSub: 'الدردشة مع البائعين',
      appearance: 'المظهر', appearanceSub: 'سمة فاتحة / داكنة',
      user: 'المستخدم', switchSeller: 'التحويل إلى وضع البائع',
      sectionOrders: 'الطلبات والمفضلة', sectionTryon: 'إعدادات التجربة',
      sectionApp: 'التطبيق', logout: 'تسجيل الخروج',
    },
  };
  const L = ((DICT as any)[lang] ?? DICT.uz) as { [K in keyof (typeof DICT)['uz']]-?: string };

  // Jade-first palette matches the mockup's sage menu rounds. Dedicated
  // accent colors keep the icon tiles visually distinct without clashing
  // with the welcome gold or forest headings.
  const SECTION_1: MenuItem[] = [
    {
      label: L.myOrders,
      sub: L.myOrdersSub,
      icon: 'bag-handle-outline',
      iconColor: '#3a6451',
      iconBg: 'rgba(90,140,116,0.14)',
      route: '/orders',
      ...(ordersCount > 0
        ? { badge: { text: String(ordersCount), bg: colors.danger, color: '#fff' } }
        : {}),
    },
    {
      label: L.wishlist,
      sub: L.wishlistSub,
      icon: 'heart-outline',
      iconColor: '#8f6a2d',
      iconBg: 'rgba(201,168,97,0.18)',
      route: '/wishlist',
    },
    {
      label: L.messages,
      sub: L.messagesSub,
      icon: 'chatbubbles-outline',
      iconColor: '#3a6451',
      iconBg: 'rgba(90,140,116,0.14)',
      route: '/chats',
    },
    {
      label: L.myAddresses,
      sub: L.myAddressesSub,
      icon: 'location-outline',
      iconColor: '#3a6451',
      iconBg: 'rgba(90,140,116,0.14)',
      route: '/settings/addresses',
    },
  ];

  const faceReady = Boolean((user as any)?.faceTemplateReady);

  const SECTION_2: MenuItem[] = [
    {
      label: L.myMeasurements,
      sub: L.myMeasurementsSub,
      icon: 'body-outline',
      iconColor: '#3a6451',
      iconBg: 'rgba(90,140,116,0.14)',
      route: '/(onboarding)/body',
    },
    {
      label: L.faceTemplate,
      sub: L.faceTemplateSub,
      icon: 'scan-outline',
      iconColor: '#5F7A94',
      iconBg: 'rgba(95,122,148,0.14)',
      route: '/(onboarding)/face',
      ...(faceReady
        ? { badge: { text: L.ready, bg: 'rgba(122,138,91,0.14)', color: '#3a6451' } }
        : {}),
    },
  ];

  const SECTION_3: MenuItem[] = [
    {
      label: L.notifications,
      sub: L.notificationsSub,
      icon: 'notifications-outline',
      iconColor: '#8f6a2d',
      iconBg: 'rgba(201,168,97,0.18)',
      route: '/notifications',
    },
    {
      label: L.language,
      sub: L.languageSub,
      icon: 'globe-outline',
      iconColor: '#3a6451',
      iconBg: 'rgba(90,140,116,0.14)',
      route: '/settings/language',
      secondary: L.languageValue,
    },
    {
      label: L.help,
      sub: L.helpSub,
      icon: 'headset-outline',
      iconColor: '#3a6451',
      iconBg: 'rgba(90,140,116,0.14)',
      route: '/settings/help',
    },
  ];

  const name = user?.fullName?.split(' ')[0] ?? L.user;

  const renderMenuSection = (items: MenuItem[]) => (
    <View style={{ gap: 10 }}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          onPress={() => item.route && router.push(item.route as any)}
          android_ripple={{ color: 'rgba(0,0,0,0.04)' }}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            padding: 14,
            borderRadius: 18,
            backgroundColor: pressed ? 'rgba(0,0,0,0.03)' : colors.surface,
            borderWidth: 1,
            borderColor: 'rgba(201,168,97,0.18)',
          })}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: item.iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={item.icon} size={20} color={item.iconColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 16,
                fontWeight: '500',
                color: colors.oliveDeep,
                marginBottom: 2,
              }}
            >
              {item.label}
            </Text>
            {item.sub && (
              <Text
                variant="caption"
                color="muted"
                numberOfLines={1}
                style={{ fontSize: 11 }}
              >
                {item.sub}
              </Text>
            )}
          </View>
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
          <Ionicons name="chevron-forward" size={18} color="#487a62" />
        </Pressable>
      ))}
    </View>
  );

  return (
    <Screen>
      {/* Shared silk + jasmine decor — identical to home.tsx. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: SCREEN_W * 0.5,
          zIndex: 0,
          backgroundColor: '#efe6cf',
          overflow: 'hidden',
        }}
      >
        <Image
          source={DECOR_SILK_TOP}
          style={{ width: '110%', height: '100%', marginLeft: '-5%', opacity: 1 }}
          resizeMode="cover"
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 50, right: -40,
          width: 190, height: 125,
          transform: [{ rotate: '-6deg' }],
          zIndex: 1,
        }}
      >
        <Image
          source={DECOR_JASMINE}
          style={{ width: '100%', height: '100%', opacity: 0.95 }}
          resizeMode="contain"
        />
      </View>

      {/* Scarf-like green silk wave above the tab bar. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: SCREEN_W * 0.4,
          zIndex: 0,
          opacity: 0.75,
        }}
      >
        <Image
          source={DECOR_WAVE_BOTTOM}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>

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
        {/* ── Welcome / page title with serif + swoosh underline ── */}
        <View style={{ paddingHorizontal: SIDE, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text
              variant="bodySmall"
              style={{
                letterSpacing: 3,
                textTransform: 'uppercase',
                fontSize: 10,
                fontWeight: '600',
                color: colors.gold,
              }}
            >
              {L.kicker}
            </Text>
            <Text style={{ color: colors.gold, fontSize: 12 }}>✦</Text>
          </View>
          <View style={{ marginTop: 6, flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <View style={{ position: 'relative' }}>
              <Text
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontSize: 32,
                  lineHeight: 36,
                  fontWeight: '500',
                  color: colors.oliveDeep,
                }}
              >
                {L.title}
              </Text>
              <Svg
                width="100%"
                height={10}
                viewBox="0 0 120 10"
                style={{ position: 'absolute', left: 2, right: 8, bottom: -4 }}
                pointerEvents="none"
              >
                <Path
                  d="M2 7 Q 30 1 60 5 T 118 4"
                  stroke={colors.olive}
                  strokeWidth={1.4}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </View>
          </View>
        </View>

        {/* ── Hero user card ── big italic name, gold loyalty chip, backed
            with the decorative silk-arch background. Taps still open the
            profile-details screen, same as before. */}
        <Pressable
          onPress={() => router.push('/settings/profile-details')}
          style={{
            marginHorizontal: SIDE,
            marginTop: 16,
            marginBottom: 18,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: 'rgba(201,168,97,0.3)',
            overflow: 'hidden',
            backgroundColor: colors.surface,
          }}
        >
          {/* Decorative background image on the right. */}
          <View style={{ position: 'absolute', inset: 0 as any, top: 0, left: 0, right: 0, bottom: 0 }}>
            <Image
              source={DECOR_PROFILE_BG}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
          {/* Cream wash so the avatar/text stay readable on the left. */}
          <View
            style={{
              position: 'absolute',
              top: 0, left: 0, bottom: 0,
              width: '70%',
              backgroundColor: 'rgba(252,250,243,0.78)',
            }}
          />

          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View
              style={{
                width: 88,
                height: 88,
                borderRadius: 44,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                borderWidth: 2,
                borderColor: '#fff',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 6,
              }}
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <Text
                  style={{
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 34,
                    fontWeight: '700',
                    color: colors.oliveDeep,
                  }}
                >
                  {name.slice(0, 1).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: theme.fontFamilies.display,
                  fontStyle: 'italic',
                  fontSize: 28,
                  fontWeight: '600',
                  lineHeight: 32,
                  color: '#487a62',
                }}
              >
                {name}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  alignSelf: 'flex-start',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  paddingLeft: 6, paddingRight: 12, paddingVertical: 5,
                  backgroundColor: '#fff',
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(201,168,97,0.3)',
                }}
              >
                <View
                  style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: colors.gold,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Svg width={11} height={11} viewBox="0 0 24 24">
                    <Path
                      d="M6 3 L18 3 L22 9 L12 22 L2 9 Z"
                      fill="#fff"
                    />
                  </Svg>
                </View>
                <Text
                  variant="caption"
                  style={{ fontSize: 11, fontWeight: '600', color: colors.oliveDeep }}
                >
                  {L.tier}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#487a62" />
          </View>
        </Pressable>

        {/* ── Seller switch (unchanged behaviour) ── */}
        {user?.role === 'seller' && (
          <Pressable
            onPress={() => router.replace('/(seller-tabs)/dashboard')}
            style={{
              marginHorizontal: SIDE,
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

        {/* ── Section 1 ── */}
        <View style={{ paddingHorizontal: SIDE, marginBottom: 18 }}>
          <Text
            variant="caption"
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10,
              paddingLeft: 4,
              color: colors.gold,
            }}
          >
            {L.sectionOrders}
          </Text>
          {renderMenuSection(SECTION_1)}
        </View>

        {/* ── Section 2 ── */}
        <View style={{ paddingHorizontal: SIDE, marginBottom: 18 }}>
          <Text
            variant="caption"
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10,
              paddingLeft: 4,
              color: colors.gold,
            }}
          >
            {L.sectionTryon}
          </Text>
          {renderMenuSection(SECTION_2)}
        </View>

        {/* ── Section 3 ── */}
        <View style={{ paddingHorizontal: SIDE, marginBottom: 18 }}>
          <Text
            variant="caption"
            style={{
              fontSize: 10,
              fontWeight: '700',
              letterSpacing: 2,
              textTransform: 'uppercase',
              marginBottom: 10,
              paddingLeft: 4,
              color: colors.gold,
            }}
          >
            {L.sectionApp}
          </Text>
          {renderMenuSection(SECTION_3)}
        </View>

        {/* ── Logout ── await the async token clear BEFORE navigating so
            the splash sees `isAuthed=false` and routes to /welcome.
            Without the await, router.replace fired while the store was
            still authed and bounced back to home. */}
        <View style={{ paddingHorizontal: SIDE }}>
          <Pressable
            onPress={async () => {
              await logout();
              router.replace('/(auth)/welcome');
            }}
            style={{
              height: 50,
              borderRadius: 999,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: 'rgba(201,168,97,0.3)',
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
