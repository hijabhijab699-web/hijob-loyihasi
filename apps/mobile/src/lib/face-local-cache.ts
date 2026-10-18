/**
 * Local cache of the user's onboarding selfie so the buyer side can run
 * face-swap previews ("Mendagi ko'rinishi") without re-capturing the camera
 * each time.
 *
 * The server stores the face encrypted-at-rest; it cannot swap it onto a
 * mannequin for us. We keep a plaintext copy inside the app's sandbox
 * documentDirectory (never leaves this device, never backed up to iCloud by
 * default because expo-file-system's documentDirectory is Documents/ which
 * excluded via a NSURLIsExcludedFromBackup attribute if we need it) so we
 * can re-upload the exact same selfie to `/tryon/faceswap` on demand.
 */
import * as FileSystem from 'expo-file-system';
import { api } from '../api/client';

const FACE_FILE_URI = `${FileSystem.documentDirectory}onboarding-face.jpg`;

/**
 * One of the specific validation failures the Python face-only route can
 * return. Mobile uses these to show a precise "qaytadan oling" message.
 */
export type FacePreviewError =
  | 'NO_FACE_DETECTED'
  | 'FACE_TILTED'
  | 'FACE_TOO_SMALL'
  | 'FACE_TOO_CLOSE'
  | 'FACE_OFF_CENTER'
  | 'FACE_LOST_AFTER_WARP'
  | 'FACE_INVALID'
  | 'NETWORK';

export type FacePreviewResult =
  | { ok: true; url: string }
  | { ok: false; code: FacePreviewError };

/**
 * Hand the raw selfie to the backend's /onboarding/face/preview route, which
 * drives Python (MediaPipe FACE_OVAL) to validate pose + crop just the face
 * onto a transparent, canonical-size PNG. On validation failure returns an
 * error code so the caller can prompt the user to retake.
 */
export async function extractFacePreview(sourceUri: string): Promise<FacePreviewResult> {
  try {
    const form = new FormData();
    form.append('image', {
      uri: sourceUri,
      name: 'face.jpg',
      type: 'image/jpeg',
    } as any);
    const { data } = await api.post<{ url: string }>('/onboarding/face/preview', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30_000,
    });
    return data?.url ? { ok: true, url: data.url } : { ok: false, code: 'FACE_INVALID' };
  } catch (e: any) {
    const code = e?.response?.data?.code ?? e?.response?.data?.message?.code ?? null;
    if (typeof code === 'string') {
      return { ok: false, code: code as FacePreviewError };
    }
    console.warn('face-preview: upload failed', e?.message ?? e);
    return { ok: false, code: 'NETWORK' };
  }
}

/** Short Uzbek message for each validation failure, ready to show in UI. */
export function facePreviewErrorMessage(code: FacePreviewError): string {
  switch (code) {
    case 'FACE_TILTED':
      return "Boshingiz qiyshaygan — to'g'ri turib qayta oling";
    case 'FACE_TOO_SMALL':
      return 'Kamerani yuzingizga yaqinroq keltiring';
    case 'FACE_TOO_CLOSE':
      return 'Kamerani biroz uzoqlashtiring';
    case 'FACE_OFF_CENTER':
      return "Yuzingizni ramkaning o'rtasiga joylashtiring";
    case 'NO_FACE_DETECTED':
    case 'FACE_LOST_AFTER_WARP':
      return "Yuz aniqlanmadi — yorug'roq joyda qayta oling";
    case 'NETWORK':
      return "Tarmoq xatosi — qayta urinib ko'ring";
    default:
      return "Rasm noto'g'ri — qaytadan oling";
  }
}

export async function saveLocalFace(sourceUri: string): Promise<void> {
  try {
    await FileSystem.copyAsync({ from: sourceUri, to: FACE_FILE_URI });
  } catch (e) {
    // Non-fatal: the server still has the encrypted copy. We just lose the
    // "Mendagi ko'rinishi" button if this fails.
    console.warn('face cache: copy failed', e);
  }
}

export async function hasLocalFace(): Promise<boolean> {
  try {
    const info = await FileSystem.getInfoAsync(FACE_FILE_URI);
    return info.exists && (info.size ?? 0) > 1024;
  } catch {
    return false;
  }
}

export function localFaceUri(): string {
  return FACE_FILE_URI;
}

export async function clearLocalFace(): Promise<void> {
  try {
    await FileSystem.deleteAsync(FACE_FILE_URI, { idempotent: true });
  } catch {
    // ignore
  }
}
