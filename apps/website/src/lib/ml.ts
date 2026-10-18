// Thin, auth-free client that talks directly to the ML services the mobile
// backend already uses. We hit ml-face for landmarks and ml-compositor for the
// scarf composite, then stream the JPEG back to the browser.
export const ML_FACE_URL =
  process.env.ML_FACE_URL ?? 'http://localhost:5001';
export const ML_COMPOSITOR_URL =
  process.env.ML_COMPOSITOR_URL ?? 'http://localhost:5002';

export type TyingStyle = 'classical' | 'loose' | 'double';
export type Pattern = 'solid' | 'silk' | 'chiffon';

export interface Point2D {
  x: number;
  y: number;
}

export interface FaceView {
  view: string;
  detected: boolean;
  confidence?: number;
  landmarks_2d: Point2D[];
  image_size?: [number, number] | null;
}

export interface FaceTemplate {
  status: string;
  views: FaceView[];
  skin_tone?: { hex: string } | null;
  warnings?: string[];
}

export interface ScarfSpec {
  tying_style: TyingStyle;
  color_hex: string;
  pattern: Pattern;
  opacity?: number;
}

/** POST face image to ml-face /face/extract. Throws if no face detected. */
export async function extractFace(face: Blob): Promise<FaceView> {
  const form = new FormData();
  form.append('front', face, 'face.jpg');
  const res = await fetch(`${ML_FACE_URL}/face/extract`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ml-face /extract → ${res.status} ${text.slice(0, 200)}`);
  }
  const tpl = (await res.json()) as FaceTemplate;
  const front = tpl.views?.find((v) => v.view === 'front');
  if (!front || !front.detected || !front.landmarks_2d?.length) {
    throw new Error('Yuz aniqlanmadi — iltimos aniqroq rasm yuklang');
  }
  return front;
}

/** Compose a scarf onto the user's face. Returns raw JPEG bytes. */
export async function composeScarf(
  face: Blob,
  front: FaceView,
  spec: ScarfSpec,
): Promise<Buffer> {
  if (!front.image_size) {
    throw new Error('MISSING_IMAGE_SIZE');
  }
  const [imgW, imgH] = front.image_size;
  const landmarks = {
    image_width: imgW,
    image_height: imgH,
    points: front.landmarks_2d,
  };
  const form = new FormData();
  form.append('face', face, 'face.jpg');
  form.append('landmarks', JSON.stringify(landmarks));
  form.append('scarf', JSON.stringify(spec));

  const res = await fetch(`${ML_COMPOSITOR_URL}/compose/scarf`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `ml-compositor /compose/scarf → ${res.status} ${text.slice(0, 200)}`,
    );
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length === 0) throw new Error('EMPTY_COMPOSE_RESULT');
  return buf;
}
