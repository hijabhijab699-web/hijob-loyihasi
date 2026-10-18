"""Thin subprocess wrapper around FaceFusion's `headless-run`.

FaceFusion ships as a standalone CLI with its own Python 3.12 venv under
/Users/umidjongafforov/facefusion. Running it in-process would mean merging
its (opencv 5, onnx 1.23, gradio) deps into ours, which conflicts with every
other service in this repo. A subprocess call per request stays isolated:
we write the two input JPEGs to a temp directory, invoke the CLI, read the
result, and clean up. Models are cached by FaceFusion itself so only the
first call pays the ~1 GB download cost.
"""
from __future__ import annotations

import logging
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

import cv2
import numpy as np

logger = logging.getLogger(__name__)

# These are the on-disk locations the user set up. Overridable via env so a
# different machine (or CI) can point at its own install.
FACEFUSION_DIR = Path(
    os.environ.get("FACEFUSION_DIR", "/Users/umidjongafforov/facefusion")
)
FACEFUSION_PY = Path(
    os.environ.get("FACEFUSION_PY", str(FACEFUSION_DIR / ".venv" / "bin" / "python"))
)

# Hard ceiling on a single call. FaceFusion typically returns in 3-6 s on
# an M-series Mac for a 1024-wide image once models are cached; 90 s covers
# a slow first-run download without hanging the HTTP worker forever.
# First-time run also downloads GFPGAN/xseg (~400 MB) which can take a few
# minutes on slow links; after that calls finish in ~5 s. 4 min ceiling.
TIMEOUT_S = int(os.environ.get("FACEFUSION_TIMEOUT_S", "240"))


class FacefusionError(RuntimeError):
    """Base class for FaceFusion wrapper failures the caller may want to
    turn into a specific HTTP code."""


class NoFaceError(FacefusionError):
    """FaceFusion ran but couldn't find a face on the source or target."""


def _write_jpeg(path: Path, img: np.ndarray) -> None:
    ok, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if not ok:
        raise FacefusionError("encode_input_failed")
    path.write_bytes(buf.tobytes())


def face_fusion_swap(
    source_bgr: np.ndarray,
    target_bgr: np.ndarray,
    *,
    enhance: bool = True,
) -> np.ndarray:
    """Swap `source` face onto `target` using FaceFusion. Both inputs are
    BGR numpy arrays; the return is a BGR numpy array of the composited
    result. `enhance=True` adds the GFPGAN face enhancer pass — slightly
    slower but visibly cleaner."""
    if not FACEFUSION_PY.exists():
        raise FacefusionError(f"FACEFUSION_PY not found: {FACEFUSION_PY}")

    started = time.perf_counter()
    with tempfile.TemporaryDirectory(prefix="ff-swap-") as tmp:
        tmp_dir = Path(tmp)
        source_path = tmp_dir / "source.jpg"
        target_path = tmp_dir / "target.jpg"
        output_path = tmp_dir / "result.jpg"
        _write_jpeg(source_path, source_bgr)
        _write_jpeg(target_path, target_bgr)

        processors = ["face_swapper"]
        if enhance:
            processors.append("face_enhancer")

        cmd: list[str] = [
            str(FACEFUSION_PY),
            "facefusion.py",
            "headless-run",
            "--source-paths", str(source_path),
            "--target-path", str(target_path),
            "--output-path", str(output_path),
            "--processors", *processors,
            "--execution-providers", "coreml", "cpu",
            "--log-level", "warn",
        ]
        env = os.environ.copy()
        # Make sure the venv's PATH wins so ffmpeg (from brew) is also
        # resolvable at /opt/homebrew/bin.
        env["PATH"] = f"/opt/homebrew/bin:{env.get('PATH', '')}"

        try:
            res = subprocess.run(
                cmd,
                cwd=str(FACEFUSION_DIR),
                capture_output=True,
                text=True,
                env=env,
                timeout=TIMEOUT_S,
                check=False,
            )
        except subprocess.TimeoutExpired as exc:
            raise FacefusionError("facefusion_timeout") from exc

        combined = (res.stdout or "") + (res.stderr or "")
        if res.returncode != 0 or not output_path.exists():
            # FaceFusion exits 0 even on validation failures like "no face"
            # but doesn't write an output. Detect that from stdout.
            lower = combined.lower()
            if "no face" in lower or "detect no face" in lower:
                raise NoFaceError("no_face_detected")
            logger.error(
                "facefusion failed rc=%s log_tail=%s",
                res.returncode,
                combined[-500:],
            )
            raise FacefusionError(f"facefusion_failed:{res.returncode}")

        result = cv2.imread(str(output_path), cv2.IMREAD_COLOR)
        if result is None:
            raise FacefusionError("decode_output_failed")

    elapsed_ms = int((time.perf_counter() - started) * 1000)
    logger.info(
        "facefusion swap in %d ms (processors=%s)",
        elapsed_ms,
        ",".join(processors),
    )
    return result


def check_available() -> tuple[bool, str]:
    """Startup probe — returns (ok, detail). Logged once on boot so a
    missing install is obvious."""
    if not FACEFUSION_DIR.is_dir():
        return False, f"missing dir {FACEFUSION_DIR}"
    if not FACEFUSION_PY.exists():
        return False, f"missing python {FACEFUSION_PY}"
    if not shutil.which("ffmpeg", path=os.environ.get("PATH", "") + ":/opt/homebrew/bin"):
        return False, "ffmpeg not found (brew install ffmpeg)"
    return True, "ok"
