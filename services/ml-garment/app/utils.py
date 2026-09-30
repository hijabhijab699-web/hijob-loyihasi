from __future__ import annotations

import base64

import cv2
import numpy as np

from app.config import settings


def decode_image_bytes(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("INVALID_IMAGE_BYTES")

    h, w = img.shape[:2]
    if max(h, w) > settings.max_image_size:
        scale = settings.max_image_size / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def png_to_base64(img: np.ndarray) -> str:
    """Encode BGR/RGBA/grayscale numpy array as base64 PNG."""
    ok, buf = cv2.imencode(".png", img)
    if not ok:
        raise RuntimeError("PNG_ENCODE_FAILED")
    return base64.b64encode(buf.tobytes()).decode("ascii")
