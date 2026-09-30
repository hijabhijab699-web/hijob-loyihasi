# N24:31 · Garment Template Service

Python + FastAPI. Sotuvchi maneken/model fotolarini avtomatik shablon qiladi:

1. **Fon o'chirish** — rembg (u2net)
2. **Kiyim mask** — alpha channel
3. **Landmark aniqlash**
   - Scarf: MediaPipe FaceMesh yordamida yuz teshigi + drape nuqtalari
   - Dress: MediaPipe Pose (33 body landmark)
   - Bags/accessories: bounding box
4. **Standart canvas** — 1200×1600, bosh markazlash + 12% yuqori marja
5. **Rang paletka** — K-means top 5 dominant rang

## Endpointlar

| Method | Path             | Nima qiladi                                          |
|--------|------------------|------------------------------------------------------|
| GET    | `/health`        | Sanity                                               |
| POST   | `/garment/extract` | `image` + `category` → `GarmentTemplate` JSON       |

## Ishga tushirish

```bash
cd services/ml-garment
uv venv --python 3.12 .venv
uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 5003
```

## Sinov

```bash
curl -X POST http://localhost:5003/garment/extract \
  -F "image=@scarf.jpg" \
  -F "category=scarves" | jq
```
