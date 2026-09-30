"""Head/foreground mask via MediaPipe SelfieSegmentation, returned as base64 PNG."""
from __future__ import annotations

import base64

import cv2
import mediapipe as mp
import numpy as np


class HeadSegmenter:
    def __init__(self) -> None:
        # model_selection=1 uses the higher-quality landscape model, better for portraits.
        self._seg = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=1)

    def mask(self, image_bgr: np.ndarray) -> np.ndarray:
        """Return an 8-bit single-channel mask (255 = foreground / person)."""
        rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        res = self._seg.process(rgb)
        if res.segmentation_mask is None:
            h, w = image_bgr.shape[:2]
            return np.zeros((h, w), dtype=np.uint8)
        # Threshold the confidence map to get a hard mask.
        m = (res.segmentation_mask > 0.55).astype(np.uint8) * 255
        # Smooth the edge a touch — reduces stair-step artefacts when it becomes an alpha channel later.
        return cv2.GaussianBlur(m, (7, 7), 0)

    def close(self) -> None:
        self._seg.close()


_segmenter: HeadSegmenter | None = None


def get_segmenter() -> HeadSegmenter:
    global _segmenter
    if _segmenter is None:
        _segmenter = HeadSegmenter()
    return _segmenter


def mask_to_png_base64(mask: np.ndarray) -> str:
    """Encode a grayscale mask as a base64 PNG string (no data-URI prefix)."""
    ok, buf = cv2.imencode(".png", mask)
    if not ok:
        return ""
    return base64.b64encode(buf.tobytes()).decode("ascii")
