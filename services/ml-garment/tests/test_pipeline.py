"""T-B1..T-B5 · Garment template pipeline (rembg + landmarks + canvas)."""
from __future__ import annotations

import base64
import time

import cv2
import numpy as np
import pytest

from app.config import settings
from app.models import DressLandmarks, ScarfLandmarks
from app.services.canvas import normalize
from app.services.dress import extract_dress_landmarks
from app.services.palette import dominant_colors
from app.services.scarf import extract_scarf_landmarks
from app.services.segmentation import remove_background
from app.services.template import build_template


# ─── T-B1 · Background removal returns matching mask + BGRA ────────────────


def test_rembg_mask_shape_matches_image(scarf_image):
    canonical_bgra, mask = remove_background(scarf_image)
    assert canonical_bgra.shape[:2] == scarf_image.shape[:2]
    assert canonical_bgra.shape[2] == 4
    assert mask.shape == scarf_image.shape[:2]
    assert mask.dtype == np.uint8


def test_rembg_mask_has_foreground(scarf_image):
    _, mask = remove_background(scarf_image)
    fg_ratio = float((mask > 20).sum()) / mask.size
    # A model-in-frame photo must give us at least a few percent foreground.
    assert 0.05 < fg_ratio < 0.95, f"unusual mask coverage: {fg_ratio:.2%}"


# ─── T-B2 · Scarf landmarks — face detected + drape sits on the fabric ────


def test_scarf_landmarks_face_detected(scarf_image):
    _, mask = remove_background(scarf_image)
    lm = extract_scarf_landmarks(scarf_image, mask)
    assert isinstance(lm, ScarfLandmarks)
    assert lm.detected_face is True

    # Face opening should be roughly centred and above the fabric midline.
    assert 0.3 < lm.face_opening_center.x < 0.7
    assert 0.2 < lm.face_opening_center.y < 0.75

    # Drape points sit at the same y and on opposite sides of the frame.
    assert lm.drape_left.x < lm.drape_right.x
    assert abs(lm.drape_left.y - lm.drape_right.y) < 0.01


def test_scarf_no_face_falls_back_gracefully(empty_image):
    """A flat-lay (or garbage) image must not throw — the service falls back to mask centre."""
    _, mask = remove_background(empty_image)
    lm = extract_scarf_landmarks(empty_image, mask)
    # detected_face may be false; the important thing is we still get a template.
    assert isinstance(lm, ScarfLandmarks)
    assert 0.0 <= lm.face_opening_center.x <= 1.0
    assert 0.0 <= lm.face_opening_center.y <= 1.0


# ─── T-B3 · Dress landmarks — pose may or may not fire, but keys are valid ─


def test_dress_landmarks_shape(dress_image):
    _, mask = remove_background(dress_image)
    lm = extract_dress_landmarks(dress_image, mask)
    assert isinstance(lm, DressLandmarks)
    # Every point normalised.
    for point in (
        lm.shoulder_left,
        lm.shoulder_right,
        lm.hip_left,
        lm.hip_right,
        lm.neck_center,
        lm.hem_left,
        lm.hem_right,
    ):
        assert 0.0 <= point.x <= 1.0, f"{point} x out of range"
        assert 0.0 <= point.y <= 1.0, f"{point} y out of range"

    # Anatomy sanity: shoulders sit above hips.
    assert lm.shoulder_left.y < lm.hip_left.y


# ─── T-B4 · Canvas normalisation puts the mask on the expected canvas ─────


def test_canvas_normalize_dimensions(scarf_image):
    bgra, mask = remove_background(scarf_image)
    canvas_bgra, canvas_mask, pose = normalize(bgra, mask)
    assert canvas_bgra.shape == (settings.canvas_height, settings.canvas_width, 4)
    assert canvas_mask.shape == (settings.canvas_height, settings.canvas_width)
    assert pose.canvas_width == settings.canvas_width
    assert pose.scale_factor > 0
    # Foreground should occupy a reasonable fraction of the canvas.
    fg = float((canvas_mask > 20).sum()) / canvas_mask.size
    assert 0.05 < fg < 0.85


# ─── T-B5 · Full pipeline latency + payload sanity ────────────────────────


def test_full_template_latency(scarf_image):
    # Warm-up so the ONNX session is loaded before we time.
    build_template(scarf_image, category="scarves")

    started = time.perf_counter()
    template = build_template(scarf_image, category="scarves")
    elapsed_ms = (time.perf_counter() - started) * 1000

    # rembg on CPU is heavy — allow up to 2 seconds; production GPUs will be far faster.
    assert elapsed_ms < 2000, f"full template took {elapsed_ms:.0f} ms (SLA 2000 ms)"

    # Canonical + mask are valid PNGs.
    canonical = base64.b64decode(template.canonical_png_base64)
    mask = base64.b64decode(template.mask_png_base64)
    assert canonical[:8] == b"\x89PNG\r\n\x1a\n"
    assert mask[:8] == b"\x89PNG\r\n\x1a\n"

    # Colour palette has 1-5 entries, all valid hex.
    assert 1 <= len(template.color_palette) <= 5
    for hex_color in template.color_palette:
        assert len(hex_color) == 7 and hex_color.startswith("#")


# ─── Palette + integration sanity ──────────────────────────────────────────


def test_palette_dominant_color_is_hex(scarf_image):
    _, mask = remove_background(scarf_image)
    palette = dominant_colors(scarf_image, mask, n=3)
    assert 1 <= len(palette) <= 3
    for c in palette:
        int(c[1:], 16)  # hex parse must not throw


def test_template_deterministic_landmarks(scarf_image):
    """Two runs on the same image should agree on landmark positions."""
    t1 = build_template(scarf_image, category="scarves")
    t2 = build_template(scarf_image, category="scarves")
    # Same shape, same categorical fields.
    assert t1.category == t2.category
    # Face-detection routes rely on TF Lite which is deterministic on the same input.
    assert t1.landmarks.model_dump() == t2.landmarks.model_dump()


def test_bag_category_uses_generic_landmarks(scarf_image):
    """Non-scarf/dress categories must not crash — bounding box only."""
    template = build_template(scarf_image, category="bags")
    assert template.category == "bags"
    assert template.landmarks.type == "generic"
