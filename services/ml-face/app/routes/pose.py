"""POST /face/pose — 33 body landmarks from a full-body image."""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.pose import body_summary, detect_pose
from app.utils import decode_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_UPLOAD_BYTES = 12 * 1024 * 1024


@router.post("/pose")
async def extract_pose(image: UploadFile = File(..., description="Full-body photo")) -> dict:
    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="EMPTY_IMAGE")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="IMAGE_TOO_LARGE")

    started = time.perf_counter()
    try:
        img = decode_image_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    result = detect_pose(img)
    elapsed_ms = int((time.perf_counter() - started) * 1000)

    if not result.detected:
        raise HTTPException(status_code=422, detail="NO_POSE_DETECTED")

    logger.info("extracted body pose in %d ms", elapsed_ms)
    return {
        "detected": True,
        "image_size": result.image_size,
        "landmarks_raw": [
            {"x": p[0], "y": p[1], "visibility": p[2]} for p in result.landmarks
        ],
        "body": body_summary(result),
    }
