import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { Input, PasswordInput } from '../../src/components/Input';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const loginSuccess = useAuth((s) => s.loginSuccess);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/login', { identifier, password });
      await loginSuccess(data.user, data.tokens);
      router.replace('/');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen gradient>
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 20 }}>
        <View style={{ alignItems: 'center', marginBottom: 8 }}>
          <Logo size={110} label />
          <Text variant="displayLarge" color="oliveDeep" style={{ marginTop: 16 }}>
            {t('auth.login.title')}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ marginTop: 6 }}>
            {t('auth.login.subtitle')}
          </Text>
        </View>

        <Input
          placeholder={t('auth.login.identifier')}
          value={identifier}
          onChangeText={setIdentifier}
          icon={<Ionicons name="person-outline" size={20} color={colors.muted} />}
          autoCapitalize="none"
        />

        <PasswordInput
          placeholder={t('auth.login.password')}
          value={password}
          onChangeText={setPassword}
          icon={<Ionicons name="lock-closed-outline" size={20} color={colors.muted} />}
        />

        <Pressable style={{ alignSelf: 'flex-end' }}>
          <Text variant="caption" color="oliveDeep">
            {t('auth.login.forgotPassword')}
          </Text>
        </Pressable>

        <Button
          label={t('auth.login.submit')}
          variant="gold"
          loading={loading}
          onPress={submit}
          iconRight={<Ionicons name="arrow-forward" size={20} color={colors.ink} />}
        />

        <Pressable
          onPress={() => router.push('/(auth)/register')}
          style={{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
        >
          <Text variant="bodySmall" color="muted">
            {t('auth.login.noAccount')}
          </Text>
          <Text variant="bodySmall" color="oliveDeep" style={{ fontWeight: '600' }}>
            {t('auth.login.signUp')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
