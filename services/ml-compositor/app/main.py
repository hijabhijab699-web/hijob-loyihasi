from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.config import settings
from app.routes import compose, health

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s :: %(message)s",
)

app = FastAPI(
    title="N24:31 Try-On Compositor",
    description="Composes scarves onto user selfies using MediaPipe face landmarks.",
    version=__version__,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(compose.router, tags=["compose"], prefix="/compose")


@app.on_event("startup")
async def _startup() -> None:
    logging.getLogger(__name__).info(
        "ml-compositor ready on :%d", settings.ml_compositor_port
    )
