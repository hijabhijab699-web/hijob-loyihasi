# N24:31 · Sprint 3 natijalari — Template-based Compositor

**Sana:** 2026-09-30
**Reja:** [AI_PLAN.md §5 Sprint 3](./AI_PLAN.md)

---

## Xulosa

| Bosqich | Testlar | O'tdi | Latency |
|---|---|---|---|
| TPS warp helper | 2 | ✅ 2/2 | — |
| Anchor helpers | 2 | ✅ 2/2 | — |
| LAB tint | 1 | ✅ 1/1 | — |
| Full template compose | 5 | ✅ 5/5 | ~250 ms |
| E2E procedural fallback | 10 | ✅ 10/10 | p95 = 117 ms |
| **Umumiy compositor suite** | **23** | ✅ **23/23** | 1.74 s |

Sprint 3 tugadi. Template-based compositor tayyor va NestJS avtomatik shu rejimga o'tadi.

---

## 1. Nima qurildi

### 1.1 TPS warp helper (`app/services/warp.py`)

OpenCV `ThinPlateSplineShapeTransformer` ustidan yozildi. API sodda: `apply_tps(image, source_points, target_points, output_size)`. OpenCV ning DMatch va 3D shape talablari ichkarida yashiringan.

### 1.2 Template compose engine (`app/services/template_compose.py`)

**Kirish:**
- `user_image` — foydalanuvchi selfi (BGR)
- `user_landmarks_px` — MediaPipe 478 face landmark, pixel space
- `template_canonical_bgra` — sotuvchi shabloni canonical PNG (RGBA)
- `template_landmarks` — DB dagi JSON (face_opening, drape_left/right, hair_top, fabric_bbox)
- `spec.color_hex` — variant rangi

**Chiqish:** user_image ustidan warped scarf composited BGR.

**8 anchor point** TPS uchun:
| Template (source) | User (target) |
|---|---|
| face_opening_center | user face centre (span) |
| hair_coverage_top | user forehead - 35% face_h |
| drape_left | user face_left - 35% face_w, chin + 85% face_h |
| drape_right | user face_right + 35% face_w, chin + 85% face_h |
| face_bbox 4 corners | user face oval 4 corners (padded ±8%) |

**LAB tinting** — L kanalini 70/30 saqlab, ab ni target rangga o'tkazadi. Yorug'lik/soya saqlanadi, faqat rang o'zgaradi.

### 1.3 POST /compose/scarf-template endpoint

Multipart kirish:
- `face` — foydalanuvchi selfi (JPEG/PNG)
- `landmarks` — foydalanuvchi 478 face landmark (JSON)
- `template_canonical` — canonical.png (RGBA)
- `template_landmarks` — scarf landmarks JSON
- `scarf` — ScarfSpec JSON (tying_style, color_hex, opacity)

Chiqish: `image/jpeg` + `X-Mode: template` header.

### 1.4 NestJS auto-routing (`tryon.service.ts`)

`POST /tryon/preview` variant ni yuklaganda `garmentTemplate` ni ham oladi. Bor bo'lsa:
1. Storage dan canonical.png ni fayl sifatida o'qish (Node `fs`)
2. `composeScarfWithTemplate(face, spec, template)` — template rejim
3. Log: `composed [template] in Nms`

Xatolik yoki template yo'q bo'lsa:
- Warning log
- `composeScarf(face, spec)` — procedural fallback
- Log: `composed [procedural] in Nms`

**Fail-open:** har qanday muvaffaqiyatsizlik yakuniy foydalanuvchini bloklamaydi.

---

## 2. Test natijalari

Suhbat: `services/ml-compositor/tests/test_template_compose.py`
Ishga tushirish: `cd services/ml-compositor && .venv/bin/python -m pytest tests/ -v`

| Test | Tekshiradi | Natija |
|---|---|---|
| `test_tps_identity_returns_same_image` | Source=target → identity, mean diff < 3 | ✅ |
| `test_tps_shift_moves_content` | +20px shift → visible change | ✅ |
| `test_template_anchors_shape` | 8 anchor, canvas ichida | ✅ |
| `test_user_anchors_are_consistent` | Drape < center < drape, hair < bbox | ✅ |
| `test_tint_changes_colour_not_alpha` | Alpha saqlanadi, BGR o'zgaradi | ✅ |
| `test_template_compose_returns_image` | Shape saqlanadi | ✅ |
| `test_template_compose_alters_image` | Mean diff > 3 | ✅ |
| `test_template_compose_different_colors` | 2 rang natijasi farqli | ✅ |
| `test_template_compose_latency` | < 1500 ms | ✅ |
| `test_template_compose_rejects_bad_input` | Grayscale → ValueError | ✅ |

**Umumiy compositor: 23/23 (procedural + template), 1.74 s.**

---

## 3. End-to-end sinov

Real DB dan template olib, foydalanuvchi selfi bilan compose:

```
Login diyor → JWT
Variant ID = 2d2cca3b... (Тестовый платок AI, garment_template bor)
POST /tryon/preview → NestJS
   → prisma: variant + garmentTemplate JOIN
   → fs.readFile canonical.png (841 KB)
   → ml-compositor /compose/scarf-template (multipart)
   → 181 ms server compose
   → 266 ms end-to-end
Response: {sessionId, resultUrl}
GET resultUrl → 121 KB JPEG
```

API log:
```
[MlCompositorClient] composed scarf template (classical, #8A8D5B) in 181ms
[TryOnService] try-on session ... composed [template] in 266ms (121.2 KB)
```

**Rejim tag** har session log da: `[template]` yoki `[procedural]`.

## 4. Latency taqqoslash

| Rejim | Rasm nashri | Chiqarish |
|---|---|---|
| Procedural (Sprint 1) | Yuz landmarklarni oldindan hisoblash + poligon chizish | ~70 ms p50 |
| Template (Sprint 3) | + Canonical PNG o'qish + TPS 8-anchor + LAB tint + alpha blend | ~180-260 ms |

Template rejim ~3× sekinroq (kutilgan) — 176 KB u2net inference emas, faqat OpenCV warp. Real rasm bilan **sifat sakrashi** procedural polygon dan.

## 5. Cheklovlar

- **TPS 8 anchor** — 478 face landmark hammasi ishlatilmadi. Barcha nuqta ustida TPS 5-10× sekin (~1.5 s p95). MVP uchun 8 ta yetadi.
- **Hair segmentation yo'q** — hozir alpha shu template mask (rembg). Soch template ustidan chiqib qolishi mumkin. Real hair matting Sprint 4 da.
- **Ko'p style** — hozir bitta template classical/loose/double uchun bir xil warp. Har style o'z anchor sozlamasi bilan chiqadigan bo'lsa keyingi iteratsiya.

## 6. Sprint umumiy testlari

| Sprint | Testlar | Umumiy vaqt |
|---|---|---|
| Sprint 1 (ml-face) | 12 | 0.57 s |
| Sprint 1 (compositor procedural) | 13 | 1.01 s |
| Sprint 2 (ml-garment) | 10 | 9.67 s |
| Sprint 3 (compositor template) | 10 | 0.91 s |
| **JAMI** | **45** | **~12 s** |

## 7. Yakuniy holat

3 ta Sprint tugadi. AI pipeline:

- ✅ **Face Template** (ml-face) — foydalanuvchi onboarding
- ✅ **Garment Template** (ml-garment) — sotuvchi upload avtomatik
- ✅ **Procedural Compositor** — fallback / real-time
- ✅ **Template Compositor** — sifatli real fabric
- ✅ **NestJS auto-routing** — variant template ga qarab rejim tanlash
- ✅ **DB integratsiya** — garment_templates jadval to'liq ishlaydi
- ✅ **45 pytest** — barchasi yashil

Sprint 4 rejasi (Faza 2 kirishi):
1. **Multi-shape TPS** — style-specific anchor sozlamalari
2. **Hair matting** — soch chegarasidan tozalash
3. **Dress compositor** — MediaPipe Pose bilan koylak try-on
4. **Client-side RN Skia** — real-time preview
5. **Visual regression** — pixel-level snapshot testlari

Sprint 3 **✅ tamomlandi**.
