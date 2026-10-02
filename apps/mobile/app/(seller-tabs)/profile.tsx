import { Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useAuth } from '../../src/store/auth';

interface MenuItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const STORE_MENU: MenuItem[] = [
  { label: "Do'kon ma'lumotlari", icon: 'storefront-outline' },
  { label: "To'lov ma'lumotlari", icon: 'card-outline' },
  { label: 'Yetkazib berish', icon: 'car-outline' },
  { label: 'Bildirishnomalar', icon: 'notifications-outline' },
  { label: 'Sozlamalar', icon: 'settings-outline' },
];

export default function SellerProfileScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
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
            Profil
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 16 }}>
          {/* User Card */}
          <Pressable
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
                {user?.fullName ?? 'Umidjon Gafforov'}
              </Text>
              <Text variant="bodySmall" color="muted" style={{ fontSize: 13 }}>
                @{user?.username ?? 'umidjon'}
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
              Rejim tanlash
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
                    backgroundColor: '#EDE5D0',
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
                    Xaridor rejimi
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                    Mahsulotlarni ko'rish va xarid qilish
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
                    Sotuvchi rejimi
                  </Text>
                  <Text variant="caption" color="muted" style={{ fontSize: 12 }}>
                    Do'kon boshqaruvi va sotish
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
              Do'kon sozlamalari
            </Text>

            {STORE_MENU.map((item, idx) => (
              <Pressable
                key={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 14,
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: idx < STORE_MENU.length - 1 ? 1 : 0,
                  borderBottomColor: colors.rule,
                }}
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
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 14,
              paddingHorizontal: 16,
              borderWidth: 1,
              borderColor: colors.rule,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.oliveDark} />
            <Text
              variant="bodySmall"
              color="ink"
              style={{ flex: 1, fontSize: 14 }}
            >
              Yordam markazi
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </Pressable>

          {/* Logout */}
          <Pressable
            onPress={() => {
              logout();
              router.replace('/');
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
              Chiqish
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </Screen>
  );
}
