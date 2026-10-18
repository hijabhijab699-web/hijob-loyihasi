"""POST /face/face-only — canonical face crop on a transparent background.

The buyer's selfie goes in; a 512×640 PNG comes out with the eyes sitting at
the SAME pixel position (centered, 34% from top, 200 px apart) and the face
masked by the MediaPipe FACE_OVAL polygon. Because every mannequin render we
show on top of has the same head geometry (same GPT prompt, same frame size),
a canonical face PNG means one calibration lines up on every variant.

If the detected face is tilted, too small, too close, or badly off-centre we
return 422 with a specific code so the mobile client can ask the buyer to
retake instead of silently accepting a bad selfie.
"""
from __future__ import annotations

import logging
import math
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.services.landmarks import get_extractor
from app.utils import decode_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_UPLOAD_BYTES = 12 * 1024 * 1024

# MediaPipe FaceMesh landmark indices.
LEFT_EYE_OUTER = 33    # picture-left eye corner
RIGHT_EYE_OUTER = 263  # picture-right eye corner

# FACE_OVAL boundary — hair/ears excluded.
FACE_OVAL_INDICES = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323,
    361, 288, 397, 365, 379, 378, 400, 377, 152,
    148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
    127, 162, 21, 54, 103, 67, 109,
]

# Canonical output canvas. Keep these constants — mobile uses them to size
# and position the overlay against the mannequin's face hole.
OUT_W = 512
OUT_H = 640
TARGET_EYE_DIST = 200          # px between left + right eye corners
TARGET_EYE_Y = 220             # py the eye line sits at
TARGET_EYE_X = OUT_W // 2      # eye midpoint x (centered)

# Validation thresholds — tuned to let a hand-held phone selfie through while
# catching obviously wrong frames.
MAX_ROLL_DEG = 15.0            # head tilt
MIN_EYE_DIST_FRAC = 0.09       # eye distance / selfie width → too small / far
MAX_EYE_DIST_FRAC = 0.70       # too close
MAX_OFFCENTER_FRAC = 0.28      # face center distance from image center


def _validate_pose(
    img_w: int, img_h: int, le: tuple[float, float], re: tuple[float, float]
) -> None:
    dx = re[0] - le[0]
    dy = re[1] - le[1]
    eye_dist = math.hypot(dx, dy)

    if eye_dist / img_w < MIN_EYE_DIST_FRAC:
        raise HTTPException(status_code=422, detail="FACE_TOO_SMALL")
    if eye_dist / img_w > MAX_EYE_DIST_FRAC:
        raise HTTPException(status_code=422, detail="FACE_TOO_CLOSE")

    roll_deg = abs(math.degrees(math.atan2(dy, dx)))
    if roll_deg > MAX_ROLL_DEG:
        raise HTTPException(status_code=422, detail="FACE_TILTED")

    mid_x = (le[0] + re[0]) / 2
    mid_y = (le[1] + re[1]) / 2
    off_x = abs(mid_x - img_w / 2) / img_w
    off_y = abs(mid_y - img_h / 2) / img_h
    if off_x > MAX_OFFCENTER_FRAC or off_y > MAX_OFFCENTER_FRAC:
        raise HTTPException(status_code=422, detail="FACE_OFF_CENTER")


def _canonical_warp(
    img_bgr: np.ndarray, le: tuple[float, float], re: tuple[float, float]
) -> np.ndarray:
    """Rotate + scale + translate the selfie so the eyes land at the canonical
    pixel position on an OUT_W×OUT_H canvas."""
    dx = re[0] - le[0]
    dy = re[1] - le[1]
    eye_dist = math.hypot(dx, dy)
    roll_deg = math.degrees(math.atan2(dy, dx))

    scale = TARGET_EYE_DIST / eye_dist
    eye_mid = ((le[0] + re[0]) / 2, (le[1] + re[1]) / 2)

    # Rotate about eye midpoint (negate roll so the eyes end up horizontal).
    M = cv2.getRotationMatrix2D(eye_mid, roll_deg, scale)
    # Translate so eye midpoint lands at (TARGET_EYE_X, TARGET_EYE_Y).
    M[0, 2] += TARGET_EYE_X - eye_mid[0]
    M[1, 2] += TARGET_EYE_Y - eye_mid[1]

    return cv2.warpAffine(
        img_bgr,
        M,
        (OUT_W, OUT_H),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REPLICATE,
    )


def _apply_oval_mask(warped: np.ndarray) -> np.ndarray:
    """Re-detect landmarks on the canonical frame and clip to FACE_OVAL. The
    second detection is cheap on a 512×640 canvas and gives us a tight,
    canonicalised oval instead of guessing one from the source coords."""
    det2 = get_extractor().detect(warped)
    if not det2.detected:
        # Shouldn't happen — the warp came from a valid detection — but if it
        # does, surface it clearly instead of returning garbage.
        raise HTTPException(status_code=422, detail="FACE_LOST_AFTER_WARP")

    pts = np.array(
        [(det2.landmarks_2d[i][0] * OUT_W, det2.landmarks_2d[i][1] * OUT_H) for i in FACE_OVAL_INDICES],
        dtype=np.float32,
    )
    # Pull the oval 10% inward so the alpha ramp never includes hair or
    # background pixels at the edge.
    center = pts.mean(axis=0, keepdims=True)
    pts_tight = (center + (pts - center) * 0.90).astype(np.int32)

    mask = np.zeros((OUT_H, OUT_W), dtype=np.uint8)
    cv2.fillPoly(mask, [pts_tight], 255)
    mask = cv2.GaussianBlur(mask, (0, 0), sigmaX=2.0)

    bgra = cv2.cvtColor(warped, cv2.COLOR_BGR2BGRA)
    bgra[..., 3] = mask
    bgra[mask < 8] = (0, 0, 0, 0)
    return bgra


def _face_only_png(img_bgr: np.ndarray) -> bytes:
    h, w = img_bgr.shape[:2]
    det = get_extractor().detect(img_bgr)
    if not det.detected:
        raise HTTPException(status_code=422, detail="NO_FACE_DETECTED")

    le = (det.landmarks_2d[LEFT_EYE_OUTER][0] * w, det.landmarks_2d[LEFT_EYE_OUTER][1] * h)
    re = (det.landmarks_2d[RIGHT_EYE_OUTER][0] * w, det.landmarks_2d[RIGHT_EYE_OUTER][1] * h)

    _validate_pose(w, h, le, re)

    warped = _canonical_warp(img_bgr, le, re)
    bgra = _apply_oval_mask(warped)

    ok, buf = cv2.imencode(".png", bgra)
    if not ok:
        raise HTTPException(status_code=500, detail="ENCODE_FAILED")
    return buf.tobytes()


@router.post("/face-only")
async def face_only(
    image: UploadFile = File(..., description="Front-view selfie (JPEG/PNG)"),
) -> Response:
    started = time.perf_counter()
    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="EMPTY_IMAGE")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="IMAGE_TOO_LARGE")

    try:
        img = decode_image_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    png_bytes = _face_only_png(img)

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "face-only canonical %d×%d in %d ms (%d KB)",
        OUT_W,
        OUT_H,
        elapsed_ms,
        len(png_bytes) // 1024,
    )
    return Response(
        content=png_bytes,
        media_type="image/png",
        headers={
            # Mobile uses these to size + position the overlay against the
            # mannequin's face hole without hard-coding magic numbers.
            "X-Face-Canvas-W": str(OUT_W),
            "X-Face-Canvas-H": str(OUT_H),
            "X-Face-Eye-X": str(TARGET_EYE_X),
            "X-Face-Eye-Y": str(TARGET_EYE_Y),
            "X-Face-Eye-Dist": str(TARGET_EYE_DIST),
        },
    )
