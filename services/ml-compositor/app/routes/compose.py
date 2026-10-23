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
from app.services.face_swap import face_swap
from app.services.facefusion import NoFaceError, face_fusion_swap
from app.services.face_overlay import apply_face_stamp, extract_face_stamp
from app.services.template_compose import compose_scarf_template
from app.utils import (
    decode_image_bytes,
    decode_image_bytes_rgba,
    encode_output,
    encode_output_png,
)

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
    "/faceswap",
    responses={200: {"content": {"image/jpeg": {}}, "description": "Face-swap result"}},
)
async def compose_faceswap(
    mannequin: UploadFile = File(
        ..., description="Pre-styled mannequin photo (model already wearing the hijab)"
    ),
    user: UploadFile = File(..., description="Buyer's frontal selfie"),
) -> Response:
    """Drop the buyer's face onto a seller-published styled image.

    This is the buyer-side try-on endpoint for the "mannequin pre-dressed by
    the seller, face swapped at request time" workflow. No landmarks are
    required — Haar face detection runs inside and keeps the request simple
    (two files in, one JPEG out).
    """
    started = time.perf_counter()

    mannequin_bytes = await _read_upload(mannequin)
    user_bytes = await _read_upload(user)

    try:
        mannequin_img = decode_image_bytes(mannequin_bytes)
        user_img = decode_image_bytes(user_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    try:
        result = face_swap(mannequin_img, user_img)
    except ValueError as exc:
        # No face detected on one of the inputs. 422 so the mobile client can
        # tell the buyer "yuzingiz aniqlanmadi — qaytadan oling".
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception:  # noqa: BLE001
        logger.exception("face swap failed")
        raise HTTPException(status_code=500, detail="FACESWAP_FAILED")

    jpeg = encode_output(result)
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("face swap in %d ms", elapsed_ms)
    return Response(
        content=jpeg,
        media_type="image/jpeg",
        headers={"X-Compose-Time-Ms": str(elapsed_ms), "X-Mode": "faceswap"},
    )


@router.post(
    "/facefusion",
    responses={200: {"content": {"image/jpeg": {}}, "description": "FaceFusion swap result"}},
)
async def compose_facefusion(
    mannequin: UploadFile = File(
        ..., description="Pre-styled mannequin photo (must have a visible face)"
    ),
    user: UploadFile = File(..., description="Buyer's frontal selfie"),
    enhance: bool = Form(True, description="Run GFPGAN face enhancer after swap"),
) -> Response:
    """FaceFusion-powered swap. Compared to /faceswap this handles hijab
    occlusion, matches skin tone to the mannequin, and (with enhance=True)
    polishes the swapped face with GFPGAN. Noticeably cleaner result, ~4-6 s
    on an M-series Mac once models are cached."""
    started = time.perf_counter()
    mannequin_bytes = await _read_upload(mannequin)
    user_bytes = await _read_upload(user)
    # Decode the mannequin with alpha so a transparent cut-out stays
    # transparent through facefusion (we swap only the BGR face region
    # and re-attach the original alpha channel at the end). The user
    # selfie is read opaque — it's a camera photo, not a cut-out.
    try:
        mannequin_rgba = decode_image_bytes_rgba(mannequin_bytes)
        user_img = decode_image_bytes(user_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    has_alpha = mannequin_rgba.ndim == 3 and mannequin_rgba.shape[2] == 4
    mannequin_bgr = mannequin_rgba[:, :, :3] if has_alpha else mannequin_rgba

    try:
        result_bgr = face_fusion_swap(user_img, mannequin_bgr, enhance=enhance)
    except NoFaceError as exc:
        raise HTTPException(status_code=422, detail="NO_MANNEQUIN_FACE") from exc
    except Exception:  # noqa: BLE001
        logger.exception("facefusion swap failed")
        raise HTTPException(status_code=500, detail="FACEFUSION_FAILED")

    # Facefusion may crop/resize internally — resize the ORIGINAL alpha
    # channel to the result's shape so transparent padding carries over.
    if has_alpha:
        alpha = mannequin_rgba[:, :, 3]
        if alpha.shape[:2] != result_bgr.shape[:2]:
            alpha = cv2.resize(
                alpha,
                (result_bgr.shape[1], result_bgr.shape[0]),
                interpolation=cv2.INTER_LINEAR,
            )
        result = cv2.merge([
            result_bgr[:, :, 0],
            result_bgr[:, :, 1],
            result_bgr[:, :, 2],
            alpha,
        ])
        payload = encode_output_png(result)
        media = "image/png"
    else:
        payload = encode_output(result_bgr)
        media = "image/jpeg"
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("facefusion swap in %d ms (enhance=%s, %s)", elapsed_ms, enhance, media)
    return Response(
        content=payload,
        media_type=media,
        headers={"X-Compose-Time-Ms": str(elapsed_ms), "X-Mode": "facefusion"},
    )


@router.post(
    "/face-stamp",
    responses={
        200: {"content": {"image/png": {}}, "description": "RGBA soft-oval face cut-out"},
        422: {"description": "No face found in the image"},
    },
)
async def compose_face_stamp(
    image: UploadFile = File(
        ..., description="Full-body image containing a visible face (typically a facefusion swap result)"
    ),
) -> Response:
    """One-off: crop the buyer's face out of their first facefusion swap
    as a soft-oval transparent PNG. The caller caches this stamp and
    reuses it on every other variant via /compose/face-overlay — one
    expensive swap, many cheap composites."""
    started = time.perf_counter()
    img_bytes = await _read_upload(image)
    try:
        img = decode_image_bytes(img_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    stamp = extract_face_stamp(img)
    if stamp is None:
        raise HTTPException(status_code=422, detail="NO_FACE_FOUND")

    ok, buf = cv2.imencode(".png", stamp, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    if not ok:
        logger.error("face stamp encode failed")
        raise HTTPException(status_code=500, detail="encode_failed")

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("face-stamp cut in %d ms (%d bytes)", elapsed_ms, len(buf))
    return Response(
        content=buf.tobytes(),
        media_type="image/png",
        headers={"X-Compose-Time-Ms": str(elapsed_ms), "X-Mode": "face-stamp"},
    )


@router.post(
    "/face-overlay",
    responses={
        200: {"content": {"image/jpeg": {}}, "description": "Face stamp composited over target mannequin"},
        422: {"description": "Target mannequin has no detectable face"},
    },
)
async def compose_face_overlay(
    mannequin: UploadFile = File(..., description="Target mannequin image (the product's variant render)"),
    stamp: UploadFile = File(..., description="RGBA face stamp from /compose/face-stamp"),
) -> Response:
    """Alpha-composite a cached face stamp onto a new mannequin. ~2 s
    instead of ~2 min for a full facefusion run — the trade-off is that
    the face is just a 2D overlay, not re-rendered per angle, so the
    source swap's lighting/angle are reused. Good enough when every
    product's mannequin faces the camera head-on at the same scale."""
    started = time.perf_counter()
    mannequin_bytes = await _read_upload(mannequin)
    stamp_bytes = await _read_upload(stamp)

    # The mannequin uploaded by the admin extension is a TRANSPARENT PNG
    # cut-out; decoding it with IMREAD_COLOR would collapse the alpha to
    # black and the mobile hero would show the figure on a dark card
    # instead of on its own boutique backdrop. Read with alpha and keep
    # it through the overlay step.
    try:
        target = decode_image_bytes_rgba(mannequin_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    arr = np.frombuffer(stamp_bytes, dtype=np.uint8)
    stamp_rgba = cv2.imdecode(arr, cv2.IMREAD_UNCHANGED)
    if stamp_rgba is None or stamp_rgba.ndim != 3 or stamp_rgba.shape[-1] != 4:
        raise HTTPException(status_code=400, detail="stamp_must_be_rgba_png")

    result = apply_face_stamp(target, stamp_rgba)
    if result is None:
        raise HTTPException(status_code=422, detail="NO_FACE_ON_MANNEQUIN")

    # Keep PNG when the mannequin had an alpha channel so the cut-out
    # stays transparent for the mobile backdrop to show through; fall
    # back to JPEG otherwise (older opaque renders).
    if result.ndim == 3 and result.shape[2] == 4:
        payload = encode_output_png(result)
        media = "image/png"
    else:
        payload = encode_output(result)
        media = "image/jpeg"
    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info("face-overlay in %d ms (%s)", elapsed_ms, media)
    return Response(
        content=payload,
        media_type=media,
        headers={"X-Compose-Time-Ms": str(elapsed_ms), "X-Mode": "face-overlay"},
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
