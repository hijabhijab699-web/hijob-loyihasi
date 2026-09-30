"""Thin-Plate-Spline warping.

We map a garment's canonical canvas onto the user's selfie by picking anchor
points (source in the canvas, target on the user's face). OpenCV ships a
``ThinPlateSplineShapeTransformer``, but its API is quirky — it wants matches
as an OpenCV `DMatch` list and expects the source/target arrays to have shape
``(1, N, 2)``. We wrap that here so the rest of the code just passes numpy arrays.
"""
from __future__ import annotations

import cv2
import numpy as np


def apply_tps(
    image: np.ndarray,
    source_points: np.ndarray,
    target_points: np.ndarray,
    output_size: tuple[int, int],
    regularization: float = 0.05,
) -> np.ndarray:
    """Warp `image` using a TPS transform that sends `source_points` to `target_points`.

    Args:
        image: source image (H, W, C).
        source_points: (N, 2) float32, in the source image's pixel coordinates.
        target_points: (N, 2) float32, in the output canvas's pixel coordinates.
        output_size: (width, height) of the destination image.
        regularization: TPS smoothing (0 = strict, higher = looser).

    Returns:
        Warped image with shape (output_size[1], output_size[0], C).
    """
    if source_points.shape != target_points.shape:
        raise ValueError("source/target must have the same shape")
    if source_points.shape[1] != 2:
        raise ValueError("points must be (N, 2)")

    src = source_points.astype(np.float32).reshape(1, -1, 2)
    dst = target_points.astype(np.float32).reshape(1, -1, 2)

    tps = cv2.createThinPlateSplineShapeTransformer(regularizationParameter=regularization)
    matches = [cv2.DMatch(i, i, 0) for i in range(source_points.shape[0])]

    # OpenCV's convention is inverted: estimateTransformation(target, source, matches).
    # Reading the docs: "the number of features in source is expected to be
    # equal to the number of features in target".
    tps.estimateTransformation(dst, src, matches)

    warped = tps.warpImage(image, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)

    # OpenCV keeps the source image size — resize if the caller wants a different canvas.
    if warped.shape[1] != output_size[0] or warped.shape[0] != output_size[1]:
        warped = cv2.resize(warped, output_size, interpolation=cv2.INTER_LINEAR)
    return warped
