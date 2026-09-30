"""Small image helpers."""
from __future__ import annotations

import cv2
import numpy as np

from app.config import settings


def decode_image_bytes(data: bytes) -> np.ndarray:
    """Decode PNG / JPEG bytes into a BGR numpy array, downscaling very large images."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("INVALID_IMAGE_BYTES")

    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim > settings.max_image_size:
        scale = settings.max_image_size / max_dim
        img = cv2.resize(
            img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA
        )
    return img
