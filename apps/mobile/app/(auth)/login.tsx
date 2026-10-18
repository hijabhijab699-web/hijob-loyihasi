import { useState } from 'react';
import { Alert, Pressable, TextInput, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { safeBack } from '../../src/lib/safe-back';

export default function LoginScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const loginSuccess = useAuth((s) => s.loginSuccess);
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const fullPhone = `+998${phone.replace(/\s/g, '')}`;
      // Backend LoginDto expects `identifier` (username OR phone) + `password`.
      const { data } = await api.post('/auth/login', { identifier: fullPhone, password });
      await loginSuccess(data.user, data.tokens);
      // Sellers land on their dashboard; buyers go through the splash so
      // onboarding gates can trigger if needed.
      if (data.user?.role === 'seller') {
        router.replace('/(seller-tabs)/dashboard');
      } else {
        router.replace('/');
      }
    } catch (e: any) {
      Alert.alert(errorTitle(), errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = phone.replace(/\s/g, '').length >= 9 && password.length >= 6;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          <Pressable
            onPress={() => safeBack()}
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
            {isRu ? 'Вход' : 'Kirish'}
          </RNText>
          <Text variant="bodySmall" color="muted" style={{ lineHeight: 20, marginBottom: 36 }}>
            {isRu ? 'Введите номер телефона и пароль' : 'Telefon raqam va parolingizni kiriting'}
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
              {isRu ? 'Номер телефона' : 'Telefon raqam'}
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

          {/* Password */}
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
              {isRu ? 'Пароль' : 'Parol'}
            </RNText>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.surfaceAlt,
                borderWidth: 1,
                borderColor: colors.rule,
                borderRadius: 12,
                paddingHorizontal: 14,
              }}
            >
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder={isRu ? 'Введите пароль' : 'Parolni kiriting'}
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                style={{
                  flex: 1,
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 14,
                  color: colors.ink,
                  paddingVertical: 14,
                }}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Svg width={20} height={20} fill="none" stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  {showPassword ? (
                    <>
                      <Path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                      <Path d="M10 7a3 3 0 110 6 3 3 0 010-6z" />
                    </>
                  ) : (
                    <>
                      <Path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                      <Path d="M10 7a3 3 0 110 6 3 3 0 010-6z" />
                      <Path d="M3 3l14 14" />
                    </>
                  )}
                </Svg>
              </Pressable>
            </View>
          </View>

          {/* Submit */}
          <Pressable
            onPress={submit}
            disabled={!canSubmit || loading}
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
              {isRu ? 'Войти' : 'Kirish'}
            </RNText>
            <Svg width={16} height={16} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
              <Path d="M6 3 L12 8 L6 13" />
            </Svg>
          </Pressable>

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
              {isRu ? 'Новый пользователь?' : 'Yangi foydalanuvchimisiz?'}
            </Text>
            <Text variant="bodySmall" color="gold" style={{ fontWeight: '600' }}>
              {isRu ? 'Регистрация' : "Ro'yxatdan o'tish"}
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
              <RNText
                onPress={() => router.push('/terms')}
                style={{ textDecorationLine: 'underline', color: colors.olive }}
              >
                Foydalanish shartlari
              </RNText>
              {' '}va{' '}
              <RNText
                onPress={() => router.push('/privacy')}
                style={{ textDecorationLine: 'underline', color: colors.olive }}
              >
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
