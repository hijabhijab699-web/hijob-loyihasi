from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np
import pytest

FIXTURES = Path(__file__).parent / "fixtures" / "garments"


@pytest.fixture(scope="session")
def scarf_image() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "scarf-on-model.jpg"))
    assert img is not None
    return img


@pytest.fixture(scope="session")
def dress_image() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "dress-on-model.jpg"))
    assert img is not None
    return img


@pytest.fixture(scope="session")
def empty_image() -> np.ndarray:
    img = cv2.imread(str(FIXTURES / "empty.jpg"))
    assert img is not None
    return img
