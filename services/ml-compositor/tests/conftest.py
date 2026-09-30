"""Shared fixtures. Landmarks are pre-baked into JSON so the tests don't have to
re-run MediaPipe — that keeps this suite decoupled from ml-face and much faster."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np
import pytest

FIXTURES = Path(__file__).parent / "fixtures" / "faces"
GARMENT_FIXTURES = Path(__file__).parent / "fixtures" / "garments"


@pytest.fixture(scope="session")
def face_image() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "hijabi-front-good.jpg"))
    assert img is not None
    return img


@pytest.fixture(scope="session")
def no_face_image() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "no-face.jpg"))
    assert img is not None
    return img


@pytest.fixture(scope="session")
def face_landmarks_px(face_image) -> np.ndarray:
    """478 pixel-space landmarks matching `face_image`. Regenerate via ml-face if the fixture changes."""
    from app.services.geometry import to_pixels

    with open(FIXTURES / "hijabi-front-good.landmarks.json") as f:
        data = json.load(f)

    landmarks = [(p[0], p[1]) for p in data["landmarks_2d"]]
    h, w = face_image.shape[:2]
    # The JSON was captured at the source image resolution — resize if needed.
    if w != data["image_width"] or h != data["image_height"]:
        # If the on-disk image was replaced, this would drift; we detect it here.
        raise RuntimeError(
            f"landmarks captured at {data['image_width']}x{data['image_height']} but image is {w}x{h}; "
            "regenerate the JSON"
        )
    return to_pixels(landmarks, w, h)


@pytest.fixture(scope="session")
def template_canonical() -> np.ndarray:
    """Real seller-uploaded scarf template canvas (rembg output, ~840 KB PNG)."""
    img = cv2.imread(str(GARMENT_FIXTURES / "scarf-canonical.png"), cv2.IMREAD_UNCHANGED)
    assert img is not None, "run Sprint 3 setup to seed scarf-canonical.png"
    if img.shape[2] == 3:
        img = np.dstack([img, np.full(img.shape[:2], 255, dtype=np.uint8)])
    return img


@pytest.fixture(scope="session")
def template_landmarks() -> dict:
    return json.loads((GARMENT_FIXTURES / "scarf-landmarks.json").read_text())
