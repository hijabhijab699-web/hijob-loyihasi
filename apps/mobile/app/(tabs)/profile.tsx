import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';

const MENU = [
  { key: 'orders', icon: 'receipt-outline' as const, route: '/orders' as const },
  { key: 'addresses', icon: 'location-outline' as const, route: '/addresses' as const },
  { key: 'measurements', icon: 'body-outline' as const, route: '/measurements' as const },
  { key: 'faceTemplate', icon: 'scan-outline' as const, route: '/face' as const },
  { key: 'notifications', icon: 'notifications-outline' as const, route: '/notifications' as const },
  { key: 'language', icon: 'globe-outline' as const, route: '/language' as const },
  { key: 'support', icon: 'help-circle-outline' as const, route: '/support' as const },
];

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text variant="displayLarge" color="oliveDeep">
          {t('profile.title')}
        </Text>

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
            <Text variant="titleMedium" color="ink">
              {user?.fullName ?? '—'}
            </Text>
            <Text variant="bodySmall" color="muted">
              @{user?.username}
            </Text>
          </View>
        </View>

        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: theme.radii.xl,
            borderWidth: 1,
            borderColor: colors.rule,
            overflow: 'hidden',
          }}
        >
          {MENU.map((item, idx) => (
            <Pressable
              key={item.key}
              onPress={() => router.push(item.route as any)}
              style={{
                padding: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                borderBottomWidth: idx < MENU.length - 1 ? 1 : 0,
                borderBottomColor: colors.rule,
              }}
            >
              <Ionicons name={item.icon} size={22} color={colors.oliveDark} />
              <Text variant="body" color="ink" style={{ flex: 1 }}>
                {t(`profile.${item.key}`)}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>

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
          <Text variant="button" color="danger">
            {t('profile.logout')}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
