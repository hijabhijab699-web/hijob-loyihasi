"""Scarf landmark extraction.

We combine:
    • The alpha mask from rembg (whole model + scarf silhouette).
    • MediaPipe FaceMesh — the face opening inside the scarf, when a model wears it.

If the scarf photo is a flat lay (no face), we fall back to the mask's centre.
Every coordinate we emit is normalised to [0..1] in the source image's coordinate space.
"""
from __future__ import annotations

import cv2
import numpy as np

from app.models import BoundingBox, Point2D, ScarfLandmarks
from app.services import face_probe


def _norm(x: int, y: int, w: int, h: int) -> Point2D:
    return Point2D(x=round(x / w, 5), y=round(y / h, 5))


def _bbox_from_mask(mask: np.ndarray) -> BoundingBox | None:
    ys, xs = np.where(mask > 20)
    if xs.size == 0:
        return None
    h, w = mask.shape[:2]
    return BoundingBox(
        x=round(float(xs.min()) / w, 5),
        y=round(float(ys.min()) / h, 5),
        w=round(float(xs.max() - xs.min()) / w, 5),
        h=round(float(ys.max() - ys.min()) / h, 5),
    )


def extract_scarf_landmarks(image_bgr: np.ndarray, mask: np.ndarray) -> ScarfLandmarks:
    h, w = image_bgr.shape[:2]

    face = face_probe.detect(image_bgr)
    fabric_bbox = _bbox_from_mask(mask)

    if face.detected:
        forehead = face.landmarks_2d[face_probe.FOREHEAD_TOP]
        chin = face.landmarks_2d[face_probe.CHIN_BOTTOM]
        left = face.landmarks_2d[face_probe.FACE_LEFT]
        right = face.landmarks_2d[face_probe.FACE_RIGHT]

        cx = int(((forehead[0] + chin[0]) / 2.0) * w)
        cy = int(((forehead[1] + chin[1]) / 2.0) * h)
        face_center = _norm(cx, cy, w, h)

        face_bbox = BoundingBox(
            x=round(min(left[0], right[0]) - 0.02, 5),
            y=round(min(forehead[1], chin[1]) - 0.02, 5),
            w=round(abs(right[0] - left[0]) + 0.04, 5),
            h=round(abs(chin[1] - forehead[1]) + 0.04, 5),
        )
        # Hair coverage = above the forehead, still inside the fabric.
        hair_top_y = max(0.0, forehead[1] - 0.10)
        hair_coverage = Point2D(x=round(float(forehead[0]), 5), y=round(hair_top_y, 5))
    else:
        # Flat-lay fallback — approximate face opening at mask centre.
        if fabric_bbox is None:
            # Degenerate case: no fabric detected either. Use image centre.
            face_center = Point2D(x=0.5, y=0.4)
            face_bbox = BoundingBox(x=0.35, y=0.25, w=0.30, h=0.35)
            hair_coverage = Point2D(x=0.5, y=0.15)
        else:
            cx = fabric_bbox.x + fabric_bbox.w / 2
            face_center = Point2D(x=round(cx, 5), y=round(fabric_bbox.y + fabric_bbox.h * 0.35, 5))
            face_bbox = BoundingBox(
                x=round(cx - fabric_bbox.w * 0.15, 5),
                y=round(fabric_bbox.y + fabric_bbox.h * 0.20, 5),
                w=round(fabric_bbox.w * 0.30, 5),
                h=round(fabric_bbox.h * 0.30, 5),
            )
            hair_coverage = Point2D(x=round(cx, 5), y=round(fabric_bbox.y + fabric_bbox.h * 0.10, 5))

    # Drape points: leftmost / rightmost fabric points near the shoulder line.
    if fabric_bbox is not None:
        drape_y = fabric_bbox.y + fabric_bbox.h * 0.80
        drape_left = Point2D(x=round(fabric_bbox.x + fabric_bbox.w * 0.05, 5), y=round(drape_y, 5))
        drape_right = Point2D(
            x=round(fabric_bbox.x + fabric_bbox.w * 0.95, 5), y=round(drape_y, 5)
        )
    else:
        drape_left = Point2D(x=0.15, y=0.85)
        drape_right = Point2D(x=0.85, y=0.85)

    return ScarfLandmarks(
        face_opening_center=face_center,
        face_opening_bbox=face_bbox,
        hair_coverage_top=hair_coverage,
        drape_left=drape_left,
        drape_right=drape_right,
        fabric_bbox=fabric_bbox or BoundingBox(x=0, y=0, w=1, h=1),
        detected_face=face.detected,
    )
