/**
 * apple-face-detector — Vision Camera frame-processor plugin backed by
 * Apple's built-in Vision framework (VNDetectFaceLandmarksRequest).
 *
 * Works on iOS device AND iOS simulator (including arm64-simulator on
 * Apple Silicon Macs, unlike Google MLKit which still ships fat frameworks
 * without an arm64-sim slice).
 */
'use strict';

const { VisionCameraProxy } = require('react-native-vision-camera');

// Lazy plugin resolver — VisionCameraProxy isn't fully wired until after
// the Camera component mounts (Bridgeless mode initialises native modules
// lazily), so calling at module load returns null and the detector would
// look absent forever. Try again on every access until it hands us a proxy.
let _plugin = null;
function getPlugin() {
  if (_plugin) return _plugin;
  try {
    _plugin = VisionCameraProxy.initFrameProcessorPlugin('detectFaceApple', {});
  } catch (_e) {
    _plugin = null;
  }
  return _plugin;
}

function detectFacesApple(frame) {
  'worklet';
  const p = getPlugin();
  if (p == null) return [];
  return p.call(frame) ?? [];
}

/** Hook style, mirrors react-native-vision-camera-face-detector's shape. */
function useAppleFaceDetector() {
  return { detectFaces: detectFacesApple };
}

/**
 * True when the JS module is installed. We can't reliably check the native
 * plugin from module scope (Bridgeless boots it lazily), so callers get a
 * true here and the worklet self-heals: it simply returns [] until the
 * native side is ready, then real face data starts flowing.
 */
function isAppleFaceDetectorAvailable() {
  return true;
}

module.exports = {
  detectFacesApple,
  useAppleFaceDetector,
  isAppleFaceDetectorAvailable,
};
