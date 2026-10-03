import { useState } from 'react';
import { Pressable, TextInput, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function LoginScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const [phone, setPhone] = useState('');

  const formattedPhone = phone.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();

  const submit = () => {
    const fullPhone = `+998${phone.replace(/\s/g, '')}`;
    router.push({ pathname: '/(auth)/otp', params: { phone: fullPhone } });
  };

  const canSubmit = phone.replace(/\s/g, '').length >= 9;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.rule,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Svg width={18} height={18} fill="none" stroke={colors.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M12 4 L6 9 L12 14" />
            </Svg>
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32 }}>
          {/* Title */}
          <RNText
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 30,
              fontWeight: '700',
              color: colors.oliveDeep,
              marginBottom: 8,
            }}
          >
            Kirish
          </RNText>
          <Text variant="bodySmall" color="muted" style={{ lineHeight: 20, marginBottom: 36 }}>
            Telefon raqamingizni kiriting, SMS orqali tasdiqlash kodi yuboramiz
          </Text>

          {/* Phone Input */}
          <View style={{ marginBottom: 24 }}>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 12,
                color: colors.muted,
                fontWeight: '500',
                marginBottom: 8,
              }}
            >
              Telefon raqam
            </RNText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {/* Country Code */}
              <View
                style={{
                  width: 90,
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.rule,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {/* Uzbek flag */}
                <View
                  style={{
                    width: 22,
                    height: 16,
                    borderRadius: 2,
                    overflow: 'hidden',
                    flexDirection: 'row',
                  }}
                >
                  <View style={{ width: 7, height: 16, backgroundColor: '#0099B5' }} />
                  <View style={{ width: 8, height: 16, backgroundColor: '#fff' }} />
                  <View style={{ width: 7, height: 16, backgroundColor: '#1EB53A' }} />
                </View>
                <RNText
                  style={{
                    fontFamily: theme.fontFamilies.body,
                    fontSize: 14,
                    color: colors.ink,
                    fontWeight: '500',
                  }}
                >
                  +998
                </RNText>
              </View>

              {/* Phone Number */}
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: 14,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.rule,
                  borderRadius: 12,
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  value={phone}
                  onChangeText={(t) => setPhone(t.replace(/[^\d]/g, '').slice(0, 9))}
                  placeholder="90 123 45 67"
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={9}
                  style={{
                    fontFamily: theme.fontFamilies.body,
                    fontSize: 14,
                    color: colors.ink,
                    paddingVertical: 14,
                  }}
                />
              </View>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            style={{
              width: '100%',
              paddingVertical: 16,
              backgroundColor: colors.oliveDeep,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: canSubmit ? 1 : 0.5,
              marginBottom: 20,
            }}
          >
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 15,
                fontWeight: '600',
                color: colors.goldSoft,
              }}
            >
              Davom etish
            </RNText>
            <Svg width={16} height={16} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
              <Path d="M6 3 L12 8 L6 13" />
            </Svg>
          </Pressable>

          {/* Divider */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.rule }} />
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 12,
                color: colors.muted,
              }}
            >
              yoki
            </RNText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.rule }} />
          </View>

          {/* Social Login */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              style={{
                flex: 1,
                paddingVertical: 14,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20">
                <Path
                  d="M18.17 8.37H10v3.45h4.72C14.28 13.8 12.35 15 10 15a5 5 0 010-10c1.23 0 2.35.44 3.22 1.17l2.57-2.57A8.96 8.96 0 0010 1 9 9 0 1018.17 8.37z"
                  fill={colors.muted}
                />
              </Svg>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 13,
                  color: colors.ink,
                  fontWeight: '500',
                }}
              >
                Google
              </RNText>
            </Pressable>

            <Pressable
              style={{
                flex: 1,
                paddingVertical: 14,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20" fill={colors.muted}>
                <Path d="M14.94 10.81a4.26 4.26 0 012.06 3.58c-.6 1.88-2.36 3.24-3.51 3.93a5.7 5.7 0 01-2.8.68c-.74 0-1.3-.16-1.83-.31-.55-.16-1.06-.3-1.79-.3-.77 0-1.32.16-1.89.32-.5.14-1.02.29-1.7.3C2.15 19.04.73 17.37.1 16.04A11.27 11.27 0 010 10.74c0-3.68 2.4-5.63 4.74-5.63.84 0 1.52.2 2.1.37.48.15.9.28 1.27.28.32 0 .7-.12 1.15-.27.65-.2 1.46-.46 2.42-.46 1.65 0 3 .83 3.74 2.05a4.4 4.4 0 00-2.12 1.83 4.32 4.32 0 001.64 1.9zM11.5.58c.03.27.04.54.04.8 0 1.34-.5 2.58-1.37 3.47A3.56 3.56 0 017.5 6.11c-.03-.25-.05-.51-.05-.77 0-1.28.55-2.6 1.41-3.45A4.65 4.65 0 0111.5.58z" />
              </Svg>
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 13,
                  color: colors.ink,
                  fontWeight: '500',
                }}
              >
                Apple
              </RNText>
            </Pressable>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Register Link */}
          <Pressable
            onPress={() => router.push('/(auth)/register')}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
            }}
          >
            <Text variant="bodySmall" color="muted">
              Yangi foydalanuvchimisiz?
            </Text>
            <Text variant="bodySmall" color="gold" style={{ fontWeight: '600' }}>
              Ro'yxatdan o'tish
            </Text>
          </Pressable>

          {/* Terms */}
          <View style={{ alignItems: 'center', paddingTop: 16, paddingBottom: 8 }}>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 11,
                color: colors.oliveSoft,
                lineHeight: 16,
                textAlign: 'center',
              }}
            >
              Davom etish orqali{' '}
              <RNText style={{ textDecorationLine: 'underline', color: colors.olive }}>
                Foydalanish shartlari
              </RNText>
              {' '}va{' '}
              <RNText style={{ textDecorationLine: 'underline', color: colors.olive }}>
                Maxfiylik siyosati
              </RNText>
              ga rozilik bildirasiz
            </RNText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
