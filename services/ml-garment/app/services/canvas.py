"""Canonical-canvas normalisation.

Given a segmented garment (BGRA + alpha mask) and the source landmarks, produce
a fixed-size output canvas where the garment sits in a predictable place. The
compositor can then use the same coordinate system for every product.

Convention:
    canvas 1200×1600 (3:4 portrait)
    bbox of the garment is centred horizontally and starts at 12% from the top.
"""
from __future__ import annotations

import cv2
import numpy as np

from app.config import settings
from app.models import BoundingBox, StandardPose


def _mask_bbox_px(mask: np.ndarray) -> tuple[int, int, int, int] | None:
    ys, xs = np.where(mask > 20)
    if xs.size == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())


def normalize(
    canonical_bgra: np.ndarray,
    mask: np.ndarray,
) -> tuple[np.ndarray, np.ndarray, StandardPose]:
    """Place the garment on the fixed canvas. Returns (canvas_bgra, canvas_mask, pose)."""
    cw = settings.canvas_width
    ch = settings.canvas_height

    bbox = _mask_bbox_px(mask)
    if bbox is None:
        # Nothing detected — return empty canvas.
        blank_bgra = np.zeros((ch, cw, 4), dtype=np.uint8)
        blank_mask = np.zeros((ch, cw), dtype=np.uint8)
        return blank_bgra, blank_mask, StandardPose(
            canvas_width=cw, canvas_height=ch, scale_factor=1.0, tx=0.0, ty=0.0
        )

    x0, y0, x1, y1 = bbox
    gw = x1 - x0
    gh = y1 - y0

    # Target box: garment fills 80% of canvas height, keep aspect ratio, top margin 12%.
    target_h = int(ch * 0.80)
    scale = target_h / max(gh, 1)
    target_w = int(gw * scale)
    if target_w > cw * 0.92:  # width-limited when the garment is very wide
        target_w = int(cw * 0.92)
        scale = target_w / max(gw, 1)
        target_h = int(gh * scale)

    # Crop the source region tightly and resize.
    crop_bgra = canonical_bgra[y0:y1, x0:x1]
    crop_mask = mask[y0:y1, x0:x1]
    resized_bgra = cv2.resize(
        crop_bgra, (target_w, target_h), interpolation=cv2.INTER_AREA
    )
    resized_mask = cv2.resize(
        crop_mask, (target_w, target_h), interpolation=cv2.INTER_AREA
    )

    canvas_bgra = np.zeros((ch, cw, 4), dtype=np.uint8)
    canvas_mask = np.zeros((ch, cw), dtype=np.uint8)

    dst_x = (cw - target_w) // 2
    dst_y = int(ch * 0.12)

    canvas_bgra[dst_y : dst_y + target_h, dst_x : dst_x + target_w] = resized_bgra
    canvas_mask[dst_y : dst_y + target_h, dst_x : dst_x + target_w] = resized_mask

    pose = StandardPose(
        canvas_width=cw,
        canvas_height=ch,
        scale_factor=round(scale, 5),
        tx=round(float(dst_x - x0 * scale), 3),
        ty=round(float(dst_y - y0 * scale), 3),
    )
    return canvas_bgra, canvas_mask, pose
