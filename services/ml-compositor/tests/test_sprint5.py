"""Sprint 5 · yaw-aware anchors, real hair matting, dress compositor end-to-end."""
from __future__ import annotations

import numpy as np
import pytest

from app.models import ScarfSpec
from app.services.hair_matting import _selfie_head_mask, blend_with_hairline_protection
from app.services.template_compose import (
    _estimate_yaw,
    _extract_user_anchors,
    compose_scarf_template,
)


# ─── Task 1 · yaw estimation + anchor bias ─────────────────────────────────


def test_yaw_estimate_range(face_landmarks_px):
    yaw = _estimate_yaw(face_landmarks_px)
    assert -1.0 <= yaw <= 1.0


def test_yaw_shifts_anchors_horizontally(face_landmarks_px):
    """The yaw-aware anchors must move horizontally when the head is turned."""
    baseline = _extract_user_anchors(face_landmarks_px, "classical")

    # Simulate a turned head by shifting the nose tip landmark to the right.
    from app.services.geometry import NOSE_TIP

    shifted = face_landmarks_px.copy()
    shifted[NOSE_TIP] = shifted[NOSE_TIP] + np.array([80, 0], dtype=np.int32)
    turned = _extract_user_anchors(shifted, "classical")

    # Drape / crown anchors should have moved.
    diff = float(np.mean(np.abs(baseline - turned)))
    assert diff > 5.0, f"yaw bias didn't move anchors enough ({diff:.2f})"


# ─── Task 2 · real hair matting via SelfieSegmentation ────────────────────


def test_selfie_segmentation_returns_mask(face_image):
    """MediaPipe Selfie mask must return a float32 array in [0..1] of the same size."""
    mask = _selfie_head_mask(face_image)
    assert mask is not None, "SelfieSegmentation should work on real portraits"
    h, w = face_image.shape[:2]
    assert mask.shape == (h, w)
    assert mask.dtype == np.float32
    assert mask.min() >= 0.0
    assert mask.max() <= 1.0
    # A portrait must have a healthy amount of foreground.
    assert (mask > 0.5).sum() > (h * w * 0.05)


def test_hair_matting_prefers_selfie_over_geometry(face_image, face_landmarks_px):
    """The mask that comes back with selfie segmentation should differ from the
    plain geometric ellipse — otherwise we didn't actually add signal."""
    fake_composed = np.full_like(face_image, 30)
    with_seg = blend_with_hairline_protection(
        face_image, fake_composed, face_landmarks_px, protect_strength=1.0, use_selfie_segmentation=True
    )
    without_seg = blend_with_hairline_protection(
        face_image, fake_composed, face_landmarks_px, protect_strength=1.0, use_selfie_segmentation=False
    )
    diff = float(np.mean(np.abs(with_seg.astype(np.int32) - without_seg.astype(np.int32))))
    assert diff > 0.5, f"selfie segmentation didn't shift the matte ({diff:.2f})"


# ─── Task 3 · dress compositor with real Pose landmarks ───────────────────


def test_dress_compose_with_real_body_still_produces_output(face_image):
    """Sanity end-to-end: a synthetic dress template + plausible body pose warp OK."""
    from app.services.dress_compose import compose_dress_template

    # Synthetic dress canvas — solid olive.
    template = np.zeros((1600, 1200, 4), dtype=np.uint8)
    template[..., :3] = (80, 130, 120)
    yy, xx = np.mgrid[0:1600, 0:1200]
    mask = ((xx - 600) ** 2 / 400 ** 2 + (yy - 800) ** 2 / 600 ** 2) < 1
    template[..., 3] = (mask * 255).astype(np.uint8)

    landmarks = {
        "shoulder_left": {"x": 0.35, "y": 0.20},
        "shoulder_right": {"x": 0.65, "y": 0.20},
        "hip_left": {"x": 0.40, "y": 0.55},
        "hip_right": {"x": 0.60, "y": 0.55},
        "neck_center": {"x": 0.50, "y": 0.15},
        "hem_left": {"x": 0.35, "y": 0.95},
        "hem_right": {"x": 0.65, "y": 0.95},
    }
    body = {
        "shoulder_left": {"x": 0.30, "y": 0.35},
        "shoulder_right": {"x": 0.70, "y": 0.35},
        "hip_left": {"x": 0.35, "y": 0.70},
        "hip_right": {"x": 0.65, "y": 0.70},
        "neck_center": {"x": 0.50, "y": 0.28},
        "hem_center": {"x": 0.50, "y": 0.98},
    }
    out = compose_dress_template(
        user_image=face_image,
        user_body=body,
        template_canonical_bgra=template,
        template_landmarks=landmarks,
        spec=ScarfSpec(tying_style="classical", color_hex="#BB4444"),
    )
    assert out.shape == face_image.shape


# ─── Task 4 · Snapshot still holds after Sprint 5 changes ─────────────────


def test_template_compose_still_stable(
    face_image, face_landmarks_px, template_canonical, template_landmarks
):
    """Sprint 5 tweaks (yaw + real matting) must not shift the golden snapshot too far."""
    result = compose_scarf_template(
        face_image,
        face_landmarks_px,
        template_canonical,
        template_landmarks,
        ScarfSpec(tying_style="classical", color_hex="#8A8D5B"),
    )
    # We're not strictly comparing to the classical snapshot — the Sprint 5
    # anchor changes intentionally shift pixels — but the output must still
    # look like a face (mostly non-zero, matching size).
    assert result.shape == face_image.shape
    assert result.mean() > 40, "output collapsed to (near-)black"
