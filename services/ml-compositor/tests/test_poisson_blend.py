"""Tests for the Poisson (edge-only) blend mode added in Sprint 8.

The design goal is: interior pixels keep the fabric colour, the ~10 pixel
ring around the fabric edge dissolves into the base's lighting via
seamlessClone, and pixels outside the fabric stay untouched.
"""
import numpy as np

from app.models import ScarfSpec
from app.services.template_compose import _blend


def _build_scene():
    """Flat skin tone selfie + a solid red rectangle fabric with full alpha."""
    selfie = np.full((200, 200, 3), (180, 170, 160), dtype=np.uint8)
    fabric = np.zeros((200, 200, 4), dtype=np.uint8)
    fabric[20:100, 40:160, 2] = 200   # red (BGR channel)
    fabric[20:100, 40:160, 3] = 255
    return selfie, fabric


def test_alpha_mode_hard_edge_centre_red():
    selfie, fabric = _build_scene()
    out = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="alpha", opacity=1.0))
    assert out.shape == selfie.shape
    # Interior is the fabric colour (bright red in channel 2).
    assert out[60, 100, 2] > 180
    # Just above the fabric is skin.
    assert out[10, 100, 2] < 180


def test_poisson_mode_preserves_interior_colour():
    """The whole point of edge-only Poisson: interior must stay the scarf
    colour. Pure seamlessClone would wash it out to the skin tone."""
    selfie, fabric = _build_scene()
    out = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="poisson", opacity=1.0))
    assert out.shape == selfie.shape
    # Deep interior (far from the edge ring) must still read as red.
    assert out[60, 100, 2] > 180, f"interior lost its red: {out[60, 100]}"
    # And channels 0/1 are near zero (no skin leakage).
    assert out[60, 100, 0] < 50 and out[60, 100, 1] < 50


def test_poisson_mode_outside_fabric_untouched():
    """Pixels well outside the dilated mask equal the original base."""
    selfie, fabric = _build_scene()
    out = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="poisson", opacity=1.0))
    # 5 pixels into the clear region, both top and bottom.
    assert tuple(out[5, 5]) == (180, 170, 160)
    assert tuple(out[195, 195]) == (180, 170, 160)


def test_poisson_mode_tiny_mask_falls_back_safely():
    """A single-pixel 'fabric' is too small to meaningfully Poisson-blend —
    the function must not raise and must produce an image that is still
    recognisable as the original base (far pixels unchanged)."""
    selfie, _ = _build_scene()
    tiny = np.zeros((200, 200, 4), dtype=np.uint8)
    tiny[50, 100] = (0, 0, 255, 255)
    out = _blend(selfie.copy(), tiny, ScarfSpec(blend_mode="poisson", opacity=1.0))
    assert out.shape == selfie.shape
    # Pixels well away from the single source pixel are untouched.
    assert tuple(out[5, 5]) == (180, 170, 160)
    assert tuple(out[195, 195]) == (180, 170, 160)


def test_poisson_mode_differs_from_alpha_at_edges():
    """Interior is the same, but the mask edge should differ because Poisson
    spreads the transition over ~10 px while alpha's edge is one pixel."""
    selfie, fabric = _build_scene()
    a = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="alpha", opacity=1.0))
    p = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="poisson", opacity=1.0))
    # Sample a few pixels along the top edge of the fabric; at least one
    # should disagree.
    edge_strip_a = a[18:24, 100]
    edge_strip_p = p[18:24, 100]
    assert not np.array_equal(edge_strip_a, edge_strip_p)


def test_poisson_opacity_half_remixes_toward_base():
    """At opacity 0.5 the result sits roughly halfway between base and the
    full Poisson composite."""
    selfie, fabric = _build_scene()
    full = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="poisson", opacity=1.0))
    half = _blend(selfie.copy(), fabric, ScarfSpec(blend_mode="poisson", opacity=0.5))
    # Interior at opacity 0.5 should be between skin (160/170/180) and the
    # full-Poisson red (<50/<50/>180).
    assert half[60, 100, 2] > selfie[60, 100, 2]  # redder than base
    assert half[60, 100, 2] < full[60, 100, 2]    # less red than full
