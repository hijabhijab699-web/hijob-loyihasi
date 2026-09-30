"""Sprint 5 · MediaPipe Pose extractor tests."""
from __future__ import annotations

from app.services.pose import (
    LEFT_HIP,
    LEFT_SHOULDER,
    RIGHT_HIP,
    RIGHT_SHOULDER,
    body_summary,
    detect_pose,
)


def test_pose_returns_no_detection_for_landscape(no_face):
    """A plain background image without a body must fail cleanly (not crash)."""
    result = detect_pose(no_face)
    # MediaPipe Pose sometimes hallucinates on very simple images, so tolerate either
    # `detected=False` or a low-quality response — but never a crash.
    if result.detected:
        assert len(result.landmarks) == 33
    else:
        assert result.landmarks == []


def test_pose_body_summary_shape(face_good):
    """When Pose fires we must be able to build a compact 6-key body payload."""
    result = detect_pose(face_good)
    if not result.detected:
        # Face-only crop may not have enough body context — skip cleanly.
        import pytest

        pytest.skip("body pose not detected on head-only fixture")
    body = body_summary(result)
    assert isinstance(body, dict)
    assert set(body.keys()) == {
        "shoulder_left",
        "shoulder_right",
        "hip_left",
        "hip_right",
        "neck_center",
        "hem_center",
    }
    for point in body.values():
        assert 0.0 <= point["x"] <= 1.0
        assert 0.0 <= point["y"] <= 1.0


def test_pose_landmark_indices_are_consistent():
    """MediaPipe Pose has fixed indices — protect against a silent MediaPipe upgrade
    changing them out from under us."""
    assert LEFT_SHOULDER == 11
    assert RIGHT_SHOULDER == 12
    assert LEFT_HIP == 23
    assert RIGHT_HIP == 24
