"""Sprint 3 · Template-based compositor tests (TPS warp + alpha blend + tint)."""
from __future__ import annotations

import json
import time
from pathlib import Path

import cv2
import numpy as np
import pytest

from app.models import ScarfSpec
from app.services.template_compose import (
    _extract_template_anchors,
    _extract_user_anchors,
    _tint_bgra_inplace,
    compose_scarf_template,
)
from app.services.warp import apply_tps


# ─── TPS warp: identity + non-identity round trip ─────────────────────────


def test_tps_identity_returns_same_image():
    """Same source and target points should approximate an identity transform."""
    img = np.random.default_rng(0).integers(0, 255, (200, 200, 3), dtype=np.uint8)
    corners = np.array(
        [[0, 0], [199, 0], [199, 199], [0, 199], [100, 100]], dtype=np.float32
    )
    out = apply_tps(img, corners, corners, output_size=(200, 200))
    # Not byte-equal because of interpolation on the borders, but bulk of the image
    # should stay the same.
    diff = np.mean(np.abs(out.astype(np.int32) - img.astype(np.int32)))
    assert diff < 3, f"identity TPS moved pixels by mean {diff:.2f}"


def test_tps_shift_moves_content():
    """Shifting all target points by +20px must produce a visibly different image."""
    img = np.zeros((200, 200, 3), dtype=np.uint8)
    cv2.rectangle(img, (80, 80), (120, 120), (255, 255, 255), -1)
    corners = np.array(
        [[0, 0], [199, 0], [199, 199], [0, 199], [100, 100]], dtype=np.float32
    )
    shifted = corners.copy()
    shifted[:, 0] += 20
    out = apply_tps(img, corners, shifted, output_size=(200, 200))
    diff = np.mean(np.abs(out.astype(np.int32) - img.astype(np.int32)))
    assert diff > 3, f"TPS did not visibly move the rectangle (diff {diff:.2f})"


# ─── Anchor helpers produce sensible geometry ─────────────────────────────


def test_template_anchors_shape(template_landmarks):
    anchors = _extract_template_anchors(template_landmarks, 1200, 1600)
    assert anchors.shape == (8, 2)
    # Every anchor should sit inside (or right on the edge of) the 1200×1600 canvas.
    assert anchors[:, 0].min() >= -1
    assert anchors[:, 0].max() <= 1201
    assert anchors[:, 1].min() >= -1
    assert anchors[:, 1].max() <= 1601


def test_user_anchors_are_consistent(face_landmarks_px):
    anchors = _extract_user_anchors(face_landmarks_px)
    assert anchors.shape == (8, 2)
    # Face centre should sit between the left/right shoulder anchors on x.
    left, right = anchors[2], anchors[3]  # drape_left, drape_right
    center = anchors[0]
    assert left[0] < center[0] < right[0]
    # Hair top must be above the face-bbox top-left corner.
    assert anchors[1][1] < anchors[4][1]


# ─── LAB tint keeps luminosity but shifts hue ─────────────────────────────


def test_tint_changes_colour_not_alpha():
    bgra = np.zeros((32, 32, 4), dtype=np.uint8)
    bgra[..., :3] = (200, 180, 160)  # neutral warm grey
    bgra[..., 3] = 255

    tinted = _tint_bgra_inplace(bgra.copy(), target_bgr=(30, 60, 200))  # olive→red-ish
    # Alpha preserved.
    assert np.array_equal(tinted[..., 3], bgra[..., 3])
    # BGR shifted noticeably.
    diff = np.mean(np.abs(tinted[..., :3].astype(np.int32) - bgra[..., :3].astype(np.int32)))
    assert diff > 15, f"tint didn't move colour enough (diff {diff:.2f})"


# ─── Full template compose pipeline ───────────────────────────────────────


def test_template_compose_returns_image(face_image, face_landmarks_px, template_canonical, template_landmarks):
    spec = ScarfSpec(tying_style="classical", color_hex="#8A8D5B")
    out = compose_scarf_template(
        user_image=face_image,
        user_landmarks_px=face_landmarks_px,
        template_canonical_bgra=template_canonical,
        template_landmarks=template_landmarks,
        spec=spec,
    )
    assert out.shape == face_image.shape
    assert out.dtype == np.uint8


def test_template_compose_alters_image(face_image, face_landmarks_px, template_canonical, template_landmarks):
    """A successful template compose must produce a noticeably different picture."""
    spec = ScarfSpec(tying_style="classical", color_hex="#8A8D5B")
    out = compose_scarf_template(
        user_image=face_image,
        user_landmarks_px=face_landmarks_px,
        template_canonical_bgra=template_canonical,
        template_landmarks=template_landmarks,
        spec=spec,
    )
    diff = np.mean(np.abs(out.astype(np.int32) - face_image.astype(np.int32)))
    assert diff > 3.0, f"template compose barely changed the base image ({diff:.2f})"


def test_template_compose_different_colors(
    face_image, face_landmarks_px, template_canonical, template_landmarks
):
    """Two different colour choices must produce different outputs."""
    beige = compose_scarf_template(
        face_image,
        face_landmarks_px,
        template_canonical,
        template_landmarks,
        ScarfSpec(tying_style="classical", color_hex="#D4C3A0"),
    )
    olive = compose_scarf_template(
        face_image,
        face_landmarks_px,
        template_canonical,
        template_landmarks,
        ScarfSpec(tying_style="classical", color_hex="#8A8D5B"),
    )
    diff = np.mean(np.abs(beige.astype(np.int32) - olive.astype(np.int32)))
    assert diff > 3.0, f"colour swap produced almost identical images ({diff:.2f})"


def test_template_compose_latency(
    face_image, face_landmarks_px, template_canonical, template_landmarks
):
    spec = ScarfSpec(tying_style="classical", color_hex="#8A8D5B")
    # Warm-up
    compose_scarf_template(face_image, face_landmarks_px, template_canonical, template_landmarks, spec)

    started = time.perf_counter()
    compose_scarf_template(face_image, face_landmarks_px, template_canonical, template_landmarks, spec)
    elapsed_ms = (time.perf_counter() - started) * 1000
    # TPS + tint + blend on a big image. Budget: 1.5s.
    assert elapsed_ms < 1500, f"template compose took {elapsed_ms:.0f} ms (SLA 1500 ms)"


def test_template_compose_rejects_bad_input(face_image, template_canonical, template_landmarks):
    """Passing non-BGRA template must fail cleanly."""
    grayscale = np.zeros((100, 100), dtype=np.uint8)
    with pytest.raises(ValueError, match="TEMPLATE_MUST_BE_BGRA"):
        compose_scarf_template(
            user_image=face_image,
            user_landmarks_px=np.zeros((478, 2), dtype=np.int32),
            template_canonical_bgra=grayscale,  # type: ignore[arg-type]
            template_landmarks=template_landmarks,
            spec=ScarfSpec(tying_style="classical", color_hex="#000000"),
        )
