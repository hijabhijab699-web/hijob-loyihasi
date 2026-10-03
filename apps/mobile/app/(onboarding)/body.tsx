import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View, Text as RNText } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

type BodyType = 'slim' | 'medium' | 'full';

export default function BodyParamsScreen() {
  const { colors, theme, scheme } = useTheme();
  const router = useRouter();
  const refreshMe = useAuth((s) => s.refreshMe);

  const [heightCm, setHeightCm] = useState('168');
  const [weightKg, setWeightKg] = useState('62');
  const [bodyType, setBodyType] = useState<BodyType>('medium');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      await api.put('/onboarding/body', {
        heightCm: parseInt(heightCm) || 168,
        weightKg: parseInt(weightKg) || 62,
        bodyType,
      });
      await refreshMe();
      router.push('/(onboarding)/face');
    } catch (e: any) {
      Alert.alert('Xatolik', e?.response?.data?.message ?? 'Tarmoq xatosi');
    } finally {
      setSaving(false);
    }
  };

  const skip = () => {
    router.push('/(onboarding)/face');
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
              2 / 3
            </RNText>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.oliveDeep }} />
              <View style={{ width: 20, height: 3, borderRadius: 2, backgroundColor: colors.rule }} />
            </View>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24, flexGrow: 1 }}
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
              marginBottom: 6,
            }}
          >
            O'lchovlaringiz
          </RNText>
          <RNText
            style={{
              fontFamily: theme.fontFamilies.body,
              fontSize: 14,
              color: colors.muted,
              lineHeight: 20,
              marginBottom: 28,
            }}
          >
            Virtual primerka uchun tana o'lchovlarini kiriting
          </RNText>

          {/* Body Illustration */}
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <View style={{ width: 160, height: 200, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={100} height={180} fill="none" strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={50} cy={22} r={16} stroke={colors.olive} strokeWidth={1.5} />
                <Path d="M50 38v50" stroke={colors.olive} strokeWidth={1.5} />
                <Path d="M50 48l-28 30" stroke={colors.olive} strokeWidth={1.5} />
                <Path d="M50 48l28 30" stroke={colors.olive} strokeWidth={1.5} />
                <Path d="M50 88l-20 50" stroke={colors.olive} strokeWidth={1.5} />
                <Path d="M50 88l20 50" stroke={colors.olive} strokeWidth={1.5} />
                <Path d="M5 6v168" stroke={colors.gold} strokeWidth={1.5} strokeDasharray="4 4" />
                <Path d="M2 6h6M2 174h6" stroke={colors.gold} strokeWidth={1.5} />
              </Svg>
              <RNText
                style={{
                  position: 'absolute',
                  left: -4,
                  top: '45%',
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 10,
                  color: colors.gold,
                  fontWeight: '500',
                  letterSpacing: 0.5,
                  transform: [{ rotate: '-90deg' }],
                }}
              >
                Bo'y
              </RNText>
            </View>
          </View>

          {/* Measurements Card */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 18,
              borderWidth: 1,
              borderColor: colors.rule,
              gap: 16,
              marginBottom: 20,
            }}
          >
            {/* Height & Weight Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                  Bo'y (sm)
                </RNText>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: colors.rule,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <TextInput
                    value={heightCm}
                    onChangeText={(t) => setHeightCm(t.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={{
                      flex: 1,
                      fontFamily: theme.fontFamilies.body,
                      fontSize: 16,
                      fontWeight: '500',
                      color: colors.ink,
                      padding: 0,
                    }}
                  />
                  <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.oliveSoft }}>sm</RNText>
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 6 }}>
                  Vazn (kg)
                </RNText>
                <View
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    backgroundColor: colors.surfaceAlt,
                    borderWidth: 1,
                    borderColor: colors.rule,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <TextInput
                    value={weightKg}
                    onChangeText={(t) => setWeightKg(t.replace(/\D/g, '').slice(0, 3))}
                    keyboardType="number-pad"
                    maxLength={3}
                    style={{
                      flex: 1,
                      fontFamily: theme.fontFamilies.body,
                      fontSize: 16,
                      fontWeight: '500',
                      color: colors.ink,
                      padding: 0,
                    }}
                  />
                  <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.oliveSoft }}>kg</RNText>
                </View>
              </View>
            </View>

            {/* Body Type */}
            <View>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 12, color: colors.muted, fontWeight: '500', marginBottom: 10 }}>
                Tana turi
              </RNText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Nozik */}
                <Pressable
                  onPress={() => setBodyType('slim')}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 8,
                    backgroundColor: bodyType === 'slim' ? `${colors.oliveDeep}10` : colors.surfaceAlt,
                    borderWidth: bodyType === 'slim' ? 2 : 1,
                    borderColor: bodyType === 'slim' ? colors.oliveDeep : colors.rule,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Svg width={28} height={40} fill="none" stroke={bodyType === 'slim' ? colors.oliveDeep : colors.muted} strokeWidth={1.2} strokeLinecap="round" style={{ marginBottom: 6 }}>
                    <Ellipse cx={14} cy={8} rx={6} ry={7} />
                    <Path d="M8 15c-2 4-3 12-3 16h18c0-4-1-12-3-16" />
                  </Svg>
                  <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, fontWeight: bodyType === 'slim' ? '600' : '400', color: bodyType === 'slim' ? colors.oliveDeep : colors.muted }}>
                    Nozik
                  </RNText>
                </Pressable>

                {/* O'rtacha */}
                <Pressable
                  onPress={() => setBodyType('medium')}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 8,
                    backgroundColor: bodyType === 'medium' ? `${colors.oliveDeep}10` : colors.surfaceAlt,
                    borderWidth: bodyType === 'medium' ? 2 : 1,
                    borderColor: bodyType === 'medium' ? colors.oliveDeep : colors.rule,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Svg width={28} height={40} fill="none" stroke={bodyType === 'medium' ? colors.oliveDeep : colors.muted} strokeWidth={1.2} strokeLinecap="round" style={{ marginBottom: 6 }}>
                    <Ellipse cx={14} cy={8} rx={7} ry={7} />
                    <Path d="M6 15c-1 5-1 12 0 16h16c1-4 1-11 0-16" />
                  </Svg>
                  <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, fontWeight: bodyType === 'medium' ? '600' : '400', color: bodyType === 'medium' ? colors.oliveDeep : colors.muted }}>
                    O'rtacha
                  </RNText>
                </Pressable>

                {/* To'la */}
                <Pressable
                  onPress={() => setBodyType('full')}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    paddingHorizontal: 8,
                    backgroundColor: bodyType === 'full' ? `${colors.oliveDeep}10` : colors.surfaceAlt,
                    borderWidth: bodyType === 'full' ? 2 : 1,
                    borderColor: bodyType === 'full' ? colors.oliveDeep : colors.rule,
                    borderRadius: 12,
                    alignItems: 'center',
                  }}
                >
                  <Svg width={28} height={40} fill="none" stroke={bodyType === 'full' ? colors.oliveDeep : colors.muted} strokeWidth={1.2} strokeLinecap="round" style={{ marginBottom: 6 }}>
                    <Ellipse cx={14} cy={8} rx={8} ry={7} />
                    <Path d="M4 15c-1 5 0 12 1 16h18c1-4 2-11 1-16" />
                  </Svg>
                  <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, fontWeight: bodyType === 'full' ? '600' : '400', color: bodyType === 'full' ? colors.oliveDeep : colors.muted }}>
                    To'la
                  </RNText>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Privacy Note */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 24, paddingHorizontal: 4 }}>
            <Svg width={16} height={16} fill="none" stroke={colors.olive} strokeWidth={1.5} strokeLinecap="round" style={{ marginTop: 1, flexShrink: 0 }}>
              <Rect x={2} y={8} width={12} height={7} rx={2} />
              <Path d="M5 8V5a3 3 0 016 0v3" />
            </Svg>
            <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 11, color: colors.muted, lineHeight: 16, flex: 1 }}>
              Ma'lumotlaringiz faqat virtual primerka uchun ishlatiladi va uchinchi tomonlarga berilmaydi
            </RNText>
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Actions */}
          <View style={{ gap: 12 }}>
            <Pressable
              onPress={submit}
              disabled={saving}
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
              <RNText
                style={{
                  fontFamily: theme.fontFamilies.body,
                  fontSize: 15,
                  fontWeight: '600',
                  color: colors.goldSoft,
                }}
              >
                Keyingi
              </RNText>
              <Svg width={16} height={16} fill="none" stroke={colors.goldSoft} strokeWidth={2} strokeLinecap="round">
                <Path d="M6 3 L12 8 L6 13" />
              </Svg>
            </Pressable>

            <Pressable onPress={skip} style={{ alignItems: 'center', paddingVertical: 8 }}>
              <RNText style={{ fontFamily: theme.fontFamilies.body, fontSize: 13, color: colors.muted, fontWeight: '500' }}>
                O'tkazib yuborish
              </RNText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
