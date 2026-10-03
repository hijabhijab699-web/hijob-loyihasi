import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View, Text as RNText } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Polyline, Rect } from 'react-native-svg';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

type Role = 'buyer' | 'seller';

export default function RegisterScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const loginSuccess = useAuth((s) => s.loginSuccess);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [loading, setLoading] = useState(false);

  const canSubmit = fullName.trim().length > 0 && username.trim().length > 0 && termsAccepted;

  const submit = async () => {
    if (!canSubmit) return;
    try {
      setLoading(true);
      const { data } = await api.post('/auth/register', {
        fullName: fullName.trim(),
        username: username.trim().replace(/^@/, ''),
        email: email.trim() || undefined,
        phone,
        role,
      });
      await loginSuccess(data.user, data.tokens);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.response?.data?.message ?? 'Tarmoq xatosi');
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
            Ro'yxatdan o'tish
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
            Shaxsiy ma'lumotlaringizni kiriting
          </RNText>

          {/* Form */}
          <View style={{ gap: 18, marginBottom: 28 }}>
            {/* Full Name */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                Ism va familiya
              </RNText>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Umidjon Gafforov"
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
                Foydalanuvchi nomi
              </RNText>
              <View style={{ position: 'relative', justifyContent: 'center' }}>
                <TextInput
                  value={username}
                  onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9._]/g, '').toLowerCase())}
                  placeholder="umidjon"
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

            {/* Email */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                Email{' '}
                <RNText style={{ color: colors.oliveSoft }}>(ixtiyoriy)</RNText>
              </RNText>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="email@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
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

            {/* Role Selector */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 8 }}>
                Siz kimsiz?
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
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, fontWeight: '600', color: colors.ink }}>Xaridor</RNText>
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 10, color: colors.muted }}>Xarid qilish</RNText>
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
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, fontWeight: role === 'seller' ? '600' : '500', color: colors.ink }}>Sotuvchi</RNText>
                    <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 10, color: colors.muted }}>Sotish</RNText>
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
              <RNText style={{ textDecorationLine: 'underline', color: colors.olive }}>Foydalanish shartlari</RNText>
              {' '}va{' '}
              <RNText style={{ textDecorationLine: 'underline', color: colors.olive }}>Maxfiylik siyosati</RNText>
              ga roziman
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
              Davom etish
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
              Akkauntingiz bormi?
            </Text>
            <Text variant="bodySmall" color="gold" style={{ fontWeight: '600' }}>
              Kirish
            </Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
