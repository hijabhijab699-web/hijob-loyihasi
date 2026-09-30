"""T-A1..T-A5 · MediaPipe landmark extractor tests."""
from __future__ import annotations

import time

import numpy as np
import pytest

from app.services.landmarks import get_extractor
from app.services.template import build_template


# ─── T-A1 · Ideal front-view returns full 478 landmark set ─────────────────


def test_landmark_count_full_478(face_good):
    extractor = get_extractor()
    result = extractor.detect(face_good)

    assert result.detected is True
    # refine_landmarks=True adds iris + lips → 478 points
    assert len(result.landmarks_2d) == 478
    assert len(result.landmarks_3d) == 478
    assert result.bbox is not None
    # bbox coordinates are normalised
    x, y, w, h = result.bbox
    assert 0.0 <= x <= 1.0
    assert 0.0 <= y <= 1.0
    assert 0.05 < w < 1.0
    assert 0.05 < h < 1.0


def test_landmarks_are_normalised(face_good):
    extractor = get_extractor()
    result = extractor.detect(face_good)
    xs = [p[0] for p in result.landmarks_2d]
    ys = [p[1] for p in result.landmarks_2d]
    # normalised coords must sit inside [0,1] (with tiny tolerance for iris outliers)
    assert min(xs) > -0.05
    assert max(xs) < 1.05
    assert min(ys) > -0.05
    assert max(ys) < 1.05


# ─── T-A2 · No face → detected=False (fallback path) ───────────────────────


def test_no_face_returns_empty_landmarks(no_face):
    extractor = get_extractor()
    result = extractor.detect(no_face)
    assert result.detected is False
    assert result.landmarks_2d == []


def test_build_template_raises_on_no_face(no_face):
    """The public template builder must reject inputs without a face."""
    with pytest.raises(ValueError, match="NO_FACE_IN_FRONT_VIEW"):
        build_template(no_face)


# ─── T-A3 · Multiple views handled — one missing view surfaces as a warning ────


def test_full_template_with_missing_side_views(face_good):
    """Only a front is required; left/right absence should show up in warnings, not errors."""
    tpl = build_template(front=face_good, left=None, right=None)
    assert tpl.status == "ready"
    front_view = next(v for v in tpl.views if v.view == "front")
    assert front_view.detected is True
    assert len(front_view.landmarks_2d) == 478
    assert "MISSING_LEFT_VIEW" in tpl.warnings
    assert "MISSING_RIGHT_VIEW" in tpl.warnings


def test_side_view_included_when_face_present(face_good):
    """When we pass the front image as a stand-in for the side, it must slot in as an extra view."""
    tpl = build_template(front=face_good, left=face_good, right=None)
    left_view = next(v for v in tpl.views if v.view == "left")
    assert left_view.detected is True
    assert len(left_view.landmarks_2d) == 478
    assert "MISSING_LEFT_VIEW" not in tpl.warnings
    assert "MISSING_RIGHT_VIEW" in tpl.warnings


# ─── T-A4 · Low-light photos still succeed OR degrade gracefully ───────────


def test_low_light_face(face_lowlight):
    """MediaPipe should degrade gracefully — at worst it fails detection cleanly."""
    extractor = get_extractor()
    result = extractor.detect(face_lowlight)
    # Either it detects (great) or it clearly reports failure — no crash.
    if result.detected:
        assert len(result.landmarks_2d) == 478


# ─── T-A5 · Latency budget: <500 ms for a single-view extraction ───────────


def test_latency_below_500ms(face_good):
    extractor = get_extractor()
    # Warm-up run so the graph is JIT-compiled.
    extractor.detect(face_good)

    started = time.perf_counter()
    extractor.detect(face_good)
    elapsed_ms = (time.perf_counter() - started) * 1000

    assert elapsed_ms < 500, f"landmark detection took {elapsed_ms:.0f} ms (SLA 500 ms)"


def test_template_build_latency(face_good):
    """Full template (landmarks + segmentation + tone) must stay under 1500 ms."""
    # Warm-up
    build_template(face_good)

    started = time.perf_counter()
    build_template(face_good)
    elapsed_ms = (time.perf_counter() - started) * 1000

    assert elapsed_ms < 1500, f"template build took {elapsed_ms:.0f} ms (SLA 1500 ms)"


# ─── Additional: template quality checks ───────────────────────────────────


def test_skin_tone_reasonable(face_good):
    tpl = build_template(face_good)
    hex_color = tpl.skin_tone.hex
    assert hex_color.startswith("#") and len(hex_color) == 7
    # LAB L* channel between 20 (very dark) and 95 (very light)
    L = tpl.skin_tone.lab[0]
    assert 20 < L < 95, f"skin tone L* out of plausible range: {L}"


def test_proportions_within_range(face_good):
    tpl = build_template(face_good)
    p = tpl.proportions
    # Ratios should never be negative and typically < 2
    for value in (p.head_width, p.head_height, p.eye_distance, p.chin_to_eyes):
        assert 0 < value < 2, f"proportion out of range: {value}"


def test_head_mask_is_valid_png(face_good):
    import base64

    tpl = build_template(face_good)
    assert tpl.head_mask_png_base64 is not None
    raw = base64.b64decode(tpl.head_mask_png_base64)
    assert raw[:8] == b"\x89PNG\r\n\x1a\n", "head mask is not a valid PNG"
    assert len(raw) > 1000
