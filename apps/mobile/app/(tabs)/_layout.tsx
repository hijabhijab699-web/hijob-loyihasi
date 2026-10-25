import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function TabsLayout() {
  const { colors, theme, scheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  // Translucent blur sits under the tabs so the content behind the bar
  // reads softly through a frosted layer — the "premium" feel comes from
  // the glass + warm gold accent + thin hairline over a solid surface
  // fallback (BlurView falls back to black on Android pre-12 unless we
  // paint a surface behind it). Theme-aware tint so dark mode doesn't
  // get a bright glass panel.
  const blurTint = scheme === 'dark' ? 'dark' : 'light';
  const barBg =
    Platform.OS === 'ios'
      ? 'transparent'
      : scheme === 'dark'
        ? 'rgba(26, 23, 20, 0.96)'
        : 'rgba(252, 248, 240, 0.96)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // Dark mode: warm gold active + semi-transparent cream inactive —
        // all tabs feel part of the same light family, the active one is
        // simply saturated.
        tabBarActiveTintColor: scheme === 'dark' ? colors.gold : colors.goldDark,
        tabBarInactiveTintColor: scheme === 'dark' ? 'rgba(240,235,218,0.45)' : colors.muted,
        tabBarShowLabel: true,
        tabBarItemStyle: {
          paddingTop: 4,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <>
              <BlurView
                tint={blurTint}
                intensity={scheme === 'dark' ? 40 : 70}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              {/* Solid tint over the blur so dark mode gets a crisp bar
                  colour instead of the washed-out gray that iOS gives a
                  dark BlurView over a dark background. */}
              <View
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor:
                    scheme === 'dark'
                      ? 'rgba(21, 21, 15, 0.82)'
                      : 'rgba(252, 248, 240, 0.4)',
                }}
              />
              {/* Hairline on top edge */}
              <View
                style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                  backgroundColor: scheme === 'dark'
                    ? 'rgba(240, 235, 218, 0.08)'
                    : 'rgba(42, 40, 32, 0.08)',
                }}
              />
            </>
          ) : null,
        tabBarStyle: {
          backgroundColor: barBg,
          borderTopWidth: 0,
          height: 64 + bottomInset,
          paddingTop: 12,
          paddingBottom: bottomInset,
          elevation: 20,
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamilies.body,
          fontWeight: '600',
          fontSize: 10.5,
          letterSpacing: 0.3,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tryon"
        options={{
          title: t('tabs.tryon'),
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: focused ? colors.goldDark : colors.oliveDeep,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 22,
                borderWidth: 3,
                borderColor: colors.surface,
                shadowColor: focused ? colors.gold : colors.oliveDeep,
                shadowOpacity: 0.45,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 14,
                elevation: 10,
              }}
            >
              <Ionicons name="sparkles" size={26} color={colors.goldSoft} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bag-handle' : 'bag-handle-outline'} size={focused ? 24 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={focused ? 25 : 23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
