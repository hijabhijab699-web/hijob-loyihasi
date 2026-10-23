from __future__ import annotations

import cv2
import numpy as np

from app.config import settings


def decode_image_bytes(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("INVALID_IMAGE_BYTES")

    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim > settings.max_image_size:
        scale = settings.max_image_size / max_dim
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def decode_image_bytes_rgba(data: bytes) -> np.ndarray:
    """Decode as BGR or BGRA so the alpha channel survives — PNG cut-outs
    from the admin extension are transparent on purpose and we must not
    silently collapse that to black during face overlay."""
    arr = np.frombuffer(data, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if img is None:
        raise ValueError("INVALID_IMAGE_BYTES")

    h, w = img.shape[:2]
    max_dim = max(h, w)
    if max_dim > settings.max_image_size:
        scale = settings.max_image_size / max_dim
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def encode_output(img: np.ndarray) -> bytes:
    """Downscale (if needed) and JPEG-encode for the wire."""
    h, w = img.shape[:2]
    max_side = settings.output_max_side
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, settings.output_jpeg_quality])
    if not ok:
        raise RuntimeError("ENCODE_FAILED")
    return buf.tobytes()


def encode_output_png(img: np.ndarray) -> bytes:
    """PNG-encode so the alpha channel survives for transparent cut-outs."""
    h, w = img.shape[:2]
    max_side = settings.output_max_side
    if max(h, w) > max_side:
        scale = max_side / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)

    ok, buf = cv2.imencode(".png", img, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    if not ok:
        raise RuntimeError("ENCODE_FAILED")
    return buf.tobytes()
