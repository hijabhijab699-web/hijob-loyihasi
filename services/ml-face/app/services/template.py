"""Combine landmarks + tone + proportions + mask into a single FaceTemplate."""
from __future__ import annotations

import logging

import numpy as np

from app.models import (
    FaceTemplate,
    Point2D,
    Point3D,
    ViewLandmarks,
)
from app.services.landmarks import get_extractor
from app.services.proportions import compute_proportions
from app.services.segmentation import get_segmenter, mask_to_png_base64
from app.services.skin_tone import extract_skin_tone

logger = logging.getLogger(__name__)


def _to_points_2d(pts: list[tuple[float, float]]) -> list[Point2D]:
    return [Point2D(x=round(x, 5), y=round(y, 5)) for x, y in pts]


def _to_points_3d(pts: list[tuple[float, float, float]]) -> list[Point3D]:
    return [Point3D(x=round(x, 5), y=round(y, 5), z=round(z, 5)) for x, y, z in pts]


def build_template(
    front: np.ndarray,
    left: np.ndarray | None = None,
    right: np.ndarray | None = None,
) -> FaceTemplate:
    """Build a full FaceTemplate from up to three views. Front view is required."""

    extractor = get_extractor()
    segmenter = get_segmenter()
    warnings: list[str] = []

    front_det = extractor.detect(front)
    if not front_det.detected:
        raise ValueError("NO_FACE_IN_FRONT_VIEW")

    views: list[ViewLandmarks] = [
        ViewLandmarks(
            view="front",
            detected=True,
            confidence=front_det.confidence,
            landmarks_2d=_to_points_2d(front_det.landmarks_2d),
            landmarks_3d=_to_points_3d(front_det.landmarks_3d),
            bbox=front_det.bbox,
            image_size=front_det.image_size,
        )
    ]

    for view_name, img in (("left", left), ("right", right)):
        if img is None:
            warnings.append(f"MISSING_{view_name.upper()}_VIEW")
            continue
        det = extractor.detect(img)
        if not det.detected:
            warnings.append(f"NO_FACE_IN_{view_name.upper()}_VIEW")
            views.append(
                ViewLandmarks(
                    view=view_name,
                    detected=False,
                    image_size=det.image_size,
                )
            )
            continue
        views.append(
            ViewLandmarks(
                view=view_name,
                detected=True,
                confidence=det.confidence,
                landmarks_2d=_to_points_2d(det.landmarks_2d),
                landmarks_3d=_to_points_3d(det.landmarks_3d),
                bbox=det.bbox,
                image_size=det.image_size,
            )
        )

    proportions = compute_proportions(front_det)
    tone = extract_skin_tone(front, front_det)
    mask = segmenter.mask(front)
    mask_b64 = mask_to_png_base64(mask)

    return FaceTemplate(
        views=views,
        skin_tone=tone,
        proportions=proportions,
        head_mask_png_base64=mask_b64,
        warnings=warnings,
    )
