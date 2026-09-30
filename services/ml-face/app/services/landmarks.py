"""MediaPipe FaceMesh wrapper — 468 (or 478 with refine_landmarks) points per face."""
from __future__ import annotations

import logging
from dataclasses import dataclass

import cv2
import mediapipe as mp
import numpy as np

from app.config import settings

logger = logging.getLogger(__name__)

# Named landmark indices for the standard MediaPipe FaceMesh topology.
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263
LEFT_EYE_CENTER = 468  # only present when refine_landmarks=True (iris)
RIGHT_EYE_CENTER = 473
CHIN_BOTTOM = 152
FOREHEAD_TOP = 10
FACE_LEFT = 234
FACE_RIGHT = 454
NOSE_TIP = 1
UPPER_LIP = 13
LOWER_LIP = 14


@dataclass
class DetectionResult:
    detected: bool
    confidence: float
    landmarks_2d: list[tuple[float, float]]  # normalised [0..1]
    landmarks_3d: list[tuple[float, float, float]]
    bbox: tuple[float, float, float, float] | None  # normalised x, y, w, h
    image_size: tuple[int, int]  # (width, height) px


class FaceMeshExtractor:
    """Single-image FaceMesh runner. Instantiate once; call `detect()` per image."""

    def __init__(self) -> None:
        self._mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,  # includes iris + lips refinement
            min_detection_confidence=settings.face_confidence,
        )

    def detect(self, image_bgr: np.ndarray) -> DetectionResult:
        """Detect the primary face in `image_bgr`. Returns landmarks and bbox."""
        h, w = image_bgr.shape[:2]
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

        result = self._mesh.process(rgb)
        if not result.multi_face_landmarks:
            return DetectionResult(
                detected=False,
                confidence=0.0,
                landmarks_2d=[],
                landmarks_3d=[],
                bbox=None,
                image_size=(w, h),
            )

        face = result.multi_face_landmarks[0]
        pts_2d: list[tuple[float, float]] = []
        pts_3d: list[tuple[float, float, float]] = []
        xs: list[float] = []
        ys: list[float] = []
        for lm in face.landmark:
            pts_2d.append((float(lm.x), float(lm.y)))
            pts_3d.append((float(lm.x), float(lm.y), float(lm.z)))
            xs.append(float(lm.x))
            ys.append(float(lm.y))

        bbox = (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))

        return DetectionResult(
            detected=True,
            confidence=1.0,  # FaceMesh doesn't report per-face confidence directly
            landmarks_2d=pts_2d,
            landmarks_3d=pts_3d,
            bbox=bbox,
            image_size=(w, h),
        )

    def close(self) -> None:
        self._mesh.close()


_extractor: FaceMeshExtractor | None = None


def get_extractor() -> FaceMeshExtractor:
    """Lazy singleton — MediaPipe graph is expensive to build."""
    global _extractor
    if _extractor is None:
        _extractor = FaceMeshExtractor()
    return _extractor
