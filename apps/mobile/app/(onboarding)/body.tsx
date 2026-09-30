import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

type Size = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function BodyParamsScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const refreshMe = useAuth((s) => s.refreshMe);

  const [heightCm, setHeightCm] = useState(170);
  const [weightKg, setWeightKg] = useState(65);
  const [age, setAge] = useState(28);
  const [preferredSize, setPreferredSize] = useState<Size>('M');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    try {
      setSaving(true);
      await api.put('/onboarding/body', { heightCm, weightKg, age, preferredSize });
      await refreshMe();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.response?.data?.message ?? 'Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen gradient>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 8 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={26} color={colors.ink} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Logo size={72} label={false} />
          </View>
          <View style={{ width: 26 }} />
        </View>

        <View style={{ marginTop: 20 }}>
          <Text variant="displayLarge" color="oliveDeep" style={{ maxWidth: 260 }}>
            {t('onboarding.body.title')}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ marginTop: 10, maxWidth: 280 }}>
            {t('onboarding.body.subtitle')}
          </Text>
        </View>

        <View style={{ marginTop: 24, gap: 16 }}>
          <ParamSlider
            icon="body-outline"
            label={t('onboarding.body.height')}
            unit={t('onboarding.body.heightUnit')}
            min={140}
            max={200}
            step={1}
            value={heightCm}
            onChange={setHeightCm}
          />
          <ParamSlider
            icon="fitness-outline"
            label={t('onboarding.body.weight')}
            unit={t('onboarding.body.weightUnit')}
            min={40}
            max={120}
            step={1}
            value={weightKg}
            onChange={setWeightKg}
          />
          <ParamSlider
            icon="calendar-outline"
            label={t('onboarding.body.age')}
            unit={t('onboarding.body.ageUnit')}
            min={16}
            max={80}
            step={1}
            value={age}
            onChange={setAge}
          />

          {/* Size picker */}
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: theme.radii.xl,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.rule,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name="shirt-outline" size={22} color={colors.oliveDark} />
              <Text variant="titleSmall" color="ink" style={{ flex: 1 }}>
                {t('onboarding.body.preferredSize')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              {SIZES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setPreferredSize(s)}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: theme.radii.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: s === preferredSize ? colors.oliveDeep : 'transparent',
                    borderWidth: 1,
                    borderColor: s === preferredSize ? colors.oliveDeep : colors.rule,
                  }}
                >
                  <Text
                    variant="button"
                    color={s === preferredSize ? 'surface' : 'ink'}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <Button
            label={t('common.continue')}
            variant="primary"
            loading={saving}
            onPress={submit}
            iconRight={<Ionicons name="arrow-forward" size={20} color={colors.surface} />}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ParamSlider({
  icon,
  label,
  unit,
  min,
  max,
  value,
  step = 1,
  onChange,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  unit: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const { colors, theme } = useTheme();
  const percent = ((value - min) / (max - min)) * 100;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: theme.radii.xl,
        padding: 20,
        borderWidth: 1,
        borderColor: colors.rule,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name={icon} size={22} color={colors.oliveDark} />
        <Text variant="titleSmall" color="ink" style={{ flex: 1 }}>
          {label}
        </Text>
        <Text variant="caption" color="muted">
          {unit}
        </Text>
      </View>

      {/* Value bubble */}
      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderRadius: theme.radii.md,
            backgroundColor: colors.goldSoft,
          }}
        >
          <Text variant="titleMedium" color="ink">
            {value}
          </Text>
        </View>
      </View>

      {/* Track */}
      <View style={{ marginTop: 12, height: 6, borderRadius: 3, backgroundColor: colors.rule, position: 'relative' }}>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent}%`,
            borderRadius: 3,
            backgroundColor: colors.gold,
          }}
        />
      </View>

      {/* Buttons — MVP: simple +/- (later replaced with real slider) */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - step))}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.surfaceGlass,
            borderWidth: 1, borderColor: colors.rule,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="remove" size={20} color={colors.ink} />
        </Pressable>
        <Text variant="caption" color="muted">{min}—{max}</Text>
        <Pressable
          onPress={() => onChange(Math.min(max, value + step))}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.surfaceGlass,
            borderWidth: 1, borderColor: colors.rule,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color={colors.ink} />
        </Pressable>
      </View>
    </View>
  );
}
