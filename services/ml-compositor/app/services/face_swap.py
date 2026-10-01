"""Face swap: drop the buyer's face onto a pre-styled mannequin image.

The seller publishes a photo of a model already wearing the hijab (that photo
is ``mannequin``). The buyer sends a frontal selfie. We detect both faces,
scale the buyer face region to the mannequin face bounding box, build a soft
elliptical mask, and let ``cv2.seamlessClone`` carry over the mannequin's
lighting so the swap doesn't look pasted.

This is intentionally a classic computer-vision pipeline (Haar face detector
+ Poisson blend) rather than a learned face-swap model. It needs no new
dependencies on top of ``opencv-python-headless``, runs in ~150 ms on a
mid-range Mac for 1024-wide images, and is good enough for the MVP's
"see-yourself-in-this-hijab" moment. A learned swap (InsightSwap / SimSwap)
can slot in later behind the same service signature.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)

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
class FaceBox:
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


def _detect_face(image_bgr: np.ndarray) -> FaceBox | None:
    """Pick the biggest face in the frame. Tries frontal → alt → profile → mirrored
    profile so a model turned slightly or lit from one side still gets picked up.
    Returns None if nothing crosses the detection threshold."""
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)

    short_side = min(image_bgr.shape[:2])
    # Catalogue hijab shots are often ~200-400 px wide, so cap the min face at
    # something that still fits inside them. The Poisson blend handles small
    # faces fine; false positives are rare on head-and-shoulders portraits.
    min_size = max(30, short_side // 12)

    def run(classifier: cv2.CascadeClassifier, image: np.ndarray):
        return classifier.detectMultiScale(
            image,
            scaleFactor=1.03,
            minNeighbors=2,
            minSize=(min_size, min_size),
        )

    for classifier in (_HAAR_FRONTAL, _HAAR_ALT):
        boxes = run(classifier, gray)
        if len(boxes) > 0:
            x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
            return FaceBox(int(x), int(y), int(w), int(h))

    # Profile detector only matches heads turned to one side; the Haar
    # profile cascade is trained on right-facing heads so we also test the
    # mirror for left-facing ones.
    for image in (gray, cv2.flip(gray, 1)):
        boxes = run(_HAAR_PROFILE, image)
        if len(boxes) > 0:
            x, y, w, h = max(boxes, key=lambda b: b[2] * b[3])
            if image.shape == gray.shape and not np.shares_memory(image, gray):
                # mirrored — map x back to the original frame
                x = gray.shape[1] - x - w
            return FaceBox(int(x), int(y), int(w), int(h))

    return None


def _elliptical_mask(h: int, w: int, feather: int = 21) -> np.ndarray:
    """Soft oval mask sized (h, w). ``feather`` controls the edge softness."""
    mask = np.zeros((h, w), dtype=np.uint8)
    # Pull the oval slightly inward so forehead hairline and chin don't bleed
    # beyond the mannequin's own face area.
    cv2.ellipse(
        mask,
        (w // 2, int(h * 0.52)),
        (int(w * 0.42), int(h * 0.48)),
        0,
        0,
        360,
        255,
        -1,
    )
    if feather > 1 and feather % 2 == 1:
        mask = cv2.GaussianBlur(mask, (feather, feather), feather / 3)
    return mask


def face_swap(mannequin_bgr: np.ndarray, user_bgr: np.ndarray) -> np.ndarray:
    """Return a copy of ``mannequin_bgr`` with the user's face swapped in.

    Raises ``ValueError`` if either image has no detectable face.
    """
    man_face = _detect_face(mannequin_bgr)
    if man_face is None:
        raise ValueError("NO_MANNEQUIN_FACE")

    user_face = _detect_face(user_bgr)
    if user_face is None:
        raise ValueError("NO_USER_FACE")

    # Enlarge the user crop slightly so we grab a bit of hair and jaw context;
    # the Poisson blend then eases the hard crop edge away.
    pad = int(user_face.w * 0.15)
    ux0 = max(0, user_face.x - pad)
    uy0 = max(0, user_face.y - pad)
    ux1 = min(user_bgr.shape[1], user_face.x + user_face.w + pad)
    uy1 = min(user_bgr.shape[0], user_face.y + user_face.h + pad)
    user_crop = user_bgr[uy0:uy1, ux0:ux1]

    # Match the mannequin face bbox so the swapped region covers eyes-to-chin
    # roughly where the mannequin face lives, then relax by the same pad so
    # the mask oval sits inside it.
    target_w = int(man_face.w * 1.3)
    target_h = int(man_face.h * 1.3)
    resized = cv2.resize(user_crop, (target_w, target_h), interpolation=cv2.INTER_LINEAR)

    mask = _elliptical_mask(target_h, target_w)

    center = (man_face.cx, int(man_face.cy + man_face.h * 0.05))

    # ``seamlessClone`` fails loudly when the mask touches the dst edge. Pad
    # the mannequin canvas just enough to keep the oval inside.
    guard = max(target_w, target_h) // 2 + 8
    padded = cv2.copyMakeBorder(
        mannequin_bgr, guard, guard, guard, guard, cv2.BORDER_REPLICATE
    )
    padded_center = (center[0] + guard, center[1] + guard)

    try:
        blended = cv2.seamlessClone(
            resized, padded, mask, padded_center, cv2.NORMAL_CLONE
        )
    except cv2.error as exc:  # noqa: BLE001
        logger.warning("seamlessClone failed (%s), falling back to alpha blend", exc)
        blended = padded.copy()
        # Alpha blend fallback — never crashes, just looks slightly flatter.
        x0 = padded_center[0] - target_w // 2
        y0 = padded_center[1] - target_h // 2
        alpha = (mask.astype(np.float32) / 255.0)[..., None]
        region = blended[y0 : y0 + target_h, x0 : x0 + target_w].astype(np.float32)
        swapped = resized.astype(np.float32)
        blended[y0 : y0 + target_h, x0 : x0 + target_w] = (
            region * (1.0 - alpha) + swapped * alpha
        ).astype(np.uint8)

    return blended[guard:-guard, guard:-guard]


def have_haar_data() -> bool:
    """Sanity check used by startup logs — False means OpenCV wasn't shipped
    with its bundled Haar cascades (shouldn't happen in a wheel install)."""
    return Path(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    ).exists()
