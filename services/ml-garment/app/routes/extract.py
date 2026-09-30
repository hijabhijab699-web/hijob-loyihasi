"""POST /garment/extract — extract a full garment template from a single image."""
from __future__ import annotations

import logging
import time

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from app.models import Category, GarmentTemplate
from app.services.template import build_template
from app.utils import decode_image_bytes

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_UPLOAD_BYTES = 12 * 1024 * 1024
_ALLOWED: set[Category] = {"scarves", "dresses", "bags", "accessories"}


@router.post("/extract", response_model=GarmentTemplate)
async def extract(
    image: UploadFile = File(..., description="Mannequin / model photo"),
    category: str = Form("scarves", description="scarves | dresses | bags | accessories"),
) -> GarmentTemplate:
    if category not in _ALLOWED:
        raise HTTPException(status_code=422, detail=f"UNKNOWN_CATEGORY:{category}")

    data = await image.read()
    if not data:
        raise HTTPException(status_code=400, detail="EMPTY_IMAGE")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="IMAGE_TOO_LARGE")

    started = time.perf_counter()
    try:
        img_bgr = decode_image_bytes(data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        template = build_template(img_bgr, category)  # type: ignore[arg-type]
    except Exception:  # noqa: BLE001
        logger.exception("garment extraction failed")
        raise HTTPException(status_code=500, detail="EXTRACT_FAILED")

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "extracted %s template in %d ms (warnings=%s)",
        category,
        elapsed_ms,
        template.warnings,
    )
    return template
