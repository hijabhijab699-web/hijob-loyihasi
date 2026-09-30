/**
 * Live camera Skia scarf try-on.
 *
 * Architecture:
 *   Vision Camera runs at ~30 fps and feeds each frame into a face detector
 *   frame processor (MLKit under the hood). The detector emits face contour
 *   points on the UI worklet thread; we ship them across to JS via a Reanimated
 *   shared value and let a transparent Skia <Canvas> layered on top of the
 *   camera preview redraw the scarf polygon each frame.
 *
 * Why not draw INTO the frame with useSkiaFrameProcessor?
 *   Skia frame processors work but require Skia 2.x for stable RN 0.76
 *   support. Overlaying a <Canvas> keeps us on Skia 1.5 and gives the same
 *   perceptual latency (~35 ms) since the Camera preview and Canvas share
 *   the same surface. The camera pixels never leave the GPU either way —
 *   we only ship the contour (~36 floats) to JS.
 *
 * Prerequisites (native modules — requires `expo prebuild`):
 *   - react-native-vision-camera >= 4.6
 *   - react-native-worklets-core >= 1.5
 *   - react-native-vision-camera-face-detector >= 1.8
 *   - @shopify/react-native-skia 1.5.x
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../theme/ThemeProvider';
import type { SkiaTyingStyle } from './ScarfSkiaPreview';

// Lazy-required so the JS bundle still parses in Expo Go (no native module).
// The `available` flag below tells the caller whether live mode can render.
let VisionCamera: any = null;
let useFaceDetector: any = null;
let useCameraPermission: any = null;
let useCameraDevice: any = null;
let useFrameProcessor: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const vc = require('react-native-vision-camera');
  VisionCamera = vc.Camera;
  useCameraPermission = vc.useCameraPermission;
  useCameraDevice = vc.useCameraDevice;
  useFrameProcessor = vc.useFrameProcessor;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fd = require('react-native-vision-camera-face-detector');
  useFaceDetector = fd.useFaceDetector;
} catch {
  // Native modules missing — the parent should route the user to the static
  // /tryon flow instead. isAvailable() reflects this.
}

export const isLiveCameraAvailable = () =>
  Boolean(VisionCamera && useFaceDetector && useFrameProcessor);

interface Props {
  colorHex: string;
  tyingStyle?: SkiaTyingStyle;
  opacity?: number;
  /** Called when the user hits the shutter — returns a still uri you can send onward. */
  onCapture?: (uri: string) => void;
  onClose?: () => void;
}

// Same style constants as the static ScarfSkiaPreview so the two previews stay coherent.
const STYLE_TUNING: Record<SkiaTyingStyle, { crown: number; drapeY: number; drapeX: number }> = {
  classical: { crown: 0.55, drapeY: 0.85, drapeX: 0.30 },
  loose: { crown: 0.45, drapeY: 1.05, drapeX: 0.55 },
  double: { crown: 0.65, drapeY: 0.75, drapeX: 0.25 },
};

interface FaceGeom {
  // All values in view-space pixels — the worklet does the frame→view mapping.
  foreheadX: number;
  foreheadY: number;
  chinX: number;
  chinY: number;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
  contour: Array<{ x: number; y: number }>; // face oval, ~35 points
}

export function CameraScarfLive({
  colorHex,
  tyingStyle = 'classical',
  opacity = 0.92,
  onCapture,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const cameraRef = useRef<any>(null);
  const [viewSize, setViewSize] = useState({ width: 0, height: 0 });
  const [fps, setFps] = useState(0);
  const [capturing, setCapturing] = useState(false);

  if (!isLiveCameraAvailable()) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Ionicons name="videocam-off-outline" size={44} color={colors.oliveDark} />
        <Text style={{ color: colors.ink, marginTop: 12, textAlign: 'center', maxWidth: 260 }}>
          Real-time try-on uchun native build kerak. Terminal da{' '}
          <Text style={{ fontWeight: '600' }}>pnpm run --filter @n2431/mobile ios</Text> ni ishga
          tushiring.
        </Text>
      </View>
    );
  }

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'none',
    contourMode: 'all',
    classificationMode: 'none',
    minFaceSize: 0.15,
    trackingEnabled: true,
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  // Shared value updated on the frame-processor thread; read from Skia on JS.
  const face = useSharedValue<FaceGeom | null>(null);
  const lastFpsTick = useSharedValue(0);
  const framesSinceTick = useSharedValue(0);

  const updateFps = useCallback((v: number) => setFps(v), []);

  const frameProcessor = useFrameProcessor(
    (frame: any) => {
      'worklet';
      const detected = detectFaces(frame);

      // Rolling FPS counter — updates once a second, cheap.
      framesSinceTick.value += 1;
      const now = Date.now();
      if (now - lastFpsTick.value > 1000) {
        runOnJS(updateFps)(framesSinceTick.value);
        framesSinceTick.value = 0;
        lastFpsTick.value = now;
      }

      if (!detected || detected.length === 0) {
        face.value = null;
        return;
      }
      const f = detected[0];

      // Map frame coords → view coords.
      // Vision Camera reports frame dimensions in the sensor orientation; on
      // front camera we need to mirror x. We do it via a scale factor and
      // let the caller pass viewSize through shared closure.
      const fw = frame.width;
      const fh = frame.height;
      const vw = viewSize.width || 1;
      const vh = viewSize.height || 1;
      // Fit "cover" — the frame is scaled to fill the view; the shorter side
      // is cropped. Compute the scale that maximises min side coverage.
      const scale = Math.max(vw / fw, vh / fh);
      const offX = (fw * scale - vw) / 2;
      const offY = (fh * scale - vh) / 2;
      const toViewX = (x: number) => vw - (x * scale - offX); // mirror front
      const toViewY = (y: number) => y * scale - offY;

      const contourPts = (f.contours?.face ?? []) as Array<{ x: number; y: number }>;
      if (contourPts.length < 8) {
        face.value = null;
        return;
      }
      const mapped = contourPts.map((p) => ({ x: toViewX(p.x), y: toViewY(p.y) }));

      // Anchor points on the oval: top (forehead), bottom (chin), extremes (temples).
      let top = mapped[0]!;
      let bottom = mapped[0]!;
      let left = mapped[0]!;
      let right = mapped[0]!;
      for (const p of mapped) {
        if (p.y < top.y) top = p;
        if (p.y > bottom.y) bottom = p;
        if (p.x < left.x) left = p;
        if (p.x > right.x) right = p;
      }

      face.value = {
        foreheadX: top.x,
        foreheadY: top.y,
        chinX: bottom.x,
        chinY: bottom.y,
        leftX: left.x,
        leftY: (left.y + top.y) / 2,
        rightX: right.x,
        rightY: (right.y + top.y) / 2,
        contour: mapped,
      };
    },
    [detectFaces, viewSize.width, viewSize.height],
  );

  // Derive the scarf path each frame the face changes. Runs on the JS thread.
  // Skia's <Path> refuses null, so when the detector loses the face we hand it
  // an empty path — the overlay simply draws nothing that frame.
  const emptyPath = useMemo(() => Skia.Path.Make(), []);
  const scarfPath = useDerivedValue(() => {
    const g = face.value;
    if (!g) return emptyPath;
    const tune = STYLE_TUNING[tyingStyle];
    const faceW = Math.hypot(g.rightX - g.leftX, g.rightY - g.leftY);
    const faceH = Math.hypot(g.chinX - g.foreheadX, g.chinY - g.foreheadY);
    const drapeY = g.chinY + faceH * tune.drapeY;
    const crownY = Math.max(0, g.foreheadY - faceH * tune.crown);

    const path = Skia.Path.Make();
    path.moveTo(g.leftX - faceW * tune.drapeX, g.leftY);
    path.lineTo(g.leftX - faceW * (tune.drapeX + 0.05), g.foreheadY - faceH * 0.10);
    path.lineTo(g.foreheadX, crownY);
    path.lineTo(g.rightX + faceW * (tune.drapeX + 0.05), g.foreheadY - faceH * 0.10);
    path.lineTo(g.rightX + faceW * tune.drapeX, g.rightY);
    path.lineTo(g.rightX + faceW * (tune.drapeX + 0.10), drapeY);
    path.lineTo(g.leftX - faceW * (tune.drapeX + 0.10), drapeY);
    path.close();

    // Cut the actual face oval out so the fabric hugs the hairline.
    const cutout = Skia.Path.Make();
    g.contour.forEach((p, i) => (i === 0 ? cutout.moveTo(p.x, p.y) : cutout.lineTo(p.x, p.y)));
    cutout.close();
    // Shrink a hair so the cutout doesn't reveal skin under the hijab edge.
    const cx = (g.leftX + g.rightX) / 2;
    const cy = (g.foreheadY + g.chinY) / 2;
    const shrunk = Skia.Path.Make();
    const s = 0.96;
    g.contour.forEach((p, i) => {
      const sx = (p.x - cx) * s + cx;
      const sy = (p.y - cy) * s + cy;
      if (i === 0) shrunk.moveTo(sx, sy);
      else shrunk.lineTo(sx, sy);
    });
    shrunk.close();

    path.op(shrunk, /* difference */ 0);
    return path;
  }, [tyingStyle, emptyPath]);

  const scarfColor = useMemo(() => {
    const hex = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return Skia.Color(`rgba(${r},${g},${b},${opacity})`);
  }, [colorHex, opacity]);

  const capture = useCallback(async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePhoto({ flash: 'off', enableShutterSound: false });
      const uri = 'file://' + photo.path;
      onCapture?.(uri);
    } finally {
      setCapturing(false);
    }
  }, [capturing, onCapture]);

  if (!device) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.gold} />
        <Text style={{ color: colors.muted, marginTop: 12 }}>Old kamerani izlayapmiz…</Text>
      </View>
    );
  }
  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <Ionicons name="camera-outline" size={44} color={colors.oliveDark} />
        <Text style={{ color: colors.ink, marginTop: 12 }}>Kamera ruxsati kerak</Text>
        <Pressable
          onPress={requestPermission}
          style={{
            marginTop: 16,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 999,
            backgroundColor: colors.gold,
          }}
        >
          <Text style={{ color: colors.ink, fontWeight: '600' }}>Ruxsat berish</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: '#000' }}
      onLayout={(e) => setViewSize(e.nativeEvent.layout)}
    >
      <VisionCamera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        photo={true}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      {/* Transparent Skia overlay — draws over the live preview. */}
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          <Path path={scarfPath} color={scarfColor} />
          <Path
            path={scarfPath}
            style="stroke"
            color={Skia.Color('rgba(0,0,0,0.20)')}
            strokeWidth={1.5}
          />
        </Group>
      </Canvas>

      {/* HUD */}
      <View style={styles.topBar}>
        <Pressable onPress={onClose} style={styles.iconBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </Pressable>
        <View style={styles.fpsChip}>
          <View style={styles.fpsDot} />
          <Text style={styles.fpsText}>{fps} fps</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.shutterBar}>
        <Pressable onPress={capture} style={styles.shutter} disabled={capturing}>
          <View style={styles.shutterInner}>
            {capturing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="camera" size={26} color="#000" />
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  topBar: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpsChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  fpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8CD867',
  },
  fpsText: { color: '#fff', fontSize: 12, fontVariant: ['tabular-nums'] },
  shutterBar: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#C9A96E',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
