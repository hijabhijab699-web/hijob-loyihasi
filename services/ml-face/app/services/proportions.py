"""Compute normalised head/face geometry ratios from front-view landmarks."""
from __future__ import annotations

import math

from app.models import FaceProportions
from app.services.landmarks import (
    CHIN_BOTTOM,
    FACE_LEFT,
    FACE_RIGHT,
    FOREHEAD_TOP,
    LEFT_EYE_CENTER,
    LEFT_EYE_OUTER,
    RIGHT_EYE_CENTER,
    RIGHT_EYE_OUTER,
    DetectionResult,
)


def _dist(a: tuple[float, float], b: tuple[float, float]) -> float:
    return math.hypot(a[0] - b[0], a[1] - b[1])


def compute_proportions(detection: DetectionResult) -> FaceProportions:
    """All values are unitless so they compose across image sizes."""
    if not detection.detected or not detection.landmarks_2d:
        return FaceProportions(
            head_width=0.0,
            head_height=0.0,
            eye_distance=0.0,
            chin_to_eyes=0.0,
            neck_length=0.0,
            face_aspect_ratio=0.0,
        )

    lm = detection.landmarks_2d

    left_face = lm[FACE_LEFT]
    right_face = lm[FACE_RIGHT]
    chin = lm[CHIN_BOTTOM]
    forehead = lm[FOREHEAD_TOP]

    head_width = _dist(left_face, right_face)
    head_height = _dist(forehead, chin)

    # Prefer refined iris centres when available (indices 468 / 473 only exist with refine_landmarks).
    if len(lm) > RIGHT_EYE_CENTER:
        eye_left = lm[LEFT_EYE_CENTER]
        eye_right = lm[RIGHT_EYE_CENTER]
    else:
        eye_left = lm[LEFT_EYE_OUTER]
        eye_right = lm[RIGHT_EYE_OUTER]
    eye_distance_raw = _dist(eye_left, eye_right)

    # Midpoint of the two eye centres.
    eyes_mid = ((eye_left[0] + eye_right[0]) / 2.0, (eye_left[1] + eye_right[1]) / 2.0)
    chin_to_eyes_raw = _dist(chin, eyes_mid)

    # Approximate neck length using the chin-to-eyes distance as a stand-in unit
    # (MediaPipe FaceMesh does not include neck vertices). Tuning: neck ≈ 0.6 × face height.
    neck_length_est = head_height * 0.6

    return FaceProportions(
        head_width=round(head_width, 4),
        head_height=round(head_height, 4),
        eye_distance=round(eye_distance_raw / head_width if head_width else 0.0, 4),
        chin_to_eyes=round(chin_to_eyes_raw / head_height if head_height else 0.0, 4),
        neck_length=round(neck_length_est, 4),
        face_aspect_ratio=round(head_width / head_height if head_height else 0.0, 4),
    )
