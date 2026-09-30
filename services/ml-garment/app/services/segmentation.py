"""Background removal via rembg (U²-Net).

Returns:
    canonical  — RGBA (H, W, 4). RGB from source, A from rembg mask.
    mask       — grayscale (H, W) uint8, 0 = background, 255 = foreground.

The rembg session is cached (loading u2net is ~40 MB and takes 1-2 s on CPU).
"""
from __future__ import annotations

import io
import logging
from functools import lru_cache

import cv2
import numpy as np
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def _session():
    # Import here so `rembg` isn't required at import time (helpful for tests).
    from rembg import new_session

    logger.info("loading rembg model %s", settings.rembg_model)
    return new_session(settings.rembg_model)


def remove_background(image_bgr: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Return (canonical_bgra, mask). Mask is single-channel uint8 (0-255)."""
    from rembg import remove

    pil = Image.fromarray(cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB))

    # Force alpha-matting off to keep this deterministic and reasonably fast on CPU.
    result_pil: Image.Image = remove(pil, session=_session())
    rgba = np.array(result_pil.convert("RGBA"))  # H, W, 4  RGB order

    # Convert to BGR-order channels while keeping alpha (OpenCV convention).
    bgra = np.dstack([rgba[..., 2], rgba[..., 1], rgba[..., 0], rgba[..., 3]])
    mask = rgba[..., 3].copy()

    # A tiny edge smooth so mask compositions elsewhere don't stair-step.
    if settings.max_mask_dilate > 0:
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=1)
        mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=1.5)

    return bgra, mask
