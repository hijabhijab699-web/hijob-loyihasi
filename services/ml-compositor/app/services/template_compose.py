"""Template-based scarf compositor.

Warps a garment's canonical canvas (mask + RGBA image) onto a user's selfie
using TPS, then alpha-blends the warped fabric on top of the face.

Anchor points:
    canvas → user
    template.face_opening_center  ↔ user face centre
    template.hair_coverage_top    ↔ user forehead + margin
    template.drape_left           ↔ user shoulder-left
    template.drape_right          ↔ user shoulder-right
    template.fabric_bbox corners  ↔ scaled corners around the user's head

Colour tinting for `color_hex` is applied per-pixel with LAB shift so
different variants of the same template look distinct without re-warping.
"""
from __future__ import annotations

from typing import Any

import cv2
import numpy as np

from app.models import ScarfSpec
from app.services.geometry import (
    CHIN_BOTTOM,
    FACE_LEFT,
    FACE_RIGHT,
    FOREHEAD_TOP,
    NOSE_TIP,
    face_span,
    hex_to_bgr,
)
from app.services.hair_matting import blend_with_hairline_protection
from app.services.warp import apply_tps


def _estimate_yaw(user_landmarks_px: np.ndarray) -> float:
    """Return a yaw estimate in [-1..1]. Positive = turning to the user's right.

    We use the horizontal offset of the nose tip from the midpoint between the
    face's left/right cheek anchors, normalised by half the face width. Simple
    and robust for MediaPipe's front-facing FaceMesh output.
    """
    face_left = user_landmarks_px[FACE_LEFT].astype(np.float32)
    face_right = user_landmarks_px[FACE_RIGHT].astype(np.float32)
    nose = user_landmarks_px[NOSE_TIP].astype(np.float32)
    mid_x = (face_left[0] + face_right[0]) / 2.0
    half_w = max(1.0, abs(face_right[0] - face_left[0]) / 2.0)
    return float(np.clip((nose[0] - mid_x) / half_w, -1.0, 1.0))


def _norm_to_px(pt: dict[str, float], w: int, h: int) -> tuple[float, float]:
    return float(pt["x"]) * w, float(pt["y"]) * h


def _extract_template_anchors(
    template_landmarks: dict[str, Any],
    canvas_w: int,
    canvas_h: int,
) -> np.ndarray:
    """Pull anchor points out of the JSON stored in `garment_templates.landmarks`."""
    fx, fy = _norm_to_px(template_landmarks["face_opening_center"], canvas_w, canvas_h)
    hx, hy = _norm_to_px(template_landmarks["hair_coverage_top"], canvas_w, canvas_h)
    dlx, dly = _norm_to_px(template_landmarks["drape_left"], canvas_w, canvas_h)
    drx, dry = _norm_to_px(template_landmarks["drape_right"], canvas_w, canvas_h)

    face_bbox = template_landmarks["face_opening_bbox"]
    fbx = face_bbox["x"] * canvas_w
    fby = face_bbox["y"] * canvas_h
    fbw = face_bbox["w"] * canvas_w
    fbh = face_bbox["h"] * canvas_h

    return np.array(
        [
            [fx, fy],                              # face centre
            [hx, hy],                              # hair top
            [dlx, dly],                            # drape left
            [drx, dry],                            # drape right
            [fbx, fby],                            # face bbox top-left
            [fbx + fbw, fby],                      # top-right
            [fbx, fby + fbh],                      # bottom-left
            [fbx + fbw, fby + fbh],                # bottom-right
        ],
        dtype=np.float32,
    )


# Style presets — each pair (top_lift, drape_dy, drape_dx_left, drape_dx_right, bbox_pad_top,
# bbox_pad_side, bbox_pad_bottom) tunes how the scarf sits for that tying style.
_STYLE_PRESETS = {
    "classical": {
        "hair_lift": 0.35,       # crown height above forehead
        "drape_dy": 0.85,        # shoulder drape distance below chin
        "drape_dx_left": 0.35,   # left drape width past face
        "drape_dx_right": 0.35,
        "bbox_pad_top": 0.08,
        "bbox_pad_side": 0.08,
        "bbox_pad_bottom": 0.06,
    },
    "loose": {
        "hair_lift": 0.28,       # a shorter crown — more fabric on shoulder
        "drape_dy": 1.05,        # extra drape falling on one side
        "drape_dx_left": 0.15,
        "drape_dx_right": 0.60,  # long drape falls right
        "bbox_pad_top": 0.05,
        "bbox_pad_side": 0.10,
        "bbox_pad_bottom": 0.03,
    },
    "double": {
        "hair_lift": 0.45,       # two layers → taller crown
        "drape_dy": 0.75,        # shorter, tighter drape
        "drape_dx_left": 0.30,
        "drape_dx_right": 0.30,
        "bbox_pad_top": 0.10,
        "bbox_pad_side": 0.06,
        "bbox_pad_bottom": 0.04,
    },
}


def _extract_user_anchors(
    user_landmarks_px: np.ndarray,
    tying_style: str = "classical",
) -> np.ndarray:
    """Compute the matching anchor points on the user's selfie, in pixel coords.

    Each tying style biases the anchors so `apply_tps` produces a shape that
    resembles the physical drape (compact crown for `double`, long asymmetric
    fall for `loose`, etc.). We also bias the anchors along the head's yaw
    so a turned head still produces a scarf that follows the rotation.
    """
    preset = _STYLE_PRESETS.get(tying_style, _STYLE_PRESETS["classical"])

    span = face_span(user_landmarks_px)
    face_center = span["center"].astype(np.float32)
    forehead = user_landmarks_px[FOREHEAD_TOP].astype(np.float32)
    face_left = user_landmarks_px[FACE_LEFT].astype(np.float32)
    face_right = user_landmarks_px[FACE_RIGHT].astype(np.float32)
    face_w = span["face_w"]
    face_h = span["face_h"]

    # yaw ∈ [-1..1]. Positive → head turned to user's right → scarf slides that way.
    yaw = _estimate_yaw(user_landmarks_px)
    yaw_dx = yaw * face_w * 0.20        # horizontal shift budget
    hair_slant = yaw * face_h * 0.10    # crown tilts opposite the yaw

    hair_top = np.array(
        [
            forehead[0] + yaw_dx * 0.4,
            max(0.0, forehead[1] - face_h * preset["hair_lift"] + hair_slant),
        ],
        dtype=np.float32,
    )

    drape_y = span["chin"][1] + face_h * preset["drape_dy"]
    drape_left = np.array(
        [face_left[0] - face_w * preset["drape_dx_left"] + yaw_dx, drape_y],
        dtype=np.float32,
    )
    drape_right = np.array(
        [face_right[0] + face_w * preset["drape_dx_right"] + yaw_dx, drape_y],
        dtype=np.float32,
    )

    fbx0 = face_left[0] - face_w * preset["bbox_pad_side"] + yaw_dx * 0.6
    fbx1 = face_right[0] + face_w * preset["bbox_pad_side"] + yaw_dx * 0.6
    fby0 = forehead[1] - face_h * preset["bbox_pad_top"]
    fby1 = span["chin"][1] + face_h * preset["bbox_pad_bottom"]

    return np.array(
        [
            face_center,
            hair_top,
            drape_left,
            drape_right,
            [fbx0, fby0],
            [fbx1, fby0],
            [fbx0, fby1],
            [fbx1, fby1],
        ],
        dtype=np.float32,
    )


def _tint_bgra_inplace(bgra: np.ndarray, target_bgr: tuple[int, int, int]) -> np.ndarray:
    """Recolour a solid fabric to `target_bgr` while keeping luminosity + alpha."""
    rgb = bgra[..., :3].astype(np.float32)
    alpha = bgra[..., 3:4]

    # Convert to LAB, replace ab channels with the target's ab, keep L.
    lab = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_BGR2LAB).astype(np.float32)
    target_lab = cv2.cvtColor(
        np.uint8([[list(target_bgr)]]),
        cv2.COLOR_BGR2LAB,
    )[0][0].astype(np.float32)
    L, a, b = cv2.split(lab)

    # Bias L slightly toward the target's L (30% pull) so recoloured darks stay dark.
    L = L * 0.7 + target_lab[0] * 0.3
    a[:] = target_lab[1]
    b[:] = target_lab[2]

    tinted = cv2.merge([L, a, b]).astype(np.uint8)
    bgr_out = cv2.cvtColor(tinted, cv2.COLOR_LAB2BGR)
    return np.concatenate([bgr_out, alpha], axis=2)


def compose_scarf_template(
    user_image: np.ndarray,
    user_landmarks_px: np.ndarray,
    template_canonical_bgra: np.ndarray,
    template_landmarks: dict[str, Any],
    spec: ScarfSpec,
) -> np.ndarray:
    """Return the user's selfie with the warped template scarf composited on top."""
    if user_image.ndim != 3 or user_image.shape[2] != 3:
        raise ValueError("USER_IMAGE_MUST_BE_BGR")
    if template_canonical_bgra.ndim != 3 or template_canonical_bgra.shape[2] != 4:
        raise ValueError("TEMPLATE_MUST_BE_BGRA")

    user_h, user_w = user_image.shape[:2]
    canvas_h, canvas_w = template_canonical_bgra.shape[:2]

    # Anchor points for TPS — user anchors depend on the tying style.
    src = _extract_template_anchors(template_landmarks, canvas_w, canvas_h)
    dst = _extract_user_anchors(user_landmarks_px, spec.tying_style)

    # Optionally recolour the fabric before warping — cheaper on the smaller canvas.
    fabric_bgra = template_canonical_bgra
    if spec.color_hex:
        fabric_bgra = _tint_bgra_inplace(fabric_bgra.copy(), hex_to_bgr(spec.color_hex))

    warped = apply_tps(
        fabric_bgra, source_points=src, target_points=dst, output_size=(user_w, user_h)
    )

    # Alpha composite: warped fabric on top of the selfie.
    if warped.shape[2] == 4:
        alpha = (warped[..., 3:4].astype(np.float32) / 255.0) * spec.opacity
    else:
        alpha = np.ones(warped.shape[:2] + (1,), dtype=np.float32) * spec.opacity

    fabric_bgr = warped[..., :3].astype(np.float32)
    base = user_image.astype(np.float32)
    out = base * (1.0 - alpha) + fabric_bgr * alpha

    # Soft feather at the mask edge to reduce stair-step artefacts.
    edge = cv2.GaussianBlur(alpha[..., 0], (0, 0), sigmaX=2.0)
    edge = np.clip(edge[..., None] * 1.6, 0, 1)
    out = base * (1.0 - edge) + out * edge

    composed = np.clip(out, 0, 255).astype(np.uint8)

    # Hairline protection — small extra pass that pulls the user's crown back
    # where the scarf sits low over the forehead. Tunable via spec.opacity so
    # a fully-opaque scarf still leaves a natural hairline.
    return blend_with_hairline_protection(
        base_image=user_image,
        composed=composed,
        user_landmarks_px=user_landmarks_px,
        protect_strength=0.55,
    )
