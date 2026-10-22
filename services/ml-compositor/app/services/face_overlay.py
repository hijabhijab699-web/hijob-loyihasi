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
from typing import Optional

import cv2
import numpy as np

from .face_swap import _init_insightface

logger = logging.getLogger(__name__)

# Padding ratios used when we crop the face out of a swap result. These
# have to match in extract and apply so the stamp lands at the right scale
# — the stamp's padded crop is wider than the detected bbox by this
# fraction, so when we resize to a new target we scale UP by the inverse.
_PAD_X = 0.35          # left + right padding, as fraction of bbox width
_PAD_Y_TOP = 0.55      # top padding (hair/forehead), fraction of bbox h
_PAD_Y_BOTTOM = 0.45   # bottom padding (jaw/neck), fraction of bbox h

_STAMP_FACE_W_RATIO = 1.0 / (1.0 + 2.0 * _PAD_X)


def _largest_face(bgr: np.ndarray):
    """Return the largest detected face from an image, or None. Uses the
    same InsightFace FaceAnalysis instance that face_swap.py already warms
    up, so there's no second model load."""
    if not _init_insightface():
        return None
    # Import *after* init so the module-level `_app` is populated.
    from . import face_swap as _fs
    if _fs._app is None:
        return None
    faces = _fs._app.get(bgr)
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

    # Soft oval alpha — feathered so edges disappear into the mannequin
    # instead of showing a hard cut-out line.
    mask = np.zeros((ch, cw), dtype=np.uint8)
    cv2.ellipse(
        mask,
        (cw // 2, int(ch * 0.52)),
        (int(cw * 0.46), int(ch * 0.48)),
        0, 0, 360, 255, -1,
    )
    feather = max(5, int(max(cw, ch) * 0.08))
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
