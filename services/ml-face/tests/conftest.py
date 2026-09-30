from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
import pytest

FIXTURES = Path(__file__).parent / "fixtures" / "faces"


@pytest.fixture(scope="session")
def face_good() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "hijabi-front-good.jpg"))
    assert img is not None, "fixture missing: hijabi-front-good.jpg"
    return img


@pytest.fixture(scope="session")
def face_lowlight() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "hijabi-front-lowlight.jpg"))
    assert img is not None, "fixture missing: hijabi-front-lowlight.jpg"
    return img


@pytest.fixture(scope="session")
def face_side() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "hijabi-side-good.jpg"))
    assert img is not None, "fixture missing: hijabi-side-good.jpg"
    return img


@pytest.fixture(scope="session")
def face_body() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "hijabi-body-good.jpg"))
    assert img is not None, "fixture missing: hijabi-body-good.jpg"
    return img


@pytest.fixture(scope="session")
def no_face() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "no-face.jpg"))
    assert img is not None, "fixture missing: no-face.jpg"
    return img
