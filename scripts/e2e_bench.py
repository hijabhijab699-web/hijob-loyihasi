#!/usr/bin/env python3
"""
End-to-end AI pipeline benchmark.

Exercises the same call chain the mobile app uses:

    login → /tryon/preview (multipart selfie + variant + style) → GET /image URL

Runs N iterations, prints p50/p90/p95/p99 for each stage plus wall-clock totals,
and (optionally) writes the last composited image to disk.

Env vars (all optional):
    API_URL             http://localhost:4000/api/v1  (backend origin)
    LOGIN_USERNAME      diyor
    LOGIN_PASSWORD      test1234
    ITERATIONS          20
    SELFIE_PATH         path to a JPEG; defaults to the bundled test image
    SAVE_LAST           1 → drop /tmp/e2e-last.jpg with the last result
"""
from __future__ import annotations

import json
import os
import statistics
import sys
import time
from pathlib import Path
from urllib import request, error

API = os.environ.get("API_URL", "http://localhost:4000/api/v1").rstrip("/")
USERNAME = os.environ.get("LOGIN_USERNAME", "diyor")
PASSWORD = os.environ.get("LOGIN_PASSWORD", "test1234")
ITERATIONS = int(os.environ.get("ITERATIONS", "20"))
SELFIE_PATH = os.environ.get(
    "SELFIE_PATH",
    "/private/tmp/claude-501/-Users-umidjongafforov-Hijob-ai-loyihasi-/3ff92275-34e7-4615-bda0-25fc3d244972/images/3.jpg",
)
SAVE_LAST = os.environ.get("SAVE_LAST", "1") == "1"


def _post_json(path: str, payload: dict, token: str | None = None) -> dict:
    body = json.dumps(payload).encode()
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = request.Request(f"{API}{path}", data=body, headers=headers, method="POST")
    with request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())


def _multipart(fields: dict, files: dict) -> tuple[bytes, str]:
    boundary = "----n2431bench"
    out = b""
    for name, val in fields.items():
        out += f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{val}\r\n'.encode()
    for name, (fname, data, mime) in files.items():
        out += (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{fname}"\r\n'
            f'Content-Type: {mime}\r\n\r\n'
        ).encode()
        out += data + b"\r\n"
    out += f"--{boundary}--\r\n".encode()
    return out, boundary


def login() -> str:
    data = _post_json("/auth/login", {"identifier": USERNAME, "password": PASSWORD})
    return data["tokens"]["accessToken"]


def find_scarf_variant(token: str) -> str:
    with request.urlopen(f"{API}/catalog/products?category=scarves&pageSize=1") as r:
        catalog = json.loads(r.read())
    product = catalog["items"][0]
    with request.urlopen(f"{API}/catalog/products/{product['id']}") as r:
        details = json.loads(r.read())
    return details["variants"][0]["id"]


def preview_once(token: str, variant_id: str, image_bytes: bytes, style: str) -> tuple[float, float, str]:
    """Run a single /tryon/preview call; return (upload_ms, download_ms, result_url)."""
    body, boundary = _multipart(
        {"variantId": variant_id, "tyingStyle": style},
        {"face": ("face.jpg", image_bytes, "image/jpeg")},
    )
    upload_started = time.perf_counter()
    req = request.Request(
        f"{API}/tryon/preview",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        method="POST",
    )
    with request.urlopen(req, timeout=60) as resp:
        payload = json.loads(resp.read())
    upload_ms = (time.perf_counter() - upload_started) * 1000

    # Fetch the composited image URL.
    dl_started = time.perf_counter()
    with request.urlopen(payload["resultUrl"], timeout=30) as r:
        jpeg = r.read()
    download_ms = (time.perf_counter() - dl_started) * 1000

    if SAVE_LAST:
        Path("/tmp/e2e-last.jpg").write_bytes(jpeg)
    return upload_ms, download_ms, payload["resultUrl"]


def pct(values: list[float], p: int) -> float:
    return statistics.quantiles(values, n=100, method="inclusive")[p - 1] if len(values) > 1 else values[0]


def main() -> int:
    print(f"→ Benchmarking {API}  ({ITERATIONS} iterations)\n")

    try:
        token = login()
    except error.HTTPError as e:
        print(f"login failed: {e.code} — is the API running?")
        return 1

    variant_id = find_scarf_variant(token)
    image_bytes = Path(SELFIE_PATH).read_bytes()
    print(f"variant={variant_id}   selfie={SELFIE_PATH} ({len(image_bytes)/1024:.1f} KB)\n")

    styles = ["classical", "loose", "double"]
    upload_all: list[float] = []
    download_all: list[float] = []

    for i in range(ITERATIONS):
        style = styles[i % 3]
        try:
            up, down, _ = preview_once(token, variant_id, image_bytes, style)
        except error.HTTPError as e:
            body = e.read().decode(errors="ignore")[:200]
            print(f"[{i:02d}] FAIL {style}: {e.code} {body}")
            continue
        upload_all.append(up)
        download_all.append(down)
        print(f"[{i:02d}] {style:9s} upload+compose={up:6.0f} ms   download={down:5.0f} ms")

    if not upload_all:
        print("no successful runs")
        return 1

    print("\n── Latency summary ──")
    print(f"                p50      p90      p95      p99      max")
    for label, values in (("preview (compose)", upload_all), ("image download", download_all)):
        p50 = statistics.median(values)
        p90 = pct(values, 90)
        p95 = pct(values, 95)
        p99 = pct(values, 99)
        mx = max(values)
        print(f"  {label:20s} {p50:6.0f}   {p90:6.0f}   {p95:6.0f}   {p99:6.0f}   {mx:6.0f}   ms")

    successful = len(upload_all)
    total_p95 = statistics.quantiles(
        [u + d for u, d in zip(upload_all, download_all)], n=100, method="inclusive"
    )[94]
    print(f"\n  end-to-end p95:  {total_p95:.0f} ms   ({successful}/{ITERATIONS} succeeded)")
    if SAVE_LAST:
        print(f"  last composite → /tmp/e2e-last.jpg")

    # Fail loud if SLA is missed so CI catches regressions.
    if total_p95 > 1500:
        print(f"\n⚠️  SLA breach: end-to-end p95 = {total_p95:.0f} ms (target 1500 ms)")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
