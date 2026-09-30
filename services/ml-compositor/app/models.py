from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


TyingStyle = Literal["classical", "loose", "double"]


class Point2D(BaseModel):
    x: float
    y: float


class ScarfSpec(BaseModel):
    """What the mobile client tells us about the scarf being tried on."""

    tying_style: TyingStyle = "classical"
    color_hex: str = Field("#D4C3A0", pattern=r"^#[0-9A-Fa-f]{6}$")
    pattern: Literal["solid", "silk", "chiffon"] = "solid"
    opacity: float = Field(1.0, ge=0.0, le=1.0)
    accent_hex: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")


class LandmarksPayload(BaseModel):
    """Front-view landmarks in normalised [0..1] coords (MediaPipe FaceMesh)."""

    points: list[Point2D]
    image_width: int
    image_height: int


class ComposeError(BaseModel):
    code: str
    message: str
