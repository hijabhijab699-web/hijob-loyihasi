from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.routes import extract, health

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)

app = FastAPI(
    title="N24:31 Garment Template Service",
    description=(
        "Extracts an alpha mask + landmarks + canonical canvas + colour palette from "
        "a seller's mannequin photo. Never keeps the source photo."
    ),
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(extract.router, tags=["garment"], prefix="/garment")


@app.on_event("startup")
async def _startup() -> None:
    logging.getLogger(__name__).info("ml-garment ready on :%d", settings.ml_garment_port)
