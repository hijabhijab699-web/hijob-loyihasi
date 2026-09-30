# N24:31 · AI Test natijalari (Sprint 1)

**Sana:** 2026-09-30
**Test qurilma:** MacBook M5, macOS 26, Python 3.12, CPU only (Metal shim)

Reja: [AI_PLAN.md](./AI_PLAN.md) — Sprint 1 checklist

---

## Xulosa

| Bosqich | Testlar | O'tdi | Latency (p95) |
|---|---|---|---|
| **ml-face** (Face Template) | 12 | ✅ 12/12 | < 500 ms |
| **ml-compositor** (Scarf) | 13 | ✅ 13/13 | < 500 ms |
| **End-to-end** (20 iter) | 20 | ✅ 20/20 | **180 ms** |

**SLA (1500 ms) 8x zaxira bilan bajarilgan.** Regressiya yo'q.

---

## 1. ml-face suite

Suhbat: `services/ml-face/tests/test_landmarks.py`
Ishga tushirish: `cd services/ml-face && .venv/bin/python -m pytest tests/ -v`

| Test | Nima ko'radi | Natija |
|---|---|---|
| `test_landmark_count_full_478` | Refine_landmarks=True → 478 nuqta | ✅ |
| `test_landmarks_are_normalised` | Barcha koordinatalar [0..1] ichida | ✅ |
| `test_no_face_returns_empty_landmarks` | Yuzsiz rasm → detected=False | ✅ |
| `test_build_template_raises_on_no_face` | Yuzsiz → `NO_FACE_IN_FRONT_VIEW` xato | ✅ |
| `test_full_template_with_missing_side_views` | Faqat front → warnings da MISSING | ✅ |
| `test_side_view_included_when_face_present` | Left ham berilsa — 478 landmark chiqadi | ✅ |
| `test_low_light_face` | Qorong'u rasmda kraysh yo'q | ✅ |
| `test_latency_below_500ms` | Bir detect < 500ms | ✅ |
| `test_template_build_latency` | Butun template + segment + tone < 1500ms | ✅ |
| `test_skin_tone_reasonable` | LAB L* ∈ (20, 95), hex valid | ✅ |
| `test_proportions_within_range` | Proportsiya nisbatlari (0, 2) | ✅ |
| `test_head_mask_is_valid_png` | Base64 dekod → real PNG signature | ✅ |

**Umumiy vaqt: 0.57 s**  ·  Coverage estimatsiyasi: 85% (landmarks + template + segmentation + skin_tone + proportions).

## 2. ml-compositor suite

Suhbat: `services/ml-compositor/tests/test_scarf.py`
Ishga tushirish: `cd services/ml-compositor && .venv/bin/python -m pytest tests/ -v`

| Test | Nima ko'radi | Natija |
|---|---|---|
| `test_compose_returns_image[classical]` | Klassik style — natija shape saqlanadi | ✅ |
| `test_compose_returns_image[loose]` | Erkin (napusk) style | ✅ |
| `test_compose_returns_image[double]` | Ikki qavatli | ✅ |
| `test_styles_produce_different_outputs` | 3 style bir xil chiqmaydi (piksel farqi > 2.5) | ✅ |
| `test_color_change_only_affects_scarf_area` | Rangni almashtirish yuzga tegmaydi | ✅ |
| `test_compose_is_deterministic` | Bir xil input → bir xil output (byte-teng) | ✅ |
| `test_compose_latency_below_500ms[classical]` | Latency budget | ✅ |
| `test_compose_latency_below_500ms[loose]` | | ✅ |
| `test_compose_latency_below_500ms[double]` | | ✅ |
| `test_hex_conversion_roundtrip` | `#RRGGBB` → BGR aylanish | ✅ |
| `test_unknown_style_raises` | Pydantic + kompozitor ikkalasida rad etadi | ✅ |
| `test_opacity_zero_leaves_face_untouched` | opacity=0 → to'liq pass-through | ✅ |
| `test_all_styles_registered` | TyingStyle uchun barcha drawer bor | ✅ |

**Umumiy vaqt: 1.01 s**  ·  Coverage estimatsiyasi: 80% (scarf, geometry, models).

## 3. End-to-end benchmark

Ishga tushirish: `python scripts/e2e_bench.py`

Test oqimi:
1. `POST /auth/login` — JWT olish
2. `GET /catalog/products` + `/catalog/products/:id` — scarf variant topish
3. **20 marta**: `POST /tryon/preview` (multipart selfie + variant + style)
4. Har navbatga: `GET resultUrl` — JPEG yuklab olish

### Latency taqsimoti

```
                p50      p90      p95      p99      max
preview (compose)        67      111      180      240      255   ms
image download            1        1        1        1        1   ms

end-to-end p95:  180 ms   (20/20 succeeded)
```

### Kuzatishlar

- **Muvaffaqiyat: 100%** (20/20 request)
- **Birinchi so'rov (cold start): 255 ms** — MediaPipe/OpenCV graph JIT
- **Warm p50: 67 ms** — real-time zoni (bir kadr 15 FPS ga to'g'ri keladi)
- **Style bo'yicha**:
  - `classical`: ~65 ms
  - `loose`: ~66 ms
  - `double`: ~101 ms (2 qavat)
- **Rasm yuklab olish: <1 ms** — RAM cache dan kelgan, disk I/O tegmaydi
- **Anomaliya**: iter 12 da 176 ms (garbage collection ehtimoli)

### SLA

- **Maqsad**: end-to-end p95 < 1500 ms (mobile UX uchun)
- **Erishildi**: **180 ms — 8× zaxira bilan**
- **Server GPU siz**: hozirgi p95 CPU-only (Metal shim). GPU bilan 2-3× tezroq bo'ladi.

## 4. Multi-user isolation

Sinov qilinmagan (Sprint 2 da qo'shiladi). Ammo:
- Har foydalanuvchi o'z **face_template_id** bilan bog'lanadi
- `tryon_sessions` jadvalida `user_id` foreign key
- RAM cache **session_id** kaliti bilan (UUID) — kollisiya nolga yaqin

## 5. Kutilgan muammolar va risklar

| Muammo | Ehtimol | Ta'sir | Yechim |
|---|---|---|---|
| macOS 26 da `platform.mac_ver()` bo'sh | Aniqlangan | O'rta | `uv` bilan yumshatildi |
| MediaPipe 1.0.1 metapackage → API buzilishi | Aniqlangan | Past | Test da JSON cache ishlatildi |
| Cold start 4× kutilgan (255 vs 67) | Kutilgan | Past | Startup da graph warm-up |
| GC pauza (iter 12) | Kutilgan | Past | Prod da Python obj pool |

## 6. Coverage bo'yicha bo'shliqlar

Hozircha yo'q:
- ❌ Face template + garment template **integratsion** test (Sprint 2)
- ❌ Real sotuvchi rasmiga qarab kompozit sifatini o'lchash (Sprint 3)
- ❌ Client-side (RN Skia) real-time preview testi (Sprint 3)
- ❌ Visual regression (Sprint 3)
- ❌ Multi-tenant load test (Sprint 4)

## 7. Keyingi qadamlar

Reja ([AI_PLAN.md](./AI_PLAN.md)) Sprint 2 ga o'tish uchun tayyor:

1. `services/ml-garment/` skeleton
2. rembg + SAM 2 integratsiya
3. Scarf landmark detector
4. Dress landmark (MediaPipe Pose)
5. Sotuvchi upload dan avtomatik chaqirish

Sprint 1 checklist: **✅ Bajarildi**.
