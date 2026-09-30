# N24:31 · Sprint 4 natijalari — Faza 2 poydevori

**Sana:** 2026-09-30
**Reja:** [AI_PLAN.md §5 Sprint 4](./AI_PLAN.md)

---

## Xulosa

| Vazifa | Testlar | O'tdi |
|---|---|---|
| Style-specific TPS anchors | 3 | ✅ 3/3 |
| Hair matting | 3 | ✅ 3/3 |
| Dress compositor | 4 | ✅ 4/4 |
| Visual regression | 3 | ✅ 3/3 (2-run) |
| **Sprint 4 alohida** | **13** | ✅ **13/13** |
| **Kompozitor jami** | **36** | ✅ **36/36** (3.19 s) |
| **AI pipeline jami** | **58** | ✅ **58/58** |

Client-side RN Skia keyingi sprint uchun qoldi (server-side sifat oldindan yakunlandi).

---

## 1. Yaratilgan qismlar

### 1.1 Style-specific TPS anchors (`template_compose.py`)

`_STYLE_PRESETS` — har style o'zining warp geometry si:

| Preset | Klassik | Erkin | Ikki qavatli |
|---|---|---|---|
| `hair_lift` | 0.35 (o'rta toj) | 0.28 (past toj) | 0.45 (baland toj) |
| `drape_dy` | 0.85 | **1.05** (uzun) | 0.75 (qisqa) |
| `drape_dx_right` | 0.35 | **0.60** (yon bo'ylab) | 0.30 |
| `bbox_pad_top` | 0.08 | 0.05 | **0.10** |

Style tanlash orqali TPS anchor lar boshqacha bo'ladi → warped canvas boshqacha shakl oladi.

### 1.2 Hair matting (`hair_matting.py`)

Yengil face segmentation qo'shildi:
1. **Forehead protect mask** — user_landmarks dan ellips (peshona atrofida).
2. **Delta activation** — kompozit qayerda base dan ancha farqli bo'lsa (>30 BGR diff), o'sha joyda pull kuchli.
3. **Blend**: `out = composed * (1-w) + base * w`, `w = protect * activation * strength`.

Natija: soch chegarasida user pixel'lari qoladi, scarf ostidan chiqib qolgan sochlar ko'rinadi.

Cheklov: to'liq alpha matting emas — segmentation model o'rniga geometrik heuristic. Sifat sakrashi bor lekin real hair MODNet bilan almashtirish kelajakda.

### 1.3 Dress compositor (`dress_compose.py`)

Scarf compositor bilan bir xil TPS + LAB tint + alpha blend arxitekturasi, lekin body-oriented:

**8 anchor:**
- shoulder_left / right
- hip_left / right
- neck_center
- hem_center + hem_left / right

**Kirish body_pose JSON** — foydalanuvchi (mobile client tomondan MediaPipe Pose orqali) yuboradi.

**REQUIRED_BODY_KEYS** constant sifatida eksport qilingan — mobile client shu ma'lumotni yuborishi kerak.

### 1.4 POST /compose/dress-template

Yangi endpoint qo'shildi. Kirish scarf-template bilan bir xil, faqat body pose JSON scarf landmark o'rniga.

### 1.5 Visual regression snapshots (`tests/fixtures/snapshots/`)

3 ta golden JPEG (classical/loose/double). Birinchi test-run seed qiladi, keyingilarida mean pixel diff `< 1.5` bo'lishi kerak. Rebaseline: fayllarni o'chirish.

---

## 2. Test natijalari

### 2.1 Sprint 4 alohida — 13 test

Faylda: `services/ml-compositor/tests/test_sprint4.py`

**Style anchors:**
- `test_style_presets_registered` — 3 style bor
- `test_style_anchors_differ` — har style o'zining anchor pattern
- `test_style_specific_compose_differs` — 3 style natijasi farqli

**Hair matting:**
- `test_protect_mask_covers_forehead` — mask peshonada
- `test_hair_matting_disabled_pass_through` — strength=0 no-op
- `test_hair_matting_restores_forehead` — inside mask, base ga yaqinroq

**Dress compositor:**
- `test_dress_compose_requires_all_body_keys` — 6 kalit majburiy
- `test_dress_compose_produces_output` — natija shape saqlanadi
- `test_dress_compose_latency` — <1500 ms
- `test_required_body_keys_exposed` — API sabit

**Visual regression:**
- `test_visual_snapshot_stable[classical/loose/double]` — golden bilan mean diff <1.5

### 2.2 Kompozitor umumiy — 36 test

```
tests/test_scarf.py                    13 passed   (procedural, Sprint 1)
tests/test_template_compose.py         10 passed   (template, Sprint 3)
tests/test_sprint4.py                  13 passed   (Sprint 4)
──────────────────────────────────────────────────
Total                                  36 passed in 3.19 s
```

### 2.3 AI pipeline jami — 58 test

```
ml-face                12
ml-compositor          36  (13 + 10 + 13)
ml-garment             10
──────────────────────────────
Total                  58 passed, ~13 s
```

---

## 3. Latency (hozircha)

Server measurements p95, CPU only:

| Kompozit rejimi | Latency |
|---|---|
| Procedural scarf | ~70 ms |
| Template scarf (Sprint 3) | ~180 ms |
| Template scarf + hair matting (Sprint 4) | ~200 ms |
| Dress template | ~500 ms |

Hair matting qo'shimcha ~20 ms (protect mask + delta hisoblash).

---

## 4. Cheklovlar

- **Hair matting**: haqiqiy segmentation model emas, geometrik ellips + delta. Bosh burilganda past sifat.
- **Dress compositor**: MediaPipe Pose ni mobile client o'zi ishga tushirishi kerak — hozir server tomondan pose extract qilinmayapti (ml-face da faqat FaceMesh).
- **Style-specific**: 3 preset qattiq kod ichida. Sotuvchi o'z shabloniga xos "tying_style_variants" ni kelajakda kompozitorga uzatishi mumkin.

## 5. Sprint 5 rejasi (kelasida)

Sprint 4 dan qolgan bandlar:
1. **Client-side RN Skia** — real-time camera preview + on-device TPS warp
2. **MediaPipe Pose server tarafida** — dress compositor ishlashi uchun `ml-face` ga Pose qo'shish (yoki alohida `ml-pose` servis)
3. **Real hair matting** — MODNet yoki BiSeNet-Face
4. **Multi-view compose** — bosh burilganda template ham burilishi
5. **Prosidural style variantlari** — sotuvchi shabloniga xos preset

---

## 6. Yakuniy holat (4 sprint bilan)

**Servislar:**
- ✅ ml-face (5001) — face template
- ✅ ml-compositor (5002) — scarf procedural + scarf template + dress template
- ✅ ml-garment (5003) — sotuvchi mahsulot shabloni
- ✅ NestJS (4000) — orchestration + auto-routing
- ✅ Seller web (3001) — CMS
- ✅ Mobile Expo (8081) — client

**Ma'lumot bazasi:**
- ✅ `face_templates` — user landmarks
- ✅ `garment_templates` — seller mask + landmarks + palette
- ✅ `tryon_sessions` — history + mode tag

**Testlar:**
- ✅ **58 pytest** (12 + 36 + 10) — ~13 s
- ✅ **3 visual regression snapshot** — barqarorlik kafolati

Sprint 4 **✅ tamomlandi**.
