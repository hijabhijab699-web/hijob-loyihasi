"""Sprint 4 · style-specific anchors, hair matting, dress compositor,
plus a lightweight visual-regression check that snapshots stay stable."""
from __future__ import annotations

import json
import time
from pathlib import Path

import cv2
import numpy as np
import pytest

from app.models import ScarfSpec
from app.services.dress_compose import (
    REQUIRED_BODY_KEYS,
    compose_dress_template,
)
from app.services.hair_matting import (
    blend_with_hairline_protection,
    build_forehead_protect_mask,
)
from app.services.template_compose import (
    _STYLE_PRESETS,
    _extract_user_anchors,
    compose_scarf_template,
)


FIXTURES = Path(__file__).parent / "fixtures"
SNAPSHOTS = FIXTURES / "snapshots"
SNAPSHOTS.mkdir(exist_ok=True)


# ─── Task 1 · Style-specific anchors ──────────────────────────────────────


def test_style_presets_registered():
    """All tying styles have their own anchor recipe."""
    assert set(_STYLE_PRESETS.keys()) == {"classical", "loose", "double"}


def test_style_anchors_differ(face_landmarks_px):
    """Each preset must produce a distinct anchor set — otherwise TPS output is identical."""
    anchors = {
        style: _extract_user_anchors(face_landmarks_px, style)
        for style in ("classical", "loose", "double")
    }
    for s1 in anchors:
        for s2 in anchors:
            if s1 == s2:
                continue
            diff = np.mean(np.abs(anchors[s1] - anchors[s2]))
            assert diff > 5.0, f"{s1} vs {s2} anchors nearly identical (diff {diff:.2f})"


def test_style_specific_compose_differs(
    face_image, face_landmarks_px, template_canonical, template_landmarks
):
    """Different tying styles should produce visibly different composites."""
    outs = {}
    for style in ("classical", "loose", "double"):
        outs[style] = compose_scarf_template(
            face_image,
            face_landmarks_px,
            template_canonical,
            template_landmarks,
            ScarfSpec(tying_style=style, color_hex="#8A8D5B"),
        )
    for s1, s2 in [("classical", "loose"), ("classical", "double"), ("loose", "double")]:
        diff = np.mean(np.abs(outs[s1].astype(np.int32) - outs[s2].astype(np.int32)))
        assert diff > 1.5, f"{s1} vs {s2} composites too similar (diff {diff:.2f})"


# ─── Task 2 · Hair matting ────────────────────────────────────────────────


def test_protect_mask_covers_forehead(face_image, face_landmarks_px):
    h, w = face_image.shape[:2]
    mask = build_forehead_protect_mask((h, w), face_landmarks_px)
    assert mask.shape == (h, w)
    assert mask.dtype == np.float32
    assert mask.max() > 0.5, "protect mask should have real coverage"
    # Mask should sit predominantly above the mid-face y coordinate.
    ys = np.where(mask > 0.3)[0]
    assert ys.size > 0
    # top-heavy: median row < half the image height
    assert np.median(ys) < h * 0.6


def test_hair_matting_disabled_pass_through(face_image, face_landmarks_px):
    """protect_strength=0 must return the composite untouched."""
    fake_composed = np.zeros_like(face_image)
    fake_composed[:] = (100, 100, 100)
    out = blend_with_hairline_protection(
        base_image=face_image,
        composed=fake_composed,
        user_landmarks_px=face_landmarks_px,
        protect_strength=0.0,
    )
    assert np.array_equal(out, fake_composed)


def test_hair_matting_restores_forehead(face_image, face_landmarks_px):
    """Inside the forehead ellipse, blended output should look more like the base
    image than the composited one. We check only that region — outside of it the
    matting is intentionally a no-op."""
    fake_composed = np.zeros_like(face_image)  # all black — completely different
    out = blend_with_hairline_protection(
        base_image=face_image,
        composed=fake_composed,
        user_landmarks_px=face_landmarks_px,
        protect_strength=1.0,
    )

    protect = build_forehead_protect_mask(face_image.shape[:2], face_landmarks_px)
    inside = protect > 0.5
    assert inside.sum() > 100, "protect mask must cover real pixels"

    base_diff = np.mean(np.abs(out[inside].astype(np.int32) - face_image[inside].astype(np.int32)))
    composed_diff = np.mean(
        np.abs(out[inside].astype(np.int32) - fake_composed[inside].astype(np.int32))
    )
    assert base_diff < composed_diff, (
        f"hair matting failed inside the protect mask "
        f"(base_diff={base_diff:.1f}, composed_diff={composed_diff:.1f})"
    )


# ─── Task 3 · Dress compositor ────────────────────────────────────────────


@pytest.fixture(scope="session")
def synthetic_dress_template() -> np.ndarray:
    """Small solid-colour BGRA canvas that acts as a dress template for the tests."""
    template = np.zeros((1600, 1200, 4), dtype=np.uint8)
    # Solid olive with soft round mask.
    template[..., :3] = (80, 130, 120)
    yy, xx = np.mgrid[0:1600, 0:1200]
    mask = ((xx - 600) ** 2 / 400 ** 2 + (yy - 800) ** 2 / 600 ** 2) < 1
    template[..., 3] = (mask * 255).astype(np.uint8)
    return template


@pytest.fixture(scope="session")
def synthetic_dress_landmarks() -> dict:
    return {
        "shoulder_left": {"x": 0.35, "y": 0.20},
        "shoulder_right": {"x": 0.65, "y": 0.20},
        "hip_left": {"x": 0.40, "y": 0.55},
        "hip_right": {"x": 0.60, "y": 0.55},
        "neck_center": {"x": 0.50, "y": 0.15},
        "hem_left": {"x": 0.35, "y": 0.95},
        "hem_right": {"x": 0.65, "y": 0.95},
    }


def _placeholder_user_body(w: int, h: int) -> dict:
    """Plausible body landmarks in normalised coords for the fixture face image."""
    return {
        "shoulder_left": {"x": 0.30, "y": 0.35},
        "shoulder_right": {"x": 0.70, "y": 0.35},
        "hip_left": {"x": 0.35, "y": 0.70},
        "hip_right": {"x": 0.65, "y": 0.70},
        "neck_center": {"x": 0.50, "y": 0.28},
        "hem_center": {"x": 0.50, "y": 0.98},
    }


def test_dress_compose_requires_all_body_keys(
    face_image, synthetic_dress_template, synthetic_dress_landmarks
):
    with pytest.raises(ValueError, match="MISSING_BODY_KEYS"):
        compose_dress_template(
            user_image=face_image,
            user_body={"shoulder_left": {"x": 0.3, "y": 0.3}},
            template_canonical_bgra=synthetic_dress_template,
            template_landmarks=synthetic_dress_landmarks,
            spec=ScarfSpec(tying_style="classical", color_hex="#8A8D5B"),
        )


def test_dress_compose_produces_output(
    face_image, synthetic_dress_template, synthetic_dress_landmarks
):
    body = _placeholder_user_body(face_image.shape[1], face_image.shape[0])
    out = compose_dress_template(
        user_image=face_image,
        user_body=body,
        template_canonical_bgra=synthetic_dress_template,
        template_landmarks=synthetic_dress_landmarks,
        spec=ScarfSpec(tying_style="classical", color_hex="#8A8D5B"),
    )
    assert out.shape == face_image.shape
    diff = np.mean(np.abs(out.astype(np.int32) - face_image.astype(np.int32)))
    assert diff > 1.0, "dress compose barely altered the base image"


def test_dress_compose_latency(
    face_image, synthetic_dress_template, synthetic_dress_landmarks
):
    body = _placeholder_user_body(face_image.shape[1], face_image.shape[0])
    spec = ScarfSpec(tying_style="classical", color_hex="#8A8D5B")
    compose_dress_template(face_image, body, synthetic_dress_template, synthetic_dress_landmarks, spec)

    started = time.perf_counter()
    compose_dress_template(face_image, body, synthetic_dress_template, synthetic_dress_landmarks, spec)
    elapsed_ms = (time.perf_counter() - started) * 1000
    assert elapsed_ms < 1500


def test_required_body_keys_exposed():
    """The client needs to know which keys to send us — surface them as a constant."""
    for key in ("shoulder_left", "shoulder_right", "hip_left", "hip_right", "neck_center", "hem_center"):
        assert key in REQUIRED_BODY_KEYS


# ─── Task 4 · Visual regression ───────────────────────────────────────────

# Two golden snapshots per style. First test-run writes them; subsequent runs
# compare against them and fail if the average absolute pixel difference exceeds
# the tolerance below. Delete files under fixtures/snapshots to rebaseline.

VISUAL_TOLERANCE = 1.5  # mean absolute BGR difference per pixel


@pytest.mark.parametrize("style", ["classical", "loose", "double"])
def test_visual_snapshot_stable(
    face_image, face_landmarks_px, template_canonical, template_landmarks, style
):
    spec = ScarfSpec(tying_style=style, color_hex="#8A8D5B")
    result = compose_scarf_template(
        face_image, face_landmarks_px, template_canonical, template_landmarks, spec
    )

    snapshot_path = SNAPSHOTS / f"scarf-{style}.jpg"
    if not snapshot_path.exists():
        cv2.imwrite(str(snapshot_path), result, [cv2.IMWRITE_JPEG_QUALITY, 92])
        pytest.skip(f"seeded {snapshot_path.name}")

    prior = cv2.imread(str(snapshot_path))
    assert prior is not None, f"could not read {snapshot_path}"
    assert prior.shape == result.shape

    diff = float(np.mean(np.abs(prior.astype(np.int32) - result.astype(np.int32))))
    assert diff < VISUAL_TOLERANCE, (
        f"{style} snapshot regression: mean diff {diff:.2f} > tol {VISUAL_TOLERANCE}. "
        "Delete the snapshot to rebaseline if the change is intentional."
    )
