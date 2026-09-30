"""POST /extract — 3-view face template extraction."""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.models import FaceTemplate
from app.services.template import build_template
from app.utils import decode_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_UPLOAD_BYTES = 12 * 1024 * 1024  # 12 MB per image


async def _read(upload: UploadFile) -> bytes:
    data = await upload.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"{upload.filename}: too large")
    if not data:
        raise HTTPException(status_code=400, detail=f"{upload.filename}: empty")
    return data


@router.post("/extract", response_model=FaceTemplate)
async def extract(
    front: UploadFile = File(..., description="Front-view selfie (required)"),
    left: UploadFile | None = File(None, description="Half-left profile (optional)"),
    right: UploadFile | None = File(None, description="Half-right profile (optional)"),
) -> FaceTemplate:
    started = time.perf_counter()

    front_bytes = await _read(front)
    left_bytes = await _read(left) if left is not None else None
    right_bytes = await _read(right) if right is not None else None

    try:
        front_img = decode_image_bytes(front_bytes)
        left_img = decode_image_bytes(left_bytes) if left_bytes else None
        right_img = decode_image_bytes(right_bytes) if right_bytes else None
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        template = build_template(front_img, left_img, right_img)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001 — surface as 500
        logger.exception("template extraction failed")
        raise HTTPException(status_code=500, detail="EXTRACT_FAILED") from exc

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "extracted face template in %d ms (warnings=%s)", elapsed_ms, template.warnings
    )
    return template
