"""Response schemas for the face template service."""
from __future__ import annotations

from pydantic import BaseModel, Field


class Point2D(BaseModel):
    x: float
    y: float


class Point3D(BaseModel):
    x: float
    y: float
    z: float


class SkinTone(BaseModel):
    """LAB colour, dominant hex, per-channel variance."""

    lab: tuple[float, float, float]
    hex: str
    variance: float


class FaceProportions(BaseModel):
    """All values are normalised ratios (unitless) so they compose regardless of image size."""

    head_width: float = Field(description="Head width / face bbox width")
    head_height: float = Field(description="Head height / face bbox height")
    eye_distance: float = Field(description="Inter-pupillary distance / face width")
    chin_to_eyes: float = Field(description="Chin-to-eyes distance / face height")
    neck_length: float = Field(description="Approximate neck length ratio")
    face_aspect_ratio: float = Field(description="Width / height")


class ViewLandmarks(BaseModel):
    """Landmarks for one captured view."""

    view: str  # front | left | right
    detected: bool
    confidence: float = 0.0
    landmarks_2d: list[Point2D] = Field(default_factory=list)
    landmarks_3d: list[Point3D] = Field(default_factory=list)
    bbox: tuple[float, float, float, float] | None = None  # x, y, w, h in normalised coords
    image_size: tuple[int, int] | None = None  # width, height in px


class FaceTemplate(BaseModel):
    version: str = "1.0"
    status: str = "ready"
    views: list[ViewLandmarks]
    skin_tone: SkinTone
    proportions: FaceProportions
    head_mask_png_base64: str | None = None  # front-view mask as PNG (base64)
    warnings: list[str] = Field(default_factory=list)


class ExtractError(BaseModel):
    code: str
    message: str
    details: dict[str, object] | None = None
