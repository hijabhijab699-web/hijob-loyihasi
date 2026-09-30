import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Rect } from 'react-native-svg';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { Logo } from '../../src/components/Logo';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import { useAuth } from '../../src/store/auth';

type CaptureStep = 'front' | 'left' | 'right';

const STEPS: CaptureStep[] = ['front', 'left', 'right'];

export default function FaceCaptureScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [step, setStep] = useState(0);
  const [captured, setCaptured] = useState<Array<{ step: CaptureStep; uri: string }>>([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  const currentStep = STEPS[step]!;

  const refreshMe = useAuth((s) => s.refreshMe);

  const uploadTemplate = async (shots: Array<{ step: CaptureStep; uri: string }>) => {
    const form = new FormData();
    for (const shot of shots) {
      // React Native FormData supports the {uri, name, type} shape natively.
      form.append(shot.step, {
        uri: shot.uri,
        name: `${shot.step}.jpg`,
        type: 'image/jpeg',
      } as unknown as Blob);
    }
    const { data } = await api.post('/onboarding/face/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60_000,
    });
    return data as { status: string; warnings: string[] };
  };

  const takeShot = async () => {
    if (!cameraRef.current) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        skipProcessing: false,
      });
      if (!photo?.uri) return;

      const next = [...captured, { step: currentStep, uri: photo.uri }];
      setCaptured(next);

      if (step < 2) {
        setStep(step + 1);
      } else {
        try {
          const result = await uploadTemplate(next);
          if (result.warnings.length) {
            console.warn('face template warnings:', result.warnings);
          }
          await refreshMe();
          router.replace('/(onboarding)/body');
        } catch (e: any) {
          const msg =
            e?.response?.data?.message ??
            e?.response?.data?.detail ??
            e?.message ??
            'Upload failed';
          Alert.alert(t('common.error'), String(msg));
          setStep(0);
          setCaptured([]);
        }
      }
    } catch (e) {
      Alert.alert(t('common.error'), String(e));
    } finally {
      setProcessing(false);
    }
  };

  if (!permission) return null;
  if (!permission.granted) {
    return (
      <Screen gradient>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <Ionicons name="camera-outline" size={48} color={colors.oliveDark} />
          <Text variant="titleMedium" color="ink" style={{ marginTop: 12, textAlign: 'center' }}>
            {t('onboarding.face.title')}
          </Text>
          <Text variant="bodySmall" color="muted" style={{ marginTop: 8, textAlign: 'center' }}>
            {t('onboarding.face.safeDesc')}
          </Text>
          <View style={{ marginTop: 24, width: '100%' }}>
            <Button label={t('common.continue')} variant="gold" onPress={requestPermission} />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          top: 60,
          left: 0,
          right: 0,
          zIndex: 5,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={28} color={colors.ink} />
        </Pressable>
        <Logo size={70} label={false} />
        <View style={{ width: 28 }} />
      </View>

      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="front"
      />

      {/* Face overlay */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={260} height={340} viewBox="0 0 260 340">
          <Circle cx={130} cy={170} r={125} stroke={colors.success} strokeWidth={4} fill="none" strokeDasharray="6 4" />
          {/* Corner brackets */}
          <Rect x={10} y={10} width={40} height={4} fill={colors.surface} />
          <Rect x={10} y={10} width={4} height={40} fill={colors.surface} />
          <Rect x={210} y={10} width={40} height={4} fill={colors.surface} />
          <Rect x={246} y={10} width={4} height={40} fill={colors.surface} />
          <Rect x={10} y={296} width={4} height={34} fill={colors.surface} />
          <Rect x={10} y={326} width={40} height={4} fill={colors.surface} />
          <Rect x={210} y={326} width={40} height={4} fill={colors.surface} />
          <Rect x={246} y={296} width={4} height={34} fill={colors.surface} />
        </Svg>

        <View style={{ marginTop: 20, alignItems: 'center' }}>
          <Text
            variant="displayLarge"
            color="oliveDeep"
            style={{ textAlign: 'center', textShadowColor: 'rgba(255,255,255,0.8)', textShadowRadius: 6 }}
          >
            {t('onboarding.face.title')}
          </Text>
          <Text variant="bodySmall" color="oliveDark" style={{ marginTop: 8 }}>
            {t(`onboarding.face.${currentStep}`)}
          </Text>
          <Text variant="caption" color="muted" style={{ marginTop: 8 }}>
            {t('onboarding.face.step', { step: step + 1, total: 3 })}
          </Text>
        </View>
      </View>

      {/* Privacy card */}
      <View
        style={{
          position: 'absolute',
          bottom: 140,
          left: 16,
          right: 16,
          backgroundColor: colors.surface,
          borderRadius: theme.radii.xl,
          padding: 20,
          flexDirection: 'row',
          gap: 12,
          borderWidth: 1,
          borderColor: colors.rule,
        }}
      >
        <PrivacyBadge icon="shield-checkmark-outline" title={t('onboarding.face.safe')} desc={t('onboarding.face.safeDesc')} />
        <PrivacyBadge icon="lock-closed-outline" title={t('onboarding.face.onlyApp')} desc={t('onboarding.face.onlyAppDesc')} />
        <PrivacyBadge icon="eye-off-outline" title={t('onboarding.face.private')} desc={t('onboarding.face.privateDesc')} />
      </View>

      {/* Capture button */}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          left: 20,
          right: 20,
        }}
      >
        <Button
          label={t('common.continue')}
          variant="primary"
          loading={processing}
          onPress={takeShot}
          iconRight={<Ionicons name="arrow-forward" size={20} color={colors.surface} />}
        />
      </View>
    </View>
  );
}

function PrivacyBadge({
  icon,
  title,
  desc,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  desc: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={22} color={colors.oliveDark} />
      <Text variant="caption" color="ink" style={{ textAlign: 'center', fontWeight: '600' }}>
        {title}
      </Text>
      <Text variant="caption" color="muted" style={{ textAlign: 'center', fontSize: 10 }}>
        {desc}
      </Text>
    </View>
  );
}
