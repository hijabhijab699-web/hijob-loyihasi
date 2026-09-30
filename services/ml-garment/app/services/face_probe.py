"""Lightweight MediaPipe FaceMesh wrapper — used to locate the face opening
inside a scarf photo (if a model is wearing the scarf).

We only expose the minimum needed for landmark detection so ml-garment
doesn't have to depend on the full ml-face template pipeline.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import cv2
import mediapipe as mp
import numpy as np

# FaceMesh oval indices we actually use (top of forehead, chin, sides).
FOREHEAD_TOP = 10
CHIN_BOTTOM = 152
FACE_LEFT = 234
FACE_RIGHT = 454
NOSE_TIP = 1


@dataclass
class FaceResult:
    detected: bool
    landmarks_2d: list[tuple[float, float]]
    bbox: tuple[float, float, float, float] | None  # normalised x, y, w, h


@lru_cache(maxsize=1)
def _mesh():
    return mp.solutions.face_mesh.FaceMesh(
        static_image_mode=True,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
    )


def detect(image_bgr: np.ndarray) -> FaceResult:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    result = _mesh().process(rgb)
    if not result.multi_face_landmarks:
        return FaceResult(False, [], None)

    face = result.multi_face_landmarks[0]
    pts = [(float(lm.x), float(lm.y)) for lm in face.landmark]
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    bbox = (min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys))
    return FaceResult(True, pts, bbox)
