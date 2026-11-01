import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';

// Premium Hijab tabbar — cream surface, serif labels, center-floating
// Примерка bubble in forest green with a gold ring. The outline-only
// icons sit inside a cream rounded tile when their tab is active so the
// highlight reads at a glance without changing icon weight.
export default function TabsLayout() {
  const { colors, theme, scheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 10);

  const barBg = scheme === 'dark' ? 'rgba(26, 23, 20, 0.98)' : '#ffffff';
  const activeTileBg = scheme === 'dark' ? 'rgba(201,168,97,0.18)' : '#efe6cf';
  const inkColor = scheme === 'dark' ? '#f0ebda' : '#2a2a1f';
  const activeInk = scheme === 'dark' ? colors.gold : '#3a4e2a';
  const inactiveInk = scheme === 'dark' ? 'rgba(240,235,218,0.55)' : '#4a4a3b';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeInk,
        tabBarInactiveTintColor: inactiveInk,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: barBg,
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          height: 64 + bottomInset,
          paddingTop: 10,
          paddingBottom: bottomInset,
          elevation: 20,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: -3 },
          position: 'absolute',
        },
        tabBarItemStyle: {
          paddingTop: 2,
        },
        tabBarLabelStyle: {
          fontFamily: theme.fontFamilies.body,
          fontWeight: '600',
          fontSize: 10.5,
          letterSpacing: 0.2,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ focused }) => (
            <ActiveTile active={focused} bg={activeTileBg}>
              <Ionicons
                name="home-outline"
                size={22}
                color={focused ? activeInk : inkColor}
              />
            </ActiveTile>
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabs.catalog'),
          tabBarIcon: ({ focused }) => (
            <ActiveTile active={focused} bg={activeTileBg}>
              <Ionicons
                name="grid-outline"
                size={22}
                color={focused ? activeInk : inkColor}
              />
            </ActiveTile>
          ),
        }}
      />
      <Tabs.Screen
        name="tryon"
        options={{
          title: t('tabs.tryon'),
          tabBarIcon: () => (
            // Floating center bubble: forest-green gradient-feel circle
            // ringed by a cream halo and then the brand gold. Sits above
            // the tabbar line via negative margin so it visibly rises.
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.oliveDeep,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: -18,
                marginBottom: 2,
                borderWidth: 3,
                borderColor: scheme === 'dark' ? colors.oliveDeep : '#fcfaf3',
                shadowColor: colors.oliveDeep,
                shadowOpacity: 0.4,
                shadowOffset: { width: 0, height: 6 },
                shadowRadius: 12,
                elevation: 10,
              }}
            >
              {/* Gold ring hugging the circle */}
              <View
                style={{
                  position: 'absolute',
                  inset: -5 as any,
                  top: -5, left: -5, right: -5, bottom: -5,
                  borderRadius: 32,
                  borderWidth: 2,
                  borderColor: colors.gold,
                }}
              />
              <Ionicons name="sparkles" size={24} color="#ffffff" />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: t('tabs.cart'),
          tabBarIcon: ({ focused }) => (
            <ActiveTile active={focused} bg={activeTileBg}>
              <Ionicons
                name="bag-handle-outline"
                size={22}
                color={focused ? activeInk : inkColor}
              />
            </ActiveTile>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ focused }) => (
            <ActiveTile active={focused} bg={activeTileBg}>
              <Ionicons
                name="person-outline"
                size={22}
                color={focused ? activeInk : inkColor}
              />
            </ActiveTile>
          ),
        }}
      />
    </Tabs>
  );
}

// Wraps the tab icon in a soft cream pill when its tab is active —
// matches the mockup's "highlighted current tab" treatment without
// changing icon weight. Non-active state is a transparent tile the
// same size so the label never jumps up/down between tabs.
function ActiveTile({
  active,
  bg,
  children,
}: {
  active: boolean;
  bg: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: 44,
        height: 32,
        borderRadius: 16,
        backgroundColor: active ? bg : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </View>
  );
}
