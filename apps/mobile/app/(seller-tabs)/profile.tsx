import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';

const SELLER_MENU = [
  { key: 'storeInfo', icon: 'storefront-outline' as const },
  { key: 'payment', icon: 'card-outline' as const },
  { key: 'delivery', icon: 'car-outline' as const },
  { key: 'notifications', icon: 'notifications-outline' as const },
  { key: 'settings', icon: 'settings-outline' as const },
];

export default function SellerProfileScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  const switchToBuyer = () => {
    router.replace('/(tabs)/home');
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text variant="displayLarge" color="oliveDeep">
          {t('profile.title')}
        </Text>

        {/* User Card */}
        <View
          style={{
            padding: 16,
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
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
            <Text variant="titleMedium" color="surface">
              {user?.fullName?.slice(0, 1).toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" color="ink">{user?.fullName ?? '—'}</Text>
            <Text variant="bodySmall" color="muted">@{user?.username}</Text>
          </View>
        </View>

        {/* Role Switcher */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.rule,
            gap: 12,
          }}
        >
          <Text variant="titleSmall" color="oliveDeep">
            {t('seller.profile.currentMode')}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              onPress={switchToBuyer}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: theme.radii.lg,
                borderWidth: 1,
                borderColor: colors.rule,
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="cart-outline" size={20} color={colors.muted} />
              <Text variant="caption" color="muted">{t('seller.profile.buyerMode')}</Text>
            </Pressable>
            <View
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: theme.radii.lg,
                backgroundColor: colors.oliveDeep,
                alignItems: 'center',
                gap: 4,
              }}
            >
              <Ionicons name="storefront-outline" size={20} color={colors.goldSoft} />
              <Text variant="caption" color="surface">{t('seller.profile.sellerMode')}</Text>
            </View>
          </View>
        </View>

        {/* Store Settings Menu */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: colors.rule,
            overflow: 'hidden',
          }}
        >
          {SELLER_MENU.map((item, idx) => (
            <Pressable
              key={item.key}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                borderBottomWidth: idx < SELLER_MENU.length - 1 ? 1 : 0,
                borderBottomColor: colors.rule,
              }}
            >
              <Ionicons name={item.icon} size={22} color={colors.oliveDark} />
              <Text variant="body" color="ink" style={{ flex: 1 }}>
                {t(`seller.profile.menu.${item.key}`)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

        {/* Logout */}
        <Pressable
          onPress={() => {
            logout();
            router.replace('/');
          }}
          style={{
            padding: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
            borderRadius: theme.radii.pill,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.rule,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text variant="button" color="danger">{t('profile.logout')}</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
