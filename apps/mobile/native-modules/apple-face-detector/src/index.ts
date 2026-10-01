/**
 * apple-face-detector — Vision Camera frame-processor plugin backed by
 * Apple's built-in Vision framework (VNDetectFaceLandmarksRequest).
 *
 * Works on iOS device AND iOS simulator (including arm64-simulator on
 * Apple Silicon Macs, unlike Google MLKit which still ships fat frameworks
 * without an arm64-sim slice).
 *
 * Usage inside a Vision Camera frame processor:
 *
 *   import { detectFacesApple, useAppleFaceDetector } from 'apple-face-detector';
 *   const { detectFaces } = useAppleFaceDetector();
 *   const fp = useFrameProcessor((frame) => {
 *     'worklet';
 *     const faces = detectFaces(frame);
 *     if (faces[0]) {
 *       // faces[0].bounds = { x, y, width, height }  (frame pixels, top-left origin)
 *       // faces[0].contour = [{ x, y }, ...]         (face oval)
 *     }
 *   }, [detectFaces]);
 */
import { VisionCameraProxy, type Frame } from 'react-native-vision-camera';

export interface AppleFace {
  bounds: { x: number; y: number; width: number; height: number };
  contour: Array<{ x: number; y: number }>;
}

// Lazy plugin resolver — VisionCameraProxy isn't fully wired until after
// the Camera component mounts (Bridgeless mode initialises native modules
// lazily), so calling at module load returns null and the detector would
// look absent forever. Try again on every access until it hands us a proxy.
let _plugin: ReturnType<typeof VisionCameraProxy.initFrameProcessorPlugin> = null;
function getPlugin() {
  if (_plugin) return _plugin;
  try {
    _plugin = VisionCameraProxy.initFrameProcessorPlugin('detectFaceApple', {});
  } catch {
    _plugin = null;
  }
  return _plugin;
}

export function detectFacesApple(frame: Frame): AppleFace[] {
  'worklet';
  const p = getPlugin();
  if (p == null) return [];
  return (p.call(frame) as unknown as AppleFace[]) ?? [];
}

/** Hook style, mirrors react-native-vision-camera-face-detector's shape. */
export function useAppleFaceDetector() {
  return { detectFaces: detectFacesApple };
}

/**
 * True when the JS module is installed. We can't reliably check the native
 * plugin from module scope (Bridgeless boots it lazily), so callers get a
 * true here and the worklet self-heals: it simply returns [] until the
 * native side is ready, then real face data starts flowing.
 */
export const isAppleFaceDetectorAvailable = () => true;
