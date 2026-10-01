"""MediaPipe Pose wrapper — 33 body landmarks.

Used by the dress compositor pipeline: mobile client sends the full-body
selfie, the ml-face service returns pose landmarks the NestJS API then
forwards to ml-compositor.
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import cv2
import mediapipe as mp
import numpy as np

# Named MediaPipe Pose indices we surface (all 33 are still returned).
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
    landmarks: list[tuple[float, float, float]]  # (x, y, visibility)
    image_size: tuple[int, int]  # (width, height)


@lru_cache(maxsize=1)
def _pose():
    return mp.solutions.pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
    )


def detect_pose(image_bgr: np.ndarray) -> PoseResult:
    h, w = image_bgr.shape[:2]
    rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    result = _pose().process(rgb)
    if not result.pose_landmarks:
        return PoseResult(False, [], (w, h))
    pts = [(float(lm.x), float(lm.y), float(lm.visibility)) for lm in result.pose_landmarks.landmark]
    return PoseResult(True, pts, (w, h))


def body_summary(result: PoseResult) -> dict:
    """Convert raw pose landmarks into the compact body payload the dress
    compositor expects (six + two anchor points)."""
    if not result.detected or not result.landmarks:
        return {}

    lm = result.landmarks
    sl = lm[LEFT_SHOULDER]
    sr = lm[RIGHT_SHOULDER]
    hl = lm[LEFT_HIP]
    hr = lm[RIGHT_HIP]
    nose = lm[NOSE]

    neck_x = (sl[0] + sr[0]) / 2.0
    neck_y = (sl[1] + sr[1]) / 2.0 - 0.02

    # Estimate hem as the average of ankles when visible; otherwise well past the hips.
    la = lm[LEFT_ANKLE]
    ra = lm[RIGHT_ANKLE]
    if la[2] > 0.4 and ra[2] > 0.4:
        hem_y = min(0.98, (la[1] + ra[1]) / 2.0 - 0.02)
    else:
        hem_y = min(0.98, max(hl[1], hr[1]) + 0.35)

    hem_center_x = (hl[0] + hr[0]) / 2.0

    def _pt(x: float, y: float) -> dict:
        # MediaPipe Pose can produce landmarks outside [0..1] when body parts sit
        # off-frame. Clamp so the downstream compositor stays in normalised space.
        return {"x": round(float(np.clip(x, 0.0, 1.0)), 5), "y": round(float(np.clip(y, 0.0, 1.0)), 5)}

    # Neck length — distance from the shoulder midpoint up to the chin. We
    # don't have the chin from Pose, so approximate with (nose_y - 0.08) which
    # tracks the jaw/chin plane for a frontal upright shot. The scarf
    # compositor uses this to decide how high the drape should hang.
    shoulder_mid_y = (sl[1] + sr[1]) / 2.0
    chin_proxy_y = max(0.0, nose[1] + 0.08)
    neck_len = max(0.0, shoulder_mid_y - chin_proxy_y)

    # Shoulder-to-shoulder span is the natural normaliser the compositor uses
    # to scale the scarf drape — same axis as body width.
    shoulder_span = float(np.hypot(sr[0] - sl[0], sr[1] - sl[1]))

    return {
        "shoulder_left": _pt(sl[0], sl[1]),
        "shoulder_right": _pt(sr[0], sr[1]),
        "hip_left": _pt(hl[0], hl[1]),
        "hip_right": _pt(hr[0], hr[1]),
        "neck_center": _pt(neck_x, max(neck_y, 0.0)),
        "hem_center": _pt(hem_center_x, hem_y),
        # Normalised scalar fields (0..1 image space) describing head/neck
        # geometry — new in Sprint 8.
        "neck_length": round(float(np.clip(neck_len, 0.0, 1.0)), 5),
        "shoulder_span": round(float(np.clip(shoulder_span, 0.0, 1.0)), 5),
    }
