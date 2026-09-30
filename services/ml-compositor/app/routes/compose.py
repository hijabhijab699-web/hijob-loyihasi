"""POST /compose — scarf composition."""
from __future__ import annotations

import json
import logging
import time

import cv2
import numpy as np
from fastapi import APIRouter, File, Form, HTTPException, Response, UploadFile

from app.models import LandmarksPayload, ScarfSpec
from app.services.geometry import to_pixels
from app.services.scarf import draw_scarf
from app.services.dress_compose import compose_dress_template
from app.services.template_compose import compose_scarf_template
from app.utils import decode_image_bytes, encode_output

logger = logging.getLogger(__name__)
router = APIRouter()

MAX_IMAGE_BYTES = 12 * 1024 * 1024


async def _read_upload(upload: UploadFile) -> bytes:
    data = await upload.read()
    if not data:
        raise HTTPException(status_code=400, detail="EMPTY_IMAGE")
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="IMAGE_TOO_LARGE")
    return data


@router.post(
    "/scarf",
    responses={200: {"content": {"image/jpeg": {}}, "description": "Composited try-on"}},
)
async def compose_scarf(
    face: UploadFile = File(..., description="Selfie / photo to composite onto"),
    landmarks: str = Form(..., description="JSON payload: LandmarksPayload"),
    scarf: str = Form(..., description="JSON payload: ScarfSpec"),
) -> Response:
    started = time.perf_counter()

    try:
        lm_payload = LandmarksPayload.model_validate_json(landmarks)
        spec = ScarfSpec.model_validate_json(scarf)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"INVALID_JSON:{exc}") from exc

    face_bytes = await _read_upload(face)
    try:
        base = decode_image_bytes(face_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # The base image may have been downscaled inside decode_image_bytes; landmarks come from
    # the original resolution, so we scale them to the working image size.
    h_now, w_now = base.shape[:2]
    scale_x = w_now / lm_payload.image_width
    scale_y = h_now / lm_payload.image_height

    normalised = [
        ((p.x * lm_payload.image_width) * scale_x / w_now, (p.y * lm_payload.image_height) * scale_y / h_now)
        for p in lm_payload.points
    ]
    landmarks_px = to_pixels(normalised, w_now, h_now)

    try:
        result = draw_scarf(base, landmarks_px, spec)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception:  # noqa: BLE001
        logger.exception("scarf composition failed")
        raise HTTPException(status_code=500, detail="COMPOSE_FAILED")

    jpeg = encode_output(result)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("composed scarf (%s / %s) in %d ms", spec.tying_style, spec.color_hex, elapsed_ms)

    return Response(
        content=jpeg,
        media_type="image/jpeg",
        headers={"X-Compose-Time-Ms": str(elapsed_ms)},
    )


@router.post(
    "/scarf-template",
    responses={200: {"content": {"image/jpeg": {}}, "description": "Template-warped try-on"}},
)
async def compose_scarf_from_template(
    face: UploadFile = File(..., description="User's selfie"),
    landmarks: str = Form(..., description="LandmarksPayload JSON — user face landmarks"),
    scarf: str = Form(..., description="ScarfSpec JSON"),
    template_canonical: UploadFile = File(..., description="Garment canonical PNG (RGBA)"),
    template_landmarks: str = Form(..., description="JSON — scarf template landmarks from DB"),
) -> Response:
    """Real-template compositor: warps a stored garment template onto the user's face."""
    started = time.perf_counter()

    try:
        lm_payload = LandmarksPayload.model_validate_json(landmarks)
        spec = ScarfSpec.model_validate_json(scarf)
        template_lm = json.loads(template_landmarks)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"INVALID_JSON:{exc}") from exc

    face_bytes = await _read_upload(face)
    canonical_bytes = await _read_upload(template_canonical)

    try:
        base = decode_image_bytes(face_bytes)
        # Canonical is a 4-channel PNG — cv2.imdecode with IMREAD_UNCHANGED keeps alpha.
        arr = np.frombuffer(canonical_bytes, dtype=np.uint8)
        canonical = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
        if canonical is None:
            raise ValueError("INVALID_TEMPLATE_PNG")
        if canonical.shape[2] == 3:
            # No alpha — treat every pixel as opaque so callers with 24-bit PNGs still work.
            canonical = np.dstack(
                [canonical, np.full(canonical.shape[:2], 255, dtype=np.uint8)]
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    # Scale user landmarks to the working image dimensions (decode may have downscaled).
    h_now, w_now = base.shape[:2]
    normalised = [
        (p.x, p.y) for p in lm_payload.points
    ]
    user_landmarks_px = to_pixels(normalised, w_now, h_now)

    try:
        result = compose_scarf_template(
            user_image=base,
            user_landmarks_px=user_landmarks_px,
            template_canonical_bgra=canonical,
            template_landmarks=template_lm,
            spec=spec,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception:  # noqa: BLE001
        logger.exception("template scarf composition failed")
        raise HTTPException(status_code=500, detail="COMPOSE_FAILED")

    jpeg = encode_output(result)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "composed template scarf (%s / %s) in %d ms",
        spec.tying_style,
        spec.color_hex,
        elapsed_ms,
    )

    return Response(
        content=jpeg,
        media_type="image/jpeg",
        headers={"X-Compose-Time-Ms": str(elapsed_ms), "X-Mode": "template"},
    )


@router.post(
    "/dress-template",
    responses={200: {"content": {"image/jpeg": {}}, "description": "Dress try-on"}},
)
async def compose_dress_from_template(
    face: UploadFile = File(..., description="User's full-body photo"),
    body_pose: str = Form(..., description="User body landmarks JSON — see REQUIRED_BODY_KEYS"),
    scarf: str = Form(..., description="ScarfSpec JSON (colour + opacity reused for the dress)"),
    template_canonical: UploadFile = File(..., description="Dress canonical PNG (RGBA)"),
    template_landmarks: str = Form(..., description="Dress template landmarks JSON"),
) -> Response:
    started = time.perf_counter()

    try:
        body = json.loads(body_pose)
        spec = ScarfSpec.model_validate_json(scarf)
        template_lm = json.loads(template_landmarks)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"INVALID_JSON:{exc}") from exc

    face_bytes = await _read_upload(face)
    canonical_bytes = await _read_upload(template_canonical)

    try:
        user_img = decode_image_bytes(face_bytes)
        arr = np.frombuffer(canonical_bytes, dtype=np.uint8)
        canonical = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
        if canonical is None:
            raise ValueError("INVALID_TEMPLATE_PNG")
        if canonical.shape[2] == 3:
            canonical = np.dstack(
                [canonical, np.full(canonical.shape[:2], 255, dtype=np.uint8)]
            )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        result = compose_dress_template(
            user_image=user_img,
            user_body=body,
            template_canonical_bgra=canonical,
            template_landmarks=template_lm,
            spec=spec,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception:  # noqa: BLE001
        logger.exception("dress template composition failed")
        raise HTTPException(status_code=500, detail="COMPOSE_FAILED")

    jpeg = encode_output(result)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("composed dress template (%s) in %d ms", spec.color_hex, elapsed_ms)

    return Response(
        content=jpeg,
        media_type="image/jpeg",
        headers={"X-Compose-Time-Ms": str(elapsed_ms), "X-Mode": "dress-template"},
    )
