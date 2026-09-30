# N24:31 · Try-On Compositor

Python + FastAPI + OpenCV. Compositor endpoint takes a selfie + MediaPipe face landmarks + a scarf specification and returns a JPEG with the scarf drawn onto the face — procedurally, following the head outline.

## Endpointlar

| Method | Path              | Vazifa                                                    |
|--------|-------------------|-----------------------------------------------------------|
| GET    | `/health`         | Sanity                                                    |
| POST   | `/compose/scarf`  | `face` (image) + `landmarks` (JSON) + `scarf` (JSON) → JPEG |

## Ishga tushirish

```bash
cd services/ml-compositor
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 5002
```

## Test

```bash
curl -X POST http://localhost:5002/compose/scarf \
  -F "face=@selfie.jpg" \
  -F 'landmarks={"points":[...],"image_width":1080,"image_height":1920}' \
  -F 'scarf={"tying_style":"classical","color_hex":"#D4C3A0","pattern":"silk"}' \
  --output tryon.jpg
```

## Tying styles

- **classical** — Klassik hijob: bosh, ikki yon, elka ustidan tushadi.
- **loose** — Erkin (napusk): bir yelka bo'ylab uzun mato.
- **double** — Ikki qavat: ostki qalpoq + tashqi ro'mol.
