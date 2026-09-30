import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { Input, PasswordInput } from '../../src/components/Input';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { setLanguage } from '../../src/i18n/i18n';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

type Role = 'buyer' | 'seller';

export default function RegisterScreen() {
  const { t, i18n } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const loginSuccess = useAuth((s) => s.loginSuccess);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('+998');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('buyer');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (password !== confirmPassword) {
      Alert.alert('', t('auth.register.password') + ' ≠ ' + t('auth.register.passwordConfirm'));
      return;
    }
    try {
      setLoading(true);
      const { data } = await api.post('/auth/register', {
        fullName,
        username: username.replace(/^@/, ''),
        phone,
        password,
        role,
        language: i18n.language,
      });
      // MVP: skip OTP, log in directly.
      await loginSuccess(data.user, data.tokens);
      router.replace('/');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.message ?? 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguage = () => {
    const next = i18n.language === 'ru' ? 'uz' : 'ru';
    setLanguage(next);
  };

  return (
    <Screen gradient>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language toggle */}
        <View style={{ alignItems: 'flex-end', paddingTop: 8 }}>
          <Pressable
            onPress={toggleLanguage}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: theme.radii.pill,
              backgroundColor: colors.surfaceGlass,
              borderWidth: 1,
              borderColor: colors.rule,
            }}
          >
            <Ionicons name="globe-outline" size={18} color={colors.oliveDeep} />
            <Text variant="bodySmall" color="oliveDeep">
              {i18n.language === 'ru' ? t('language.russian') : t('language.uzbek')}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.oliveDeep} />
          </Pressable>
        </View>

        {/* Header */}
        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 24 }}>
          <Logo size={110} label />
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{ marginTop: 16, textAlign: 'center' }}
          >
            {t('auth.register.title')}
          </Text>
          <Text
            variant="bodySmall"
            color="muted"
            style={{ marginTop: 8, textAlign: 'center', paddingHorizontal: 20 }}
          >
            {t('auth.register.subtitle')}
          </Text>
        </View>

        {/* Form */}
        <View style={{ gap: 12 }}>
          <Input
            placeholder={t('auth.register.name')}
            value={fullName}
            onChangeText={setFullName}
            icon={<Ionicons name="person-outline" size={20} color={colors.muted} />}
            autoCapitalize="words"
          />

          <Input
            placeholder={t('auth.register.usernamePlaceholder')}
            value={username}
            onChangeText={setUsername}
            icon={<Ionicons name="at-outline" size={20} color={colors.muted} />}
            autoCapitalize="none"
            hint={t('auth.register.usernameHint')}
          />

          <Input
            placeholder={t('auth.register.phone')}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            icon={<Ionicons name="call-outline" size={20} color={colors.muted} />}
          />

          {/* Role picker */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surfaceGlass,
              borderRadius: theme.radii.pill,
              borderWidth: 1,
              borderColor: colors.rule,
              padding: 6,
              alignItems: 'center',
              gap: 6,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12 }}>
              <Ionicons name="people-outline" size={18} color={colors.muted} />
              <Text variant="caption" color="muted">
                {t('auth.register.roleQuestion')}
              </Text>
            </View>
            <RoleChip
              label={t('auth.register.roleBuyer')}
              icon="cart-outline"
              active={role === 'buyer'}
              onPress={() => setRole('buyer')}
            />
            <RoleChip
              label={t('auth.register.roleSeller')}
              icon="storefront-outline"
              active={role === 'seller'}
              onPress={() => setRole('seller')}
            />
          </View>

          <PasswordInput
            placeholder={t('auth.register.password')}
            value={password}
            onChangeText={setPassword}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
          />

          <PasswordInput
            placeholder={t('auth.register.passwordConfirm')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <Button
            label={t('auth.register.submit')}
            variant="gold"
            onPress={submit}
            loading={loading}
            iconRight={<Ionicons name="arrow-forward" size={20} color={colors.ink} />}
          />
        </View>

        {/* Divider */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.rule }} />
          <Text variant="caption" color="muted">
            {t('auth.register.or')}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.rule }} />
        </View>

        {/* Social */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <SocialButton label="Google" icon="logo-google" />
          <SocialButton label="Apple" icon="logo-apple" />
          <SocialButton label="Facebook" icon="logo-facebook" />
        </View>

        {/* Terms */}
        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>
            {t('auth.register.terms')}{'\n'}
            <Text variant="caption" color="oliveDeep" style={{ textDecorationLine: 'underline' }}>
              {t('auth.register.termsLink')}
            </Text>
            {' '}
            {t('auth.register.termsAnd')}
            {' '}
            <Text variant="caption" color="oliveDeep" style={{ textDecorationLine: 'underline' }}>
              {t('auth.register.privacyLink')}
            </Text>
          </Text>
        </View>

        {/* Have account */}
        <Pressable
          onPress={() => router.push('/(auth)/login')}
          style={{ marginTop: 24, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          <Text variant="bodySmall" color="muted">
            {t('auth.register.haveAccount')}
          </Text>
          <Text variant="bodySmall" color="oliveDeep" style={{ fontWeight: '600' }}>
            {t('auth.register.login')}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function RoleChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  active: boolean;
  onPress: () => void;
}) {
  const { colors, theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        height: 40,
        borderRadius: theme.radii.pill,
        backgroundColor: active ? colors.goldSoft : 'transparent',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={16} color={active ? colors.ink : colors.muted} />
      <Text variant="bodySmall" color={active ? 'ink' : 'muted'}>
        {label}
      </Text>
    </Pressable>
  );
}

function SocialButton({
  label,
  icon,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}) {
  const { colors, theme } = useTheme();
  return (
    <Pressable
      style={{
        flex: 1,
        height: 48,
        borderRadius: theme.radii.pill,
        backgroundColor: colors.surfaceGlass,
        borderWidth: 1,
        borderColor: colors.rule,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      <Ionicons name={icon} size={18} color={colors.ink} />
      <Text variant="bodySmall" color="ink">
        {label}
      </Text>
    </Pressable>
  );
}
