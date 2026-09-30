"""Extract up to 5 dominant hex colours from the foreground pixels."""
from __future__ import annotations

import cv2
import numpy as np


def dominant_colors(image_bgra: np.ndarray, mask: np.ndarray, n: int = 5) -> list[str]:
    """K-means over foreground pixels. Returns list of `#RRGGBB` (up to `n`)."""
    fg = image_bgra[mask > 20]
    if fg.size == 0:
        return []

    pixels = fg[:, :3].astype(np.float32)  # drop alpha, keep BGR
    n = min(n, max(1, len(pixels) // 1000))  # avoid clusters larger than pixel pool

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    _, labels, centers = cv2.kmeans(
        pixels, n, None, criteria, 3, cv2.KMEANS_PP_CENTERS
    )

    # Sort clusters by frequency, most common first.
    counts = np.bincount(labels.flatten(), minlength=n)
    order = np.argsort(counts)[::-1]

    hexes: list[str] = []
    for idx in order:
        b, g, r = centers[idx].astype(np.uint8)
        hexes.append(f"#{int(r):02x}{int(g):02x}{int(b):02x}")
    return hexes
