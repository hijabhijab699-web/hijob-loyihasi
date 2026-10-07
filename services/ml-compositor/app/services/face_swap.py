"""Face swap powered by InsightFace's inswapper_128 model.

The seller publishes a mannequin pre-wearing the hijab; the buyer sends a
frontal selfie. We detect faces in both with InsightFace's ``buffalo_l``
model, then paste the buyer's face onto the mannequin with the open-source
``inswapper_128.onnx`` network. Lighting, pose, hair and jaw context from
the mannequin are preserved; only the face identity swaps.

The service lazy-loads the heavy models on first request so the FastAPI
worker starts fast. Everything after that stays warm in memory. CPU
inference runs in roughly 1.5-2 seconds per 1024-wide image on an M-series
Mac — slow for a REST hit, but good enough for a "preview a hijab on
yourself" tap.

Fallback: when InsightFace is unavailable (model missing, Python version
mismatch, or GPU-only build) we fall back to the Haar + Poisson classic
pipeline so the endpoint still returns *something* instead of a 500.
"""
from __future__ import annotations

import logging
import os
import threading
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)

MODEL_DIR = Path(os.environ.get("ML_COMPOSITOR_MODEL_DIR", Path(__file__).resolve().parents[2] / "models"))
INSWAPPER_PATH = MODEL_DIR / "inswapper_128.onnx"

_app = None  # insightface FaceAnalysis, lazily initialised
_swapper = None
_init_lock = threading.Lock()
_init_failed = False
_init_error: str | None = None


def _init_insightface() -> bool:
    """Load the FaceAnalysis + inswapper models once. Returns True on success,
    False if we should fall back to the classic Haar pipeline."""
    global _app, _swapper, _init_failed, _init_error
    if _app is not None and _swapper is not None:
        return True
    if _init_failed:
        return False

    with _init_lock:
        if _app is not None and _swapper is not None:
            return True
        if _init_failed:
            return False

        try:
            # Imported lazily so the service still boots when the package or
            # its ONNX runtime fail to load (e.g. on an unsupported platform).
            from insightface.app import FaceAnalysis
            from insightface.model_zoo import get_model

            if not INSWAPPER_PATH.exists():
                raise FileNotFoundError(
                    f"inswapper_128.onnx missing at {INSWAPPER_PATH} — "
                    "run `scripts/download_models.sh` or set ML_COMPOSITOR_MODEL_DIR."
                )

            logger.info("initialising insightface (det+rec) …")
            app = FaceAnalysis(
                name="buffalo_l",
                providers=["CPUExecutionProvider"],
                root=str(MODEL_DIR),
            )
            # det_size 512 keeps CPU inference under a second while catching
            # ~90-px-wide faces in the catalogue shots.
            app.prepare(ctx_id=0, det_size=(512, 512))

            logger.info("loading inswapper_128.onnx …")
            swapper = get_model(
                str(INSWAPPER_PATH),
                providers=["CPUExecutionProvider"],
            )

            _app = app
            _swapper = swapper
            logger.info("insightface ready")
            return True
        except Exception as exc:  # noqa: BLE001
            _init_failed = True
            _init_error = str(exc)
            logger.warning("insightface init failed, falling back to Haar: %s", exc)
            return False


# ---------------------------------------------------------------------------
# Fallback (Haar + Poisson). Only used when insightface is unavailable.
# ---------------------------------------------------------------------------
_HAAR_FRONTAL = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)
_HAAR_ALT = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_alt2.xml"
)
_HAAR_PROFILE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_profileface.xml"
)


@dataclass(frozen=True)
class _FaceBox:
    x: int
    y: int
    w: int
    h: int

    @property
    def cx(self) -> int:
        return self.x + self.w // 2

    @property
    def cy(self) -> int:
        return self.y + self.h // 2


def _detect_face_haar(image_bgr: np.ndarray) -> _FaceBox | None:
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    short_side = min(image_bgr.shape[:2])
    min_size = max(30, short_side // 12)

    def run(classifier: cv2.CascadeClassifier, image: np.ndarray):
        return classifier.detectMultiScale(
            image, scaleFactor=1.03, minNeighbors=2, minSize=(min_size, min_size)
        )

    for classifier in (_HAAR_FRONTAL, _HAAR_ALT):
        boxes = run(classifier, gray)
        if len(boxes) > 0:
            x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
            return _FaceBox(int(x), int(y), int(w), int(h))

    for image in (gray, cv2.flip(gray, 1)):
        boxes = run(_HAAR_PROFILE, image)
        if len(boxes) > 0:
            x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
            if not np.shares_memory(image, gray):
                x = gray.shape[1] - x - w
            return _FaceBox(int(x), int(y), int(w), int(h))

    return None


def _elliptical_mask(h: int, w: int, feather: int = 21) -> np.ndarray:
    mask = np.zeros((h, w), dtype=np.uint8)
    cv2.ellipse(
        mask,
        (w // 2, int(h * 0.52)),
        (int(w * 0.42), int(h * 0.48)),
        0, 0, 360, 255, -1,
    )
    if feather > 1 and feather % 2 == 1:
        mask = cv2.GaussianBlur(mask, (feather, feather), feather / 3)
    return mask


def _face_swap_haar(mannequin_bgr: np.ndarray, user_bgr: np.ndarray) -> np.ndarray:
    """Classic fallback: Haar box → scale → Poisson seamless clone."""
    man_face = _detect_face_haar(mannequin_bgr)
    if man_face is None:
        raise ValueError("NO_MANNEQUIN_FACE")
    user_face = _detect_face_haar(user_bgr)
    if user_face is None:
        raise ValueError("NO_USER_FACE")

    pad = int(user_face.w * 0.15)
    ux0 = max(0, user_face.x - pad)
    uy0 = max(0, user_face.y - pad)
    ux1 = min(user_bgr.shape[1], user_face.x + user_face.w + pad)
    uy1 = min(user_bgr.shape[0], user_face.y + user_face.h + pad)
    user_crop = user_bgr[uy0:uy1, ux0:ux1]

    target_w = int(man_face.w * 1.3)
    target_h = int(man_face.h * 1.3)
    resized = cv2.resize(user_crop, (target_w, target_h), interpolation=cv2.INTER_LINEAR)
    mask = _elliptical_mask(target_h, target_w)

    center = (man_face.cx, int(man_face.cy + man_face.h * 0.05))
    guard = max(target_w, target_h) // 2 + 8
    padded = cv2.copyMakeBorder(
        mannequin_bgr, guard, guard, guard, guard, cv2.BORDER_REPLICATE
    )
    padded_center = (center[0] + guard, center[1] + guard)
    try:
        blended = cv2.seamlessClone(
            resized, padded, mask, padded_center, cv2.NORMAL_CLONE
        )
    except cv2.error:
        blended = padded.copy()
        x0 = padded_center[0] - target_w // 2
        y0 = padded_center[1] - target_h // 2
        alpha = (mask.astype(np.float32) / 255.0)[..., None]
        region = blended[y0 : y0 + target_h, x0 : x0 + target_w].astype(np.float32)
        swapped = resized.astype(np.float32)
        blended[y0 : y0 + target_h, x0 : x0 + target_w] = (
            region * (1.0 - alpha) + swapped * alpha
        ).astype(np.uint8)
    return blended[guard:-guard, guard:-guard]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def face_swap(mannequin_bgr: np.ndarray, user_bgr: np.ndarray) -> np.ndarray:
    """Return a copy of the mannequin with the user's face swapped in.

    Uses the InsightFace inswapper when available; otherwise falls back to
    the Haar+Poisson classic pipeline.

    Raises ``ValueError`` if no face can be found in either image.
    """
    if _init_insightface():
        assert _app is not None and _swapper is not None  # for type checkers
        man_faces = _app.get(mannequin_bgr)
        if not man_faces:
            raise ValueError("NO_MANNEQUIN_FACE")
        user_faces = _app.get(user_bgr)
        if not user_faces:
            raise ValueError("NO_USER_FACE")

        # Biggest face in each — the catalogue shots are head-and-shoulders,
        # and the buyer's selfie is usually the only face in frame.
        man_face = max(man_faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))
        user_face = max(user_faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))

        # Inswapper writes directly onto the destination image. paste_back=True
        # restores pose + hair + background from the mannequin photo.
        return _swapper.get(mannequin_bgr.copy(), man_face, user_face, paste_back=True)

    # Fallback path
    return _face_swap_haar(mannequin_bgr, user_bgr)


def have_haar_data() -> bool:
    return Path(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    ).exists()


def is_premium_ready() -> bool:
    """Startup-time check: True when insightface + inswapper are available."""
    return _init_insightface()
