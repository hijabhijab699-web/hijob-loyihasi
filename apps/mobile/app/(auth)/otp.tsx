import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

export default function OtpScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const loginSuccess = useAuth((s) => s.loginSuccess);

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  // MVP dev mode: auto-verify immediately.
  useEffect(() => {
    if (phone) verify('0000');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  const handleChange = (idx: number, value: string) => {
    const next = [...digits];
    next[idx] = value.replace(/\D/g, '').slice(-1);
    setDigits(next);
    if (value && idx < 3) inputs.current[idx + 1]?.focus();
    if (idx === 3 && next.every((d) => d)) verify(next.join(''));
  };

  const verify = async (code: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/verify-otp', { phone, code });
      await loginSuccess(data.user, data.tokens);
      router.replace('/');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.message ?? 'Wrong code');
      setDigits(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen gradient>
      <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Logo size={100} />
          <Text variant="displayLarge" color="oliveDeep" style={{ marginTop: 16 }}>
            {t('auth.otp.title')}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ marginTop: 6 }}>
            {t('auth.otp.subtitle')} {phone}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={(r) => {
                inputs.current[i] = r;
              }}
              value={d}
              onChangeText={(v) => handleChange(i, v)}
              keyboardType="number-pad"
              maxLength={1}
              style={{
                width: 60,
                height: 68,
                borderRadius: theme.radii.lg,
                backgroundColor: colors.surfaceGlass,
                borderWidth: 1,
                borderColor: d ? colors.gold : colors.rule,
                textAlign: 'center',
                fontSize: 28,
                fontFamily: theme.fontFamilies.display,
                color: colors.ink,
              }}
            />
          ))}
        </View>

        {loading && <Text variant="caption" color="muted" style={{ textAlign: 'center' }}>...</Text>}

        <Pressable
          disabled={secondsLeft > 0}
          onPress={() => {
            /* TODO: resend OTP endpoint */
            setSecondsLeft(60);
          }}
          style={{ alignItems: 'center', opacity: secondsLeft > 0 ? 0.4 : 1 }}
        >
          <Text variant="bodySmall" color="oliveDeep">
            {secondsLeft > 0
              ? t('auth.otp.resendIn', { seconds: secondsLeft })
              : t('auth.otp.resend')}
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
