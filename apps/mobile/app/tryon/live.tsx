/**
 * Live camera try-on route.
 *
 * Opens the on-device Vision-Camera + Skia overlay. When the user hits the
 * shutter we jump back to the standard /tryon flow with the captured selfie
 * pre-filled, so from there Add-to-Cart, style picker etc. keep working.
 */
import { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';

import { CameraScarfLive } from '../../src/components/CameraScarfLive';
import { Text } from '../../src/components/Text';
import { useTheme } from '../../src/theme/ThemeProvider';
import { api } from '../../src/api/client';
import type { SkiaTyingStyle } from '../../src/components/ScarfSkiaPreview';
import { fabricKindFromAttribute, type FabricKind } from '../../src/lib/fabric-shaders';

interface Variant {
  id: string;
  color: string;
  colorHex: string;
  /** Carried over from the parent product so the shader can pick the right fabric. */
  fabric: FabricKind;
}

export default function LiveTryOnScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const { variantId } = useLocalSearchParams<{ variantId?: string }>();

  const [tyingStyle, setTyingStyle] = useState<SkiaTyingStyle>('classical');

  const { data: catalog } = useQuery({
    queryKey: ['tryon-catalog-live'],
    queryFn: async () =>
      (await api.get('/catalog/products', { params: { category: 'scarves', pageSize: 12 } })).data,
  });

  const variants: Variant[] = (catalog?.items ?? []).flatMap((p: any) => {
    const fabric = fabricKindFromAttribute(p?.attributes?.fabric);
    return (p.variants ?? []).map((v: any) => ({ ...v, fabric }));
  });
  const initialIdx = Math.max(0, variants.findIndex((v) => v.id === variantId));
  const [activeIdx, setActiveIdx] = useState(initialIdx >= 0 ? initialIdx : 0);
  const active = variants[activeIdx];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <CameraScarfLive
        colorHex={active?.colorHex ?? '#8A8D5B'}
        tyingStyle={tyingStyle}
        fabric={active?.fabric ?? 'solid'}
        onClose={() => router.back()}
        onCapture={(uri) => {
          // Hand the captured still to the main try-on flow so /preview,
          // add-to-cart, etc. all keep working with the frozen frame.
          router.replace({
            pathname: '/(tabs)/tryon',
            params: { capturedUri: uri, variantId: active?.id },
          });
        }}
      />

      {/* Bottom controls hover over the camera. */}
      <View style={styles.hud}>
        <View style={styles.styleRow}>
          {(['classical', 'loose', 'double'] as SkiaTyingStyle[]).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setTyingStyle(s);
              }}
              style={[
                styles.stylePill,
                {
                  borderColor: s === tyingStyle ? colors.gold : 'rgba(255,255,255,0.4)',
                  borderWidth: s === tyingStyle ? 2 : 1,
                },
              ]}
            >
              <Text
                variant="caption"
                color="surface"
                style={{ fontWeight: s === tyingStyle ? '700' : '500' }}
              >
                {s === 'classical' ? 'Klassik' : s === 'loose' ? 'Yumshoq' : 'Ikki qavat'}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
        >
          {variants.map((v, i) => (
            <Pressable
              key={v.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setActiveIdx(i);
              }}
              style={{
                width: 52,
                height: 52,
                borderRadius: theme.radii.md,
                backgroundColor: v.colorHex,
                borderWidth: i === activeIdx ? 2 : 1,
                borderColor: i === activeIdx ? colors.gold : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
    bottom: 160,
    left: 0,
    right: 0,
    gap: 14,
  },
  styleRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  stylePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
});
