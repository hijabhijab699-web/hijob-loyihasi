/**
 * Client-side scarf preview.
 *
 * Draws the user's photo through a Skia Canvas and overlays a procedural
 * scarf shape derived from face landmarks. Runs entirely on-device — no
 * network round-trip to /tryon/preview — so swiping between colours is
 * instantaneous.
 *
 * Landmarks come from the server's ml-face template that we already extracted
 * during onboarding. If they're not available yet the parent should fall back
 * to the /tryon/preview flow (which is more accurate but slower).
 */
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Group,
  Image as SkImage,
  Path,
  Skia,
  useImage,
} from '@shopify/react-native-skia';

import { useTheme } from '../theme/ThemeProvider';

export type SkiaTyingStyle = 'classical' | 'loose' | 'double';

interface Landmark {
  x: number;
  y: number;
}

interface Props {
  /** Local URI or remote URL of the base image (typically a selfie). */
  imageUri: string;
  /** Rendered width — the canvas keeps 3:4 aspect ratio. */
  width: number;
  /** MediaPipe FaceMesh 478 landmarks in normalised [0..1] coords, or null → no overlay. */
  landmarks: Landmark[] | null;
  colorHex: string;
  tyingStyle?: SkiaTyingStyle;
  opacity?: number;
}

// Same face-mesh landmark indices the server-side compositor uses.
const FOREHEAD_TOP = 10;
const CHIN_BOTTOM = 152;
const FACE_LEFT = 234;
const FACE_RIGHT = 454;

const STYLE_TUNING: Record<SkiaTyingStyle, { crown: number; drapeY: number; drapeX: number }> = {
  classical: { crown: 0.55, drapeY: 0.85, drapeX: 0.30 },
  loose: { crown: 0.45, drapeY: 1.05, drapeX: 0.55 },
  double: { crown: 0.65, drapeY: 0.75, drapeX: 0.25 },
};

export function ScarfSkiaPreview({
  imageUri,
  width,
  landmarks,
  colorHex,
  tyingStyle = 'classical',
  opacity = 0.92,
}: Props) {
  const image = useImage(imageUri);
  const { colors } = useTheme();
  const height = width * (4 / 3);

  // Build the scarf polygon once per (landmarks, style) tuple.
  const scarfPath = useMemo(() => {
    if (!landmarks || landmarks.length < 468) return null;

    const forehead = landmarks[FOREHEAD_TOP]!;
    const chin = landmarks[CHIN_BOTTOM]!;
    const left = landmarks[FACE_LEFT]!;
    const right = landmarks[FACE_RIGHT]!;

    const faceW = Math.hypot((right.x - left.x) * width, (right.y - left.y) * height);
    const faceH = Math.hypot((chin.x - forehead.x) * width, (chin.y - forehead.y) * height);
    const tune = STYLE_TUNING[tyingStyle];

    const scaleX = (n: number) => n * width;
    const scaleY = (n: number) => n * height;

    const drapeY = scaleY(chin.y) + faceH * tune.drapeY;
    const crownY = Math.max(0, scaleY(forehead.y) - faceH * tune.crown);

    const path = Skia.Path.Make();
    // Outer scarf silhouette. Same 7-point polygon the server uses so the
    // client and server previews look consistent.
    path.moveTo(scaleX(left.x) - faceW * tune.drapeX, scaleY(left.y));
    path.lineTo(scaleX(left.x) - faceW * (tune.drapeX + 0.05), scaleY(forehead.y) - faceH * 0.10);
    path.lineTo(scaleX(forehead.x), crownY);
    path.lineTo(scaleX(right.x) + faceW * (tune.drapeX + 0.05), scaleY(forehead.y) - faceH * 0.10);
    path.lineTo(scaleX(right.x) + faceW * tune.drapeX, scaleY(right.y));
    path.lineTo(scaleX(right.x) + faceW * (tune.drapeX + 0.10), drapeY);
    path.lineTo(scaleX(left.x) - faceW * (tune.drapeX + 0.10), drapeY);
    path.close();

    // Cut the face oval out of the scarf using the FaceMesh silhouette itself.
    // Slightly shrink so the fabric hugs the hairline.
    const faceCutout = Skia.Path.Make();
    const shrink = 0.96;
    const cx = (left.x + right.x) / 2;
    const cy = (forehead.y + chin.y) / 2;
    const ovalIndices = [
      10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
      379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93,
      234, 127, 162, 21, 54, 103, 67, 109,
    ];
    ovalIndices.forEach((idx, i) => {
      const p = landmarks[idx];
      if (!p) return;
      const sx = scaleX((p.x - cx) * shrink + cx);
      const sy = scaleY((p.y - cy) * shrink + cy);
      if (i === 0) faceCutout.moveTo(sx, sy);
      else faceCutout.lineTo(sx, sy);
    });
    faceCutout.close();

    path.op(faceCutout, /* difference */ 0);
    return path;
  }, [landmarks, tyingStyle, width, height]);

  // Parse #RRGGBB → Skia opaque colour.
  const scarfColor = useMemo(() => {
    const hex = colorHex.startsWith('#') ? colorHex.slice(1) : colorHex;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return Skia.Color(`rgba(${r},${g},${b},${opacity})`);
  }, [colorHex, opacity]);

  return (
    <View style={[styles.wrap, { width, height, backgroundColor: colors.surface2 }]}>
      <Canvas style={{ width, height }}>
        {image && <SkImage image={image} x={0} y={0} width={width} height={height} fit="cover" />}
        {scarfPath && (
          <Group>
            <Path path={scarfPath} color={scarfColor} />
            {/* subtle inner shadow along the crown for depth */}
            <Path
              path={scarfPath}
              style="stroke"
              color={Skia.Color('rgba(0,0,0,0.15)')}
              strokeWidth={2}
            />
          </Group>
        )}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
});
