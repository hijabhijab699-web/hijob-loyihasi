"""Reuse one face-swap across many mannequins.

Pattern: a single facefusion run per user produces a full-body image with
the user's face on the mannequin. We crop that face out as a soft-edged
RGBA stamp. For every other variant mannequin the user hasn't rendered
yet, we detect the mannequin's own face landmarks with InsightFace,
resize + alpha-composite the stamp over the mannequin's face area. One
slow swap (~2 min) + N cheap overlays (~2 s each) replaces N slow swaps.

Alignment stays simple on purpose: center-of-face + width-match. On the
AI-generated mannequin grid every face points at the camera at roughly
the same angle, so a 2D crop drops in cleanly without a per-landmark
warp. If the mannequin's face detector returns nothing the caller can
fall back to the real facefusion run.
"""
from __future__ import annotations

import logging
import os
import threading
from pathlib import Path
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# Face DETECTOR only — we deliberately do not require inswapper_128.onnx
# here, unlike face_swap.py. The overlay path takes the user's face from a
# cached stamp, so the ONNX swapper model is never needed; a missing one
# would otherwise shoot the whole overlay pipeline down.
_MODEL_DIR = Path(
    os.environ.get(
        "ML_COMPOSITOR_MODEL_DIR",
        Path(__file__).resolve().parents[2] / "models",
    )
)
_detector = None
_init_lock = threading.Lock()
_init_failed = False


def _init_detector() -> bool:
    """Lazily load an InsightFace FaceAnalysis (buffalo_l) just for detection.
    Returns True on success. On failure (missing deps, model download blocked)
    we flip _init_failed so retries don't thrash."""
    global _detector, _init_failed
    if _detector is not None:
        return True
    if _init_failed:
        return False

    with _init_lock:
        if _detector is not None:
            return True
        if _init_failed:
            return False

        try:
            from insightface.app import FaceAnalysis

            logger.info("initialising face detector (buffalo_l)…")
            app = FaceAnalysis(
                name="buffalo_l",
                providers=["CPUExecutionProvider"],
                root=str(_MODEL_DIR),
            )
            app.prepare(ctx_id=0, det_size=(512, 512))
            _detector = app
            logger.info("face detector ready")
            return True
        except Exception as exc:  # noqa: BLE001
            _init_failed = True
            logger.warning("face detector init failed: %s", exc)
            return False

# Padding ratios used when we crop the face out of a swap result. These
# have to match in extract and apply so the stamp lands at the right scale
# — the stamp's padded crop is wider than the detected bbox by this
# fraction, so when we resize to a new target we scale UP by the inverse.
# Keep padding tight to the face bbox: the source mannequin's hijab wraps
# across the forehead and over the shoulders, so a loose crop drags that
# wrap into the stamp and we see two hijabs stacked when the stamp lands
# on a target wearing a different one.
_PAD_X = 0.08          # left + right padding, as fraction of bbox width
_PAD_Y_TOP = 0.06      # top padding — just a sliver of forehead, no hijab
_PAD_Y_BOTTOM = 0.10   # bottom padding (jaw), stays off neck/hijab drape

_STAMP_FACE_W_RATIO = 1.0 / (1.0 + 2.0 * _PAD_X)


def _largest_face(bgr: np.ndarray):
    """Return the largest detected face from an image, or None."""
    if not _init_detector():
        return None
    faces = _detector.get(bgr)
    if not faces:
        return None
    faces.sort(
        key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]),
        reverse=True,
    )
    return faces[0]


def extract_face_stamp(bgr: np.ndarray) -> Optional[np.ndarray]:
    """Crop the face region from a full-body swap result as an RGBA stamp
    with a soft-feathered oval alpha. Returns (H, W, 4) uint8 or None if
    no face was detected."""
    face = _largest_face(bgr)
    if face is None:
        return None

    x1, y1, x2, y2 = face.bbox.astype(int)
    w = x2 - x1
    h = y2 - y1
    pad_x = int(w * _PAD_X)
    pad_y_t = int(h * _PAD_Y_TOP)
    pad_y_b = int(h * _PAD_Y_BOTTOM)

    H, W = bgr.shape[:2]
    cx1 = max(0, x1 - pad_x)
    cy1 = max(0, y1 - pad_y_t)
    cx2 = min(W, x2 + pad_x)
    cy2 = min(H, y2 + pad_y_b)

    crop = bgr[cy1:cy2, cx1:cx2].copy()
    ch, cw = crop.shape[:2]
    if ch < 10 or cw < 10:
        return None

    # Soft oval alpha — feathered so edges disappear into the mannequin.
    # The ellipse is intentionally narrower than the crop box so forehead
    # pixels (the top of the crop, where the source hijab wrap could still
    # creep in on a wide face) stay transparent and the target's own hair/
    # hijab shows through unchanged. Only the actual face area is replaced.
    mask = np.zeros((ch, cw), dtype=np.uint8)
    cv2.ellipse(
        mask,
        (cw // 2, int(ch * 0.52)),
        (int(cw * 0.36), int(ch * 0.42)),
        0, 0, 360, 255, -1,
    )
    # Heavier feather so the oval edge dissolves instead of showing a seam
    # against the target mannequin's skin / hijab.
    feather = max(8, int(max(cw, ch) * 0.12))
    k = feather * 2 + 1
    mask = cv2.GaussianBlur(mask, (k, k), feather / 2.0)

    rgba = cv2.cvtColor(crop, cv2.COLOR_BGR2BGRA)
    rgba[:, :, 3] = mask
    return rgba


def apply_face_stamp(
    target_bgr: np.ndarray,
    stamp_rgba: np.ndarray,
) -> Optional[np.ndarray]:
    """Alpha-composite `stamp_rgba` onto the face region of `target_bgr`
    (in place). Returns the mutated target or None if the target has no
    detectable face. The stamp is resized so its underlying face region
    matches the target's bbox width."""
    face = _largest_face(target_bgr)
    if face is None:
        return None

    tx1, ty1, tx2, ty2 = face.bbox.astype(int)
    tw = tx2 - tx1
    th = ty2 - ty1
    tcx = (tx1 + tx2) // 2
    tcy = (ty1 + ty2) // 2

    sh, sw = stamp_rgba.shape[:2]
    # The stamp's own face bbox is roughly _STAMP_FACE_W_RATIO of the
    # stamp width (we padded by _PAD_X on each side when extracting).
    # Scale the whole stamp so its face bbox width matches the target's.
    target_stamp_w = max(4, int(tw / _STAMP_FACE_W_RATIO))
    scale = target_stamp_w / sw
    target_stamp_h = max(4, int(sh * scale))

    stamp_resized = cv2.resize(
        stamp_rgba,
        (target_stamp_w, target_stamp_h),
        interpolation=cv2.INTER_LANCZOS4,
    )

    # Center on the target face center, nudged slightly up so the stamp's
    # hairline sits above the forehead where it belongs rather than
    # cutting the mannequin's eyes.
    px = tcx - target_stamp_w // 2
    py = tcy - int(target_stamp_h * 0.52)

    H, W = target_bgr.shape[:2]
    x0 = max(0, px)
    y0 = max(0, py)
    x1 = min(W, px + target_stamp_w)
    y1 = min(H, py + target_stamp_h)
    if x1 <= x0 or y1 <= y0:
        return None

    sx0 = x0 - px
    sy0 = y0 - py
    sx1 = sx0 + (x1 - x0)
    sy1 = sy0 + (y1 - y0)

    region = target_bgr[y0:y1, x0:x1].astype(np.float32)
    stamp_slice = stamp_resized[sy0:sy1, sx0:sx1]
    alpha = (stamp_slice[:, :, 3:4].astype(np.float32)) / 255.0
    bgr = stamp_slice[:, :, :3].astype(np.float32)

    composite = region * (1.0 - alpha) + bgr * alpha
    target_bgr[y0:y1, x0:x1] = composite.astype(np.uint8)
    return target_bgr
