"""Dress / abaya landmarks via MediaPipe Pose.

We keep the six landmarks the compositor actually uses (shoulders, hips, neck,
plus estimated hemlines). If Pose fails to detect the body we fall back to the
alpha-mask bounding box — good enough to still produce a canonical canvas.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import cv2
import mediapipe as mp
import numpy as np

from app.models import DressLandmarks, Point2D

# MediaPipe Pose landmark indices we care about.
NOSE = 0
LEFT_SHOULDER = 11
RIGHT_SHOULDER = 12
LEFT_HIP = 23
RIGHT_HIP = 24
LEFT_KNEE = 25
RIGHT_KNEE = 26
LEFT_ANKLE = 27
RIGHT_ANKLE = 28


@dataclass
class PoseResult:
    detected: bool
    landmarks: list[tuple[float, float]]  # normalised (x, y)


@lru_cache(maxsize=1)
def _pose():
    return mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
    )


def _detect_pose(image_bgr: np.ndarray) -> PoseResult:
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    result = _pose().process(rgb)
    if not result.pose_landmarks:
        return PoseResult(False, [])
    pts = [(float(lm.x), float(lm.y)) for lm in result.pose_landmarks.landmark]
    return PoseResult(True, pts)


def _bbox_hem(mask: np.ndarray, hip_y_norm: float) -> tuple[Point2D, Point2D] | None:
    """Find the mask's leftmost and rightmost non-zero pixel at (or slightly above)
    the estimated hemline — where the dress ends before shoes/floor start."""
    if mask.size == 0:
        return None
    h, w = mask.shape[:2]
    # Search downward from the hip toward the bottom of the frame; the hem is the
    # last row where the mask width is still >30% of the widest row.
    hip_y_px = int(hip_y_norm * h)
    row_widths = (mask[hip_y_px:] > 20).sum(axis=1)
    if row_widths.size == 0:
        return None
    max_width = row_widths.max()
    if max_width == 0:
        return None
    threshold = int(max_width * 0.3)
    hem_offset = np.where(row_widths >= threshold)[0]
    if hem_offset.size == 0:
        return None
    hem_y_px = hip_y_px + int(hem_offset[-1])
    row = mask[hem_y_px] > 20
    xs = np.where(row)[0]
    if xs.size == 0:
        return None
    hem_left = Point2D(x=round(float(xs[0]) / w, 5), y=round(hem_y_px / h, 5))
    hem_right = Point2D(x=round(float(xs[-1]) / w, 5), y=round(hem_y_px / h, 5))
    return hem_left, hem_right


def extract_dress_landmarks(image_bgr: np.ndarray, mask: np.ndarray) -> DressLandmarks:
    pose = _detect_pose(image_bgr)

    if pose.detected:
        sl = pose.landmarks[LEFT_SHOULDER]
        sr = pose.landmarks[RIGHT_SHOULDER]
        hl = pose.landmarks[LEFT_HIP]
        hr = pose.landmarks[RIGHT_HIP]
        nose = pose.landmarks[NOSE]

        # Neck is midway between shoulders, biased slightly upward toward the chin.
        neck_x = (sl[0] + sr[0]) / 2.0
        neck_y = (sl[1] + sr[1]) / 2.0 - 0.02

        # Try mask-based hem; fall back to a rough estimate past the hips.
        hem_pair = _bbox_hem(mask, hip_y_norm=(hl[1] + hr[1]) / 2.0)
        if hem_pair is None:
            hem_left = Point2D(x=round(min(hl[0], hr[0]) - 0.03, 5), y=0.95)
            hem_right = Point2D(x=round(max(hl[0], hr[0]) + 0.03, 5), y=0.95)
        else:
            hem_left, hem_right = hem_pair

        return DressLandmarks(
            shoulder_left=Point2D(x=round(sl[0], 5), y=round(sl[1], 5)),
            shoulder_right=Point2D(x=round(sr[0], 5), y=round(sr[1], 5)),
            hip_left=Point2D(x=round(hl[0], 5), y=round(hl[1], 5)),
            hip_right=Point2D(x=round(hr[0], 5), y=round(hr[1], 5)),
            neck_center=Point2D(x=round(neck_x, 5), y=round(max(neck_y, 0.0), 5)),
            hem_left=hem_left,
            hem_right=hem_right,
            detected_pose=True,
        )

    # ────────── Fallback: use the alpha mask bounding box only. ──────────
    ys, xs = np.where(mask > 20)
    if xs.size == 0:
        return DressLandmarks(
            shoulder_left=Point2D(x=0.35, y=0.20),
            shoulder_right=Point2D(x=0.65, y=0.20),
            hip_left=Point2D(x=0.40, y=0.55),
            hip_right=Point2D(x=0.60, y=0.55),
            neck_center=Point2D(x=0.5, y=0.15),
            hem_left=Point2D(x=0.35, y=0.95),
            hem_right=Point2D(x=0.65, y=0.95),
            detected_pose=False,
        )

    h, w = mask.shape[:2]
    x0 = float(xs.min()) / w
    x1 = float(xs.max()) / w
    y0 = float(ys.min()) / h
    y1 = float(ys.max()) / h
    cx = (x0 + x1) / 2.0

    return DressLandmarks(
        shoulder_left=Point2D(x=round(x0 + (x1 - x0) * 0.25, 5), y=round(y0 + (y1 - y0) * 0.10, 5)),
        shoulder_right=Point2D(
            x=round(x0 + (x1 - x0) * 0.75, 5), y=round(y0 + (y1 - y0) * 0.10, 5)
        ),
        hip_left=Point2D(x=round(x0 + (x1 - x0) * 0.30, 5), y=round(y0 + (y1 - y0) * 0.55, 5)),
        hip_right=Point2D(x=round(x0 + (x1 - x0) * 0.70, 5), y=round(y0 + (y1 - y0) * 0.55, 5)),
        neck_center=Point2D(x=round(cx, 5), y=round(y0 + (y1 - y0) * 0.05, 5)),
        hem_left=Point2D(x=round(x0 + 0.02, 5), y=round(y1 - 0.02, 5)),
        hem_right=Point2D(x=round(x1 - 0.02, 5), y=round(y1 - 0.02, 5)),
        detected_pose=False,
    )
