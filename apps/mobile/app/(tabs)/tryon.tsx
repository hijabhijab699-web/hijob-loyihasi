import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, View, ActivityIndicator, Platform } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { isLiveCameraAvailable } from '../../src/components/CameraScarfLive';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

const IS_SIMULATOR =
  Platform.OS === 'ios' && !Constants.isDevice && Constants.executionEnvironment !== 'storeClient';

type TyingStyle = 'classical' | 'loose' | 'double';

const STYLE_LABELS: Record<TyingStyle, string> = {
  classical: 'tryon.styles.classical',
  loose: 'tryon.styles.loose',
  double: 'tryon.styles.double',
};

interface Product {
  id: string;
  title: { ru: string };
  variants: Array<{ id: string; color: string; colorHex: string; images: string[] }>;
}

export default function TryOnScreen() {
  const { t } = useTranslation();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ variantId?: string; productId?: string; capturedUri?: string }>();
  const liveAvailable = isLiveCameraAvailable();

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [tyingStyle, setTyingStyle] = useState<TyingStyle>('classical');
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  // Fetch scarf catalog so the user can swipe between variants right from the try-on screen.
  const { data: catalog } = useQuery({
    queryKey: ['tryon-catalog'],
    queryFn: async () =>
      (
        await api.get('/catalog/products', {
          params: { category: 'scarves', pageSize: 12 },
        })
      ).data,
  });

  const products: Product[] = catalog?.items ?? [];
  const variants = products.flatMap((p) =>
    p.variants.map((v) => ({ ...v, productTitle: p.title.ru })),
  );
  const activeVariant = variants[selectedVariantIdx];

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission, requestPermission]);

  // /tryon/live routes back here with a captured still — run the standard
  // preview pipeline on it so the user lands on a fully composed frame.
  useEffect(() => {
    if (params.capturedUri && params.capturedUri !== selfieUri) {
      setSelfieUri(params.capturedUri);
      runPreview(params.capturedUri);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.capturedUri]);

  const preview = useMutation({
    mutationFn: async (vars: { variantId: string; style: TyingStyle; uri: string }) => {
      const form = new FormData();
      form.append('face', {
        uri: vars.uri,
        name: 'face.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      form.append('variantId', vars.variantId);
      form.append('tyingStyle', vars.style);

      const { data } = await api.post('/tryon/preview', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60_000,
      });
      return data as { resultUrl: string; sessionId: string; latencyMs: number };
    },
    onSuccess: (data) => setResultUrl(data.resultUrl),
    onError: (e: any) => {
      const msg = e?.response?.data?.message ?? e?.message ?? 'Preview failed';
      Alert.alert(t('common.error'), String(msg));
    },
  });

  const runPreview = async (uri: string, style = tyingStyle, variantId?: string) => {
    const vid = variantId ?? activeVariant?.id;
    if (!vid) return;
    preview.mutate({ variantId: vid, style, uri });
  };

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
    if (!photo?.uri) return;
    setSelfieUri(photo.uri);
    runPreview(photo.uri);
  };

  const useDemoPhoto = async () => {
    try {
      const asset = Asset.fromModule(require('../../assets/demo-face.jpg'));
      await asset.downloadAsync();
      const uri = asset.localUri ?? asset.uri;
      setSelfieUri(uri);
      runPreview(uri);
    } catch (e: any) {
      Alert.alert(t('common.error'), e?.message ?? 'Demo photo failed');
    }
  };

  const chooseStyle = (style: TyingStyle) => {
    Haptics.selectionAsync().catch(() => {});
    setTyingStyle(style);
    if (selfieUri) runPreview(selfieUri, style);
  };

  const chooseVariant = (idx: number) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedVariantIdx(idx);
    const vid = variants[idx]?.id;
    if (selfieUri && vid) runPreview(selfieUri, tyingStyle, vid);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ width: 26 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="body-outline" size={22} color={colors.gold} />
          <Text
            variant="labelUppercase"
            color="gold"
            style={{ fontFamily: theme.fontFamilies.display, fontSize: 20, letterSpacing: 3 }}
          >
            {t('tryon.title').toUpperCase()}
          </Text>
        </View>
        <Ionicons name="bag-outline" size={22} color={colors.ink} />
      </View>

      {/* Main preview area */}
      <View style={{ flex: 1, position: 'relative' }}>
        {resultUrl ? (
          // key on resultUrl → the Animated.Image remounts and fades in each new composite.
          <Animated.Image
            key={resultUrl}
            entering={FadeIn.duration(220)}
            source={{ uri: resultUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : permission?.granted ? (
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <Ionicons name="camera-outline" size={48} color={colors.oliveDark} />
            <Text variant="body" color="muted" style={{ marginTop: 12, textAlign: 'center' }}>
              Kamera ruxsati kerak
            </Text>
            <View style={{ marginTop: 20, width: '100%' }}>
              <Button label={t('common.continue')} variant="gold" onPress={requestPermission} />
            </View>
          </View>
        )}

        {/* Loading overlay */}
        {preview.isPending && (
          <View
            style={{
              position: 'absolute',
              inset: 0 as unknown as number,
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator color={colors.goldSoft} size="large" />
            <Text variant="bodySmall" color="surface" style={{ marginTop: 12 }}>
              {t('common.loading')}
            </Text>
          </View>
        )}

        {/* Left: tying styles */}
        {selfieUri && (
          <View style={{ position: 'absolute', top: 16, left: 16, gap: 10 }}>
            <Text variant="caption" color="surface" style={{ maxWidth: 88 }}>
              {t('tryon.tyingStyle')}
            </Text>
            {(['classical', 'loose', 'double'] as TyingStyle[]).map((style) => (
              <Pressable
                key={style}
                onPress={() => chooseStyle(style)}
                style={{
                  width: 84,
                  paddingVertical: 10,
                  borderRadius: theme.radii.md,
                  borderWidth: style === tyingStyle ? 2 : 1,
                  borderColor: style === tyingStyle ? colors.gold : 'rgba(255,255,255,0.4)',
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  alignItems: 'center',
                }}
              >
                <Text variant="caption" color="surface" style={{ fontWeight: '600' }}>
                  {t(STYLE_LABELS[style])}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Right: controls */}
        <View style={{ position: 'absolute', top: 16, right: 16, gap: 10 }}>
          {selfieUri && (
            <ControlPill
              icon="refresh-outline"
              label={t('tryon.reset')}
              onPress={() => {
                setSelfieUri(null);
                setResultUrl(null);
              }}
            />
          )}
          {!selfieUri && liveAvailable && (
            <ControlPill
              icon="videocam-outline"
              label="Live"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                router.push({
                  pathname: '/tryon/live',
                  params: { variantId: activeVariant?.id },
                });
              }}
            />
          )}
          {!selfieUri && !liveAvailable && (
            <ControlPill icon="camera-reverse-outline" label={t('tryon.changeCamera')} onPress={() => {}} />
          )}
        </View>
      </View>

      {/* Bottom sheet: variant swatches + CTA */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: theme.radii['2xl'],
          borderTopRightRadius: theme.radii['2xl'],
          paddingTop: 16,
          paddingBottom: 32,
          gap: 12,
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        >
          {variants.map((v, i) => (
            <Pressable
              key={v.id}
              onPress={() => chooseVariant(i)}
              style={{
                width: 68,
                height: 68,
                borderRadius: theme.radii.md,
                backgroundColor: v.colorHex,
                borderWidth: i === selectedVariantIdx ? 2 : 1,
                borderColor: i === selectedVariantIdx ? colors.gold : colors.rule,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {i === selectedVariantIdx && (
                <Ionicons name="checkmark" size={22} color={colors.surface} />
              )}
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: 20, marginTop: 4 }}>
          {selfieUri ? (
            <Button
              label={t('tryon.addToCart')}
              variant="gold"
              icon={<Ionicons name="bag-add-outline" size={20} color={colors.ink} />}
              onPress={() =>
                activeVariant &&
                api.post('/cart', { variantId: activeVariant.id, quantity: 1 }).then(
                  () => Alert.alert('✓', 'Added to cart'),
                  (e: any) => Alert.alert(t('common.error'), e?.message ?? 'Failed'),
                )
              }
            />
          ) : (
            <View style={{ gap: 8 }}>
              <Button
                label={t('onboarding.face.capture')}
                variant="primary"
                icon={<Ionicons name="camera-outline" size={20} color={colors.surface} />}
                onPress={takeSelfie}
                loading={preview.isPending}
              />
              {IS_SIMULATOR && (
                <Button
                  label="Demo (simulator)"
                  variant="secondary"
                  icon={<Ionicons name="images-outline" size={18} color={colors.oliveDeep} />}
                  onPress={useDemoPhoto}
                  loading={preview.isPending}
                />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

function ControlPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width: 56, alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: 'rgba(0,0,0,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={22} color={colors.surface} />
      </View>
      <Text variant="caption" color="surface" style={{ textAlign: 'center', fontSize: 10 }}>
        {label}
      </Text>
    </Pressable>
  );
}
