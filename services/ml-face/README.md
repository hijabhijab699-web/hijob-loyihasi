# N24:31 · Face Template Service

Python + FastAPI service that turns a foydalanuvchi's three selfies into a **face template** (landmarks, skin tone, head/neck proportions, and a foreground mask). Raw images are never persisted — only the derived data is returned to the caller (typically the NestJS API).

## Endpointlar

| Method | Path            | Nima qiladi                                                 |
|--------|-----------------|-------------------------------------------------------------|
| GET    | `/health`       | Sanity check                                                |
| POST   | `/face/extract` | 3 rakursli multipart → to'liq `FaceTemplate` JSON            |

## Ishga tushirish

```bash
# 1. venv
cd services/ml-face
python3.12 -m venv .venv
source .venv/bin/activate

# 2. install
pip install --upgrade pip
pip install -r requirements.txt

# 3. run
uvicorn app.main:app --host 0.0.0.0 --port 5001 --reload
```

Swagger UI: http://localhost:5001/docs

## Test qilib ko'rish

```bash
curl -X POST http://localhost:5001/face/extract \
  -F "front=@front.jpg" \
  -F "left=@left.jpg" \
  -F "right=@right.jpg" | jq
```

## Muhim eslatmalar

- Rasmlar 2048px dan katta bo'lsa avtomatik kichraytiriladi.
- MediaPipe modellari **birinchi so'rov** dan oldin startup vaqtida yuklanadi (~1s).
- Har bir yuz shabloni ~5-15KB JSON + head mask PNG (~30KB base64).
