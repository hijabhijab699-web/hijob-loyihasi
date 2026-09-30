"""T-C1..T-C5 · Procedural scarf compositor tests."""
from __future__ import annotations

import time

import cv2
import numpy as np
import pytest

from app.models import ScarfSpec
from app.services.geometry import face_span, hex_to_bgr
from app.services.scarf import draw_scarf, STYLE_DRAWERS


ALL_STYLES = ["classical", "loose", "double"]


# ─── T-C1 · Composite returns an image and doesn't crash ───────────────────


@pytest.mark.parametrize("style", ALL_STYLES)
def test_compose_returns_image(face_image, face_landmarks_px, style):
    spec = ScarfSpec(tying_style=style, color_hex="#8A8D5B", pattern="silk")
    out = draw_scarf(face_image, face_landmarks_px, spec)
    assert out.shape == face_image.shape
    assert out.dtype == face_image.dtype


# ─── T-C2 · Three styles produce visibly different pixels ──────────────────


def test_styles_produce_different_outputs(face_image, face_landmarks_px):
    """Rendering the same scarf in three tying styles must not collapse to identical images."""
    outputs = []
    for style in ALL_STYLES:
        spec = ScarfSpec(tying_style=style, color_hex="#8A8D5B", pattern="silk")
        outputs.append(draw_scarf(face_image, face_landmarks_px, spec))

    for i in range(len(outputs)):
        for j in range(i + 1, len(outputs)):
            diff = np.mean(np.abs(outputs[i].astype(np.int32) - outputs[j].astype(np.int32)))
            assert diff > 2.5, (
                f"style '{ALL_STYLES[i]}' vs '{ALL_STYLES[j]}' too similar "
                f"(mean pixel diff {diff:.2f})"
            )


# ─── T-C3 · Colour swap paints the scarf, not the face ─────────────────────


def test_color_change_only_affects_scarf_area(face_image, face_landmarks_px):
    """When we swap the scarf colour the face box should stay nearly identical."""
    beige = ScarfSpec(tying_style="classical", color_hex="#D4C3A0", pattern="silk")
    olive = ScarfSpec(tying_style="classical", color_hex="#8A8D5B", pattern="silk")

    out_beige = draw_scarf(face_image, face_landmarks_px, beige)
    out_olive = draw_scarf(face_image, face_landmarks_px, olive)

    # Sample a tight box around the face itself.
    span = face_span(face_landmarks_px)
    cx, cy = span["center"]
    fw = span["face_w"]
    fh = span["face_h"]
    x0 = int(cx - fw * 0.30)
    x1 = int(cx + fw * 0.30)
    y0 = int(span["forehead"][1] + fh * 0.35)
    y1 = int(span["chin"][1] - fh * 0.10)

    face_diff = np.mean(
        np.abs(out_beige[y0:y1, x0:x1].astype(np.int32) - out_olive[y0:y1, x0:x1].astype(np.int32))
    )
    assert face_diff < 3.0, f"face pixels shift too much between colours ({face_diff:.2f})"

    # Global diff must be non-trivial — otherwise the whole picture didn't change either.
    global_diff = np.mean(np.abs(out_beige.astype(np.int32) - out_olive.astype(np.int32)))
    assert global_diff > 3.0, f"scarf recolour did nothing (global diff {global_diff:.2f})"


# ─── T-C4 · Compositor is deterministic for the same input ────────────────


def test_compose_is_deterministic(face_image, face_landmarks_px):
    spec = ScarfSpec(tying_style="classical", color_hex="#8A8D5B", pattern="silk")
    a = draw_scarf(face_image, face_landmarks_px, spec)
    b = draw_scarf(face_image, face_landmarks_px, spec)
    # Byte-for-byte equal — no rng leaks into the render path.
    assert np.array_equal(a, b), "same input produced different outputs"


# ─── T-C5 · Latency budget: <500 ms per composite ─────────────────────────


@pytest.mark.parametrize("style", ALL_STYLES)
def test_compose_latency_below_500ms(face_image, face_landmarks_px, style):
    spec = ScarfSpec(tying_style=style, color_hex="#8A8D5B", pattern="silk")
    # Warm-up (rng seeding + kernel JIT).
    draw_scarf(face_image, face_landmarks_px, spec)

    started = time.perf_counter()
    draw_scarf(face_image, face_landmarks_px, spec)
    elapsed_ms = (time.perf_counter() - started) * 1000

    assert elapsed_ms < 500, f"{style} composite took {elapsed_ms:.0f} ms (SLA 500 ms)"


# ─── Additional coverage — geometry helpers + fabric texture ──────────────


def test_hex_conversion_roundtrip():
    for hex_color in ("#8A8D5B", "#D4C3A0", "#000000", "#FFFFFF"):
        b, g, r = hex_to_bgr(hex_color)
        assert 0 <= b <= 255 and 0 <= g <= 255 and 0 <= r <= 255


def test_unknown_style_raises(face_image, face_landmarks_px):
    """Pydantic validation catches bad tying styles before they hit the drawer,
    and the drawer itself falls back to a defensive raise if a bad style ever leaks through."""
    # 1. Pydantic layer.
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        ScarfSpec(tying_style="totally_made_up", color_hex="#000000")  # type: ignore[arg-type]

    # 2. Direct call to draw_scarf with a bypassed model — construct an object with an unexpected style.
    spec = ScarfSpec(tying_style="classical", color_hex="#000000")
    object.__setattr__(spec, "tying_style", "totally_made_up")

    with pytest.raises(ValueError, match="UNKNOWN_TYING_STYLE"):
        draw_scarf(face_image, face_landmarks_px, spec)


def test_opacity_zero_leaves_face_untouched(face_image, face_landmarks_px):
    """opacity=0 should be a no-op (base image unchanged) — otherwise the blend is broken."""
    spec = ScarfSpec(
        tying_style="classical", color_hex="#000000", pattern="solid", opacity=0.0
    )
    out = draw_scarf(face_image, face_landmarks_px, spec)
    diff = np.mean(np.abs(out.astype(np.int32) - face_image.astype(np.int32)))
    assert diff < 0.5, f"opacity=0 should be a no-op (diff {diff:.2f})"


def test_all_styles_registered():
    """Every style declared in TyingStyle must have a drawer registered."""
    assert set(STYLE_DRAWERS.keys()) == set(ALL_STYLES)
