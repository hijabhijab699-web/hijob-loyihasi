"""Top-level orchestrator — combines segmentation + landmarks + canvas + palette."""
from __future__ import annotations

import logging

import numpy as np

from app.models import (
    Category,
    GarmentTemplate,
    GenericLandmarks,
    Landmarks,
)
from app.services.canvas import normalize
from app.services.dress import extract_dress_landmarks
from app.services.palette import dominant_colors
from app.services.scarf import extract_scarf_landmarks
from app.services.segmentation import remove_background
from app.utils import png_to_base64

logger = logging.getLogger(__name__)


def _landmarks_for_category(
    category: Category,
    image_bgr: np.ndarray,
    mask: np.ndarray,
) -> tuple[Landmarks, list[str]]:
    """Return `(landmarks, warnings)`. Bags/accessories get the generic bbox."""
    warnings: list[str] = []

    if category == "scarves":
        scarf = extract_scarf_landmarks(image_bgr, mask)
        if not scarf.detected_face:
            warnings.append("NO_FACE_ON_MODEL")
        return scarf, warnings

    if category == "dresses":
        dress = extract_dress_landmarks(image_bgr, mask)
        if not dress.detected_pose:
            warnings.append("NO_BODY_POSE_DETECTED")
        return dress, warnings

    # Bags, accessories — just carry the bounding box.
    ys, xs = np.where(mask > 20)
    if xs.size == 0:
        bbox = {"x": 0.0, "y": 0.0, "w": 1.0, "h": 1.0}
    else:
        h, w = mask.shape[:2]
        bbox = {
            "x": round(float(xs.min()) / w, 5),
            "y": round(float(ys.min()) / h, 5),
            "w": round(float(xs.max() - xs.min()) / w, 5),
            "h": round(float(ys.max() - ys.min()) / h, 5),
        }
    return GenericLandmarks(bbox=bbox), warnings


def build_template(image_bgr: np.ndarray, category: Category) -> GarmentTemplate:
    """Full pipeline: rembg → landmarks → normalize → palette."""

    canonical_bgra, mask = remove_background(image_bgr)

    # ── Landmarks are computed on the *source* image so face/pose detection has
    # the original pixels to work with (rembg smooths edges, which can throw off Pose).
    landmarks, warnings = _landmarks_for_category(category, image_bgr, mask)

    canvas_bgra, canvas_mask, pose = normalize(canonical_bgra, mask)
    palette = dominant_colors(canonical_bgra, mask, n=5)

    return GarmentTemplate(
        category=category,
        landmarks=landmarks,
        standard_pose=pose,
        canonical_png_base64=png_to_base64(canvas_bgra),
        mask_png_base64=png_to_base64(canvas_mask),
        color_palette=palette,
        warnings=warnings,
    )
