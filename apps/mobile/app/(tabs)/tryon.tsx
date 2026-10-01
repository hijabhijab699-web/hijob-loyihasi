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
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';

const IS_SIMULATOR =
  Platform.OS === 'ios' && !Constants.isDevice && Constants.executionEnvironment !== 'storeClient';

type TyingStyle = 'classical' | 'loose' | 'double';

const STYLE_LABELS: Record<TyingStyle, string> = {
  classical: 'Klassik',
  loose: 'Erkin',
  double: 'Ikki qavatli',
};

interface Product {
  id: string;
  title: { ru: string; uz: string };
  variants: Array<{ id: string; color: string; colorHex: string; images: string[] }>;
}

const DARK = '#1B1B14';
const DARK_SURFACE = '#23231B';
const DARK_BORDER = 'rgba(255,255,255,0.08)';
const DARK_BORDER_LIGHT = 'rgba(255,255,255,0.15)';
const DARK_TEXT = '#F0EBDA';
const DARK_MUTED = '#948E7E';

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

      const { data } = await api.post('/tryon/faceswap', form, {
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

  const SWATCH_COLORS = [
    { key: 'red', hex: '#C0504D' },
    { key: 'black', hex: '#2A2820' },
    { key: 'white', hex: '#F0EBDA' },
    { key: 'olive', hex: '#8A8D5B' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: DARK }}>
      {/* Camera Viewfinder Area */}
      <View style={{ flex: 1, position: 'relative' }}>
        {/* Top Controls */}
        <View
          style={{
            position: 'absolute',
            top: 56,
            left: 0,
            right: 0,
            zIndex: 10,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="chevron-back" size={18} color={DARK_TEXT} />
          </Pressable>
          <Text
            variant="displayLarge"
            style={{
              fontFamily: theme.fontFamilies.display,
              fontSize: 18,
              fontWeight: '600',
              color: colors.goldSoft,
            }}
          >
            Primerka
          </Text>
          <Pressable
            hitSlop={12}
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="settings-outline" size={18} color={DARK_TEXT} />
          </Pressable>
        </View>

        {/* Face Detection Pill */}
        <View
          style={{
            position: 'absolute',
            top: 102,
            left: 0,
            right: 0,
            zIndex: 10,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(122,138,91,0.2)',
              borderRadius: 20,
              paddingVertical: 5,
              paddingHorizontal: 12,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                backgroundColor: colors.success,
              }}
            />
            <Text variant="caption" style={{ fontSize: 11, color: colors.success, fontWeight: '500' }}>
              Yuz aniqlandi
            </Text>
          </View>
        </View>

        {/* Camera / Result */}
        {resultUrl ? (
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
            {/* Dashed Oval Viewfinder placeholder */}
            <View
              style={{
                width: 200,
                height: 340,
                borderRadius: 100,
                borderWidth: 2,
                borderStyle: 'dashed',
                borderColor: 'rgba(228,206,154,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
              }}
            >
              <Ionicons name="body-outline" size={48} color="rgba(228,206,154,0.35)" />
              <Text
                variant="bodySmall"
                style={{
                  color: 'rgba(228,206,154,0.4)',
                  textAlign: 'center',
                  maxWidth: 140,
                  lineHeight: 17,
                }}
              >
                Kamerani yuzingizga yo'naltiring
              </Text>
            </View>
          </View>
        )}

        {/* Loading overlay */}
        {preview.isPending && (
          <View
            style={{
              position: 'absolute',
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
            <Text variant="bodySmall" style={{ color: DARK_TEXT, marginTop: 12 }}>
              {t('common.loading')}
            </Text>
          </View>
        )}

        {/* Right controls (reset / live) */}
        {selfieUri && (
          <View style={{ position: 'absolute', top: 110, right: 16, gap: 10, zIndex: 10 }}>
            <Pressable
              onPress={() => {
                setSelfieUri(null);
                setResultUrl(null);
              }}
              style={{ width: 56, alignItems: 'center', gap: 4 }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="refresh-outline" size={20} color={DARK_TEXT} />
              </View>
              <Text variant="caption" style={{ color: DARK_TEXT, textAlign: 'center', fontSize: 10 }}>
                {t('tryon.reset')}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Tying Style Selector (bottom of camera area) */}
        <View
          style={{
            position: 'absolute',
            bottom: 16,
            left: 20,
            right: 20,
            zIndex: 10,
          }}
        >
          <Text
            variant="caption"
            style={{
              color: DARK_MUTED,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            Bog'lash usuli
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['classical', 'loose', 'double'] as TyingStyle[]).map((style) => {
              const active = style === tyingStyle;
              return (
                <Pressable
                  key={style}
                  onPress={() => chooseStyle(style)}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 8,
                    borderRadius: 999,
                    backgroundColor: active ? colors.goldSoft : 'transparent',
                    borderWidth: active ? 0 : 1,
                    borderColor: DARK_BORDER_LIGHT,
                  }}
                >
                  <Text
                    variant="bodySmall"
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: active ? DARK : DARK_MUTED,
                    }}
                  >
                    {STYLE_LABELS[style]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {/* Bottom Panel */}
      <View style={{ backgroundColor: DARK, paddingHorizontal: 20, paddingTop: 16 }}>
        {/* Selected Product Card */}
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
            borderColor: DARK_BORDER,
            borderRadius: 14,
            padding: 12,
            flexDirection: 'row',
            gap: 12,
            marginBottom: 14,
          }}
        >
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 10,
              backgroundColor: colors.gold,
            }}
          />
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text variant="bodySmall" style={{ color: DARK_TEXT, fontWeight: '500', lineHeight: 18 }}>
              Ipak ro'mol Premium
            </Text>
            <Text variant="caption" style={{ color: DARK_MUTED, marginTop: 2, fontSize: 12 }}>
              Qizil · SilkWay
            </Text>
          </View>
          <View style={{ justifyContent: 'center' }}>
            <Text
              variant="displayLarge"
              style={{
                fontFamily: theme.fontFamilies.display,
                fontSize: 18,
                fontWeight: '700',
                color: colors.goldSoft,
              }}
            >
              $45
            </Text>
          </View>
        </View>

        {/* Color Swatches */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, paddingLeft: 2 }}>
          {SWATCH_COLORS.map((c, i) => (
            <Pressable
              key={c.key}
              onPress={() => chooseVariant(i)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                backgroundColor: c.hex,
                borderWidth: 2,
                borderColor: i === selectedVariantIdx ? colors.gold : 'transparent',
              }}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
          <Pressable
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: DARK_BORDER_LIGHT,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="image-outline" size={18} color={DARK_TEXT} />
            <Text variant="body" style={{ fontSize: 14, fontWeight: '500', color: DARK_TEXT }}>
              Saqlash
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              if (!selfieUri) {
                takeSelfie();
              } else if (activeVariant) {
                api.post('/cart', { variantId: activeVariant.id, quantity: 1 }).then(
                  () => Alert.alert('✓', 'Added to cart'),
                  (e: any) => Alert.alert(t('common.error'), e?.message ?? 'Failed'),
                );
              }
            }}
            style={{
              flex: 1,
              height: 48,
              borderRadius: 14,
              backgroundColor: colors.gold,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="bag-outline" size={18} color={DARK} />
            <Text variant="body" style={{ fontSize: 14, fontWeight: '600', color: DARK }}>
              Savatga
            </Text>
          </Pressable>
        </View>

        {/* Carousel Dots */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 6,
          }}
        >
          <View
            style={{ width: 24, height: 4, borderRadius: 999, backgroundColor: colors.goldSoft }}
          />
          <View
            style={{
              width: 8,
              height: 4,
              borderRadius: 999,
              backgroundColor: 'rgba(228,206,154,0.25)',
            }}
          />
          <View
            style={{
              width: 8,
              height: 4,
              borderRadius: 999,
              backgroundColor: 'rgba(228,206,154,0.25)',
            }}
          />
          <View
            style={{
              width: 8,
              height: 4,
              borderRadius: 999,
              backgroundColor: 'rgba(228,206,154,0.25)',
            }}
          />
        </View>

        {IS_SIMULATOR && !selfieUri && (
          <Pressable
            onPress={useDemoPhoto}
            style={{
              height: 40,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: DARK_BORDER_LIGHT,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              marginBottom: 8,
            }}
          >
            <Ionicons name="images-outline" size={16} color={DARK_MUTED} />
            <Text variant="caption" style={{ color: DARK_MUTED, fontWeight: '500' }}>
              Demo (simulator)
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
