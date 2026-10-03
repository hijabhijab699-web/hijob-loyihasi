import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, TextInput, View, Text as RNText } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

export default function OtpScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const loginSuccess = useAuth((s) => s.loginSuccess);

  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const inputs = useRef<Array<TextInput | null>>([]);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(45);

  useEffect(() => {
    const t = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const maskPhone = (p: string) => {
    if (!p) return '+998 ** *** ** **';
    const clean = p.replace(/\D/g, '');
    if (clean.length < 12) return p;
    const code = clean.slice(3, 5);
    const last2 = clean.slice(10, 12);
    return `+998 ${code} *** ** ${last2}`;
  };

  const handleChange = (idx: number, value: string) => {
    const next = [...digits];
    next[idx] = value.replace(/\D/g, '').slice(-1);
    setDigits(next);
    if (value && idx < 3) inputs.current[idx + 1]?.focus();
    if (idx === 3 && next.every((d) => d)) verify(next.join(''));
  };

  const handleKeyPress = (idx: number, key: string) => {
    if (key === 'Backspace' && !digits[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  const verify = async (code: string) => {
    try {
      setLoading(true);
      const { data } = await api.post('/auth/verify-otp', { phone, code });
      await loginSuccess(data.user, data.tokens);
      router.replace('/');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.response?.data?.message ?? 'Noto\'g\'ri kod');
      setDigits(['', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timerText = `${minutes}:${secs.toString().padStart(2, '0')}`;

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
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 32, alignItems: 'center' }}>
          {/* Lock Icon */}
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: `${colors.oliveDeep}10`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <Svg width={28} height={28} fill="none" stroke={colors.oliveDeep} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <Rect x={5} y={12} width={18} height={14} rx={3} />
              <Path d="M9 12V8a5 5 0 0110 0v4" />
              <Circle cx={14} cy={19} r={1.5} fill={colors.oliveDeep} />
            </Svg>
          </View>

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
            Tasdiqlash kodi
          </RNText>

          {/* Subtitle */}
          <RNText
            style={{
              fontFamily: theme.fontFamilies.body,
              fontSize: 14,
              color: colors.muted,
              lineHeight: 20,
              textAlign: 'center',
              marginBottom: 40,
            }}
          >
            SMS kod yuborildi:{'\n'}
            <RNText style={{ color: colors.ink, fontWeight: '500' }}>
              {maskPhone(phone ?? '')}
            </RNText>
          </RNText>

          {/* OTP Inputs */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
            {digits.map((d, i) => (
              <View
                key={i}
                style={{
                  width: 56,
                  height: 64,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  borderWidth: d ? 2 : 1,
                  borderColor: d ? colors.oliveDeep : colors.rule,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  ref={(r) => { inputs.current[i] = r; }}
                  value={d}
                  onChangeText={(v) => handleChange(i, v)}
                  onKeyPress={(e) => handleKeyPress(i, e.nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  style={{
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    fontFamily: theme.fontFamilies.display,
                    fontSize: 28,
                    fontWeight: '700',
                    color: colors.oliveDeep,
                  }}
                />
              </View>
            ))}
          </View>

          {/* Timer */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 40 }}>
            <Svg width={16} height={16} fill="none" stroke={colors.muted} strokeWidth={1.5} strokeLinecap="round">
              <Circle cx={8} cy={8} r={6} />
              <Path d="M8 5v3l2 2" />
            </Svg>
            <Pressable
              disabled={secondsLeft > 0}
              onPress={() => setSecondsLeft(45)}
              style={{ opacity: secondsLeft > 0 ? 1 : 1 }}
            >
              <RNText style={{ flexDirection: 'row' }}>
                <RNText
                  style={{
                    fontFamily: theme.fontFamilies.body,
                    fontSize: 13,
                    color: colors.muted,
                  }}
                >
                  Qayta yuborish{' '}
                </RNText>
                {secondsLeft > 0 ? (
                  <RNText
                    style={{
                      fontFamily: theme.fontFamilies.body,
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.oliveDeep,
                    }}
                  >
                    {timerText}
                  </RNText>
                ) : (
                  <RNText
                    style={{
                      fontFamily: theme.fontFamilies.body,
                      fontSize: 13,
                      fontWeight: '600',
                      color: colors.gold,
                    }}
                  >
                    Yuborish
                  </RNText>
                )}
              </RNText>
            </Pressable>
          </View>

          {/* Submit Button */}
          <Pressable
            onPress={() => {
              const code = digits.join('');
              if (code.length === 4) verify(code);
            }}
            disabled={loading || digits.some((d) => !d)}
            style={{
              width: '100%',
              paddingVertical: 16,
              backgroundColor: colors.oliveDeep,
              borderRadius: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: digits.every((d) => d) ? 1 : 0.5,
            }}
          >
            <Svg width={18} height={18} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
              <Path d="M4 9 L8 13 L14 5" />
            </Svg>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 15,
                fontWeight: '600',
                color: colors.goldSoft,
              }}
            >
              Tasdiqlash
            </RNText>
          </Pressable>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Help */}
          <View style={{ alignItems: 'center', paddingBottom: 16 }}>
            <RNText
              style={{
                fontFamily: theme.fontFamilies.body,
                fontSize: 12,
                color: colors.muted,
              }}
            >
              SMS kelmadimi?{' '}
              <RNText style={{ fontWeight: '500', color: colors.gold }}>
                Yordam
              </RNText>
            </RNText>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
