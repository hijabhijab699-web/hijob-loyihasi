import { View, Pressable, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function WelcomeScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView
        edges={['top', 'bottom']}
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 40,
          paddingTop: 40,
          paddingBottom: 40,
        }}
      >
        <View />

        <View style={{ alignItems: 'center', gap: 24 }}>
          {/* Logo Mark */}
          <View
            style={{
              width: 88,
              height: 88,
              borderRadius: 24,
              backgroundColor: colors.oliveDeep,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RNText
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 36,
                fontWeight: '700',
                color: colors.goldSoft,
              }}
            >
              H
            </RNText>
          </View>

          {/* Brand Name */}
          <View style={{ alignItems: 'center' }}>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 42,
                fontWeight: '700',
                color: colors.oliveDeep,
                letterSpacing: -0.5,
              }}
            >
              Hijob
            </RNText>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 14,
                color: colors.muted,
                marginTop: 8,
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              Modest Fashion
            </RNText>
          </View>

          {/* Illustration */}
          <View
            style={{
              width: 260,
              height: 260,
              borderRadius: 130,
              borderWidth: 1,
              borderColor: colors.rule,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 200,
                height: 200,
                borderRadius: 100,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Svg
                width={48}
                height={48}
                fill="none"
                stroke={colors.olive}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <Circle cx={24} cy={14} r={8} />
                <Path d="M8 42c0-8.8 7.2-16 16-16s16 7.2 16 16" />
                <Path d="M20 22c-2 4-3 10-3 14" />
                <Path d="M28 22c2 4 3 10 3 14" />
              </Svg>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 11,
                  color: colors.oliveSoft,
                  letterSpacing: 0.5,
                }}
              >
                Virtual Try-On
              </RNText>
            </View>
          </View>

          {/* Tagline */}
          <View style={{ alignItems: 'center', maxWidth: 260 }}>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 15,
                color: colors.oliveDark,
                lineHeight: 22,
                textAlign: 'center',
              }}
            >
              Kiyimlarni sotib olishdan oldin{' '}
              <RNText style={{ fontWeight: '700', color: colors.oliveDeep }}>
                virtual sinab ko'ring
              </RNText>
            </RNText>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={{ width: '100%', gap: 12 }}>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{
              width: '100%',
              paddingVertical: 16,
              backgroundColor: colors.oliveDeep,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Text
              variant="body"
              style={{
                fontWeight: '600',
                fontSize: 15,
                color: colors.goldSoft,
              }}
            >
              Boshlash
            </Text>
            <Svg
              width={16}
              height={16}
              fill="none"
              stroke={colors.goldSoft}
              strokeWidth={2}
              strokeLinecap="round"
            >
              <Path d="M6 3 L12 8 L6 13" />
            </Svg>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
            }}
          >
            <Text variant="bodySmall" color="muted">
              Akkauntingiz bormi?
            </Text>
            <Text
              variant="bodySmall"
              color="gold"
              style={{ fontWeight: '500' }}
            >
              Kirish
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
