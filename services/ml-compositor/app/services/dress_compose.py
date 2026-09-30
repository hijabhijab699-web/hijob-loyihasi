"""Template-based dress / abaya compositor.

Same idea as the scarf pipeline (Sprint 3) but the anchor scheme is body-based:
6 pose landmarks plus the four corners of the garment bounding-box.

Callers supply the user's body pose landmarks (from MediaPipe Pose upstream — the
mobile client / ml-face service). Down here we just warp and blend.
"""
from __future__ import annotations

from typing import Any

import cv2
import numpy as np

from app.models import ScarfSpec  # reuse for its color_hex / opacity / pattern fields
from app.services.geometry import hex_to_bgr
from app.services.warp import apply_tps


# Public field names the caller uses to describe the user's body.
# All coordinates are normalised to the *user image* space (x, y ∈ [0..1]).
REQUIRED_BODY_KEYS = (
    "shoulder_left",
    "shoulder_right",
    "hip_left",
    "hip_right",
    "neck_center",
    "hem_center",
)


def _pt(payload: dict, key: str, w: int, h: int) -> tuple[float, float]:
    p = payload[key]
    return float(p["x"]) * w, float(p["y"]) * h


def _extract_template_anchors(
    template_landmarks: dict[str, Any], canvas_w: int, canvas_h: int
) -> np.ndarray:
    """8 anchor points on the canonical canvas from `dress` template JSON."""
    keys = [
        "shoulder_left",
        "shoulder_right",
        "hip_left",
        "hip_right",
        "neck_center",
    ]
    pts = [_pt(template_landmarks, k, canvas_w, canvas_h) for k in keys]

    # Hem midpoint — halfway between hem_left/right.
    hl = template_landmarks["hem_left"]
    hr = template_landmarks["hem_right"]
    pts.append(
        (float(hl["x"] + hr["x"]) / 2.0 * canvas_w, float(hl["y"] + hr["y"]) / 2.0 * canvas_h)
    )
    # Include the two hem corners so the warp also stretches sideways.
    pts.append((float(hl["x"]) * canvas_w, float(hl["y"]) * canvas_h))
    pts.append((float(hr["x"]) * canvas_w, float(hr["y"]) * canvas_h))
    return np.array(pts, dtype=np.float32)


def _extract_user_anchors(user_body: dict[str, Any], w: int, h: int) -> np.ndarray:
    """Corresponding anchor points on the user image. `user_body` needs the six
    `REQUIRED_BODY_KEYS` plus optional `hem_left` / `hem_right`. If those aren't
    supplied we estimate them from hip position + expected dress length."""
    missing = [k for k in REQUIRED_BODY_KEYS if k not in user_body]
    if missing:
        raise ValueError(f"MISSING_BODY_KEYS:{','.join(missing)}")

    sl = _pt(user_body, "shoulder_left", w, h)
    sr = _pt(user_body, "shoulder_right", w, h)
    hipl = _pt(user_body, "hip_left", w, h)
    hipr = _pt(user_body, "hip_right", w, h)
    neck = _pt(user_body, "neck_center", w, h)
    hem_center = _pt(user_body, "hem_center", w, h)

    if "hem_left" in user_body and "hem_right" in user_body:
        hem_left = _pt(user_body, "hem_left", w, h)
        hem_right = _pt(user_body, "hem_right", w, h)
    else:
        # Fall back: hem_left/right sit under the hips, shifted outward by 30%.
        dx = abs(hipr[0] - hipl[0])
        hem_left = (hipl[0] - dx * 0.30, hem_center[1])
        hem_right = (hipr[0] + dx * 0.30, hem_center[1])

    return np.array([sl, sr, hipl, hipr, neck, hem_center, hem_left, hem_right], dtype=np.float32)


def _tint_bgra(bgra: np.ndarray, target_bgr: tuple[int, int, int]) -> np.ndarray:
    """Same LAB-preserving tint as the scarf compositor."""
    rgb = bgra[..., :3]
    alpha = bgra[..., 3:4]

    lab = cv2.cvtColor(rgb, cv2.COLOR_BGR2LAB).astype(np.float32)
    target_lab = cv2.cvtColor(
        np.uint8([[list(target_bgr)]]), cv2.COLOR_BGR2LAB
    )[0][0].astype(np.float32)
    L, a, b = cv2.split(lab)

    L = L * 0.7 + target_lab[0] * 0.3
    a[:] = target_lab[1]
    b[:] = target_lab[2]

    bgr_out = cv2.cvtColor(cv2.merge([L, a, b]).astype(np.uint8), cv2.COLOR_LAB2BGR)
    return np.concatenate([bgr_out, alpha], axis=2)


def compose_dress_template(
    user_image: np.ndarray,
    user_body: dict[str, Any],
    template_canonical_bgra: np.ndarray,
    template_landmarks: dict[str, Any],
    spec: ScarfSpec,
) -> np.ndarray:
    """Warp a dress template onto the user image."""
    if user_image.ndim != 3 or user_image.shape[2] != 3:
        raise ValueError("USER_IMAGE_MUST_BE_BGR")
    if template_canonical_bgra.ndim != 3 or template_canonical_bgra.shape[2] != 4:
        raise ValueError("TEMPLATE_MUST_BE_BGRA")

    user_h, user_w = user_image.shape[:2]
    canvas_h, canvas_w = template_canonical_bgra.shape[:2]

    src = _extract_template_anchors(template_landmarks, canvas_w, canvas_h)
    dst = _extract_user_anchors(user_body, user_w, user_h)

    fabric = template_canonical_bgra
    if spec.color_hex:
        fabric = _tint_bgra(fabric.copy(), hex_to_bgr(spec.color_hex))

    warped = apply_tps(fabric, source_points=src, target_points=dst, output_size=(user_w, user_h))
    if warped.shape[2] == 4:
        alpha = warped[..., 3:4].astype(np.float32) / 255.0 * spec.opacity
    else:
        alpha = np.ones(warped.shape[:2] + (1,), dtype=np.float32) * spec.opacity

    fabric_bgr = warped[..., :3].astype(np.float32)
    base = user_image.astype(np.float32)
    out = base * (1.0 - alpha) + fabric_bgr * alpha

    # Feather the mask edge.
    edge = cv2.GaussianBlur(alpha[..., 0], (0, 0), sigmaX=2.5)
    edge = np.clip(edge[..., None] * 1.6, 0, 1)
    out = base * (1.0 - edge) + out * edge

    return np.clip(out, 0, 255).astype(np.uint8)
