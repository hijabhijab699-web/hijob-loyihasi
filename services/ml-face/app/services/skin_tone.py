"""Sample skin patches from forehead + cheeks; compute dominant LAB tone + variance."""
from __future__ import annotations

import cv2
import numpy as np

from app.models import SkinTone
from app.services.landmarks import DetectionResult

# Landmark indices that sit on skin, away from mouth/eyes.
FOREHEAD_CENTER = 10  # top of forehead
CHEEK_LEFT = 234
CHEEK_RIGHT = 454
NOSE_BRIDGE = 6
CHIN_LEFT = 172
CHIN_RIGHT = 397


def _patch(image_bgr: np.ndarray, cx: int, cy: int, radius: int = 12) -> np.ndarray:
    """Extract a square patch around (cx, cy) safely clipped to image bounds."""
    h, w = image_bgr.shape[:2]
    x0 = max(0, cx - radius)
    y0 = max(0, cy - radius)
    x1 = min(w, cx + radius)
    y1 = min(h, cy + radius)
    return image_bgr[y0:y1, x0:x1]


def extract_skin_tone(image_bgr: np.ndarray, detection: DetectionResult) -> SkinTone:
    """Combine several small skin patches from the front-view face into a dominant LAB tone."""
    if not detection.detected or not detection.landmarks_2d:
        # Fallback neutral olive-adjacent placeholder so downstream code has valid values.
        return SkinTone(lab=(65.0, 8.0, 15.0), hex="#c9a68a", variance=0.0)

    w, h = detection.image_size
    sample_indices = [FOREHEAD_CENTER, CHEEK_LEFT, CHEEK_RIGHT, NOSE_BRIDGE, CHIN_LEFT, CHIN_RIGHT]

    # Radius scales with face size so it works at any resolution.
    face_w_px = detection.bbox[2] * w if detection.bbox else w * 0.3
    radius = max(6, int(face_w_px * 0.03))

    patches: list[np.ndarray] = []
    for idx in sample_indices:
        if idx >= len(detection.landmarks_2d):
            continue
        nx, ny = detection.landmarks_2d[idx]
        cx, cy = int(nx * w), int(ny * h)
        p = _patch(image_bgr, cx, cy, radius)
        if p.size:
            patches.append(p.reshape(-1, 3))

    if not patches:
        return SkinTone(lab=(65.0, 8.0, 15.0), hex="#c9a68a", variance=0.0)

    stacked = np.concatenate(patches, axis=0).astype(np.uint8)
    # BGR → LAB (OpenCV LAB range: L in [0, 255], a/b in [0, 255] shifted by 128).
    lab_pixels = cv2.cvtColor(stacked.reshape(-1, 1, 3), cv2.COLOR_BGR2LAB).reshape(-1, 3)

    median_lab = np.median(lab_pixels, axis=0)  # median is robust to outliers
    variance = float(np.mean(np.var(lab_pixels.astype(np.float32), axis=0)))

    # Convert median back to BGR to produce a canonical hex.
    bgr_arr = cv2.cvtColor(np.uint8([[median_lab]]), cv2.COLOR_LAB2BGR)[0][0]
    hex_color = f"#{bgr_arr[2]:02x}{bgr_arr[1]:02x}{bgr_arr[0]:02x}"

    # Convert OpenCV LAB (0..255) to CIE-scaled floats for a cleaner interface.
    lab_scaled = (
        float(median_lab[0] * 100.0 / 255.0),
        float(median_lab[1] - 128.0),
        float(median_lab[2] - 128.0),
    )

    return SkinTone(lab=lab_scaled, hex=hex_color, variance=round(variance, 2))
