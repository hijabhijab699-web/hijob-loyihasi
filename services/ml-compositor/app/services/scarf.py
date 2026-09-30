"""Procedural scarf renderer.

Draws a hijab-style scarf that wraps the head, respecting the face oval landmarks.
Three tying styles are supported (classical / loose / double), each with a different
draping pattern. Every stroke is deterministic given the same landmarks + colour.
"""
from __future__ import annotations

import numpy as np
import cv2

from app.models import ScarfSpec, TyingStyle
from app.services.geometry import (
    FACE_OVAL_INDICES,
    darken,
    face_span,
    hex_to_bgr,
    lighten,
)


def _face_oval_polygon(landmarks_px: np.ndarray) -> np.ndarray:
    """Closed polygon of face-oval points, in the order MediaPipe defines them."""
    pts = landmarks_px[FACE_OVAL_INDICES]
    return pts.reshape(-1, 1, 2).astype(np.int32)


def _expand_head_polygon(landmarks_px: np.ndarray, expand: float) -> np.ndarray:
    """Enlarge the face oval outward from its centre — this is the scarf's outer edge."""
    span = face_span(landmarks_px)
    center = span["center"].astype(np.float32)
    pts = landmarks_px[FACE_OVAL_INDICES].astype(np.float32)
    vec = pts - center
    scaled = center + vec * expand
    return scaled.reshape(-1, 1, 2).astype(np.int32)


def _apply_fabric_texture(
    layer: np.ndarray, mask: np.ndarray, base_bgr: tuple[int, int, int], pattern: str
) -> np.ndarray:
    """Give the fabric a bit of depth: subtle noise + a soft top-light gradient."""
    h, w = layer.shape[:2]

    # Base fill.
    color_layer = np.full((h, w, 3), base_bgr, dtype=np.uint8)

    # Vertical shading gradient (lighter at top → darker at bottom).
    y_norm = np.linspace(1.06, 0.90, h, dtype=np.float32)[:, None]
    shade = (color_layer.astype(np.float32) * y_norm[..., None]).clip(0, 255).astype(np.uint8)

    if pattern == "silk":
        # Smoother high-key sheen.
        noise = np.random.default_rng(42).normal(0, 4, (h, w)).astype(np.float32)
        shade = (shade + noise[..., None]).clip(0, 255).astype(np.uint8)
    elif pattern == "chiffon":
        # Coarser cross-hatch texture.
        noise = np.random.default_rng(11).normal(0, 8, (h, w)).astype(np.float32)
        shade = (shade + noise[..., None]).clip(0, 255).astype(np.uint8)
    # solid: leave the gradient alone.

    # Apply the shaded fabric only where the mask says so.
    m3 = mask[..., None].astype(np.float32) / 255.0
    return (layer.astype(np.float32) * (1 - m3) + shade.astype(np.float32) * m3).astype(np.uint8)


def _draw_style_classical(
    canvas: np.ndarray,
    landmarks_px: np.ndarray,
    base_bgr: tuple[int, int, int],
    pattern: str,
) -> np.ndarray:
    """Classic wrap: covers the top of the head, sides, and drapes down over the shoulders."""
    h, w = canvas.shape[:2]
    span = face_span(landmarks_px)

    # 1. Base head coverage — expand face oval outward.
    outer = _expand_head_polygon(landmarks_px, expand=1.55)
    inner = _face_oval_polygon(landmarks_px)  # face opening

    # Extend outer polygon down onto the shoulders so the scarf drapes.
    drape_left = np.array([[int(span["left"][0] - span["face_w"] * 0.35), min(h - 1, int(span["chin"][1] + span["face_h"] * 1.4))]], dtype=np.int32)
    drape_right = np.array([[int(span["right"][0] + span["face_w"] * 0.35), min(h - 1, int(span["chin"][1] + span["face_h"] * 1.4))]], dtype=np.int32)

    outer_flat = outer.reshape(-1, 2)
    # Insert drape points at the widest waist positions.
    # Simpler: build a manual outer path.
    top_of_head = landmarks_px[10].copy()
    top_of_head[1] = max(0, int(top_of_head[1] - span["face_h"] * 0.55))

    outer_path = np.array([
        [int(span["left"][0] - span["face_w"] * 0.30), int(span["left"][1])],
        [int(span["left"][0] - span["face_w"] * 0.42), int(span["forehead"][1] - span["face_h"] * 0.10)],
        [int(top_of_head[0]), int(top_of_head[1])],
        [int(span["right"][0] + span["face_w"] * 0.42), int(span["forehead"][1] - span["face_h"] * 0.10)],
        [int(span["right"][0] + span["face_w"] * 0.30), int(span["right"][1])],
        drape_right[0],
        drape_left[0],
    ], dtype=np.int32)

    scarf_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(scarf_mask, [outer_path], 255)

    # Cut out the face opening (a slightly-inset face oval so the scarf hugs the hairline).
    face_cutout = _shrink_face_opening(inner.reshape(-1, 2), landmarks_px)
    cv2.fillPoly(scarf_mask, [face_cutout], 0)

    # Soften the edge so composition doesn't look pasted.
    scarf_mask = cv2.GaussianBlur(scarf_mask, (0, 0), sigmaX=2.5)

    canvas = _apply_fabric_texture(canvas, scarf_mask, base_bgr, pattern)

    # Fold detail across the crown for realism.
    cv2.line(
        canvas,
        tuple(outer_path[1]),
        tuple(outer_path[3]),
        darken(base_bgr, 0.78),
        thickness=max(1, int(span["face_w"] * 0.02)),
        lineType=cv2.LINE_AA,
    )
    # Chin-to-shoulder fold.
    cv2.line(
        canvas,
        (int(span["chin"][0] - span["face_w"] * 0.10), int(span["chin"][1] + span["face_h"] * 0.35)),
        (int(drape_right[0][0] - span["face_w"] * 0.10), int(drape_right[0][1] - span["face_h"] * 0.15)),
        darken(base_bgr, 0.85),
        thickness=max(1, int(span["face_w"] * 0.015)),
        lineType=cv2.LINE_AA,
    )
    return canvas


def _draw_style_loose(
    canvas: np.ndarray,
    landmarks_px: np.ndarray,
    base_bgr: tuple[int, int, int],
    pattern: str,
) -> np.ndarray:
    """«Napusk» style: a looser drape over one shoulder, more fabric visible."""
    h, w = canvas.shape[:2]
    span = face_span(landmarks_px)

    top_of_head = landmarks_px[10].copy()
    top_of_head[1] = max(0, int(top_of_head[1] - span["face_h"] * 0.65))

    outer_path = np.array([
        [int(span["left"][0] - span["face_w"] * 0.55), int(span["chin"][1] + span["face_h"] * 0.20)],
        [int(span["left"][0] - span["face_w"] * 0.42), int(span["forehead"][1])],
        [int(top_of_head[0] - span["face_w"] * 0.10), int(top_of_head[1] + span["face_h"] * 0.05)],
        [int(top_of_head[0] + span["face_w"] * 0.10), int(top_of_head[1])],
        [int(span["right"][0] + span["face_w"] * 0.30), int(span["forehead"][1])],
        [int(span["right"][0] + span["face_w"] * 0.20), int(span["right"][1])],
        # Long drape falling past the shoulder on the right.
        [int(span["right"][0] + span["face_w"] * 0.60), min(h - 1, int(span["chin"][1] + span["face_h"] * 1.6))],
        [int(span["left"][0] - span["face_w"] * 0.20), min(h - 1, int(span["chin"][1] + span["face_h"] * 1.5))],
    ], dtype=np.int32)

    scarf_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(scarf_mask, [outer_path], 255)

    inner = _face_oval_polygon(landmarks_px).reshape(-1, 2)
    face_cutout = _shrink_face_opening(inner, landmarks_px, tighten=0.06)
    cv2.fillPoly(scarf_mask, [face_cutout], 0)

    scarf_mask = cv2.GaussianBlur(scarf_mask, (0, 0), sigmaX=3.0)
    canvas = _apply_fabric_texture(canvas, scarf_mask, base_bgr, pattern)

    # Sweeping shoulder fold.
    cv2.line(
        canvas,
        (int(span["right"][0] + span["face_w"] * 0.30), int(span["right"][1] + span["face_h"] * 0.10)),
        (int(span["right"][0] + span["face_w"] * 0.55), int(span["chin"][1] + span["face_h"] * 1.5)),
        darken(base_bgr, 0.78),
        thickness=max(1, int(span["face_w"] * 0.02)),
        lineType=cv2.LINE_AA,
    )
    return canvas


def _draw_style_double(
    canvas: np.ndarray,
    landmarks_px: np.ndarray,
    base_bgr: tuple[int, int, int],
    pattern: str,
) -> np.ndarray:
    """Two-layer wrap: an under-cap plus a scarf on top."""
    h, w = canvas.shape[:2]
    span = face_span(landmarks_px)

    # Layer 1 — a darker under-cap that peeks slightly under the outer scarf.
    under_bgr = darken(base_bgr, 0.60)
    top_of_head = landmarks_px[10].copy()
    top_of_head[1] = max(0, int(top_of_head[1] - span["face_h"] * 0.35))

    under_path = np.array([
        [int(span["left"][0] - span["face_w"] * 0.18), int(span["forehead"][1] - span["face_h"] * 0.05)],
        [int(top_of_head[0]), int(top_of_head[1])],
        [int(span["right"][0] + span["face_w"] * 0.18), int(span["forehead"][1] - span["face_h"] * 0.05)],
        [int(span["right"][0]), int(span["forehead"][1] + span["face_h"] * 0.20)],
        [int(span["left"][0]), int(span["forehead"][1] + span["face_h"] * 0.20)],
    ], dtype=np.int32)

    under_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(under_mask, [under_path], 255)
    inner_tight = _shrink_face_opening(_face_oval_polygon(landmarks_px).reshape(-1, 2), landmarks_px, tighten=0.14)
    cv2.fillPoly(under_mask, [inner_tight], 0)
    under_mask = cv2.GaussianBlur(under_mask, (0, 0), sigmaX=2.0)
    canvas = _apply_fabric_texture(canvas, under_mask, under_bgr, pattern)

    # Layer 2 — the main scarf on top (classical style but offset upward).
    outer_top = landmarks_px[10].copy()
    outer_top[1] = max(0, int(outer_top[1] - span["face_h"] * 0.65))
    outer_path = np.array([
        [int(span["left"][0] - span["face_w"] * 0.30), int(span["chin"][1])],
        [int(span["left"][0] - span["face_w"] * 0.48), int(span["forehead"][1] - span["face_h"] * 0.15)],
        [int(outer_top[0]), int(outer_top[1])],
        [int(span["right"][0] + span["face_w"] * 0.48), int(span["forehead"][1] - span["face_h"] * 0.15)],
        [int(span["right"][0] + span["face_w"] * 0.30), int(span["chin"][1])],
        [int(span["right"][0] + span["face_w"] * 0.42), min(h - 1, int(span["chin"][1] + span["face_h"] * 1.5))],
        [int(span["left"][0] - span["face_w"] * 0.42), min(h - 1, int(span["chin"][1] + span["face_h"] * 1.5))],
    ], dtype=np.int32)

    outer_mask = np.zeros((h, w), dtype=np.uint8)
    cv2.fillPoly(outer_mask, [outer_path], 255)
    inner = _face_oval_polygon(landmarks_px).reshape(-1, 2)
    face_cutout = _shrink_face_opening(inner, landmarks_px, tighten=0.02)
    cv2.fillPoly(outer_mask, [face_cutout], 0)
    outer_mask = cv2.GaussianBlur(outer_mask, (0, 0), sigmaX=2.5)
    canvas = _apply_fabric_texture(canvas, outer_mask, base_bgr, pattern)

    # Highlight the seam where the two layers meet.
    cv2.line(
        canvas,
        (int(span["left"][0] - span["face_w"] * 0.10), int(span["forehead"][1] + span["face_h"] * 0.05)),
        (int(span["right"][0] + span["face_w"] * 0.10), int(span["forehead"][1] + span["face_h"] * 0.05)),
        darken(base_bgr, 0.70),
        thickness=max(1, int(span["face_w"] * 0.012)),
        lineType=cv2.LINE_AA,
    )
    return canvas


def _shrink_face_opening(
    face_oval: np.ndarray, landmarks_px: np.ndarray, tighten: float = 0.04
) -> np.ndarray:
    """Inset the face-oval polygon a touch so the scarf hugs the hairline instead of leaving a gap."""
    center = np.mean(face_oval, axis=0)
    diff = face_oval.astype(np.float32) - center
    shrunk = center + diff * (1.0 - tighten)
    return shrunk.astype(np.int32)


STYLE_DRAWERS = {
    "classical": _draw_style_classical,
    "loose": _draw_style_loose,
    "double": _draw_style_double,
}


def draw_scarf(base_image: np.ndarray, landmarks_px: np.ndarray, spec: ScarfSpec) -> np.ndarray:
    """Main entrypoint — compose a scarf onto `base_image` using MediaPipe landmarks."""
    base_bgr = hex_to_bgr(spec.color_hex)

    if spec.tying_style not in STYLE_DRAWERS:
        raise ValueError(f"UNKNOWN_TYING_STYLE:{spec.tying_style}")

    canvas = base_image.copy()
    canvas = STYLE_DRAWERS[spec.tying_style](canvas, landmarks_px, base_bgr, spec.pattern)

    if spec.opacity < 1.0:
        canvas = cv2.addWeighted(base_image, 1.0 - spec.opacity, canvas, spec.opacity, 0.0)

    # If the scarf has an accent colour, draw a thin decorative band at the hairline.
    if spec.accent_hex:
        accent_bgr = hex_to_bgr(spec.accent_hex)
        span = face_span(landmarks_px)
        cv2.line(
            canvas,
            (int(span["left"][0] - span["face_w"] * 0.20), int(span["forehead"][1])),
            (int(span["right"][0] + span["face_w"] * 0.20), int(span["forehead"][1])),
            accent_bgr,
            thickness=max(1, int(span["face_w"] * 0.015)),
            lineType=cv2.LINE_AA,
        )

    return canvas
