"""Hair-region protection — two layers.

    1. Geometric ellipse from face landmarks (fast fallback, always available).
    2. MediaPipe SelfieSegmentation — cropped to the head region — for the
       actual foreground/background boundary. When it fires we intersect the
       ellipse with the segmentation to get an accurate hair silhouette.

Anywhere the resulting mask is high AND the composited image sits below the
base, we blend the base back in. This keeps stray hairs visible instead of
being erased at the scarf edge.
"""
from __future__ import annotations

from functools import lru_cache

import cv2
import mediapipe as mp
import numpy as np

from app.services.geometry import FOREHEAD_TOP, face_span


@lru_cache(maxsize=1)
def _segmenter():
    return mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)


def _selfie_head_mask(image_bgr: np.ndarray) -> np.ndarray | None:
    """Run MediaPipe SelfieSegmentation and return a float32 (H, W) mask in [0..1].

    Returns None if the model fails or is unavailable — the caller falls back
    to the ellipse-only protect mask.
    """
    try:
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        res = _segmenter().process(rgb)
        if res.segmentation_mask is None:
            return None
        return res.segmentation_mask.astype(np.float32).clip(0.0, 1.0)
    except Exception:  # noqa: BLE001 — hair matting must never crash the compositor
        return None


def build_forehead_protect_mask(
    shape_hw: tuple[int, int],
    user_landmarks_px: np.ndarray,
    lift: float = 0.40,
    width_scale: float = 1.15,
) -> np.ndarray:
    """Return a float32 mask (H, W) in [0..1] where 1 = protect user pixels."""
    h, w = shape_hw
    mask = np.zeros((h, w), dtype=np.float32)

    span = face_span(user_landmarks_px)
    forehead = user_landmarks_px[FOREHEAD_TOP]
    face_w = span["face_w"]
    face_h = span["face_h"]

    center_x = int(forehead[0])
    center_y = int(max(0, forehead[1] - face_h * lift * 0.5))
    axis_x = int(face_w * width_scale * 0.5)
    axis_y = int(face_h * lift * 0.65)

    if axis_x <= 0 or axis_y <= 0:
        return mask

    cv2.ellipse(
        mask,
        (center_x, center_y),
        (axis_x, axis_y),
        angle=0,
        startAngle=0,
        endAngle=360,
        color=1.0,
        thickness=-1,
    )
    # Soft edge so the transition to the scarf doesn't reveal a hard oval.
    mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=max(2.0, face_w * 0.03))
    return mask


def blend_with_hairline_protection(
    base_image: np.ndarray,
    composed: np.ndarray,
    user_landmarks_px: np.ndarray,
    protect_strength: float = 0.75,
    use_selfie_segmentation: bool = True,
) -> np.ndarray:
    """Restore the user's forehead pixels where the composited scarf is thin.

    `protect_strength` scales how aggressively we pull the base back:
        0.0 = disabled
        1.0 = fully restore the forehead / crown to the base image

    When `use_selfie_segmentation` is on we intersect the geometric ellipse
    with a real foreground mask from MediaPipe — that gives us the actual hair
    silhouette instead of an oval approximation.
    """
    if protect_strength <= 0.0:
        return composed

    h, w = composed.shape[:2]
    ellipse = build_forehead_protect_mask((h, w), user_landmarks_px)

    if use_selfie_segmentation:
        foreground = _selfie_head_mask(base_image)
        if foreground is not None:
            # Both masks are in [0..1]. Their product keeps pixels that are both
            # anatomically near the forehead AND on the person (not background).
            protect = ellipse * foreground
        else:
            protect = ellipse
    else:
        protect = ellipse

    protect = protect * protect_strength

    # Only pull the base back where the composited image has clearly diverged
    # from the base (i.e. the scarf actually drew there).
    delta = np.mean(np.abs(composed.astype(np.int32) - base_image.astype(np.int32)), axis=2)
    activation = np.clip(delta / 30.0, 0.0, 1.0).astype(np.float32)

    weight = (protect * activation)[..., None]
    return (
        composed.astype(np.float32) * (1.0 - weight) + base_image.astype(np.float32) * weight
    ).astype(np.uint8)
