"""FastAPI entry point for the face template service."""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.routes import extract, face_only, health, pose

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)

app = FastAPI(
    title="N24:31 Face Template Service",
    description=(
        "Extracts landmarks, skin tone, proportions, and a head mask from selfies. "
        "Never persists raw images."
    ),
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.trusted_callers,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(extract.router, tags=["face"], prefix="/face")
app.include_router(pose.router, tags=["face"], prefix="/face")
app.include_router(face_only.router, tags=["face"], prefix="/face")


@app.on_event("startup")
async def startup() -> None:
    # Warm the MediaPipe graphs so the first /extract call is fast.
    from app.services.landmarks import get_extractor
    from app.services.segmentation import get_segmenter

    logging.getLogger(__name__).info("warming MediaPipe models…")
    get_extractor()
    get_segmenter()
    logging.getLogger(__name__).info("ml-face ready on port %d", settings.ml_face_port)
