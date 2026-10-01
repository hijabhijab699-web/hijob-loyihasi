import { Pressable, ScrollView, View } from 'react-native';
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
  iconColor: string;
  iconBg: string;
  route?: string;
  badge?: { text: string; bg: string; color: string };
  secondary?: string;
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  const SECTION_1: MenuItem[] = [
    {
      label: 'Buyurtmalarim',
      icon: 'receipt-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/orders',
      badge: { text: '2', bg: colors.danger, color: '#fff' },
    },
    {
      label: 'Sevimlilar',
      icon: 'heart-outline',
      iconColor: '#B85450',
      iconBg: 'rgba(184,84,80,0.1)',
      route: '/wishlist',
    },
    {
      label: 'Manzillarim',
      icon: 'location-outline',
      iconColor: '#C9A96E',
      iconBg: 'rgba(201,169,110,0.1)',
      route: '/addresses',
    },
  ];

  const SECTION_2: MenuItem[] = [
    {
      label: "O'lchovlarim",
      icon: 'body-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/measurements',
    },
    {
      label: 'Yuz shablonim',
      icon: 'scan-outline',
      iconColor: '#5F7A94',
      iconBg: 'rgba(95,122,148,0.1)',
      route: '/face',
      badge: { text: 'Tayyor', bg: 'rgba(122,138,91,0.12)', color: '#7A8A5B' },
    },
  ];

  const SECTION_3: MenuItem[] = [
    {
      label: 'Bildirishnomalar',
      icon: 'notifications-outline',
      iconColor: '#C9A96E',
      iconBg: 'rgba(201,169,110,0.1)',
      route: '/notifications',
    },
    {
      label: 'Til / Язык',
      icon: 'globe-outline',
      iconColor: '#8A8D5B',
      iconBg: 'rgba(138,141,91,0.1)',
      route: '/language',
      secondary: "O'zbekcha",
    },
    {
      label: 'Yordam',
      icon: 'help-circle-outline',
      iconColor: '#857E6E',
      iconBg: 'rgba(133,126,110,0.1)',
      route: '/support',
    },
  ];

  const STATS = [
    { value: '12', label: 'Buyurtmalar' },
    { value: '8', label: 'Sevimlilar' },
    { value: '3', label: 'Manzillar' },
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
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 14,
            paddingHorizontal: 16,
            borderBottomWidth: idx < items.length - 1 ? 1 : 0,
            borderBottomColor: colors.rule,
          }}
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
            Profil
          </Text>
          <Pressable
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
            }}
          >
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
          </View>
          <View style={{ flex: 1 }}>
            <Text
              variant="body"
              color="ink"
              style={{ fontSize: 16, fontWeight: '600', marginBottom: 2 }}
            >
              {user?.fullName ?? 'Umidjon Gafforov'}
            </Text>
            <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>
              @{user?.username ?? 'umidjon'}
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
              Sotuvchi rejimiga o'tish
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
            Buyurtmalar va tanlangan
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
            Primerka sozlamalari
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
            Ilova
          </Text>
          {renderMenuSection(SECTION_3)}
        </View>

        {/* Logout */}
        <View style={{ paddingHorizontal: 20 }}>
          <Pressable
            onPress={() => {
              logout();
              router.replace('/');
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
              Chiqish
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
