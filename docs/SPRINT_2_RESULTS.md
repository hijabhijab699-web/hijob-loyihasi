# N24:31 · Sprint 2 natijalari — Garment Template Engine

**Sana:** 2026-09-30
**Reja:** [AI_PLAN.md §5 Sprint 2](./AI_PLAN.md)

---

## Xulosa

| Bosqich | Testlar | O'tdi | Latency |
|---|---|---|---|
| **ml-garment** unit + integration | 10 | ✅ 10/10 | 628 ms real |
| **End-to-end** (upload → template → DB) | 1 | ✅ 1/1 | < 3 s |
| **Barcha 3 servis birlashuvda** | — | ✅ | Tayyor |

Sprint 2 checklist tamomlandi.

---

## 1. Yaratilgan tarkibiy qismlar

### 1.1 ml-garment servisi

`services/ml-garment/` (Python 3.12 + FastAPI, port 5003)

**Modul struktura:**
```
app/
├── main.py                    # FastAPI + CORS
├── config.py                  # canvas 1200×1600, u2net model
├── models.py                  # Pydantic: ScarfLandmarks | DressLandmarks | GenericLandmarks
├── utils.py                   # image decode, PNG base64
├── routes/
│   ├── health.py
│   └── extract.py             # POST /garment/extract
└── services/
    ├── segmentation.py        # rembg u2net wrapper (LRU cached)
    ├── face_probe.py          # MediaPipe FaceMesh (mini)
    ├── scarf.py               # scarf landmark extractor
    ├── dress.py               # MediaPipe Pose + hem detection
    ├── canvas.py              # normalize to 1200×1600
    ├── palette.py             # K-means dominant colours
    └── template.py            # top-level orchestrator
```

### 1.2 NestJS integratsiya

`services/api/src/seller/ml-garment.client.ts` — fetch client
`services/api/src/seller/seller.service.ts` — `buildGarmentTemplatesForProduct()` fon vazifa sifatida

**Oqim:**
```
Sotuvchi: POST /seller/products (variants[].images = [uploaded URL])
      │
      ▼
Product yaratildi (response 200 OK)
      │
      └─────────► Background job (void, promise, fail-open):
                  for each variant:
                    - fetch image from URL
                    - POST ml-garment /garment/extract
                    - save canonical.png + mask.png to storage
                    - INSERT garment_templates row (landmarks, palette)
```

---

## 2. Test natijalari

Ishga tushirish: `cd services/ml-garment && .venv/bin/python -m pytest tests/ -v`

| Test | Nima ko'radi | Natija |
|---|---|---|
| `test_rembg_mask_shape_matches_image` | Alpha mask = kirish shape | ✅ |
| `test_rembg_mask_has_foreground` | Foreground ratio 5-95% | ✅ |
| `test_scarf_landmarks_face_detected` | Yuz aniqlanadi, drape symmetric | ✅ |
| `test_scarf_no_face_falls_back_gracefully` | Yuzsiz rasm → mask centre fallback | ✅ |
| `test_dress_landmarks_shape` | Yelkalar hip'lardan yuqorida | ✅ |
| `test_canvas_normalize_dimensions` | 1200×1600, scale_factor > 0 | ✅ |
| `test_full_template_latency` | < 2 s + valid PNG | ✅ |
| `test_palette_dominant_color_is_hex` | Hex parse ishlaydi | ✅ |
| `test_template_deterministic_landmarks` | Bir input → bir output | ✅ |
| `test_bag_category_uses_generic_landmarks` | Bag → generic bbox | ✅ |

**Umumiy vaqt: 9.67 s** (rembg model load + real ONNX inference)

---

## 3. End-to-end integratsiya sinovi

**Test skript:**
1. `POST /auth/login` (noor) → JWT
2. `POST /seller/uploads` (image) → 251 KB rasm yuklandi
3. `POST /seller/products` (variant.images = [uploaded_url])
4. 3 s kutish (fon job)
5. `SELECT FROM garment_templates`

**Natija:**
```
variant_id: 2d2cca3b-e0c2-4f1e-a33c-0468e3572767
canonical_image_key: garment/2d2c.../2026-09/27d0....png
color_palette: ["#ece2cd", "#dacaab", "#baa07e", "#817050", "#2e2820"]
landmark_keys: 8 — type, drape_left/right, fabric_bbox, detected_face,
              face_opening_bbox/center, hair_coverage_top
```

**Chiqarilgan fayllar:**
- `services/api/uploads/garment/{variant_id}/2026-09/canonical.png` — fon o'chirilgan RGBA canvas
- `services/api/uploads/garment/{variant_id}/2026-09/mask.png` — grayscale alpha

**Latency**: 628 ms real POST → DB write (u2net + FaceMesh + K-means).

---

## 4. Model tanlash va texnik qarorlar

| Vazifa | Tanlangan model | Muqobil | Qaror sababi |
|---|---|---|---|
| Background removal | **rembg u2net** (176 MB) | SAM 2, MODNet | CPU da yetarli, siyosat: modeling qarama-qarshiligini kamaytirish |
| Scarf face opening | **MediaPipe FaceMesh** | Custom-trained | Mavjud model 478 nuqta beradi, custom kerak emas |
| Dress pose | **MediaPipe Pose** | OpenPose, YOLO-Pose | 33 landmark, tez, CPU friendly |
| Palette | **OpenCV K-means** | scikit-learn | Kam bog'liqlik |

**Fallback taktikalar:**
- Yuzsiz rasm → face opening = mask markazi
- Pose detektsiyasi ishlamasa → mask bounding box
- rembg boshlash oldini olib yugurish (LRU cache, model 1 marta yuklanadi)

---

## 5. Ma'lumot bazasi va API oqimi

**Prisma jadval** (Sprint 1 dan):
```
garment_templates {
  variant_id       UUID (FK)
  canonical_key    TEXT
  alpha_mask_key   TEXT
  landmarks        JSONB     ← Sprint 2 to'ldirdi
  standard_pose    JSONB
  color_palette    JSONB     ← Sprint 2 to'ldirdi
  approved_at      TIMESTAMPTZ
}
```

**Yangi environment o'zgaruvchi:**
```
ML_GARMENT_URL=http://localhost:5003
ML_GARMENT_DISABLED=  # optional: true → skip templating
```

---

## 6. Cheklovlar va keyingi qadamlar

### Hozir yechilmagan

- **SAM 2 integratsiya** — u2net foto sifatida ancha oddiy. Sotuvchi maneken foto muhim bo'lganda SAM 2 aniqroq bo'ladi.
- **Scarf tying_style variantlari** — hozir bitta shablon; foydalanuvchi tanlagan uslub kompozitor tomonida chiziladi (Sprint 1 dagi kabi).
- **Client-side (RN Skia) real-time** — Sprint 3 da rejalashtirilgan.

### Sprint 3 rejasi

Endi **template-based compositor** ni yozish mumkin:
1. `ml-compositor` dan garment_template mask + landmark ni yuklash
2. **Thin Plate Spline warp**: foydalanuvchi face landmarks → template face_opening
3. Alpha compositing (procedural o'rniga real mask)
4. Yorug'lik va rang moslashtirish
5. Testlar

Bu — hozirgi procedural render dan sifat sakrashi (real fabric texture, real drape).

---

## 7. Yakuniy ko'rsatgichlar

- **Servislar soni**: 3 (ml-face, ml-compositor, ml-garment) — barchasi live va sog'lom
- **Backend endpoint qo'shildi**: `POST /garment/extract` (Python), fon vazifa (NestJS)
- **Yangi jadval yozuvi**: `garment_templates` — 1 real yozuv sinovda
- **Yangi test suite**: 10 pytest
- **Umumiy AI pipeline testlari**: 35 (12 + 13 + 10)

Sprint 2 **✅ tamomlandi**.
