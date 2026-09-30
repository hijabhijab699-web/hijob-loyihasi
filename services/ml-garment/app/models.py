"""Response schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Category = Literal["scarves", "dresses", "bags", "accessories"]


class Point2D(BaseModel):
    x: float
    y: float


class BoundingBox(BaseModel):
    x: float
    y: float
    w: float
    h: float


class ScarfLandmarks(BaseModel):
    type: Literal["scarf"] = "scarf"
    face_opening_center: Point2D
    face_opening_bbox: BoundingBox
    hair_coverage_top: Point2D
    drape_left: Point2D
    drape_right: Point2D
    fabric_bbox: BoundingBox
    detected_face: bool


class DressLandmarks(BaseModel):
    type: Literal["dress"] = "dress"
    shoulder_left: Point2D
    shoulder_right: Point2D
    hip_left: Point2D
    hip_right: Point2D
    neck_center: Point2D
    hem_left: Point2D
    hem_right: Point2D
    detected_pose: bool


class GenericLandmarks(BaseModel):
    type: Literal["generic"] = "generic"
    bbox: BoundingBox


Landmarks = ScarfLandmarks | DressLandmarks | GenericLandmarks


class StandardPose(BaseModel):
    canvas_width: int
    canvas_height: int
    scale_factor: float
    tx: float
    ty: float


class GarmentTemplate(BaseModel):
    version: str = "1.0"
    category: Category
    landmarks: Landmarks = Field(discriminator="type")
    standard_pose: StandardPose
    canonical_png_base64: str = Field(description="Foreground on transparent bg, downscaled")
    mask_png_base64: str = Field(description="Grayscale alpha (0-255)")
    color_palette: list[str] = Field(description="Dominant hex colours (up to 5)")
    warnings: list[str] = []
