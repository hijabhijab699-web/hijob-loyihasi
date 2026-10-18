import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Rect } from 'react-native-svg';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';
import { errorMessage, errorTitle } from '../../src/lib/api-errors';
import { safeBack } from '../../src/lib/safe-back';

type Role = 'buyer' | 'seller';

export default function RegisterScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const loginSuccess = useAuth((s) => s.loginSuccess);
  const { i18n } = useTranslation();
  const isRu = (i18n.language?.slice(0, 2) ?? 'uz') === 'ru';

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>('buyer');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const canSubmit = fullName.trim().length > 0 && username.trim().length > 0 && phone.replace(/\s/g, '').length >= 9 && password.length >= 6 && termsAccepted;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const fullPhone = `+998${phone.replace(/\s/g, '')}`;
      const { data } = await api.post('/auth/register', {
        fullName: fullName.trim(),
        username: username.trim().replace(/^@/, ''),
        phone: fullPhone,
        password,
        role,
      });
      await loginSuccess(data.user, data.tokens);
      // Sellers skip the buyer try-on onboarding and land on the seller
      // dashboard immediately. Buyers hit the splash which continues them
      // to body/face onboarding or the home tab as appropriate.
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

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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

          {/* Progress */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, color: colors.muted }}>
              1 / 3
            </RNText>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.rule }} />
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.rule }} />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <RNText
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 26,
              fontWeight: '700',
              color: colors.oliveDeep,
              marginBottom: 8,
            }}
          >
            {isRu ? 'Регистрация' : "Ro'yxatdan o'tish"}
          </RNText>
          <RNText
            style={{
              fontFamily: theme.fontFamilies.body,
              fontSize: 14,
              color: colors.muted,
              lineHeight: 20,
              marginBottom: 32,
            }}
          >
            {isRu ? 'Введите свои личные данные' : "Shaxsiy ma'lumotlaringizni kiriting"}
          </RNText>

          {/* Form */}
          <View style={{ gap: 18, marginBottom: 28 }}>
            {/* Full Name */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                {isRu ? 'Имя и фамилия *' : 'Ism va familiya *'}
              </RNText>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder={isRu ? 'Введите имя и фамилию' : 'Ism va familiyangizni kiriting'}
                placeholderTextColor={colors.muted}
                autoCapitalize="words"
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  backgroundColor: colors.surfaceAlt,
                  borderWidth: 1,
                  borderColor: colors.rule,
                  borderRadius: 12,
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 14,
                  color: colors.ink,
                }}
              />
            </View>

            {/* Username */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                {isRu ? 'Имя пользователя *' : 'Foydalanuvchi nomi *'}
              </RNText>
              <View style={{ position: 'relative', justifyContent: 'center' }}>
                <TextInput
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase())}
                  placeholder="username"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={{
                    paddingHorizontal: 14,
                    paddingLeft: 28,
                    paddingVertical: 14,
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: colors.rule,
                    borderRadius: 12,
                    fontFamily: theme.fontFamilies.body,
                    fontSize: 14,
                    color: colors.ink,
                  }}
                />
                <RNText
                  style={{
                    position: 'absolute',
                    left: 14,
                    fontFamily: theme.fontFamilies.body,
                    fontSize: 14,
                    color: colors.muted,
                  }}
                >
                  @
                </RNText>
              </View>
            </View>

            {/* Phone */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                {isRu ? 'Номер телефона' : 'Telefon raqam'}
              </RNText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
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
                  <View style={{ width: 22, height: 16, borderRadius: 2, overflow: 'hidden', flexDirection: 'row' }}>
                    <View style={{ width: 7, height: 16, backgroundColor: '#0099B5' }} />
                    <View style={{ width: 8, height: 16, backgroundColor: '#fff' }} />
                    <View style={{ width: 7, height: 16, backgroundColor: '#1EB53A' }} />
                  </View>
                  <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 14, color: colors.ink, fontWeight: '500' }}>+998</RNText>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.rule, borderRadius: 12, justifyContent: 'center' }}>
                  <TextInput
                    value={phone}
                    onChangeText={(t) => setPhone(t.replace(/[^\d]/g, '').slice(0, 9))}
                    placeholder="90 123 45 67"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                    maxLength={9}
                    style={{ paddingHorizontal: 14, paddingVertical: 14, fontFamily: theme.fontFamilies.body, fontSize: 14, color: colors.ink }}
                  />
                </View>
              </View>
            </View>

            {/* Password */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                {isRu ? 'Пароль' : 'Parol'}
              </RNText>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.rule, borderRadius: 12, paddingHorizontal: 14 }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder={isRu ? 'Минимум 6 символов' : 'Kamida 6 ta belgi'}
                  placeholderTextColor={colors.muted}
                  secureTextEntry={!showPassword}
                  style={{ flex: 1, fontFamily: theme.fontFamilies.body, fontSize: 14, color: colors.ink, paddingVertical: 14 }}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Svg width={20} height={20} fill="none" stroke={colors.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                    <Path d="M10 7a3 3 0 110 6 3 3 0 010-6z" />
                    {!showPassword && <Path d="M3 3l14 14" />}
                  </Svg>
                </Pressable>
              </View>
            </View>

            {/* Role Selector */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 8 }}>
                {isRu ? 'Кто вы?' : 'Siz kimsiz?'}
              </RNText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Xaridor */}
                <Pressable
                  onPress={() => setRole('buyer')}
                  style={{
                    flex: 1,
                    padding: 14,
                    backgroundColor: role === 'buyer' ? `${colors.oliveDeep}10` : colors.surfaceAlt,
                    borderWidth: role === 'buyer' ? 2 : 1,
                    borderColor: role === 'buyer' ? colors.oliveDeep : colors.rule,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Svg width={22} height={22} fill="none" stroke={role === 'buyer' ? colors.oliveDeep : colors.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M5 2h12l2 4H3l2-4z" />
                    <Path d="M3 6v10a2 2 0 002 2h8a2 2 0 002-2V6" />
                  </Svg>
                  <View>
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, fontWeight: '600', color: colors.ink }}>
                      {isRu ? 'Покупатель' : 'Xaridor'}
                    </RNText>
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 10, color: colors.muted }}>
                      {isRu ? 'Покупка' : 'Xarid qilish'}
                    </RNText>
                  </View>
                </Pressable>

                {/* Sotuvchi */}
                <Pressable
                  onPress={() => setRole('seller')}
                  style={{
                    flex: 1,
                    padding: 14,
                    backgroundColor: role === 'seller' ? `${colors.oliveDeep}10` : colors.surfaceAlt,
                    borderWidth: role === 'seller' ? 2 : 1,
                    borderColor: role === 'seller' ? colors.oliveDeep : colors.rule,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Svg width={22} height={22} fill="none" stroke={role === 'seller' ? colors.oliveDeep : colors.muted} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <Rect x={2} y={4} width={18} height={14} rx={2} />
                    <Path d="M8 4V2h6v2" />
                    <Path d="M2 10h18" />
                  </Svg>
                  <View>
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, fontWeight: role === 'seller' ? '600' : '500', color: colors.ink }}>
                      {isRu ? 'Продавец' : 'Sotuvchi'}
                    </RNText>
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 10, color: colors.muted }}>
                      {isRu ? 'Продажа' : 'Sotish'}
                    </RNText>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Terms */}
          <Pressable
            onPress={() => setTermsAccepted(!termsAccepted)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 28 }}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                backgroundColor: termsAccepted ? colors.oliveDeep : 'transparent',
                borderWidth: termsAccepted ? 0 : 1.5,
                borderColor: colors.rule,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 1,
              }}
            >
              {termsAccepted && (
                <Svg width={12} height={12} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
                  <Polyline points="2,6 5,9 10,3" />
                </Svg>
              )}
            </View>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, lineHeight: 17, flex: 1 }}>
              {isRu ? 'Я согласен с ' : ''}
              <RNText
                onPress={() => router.push('/terms')}
                style={{ textDecorationLine: 'underline', color: colors.olive }}
              >
                {isRu ? 'Условиями использования' : 'Foydalanish shartlari'}
              </RNText>
              {isRu ? ' и ' : ' va '}
              <RNText
                onPress={() => router.push('/privacy')}
                style={{ textDecorationLine: 'underline', color: colors.olive }}
              >
                {isRu ? 'Политикой конфиденциальности' : 'Maxfiylik siyosati'}
              </RNText>
              {isRu ? '' : 'ga roziman'}
            </RNText>
          </Pressable>

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
              {isRu ? 'Зарегистрироваться' : "Ro'yxatdan o'tish"}
            </RNText>
            <Svg width={16} height={16} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
              <Path d="M6 3 L12 8 L6 13" />
            </Svg>
          </Pressable>

          {/* Spacer + Login link */}
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={{
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 8,
              marginTop: 24,
            }}
          >
            <Text variant="bodySmall" color="muted">
              {isRu ? 'Уже есть аккаунт?' : 'Akkauntingiz bormi?'}
            </Text>
            <Text variant="bodySmall" color="gold" style={{ fontWeight: '600' }}>
              {isRu ? 'Войти' : 'Kirish'}
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
