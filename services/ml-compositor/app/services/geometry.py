"""Face landmark index constants and geometry helpers."""
from __future__ import annotations

import numpy as np

# MediaPipe FaceMesh landmark indices used by the compositor.
# Full topology: https://storage.googleapis.com/mediapipe-assets/documentation/mediapipe_face_landmark_fullsize.png
FOREHEAD_TOP = 10
CHIN_BOTTOM = 152
FACE_LEFT = 234
FACE_RIGHT = 454
LEFT_TEMPLE = 127
RIGHT_TEMPLE = 356
LEFT_JAW = 172
RIGHT_JAW = 397
LEFT_CHEEK = 234
RIGHT_CHEEK = 454
NOSE_BRIDGE = 6
NOSE_TIP = 1
LEFT_EYE_OUTER = 33
RIGHT_EYE_OUTER = 263

# Head outline — mediapipe FACEMESH_FACE_OVAL boundary points.
FACE_OVAL_INDICES = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
    361, 288, 397, 365, 379, 378, 400, 377, 152,
    148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
    127, 162, 21, 54, 103, 67, 109,
]


def to_pixels(points_norm: list[tuple[float, float]], w: int, h: int) -> np.ndarray:
    """Convert normalised [0..1] landmark list → int32 (N, 2) array in pixel coords."""
    arr = np.array(points_norm, dtype=np.float32)
    arr[:, 0] *= w
    arr[:, 1] *= h
    return arr.astype(np.int32)


def face_span(landmarks_px: np.ndarray) -> dict:
    """Compute head-size derived reference points used by every scarf style."""
    forehead = landmarks_px[FOREHEAD_TOP]
    chin = landmarks_px[CHIN_BOTTOM]
    left = landmarks_px[FACE_LEFT]
    right = landmarks_px[FACE_RIGHT]

    face_h = float(np.linalg.norm(chin - forehead))
    face_w = float(np.linalg.norm(right - left))
    center = ((left + right) / 2.0).astype(np.int32)

    return {
        "forehead": forehead,
        "chin": chin,
        "left": left,
        "right": right,
        "center": center,
        "face_w": face_w,
        "face_h": face_h,
    }


def hex_to_bgr(hex_color: str) -> tuple[int, int, int]:
    """`#RRGGBB` → OpenCV BGR tuple."""
    c = hex_color.lstrip("#")
    r = int(c[0:2], 16)
    g = int(c[2:4], 16)
    b = int(c[4:6], 16)
    return (b, g, r)


def darken(bgr: tuple[int, int, int], factor: float = 0.85) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(c * factor))) for c in bgr)  # type: ignore[return-value]


def lighten(bgr: tuple[int, int, int], factor: float = 1.12) -> tuple[int, int, int]:
    return tuple(max(0, min(255, int(c * factor))) for c in bgr)  # type: ignore[return-value]
