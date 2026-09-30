# N24:31 · AI Pipeline — To'liq reja va test strategiyasi

**Sana:** 2026-09-30
**Maqsad:** Butun AI qismini bir joyga jamlash, har bir bosqichni to'liq testdan o'tkazish.

---

## 0. Falsafa (§0 dan qisqacha)

Butun tizim **template-based**: AI hech qachon yuzni qaytadan chizmaydi.

- Foydalanuvchi yuzi — bir marta shablon (landmarks + mask + tone).
- Sotuvchi mahsuloti — bir marta shablon (mask + landmarks + standart pose).
- Try-on — matematik warping + blending. Generation emas.

Bu nima demak:
- **Tezlik**: 100-300 ms har try-onga (real-time UI).
- **Narx**: GPU vaqti ~5% dan kam.
- **Sifat**: Foydalanuvchi yuzi doim bir xil chiqadi (deterministik).
- **Privacy**: Xom fotolar hech qachon tashqariga chiqmaydi.

---

## 1. Uch bosqichli pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│  Bosqich A: FACE TEMPLATE  (foydalanuvchi onboarding)            │
│    Kirish: 3 selfie                                              │
│    Chiqish: 478 landmark + head mask + LAB tone + proportions    │
│    Servis: ml-face  (Python + MediaPipe)                         │
│    Holati: ✅ ISHLAB TURIBDI                                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Bosqich B: GARMENT TEMPLATE  (sotuvchi mahsulot yuklaganda)     │
│    Kirish: 1-6 maneken/model foto                                │
│    Chiqish: alpha mask + garment landmarks + standart canvas     │
│    Servis: ml-garment  (Python + SAM/rembg + custom detectors)   │
│    Holati: ❌ QURILMAGAN (hozircha prosidural)                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Bosqich C: COMPOSITOR  (foydalanuvchi try-on qilganda)          │
│    Kirish: user selfie + face landmarks + garment template       │
│    Chiqish: JPEG (composited try-on)                             │
│    Servis: ml-compositor  (Python + OpenCV)                      │
│    Holati: ✅ ISHLAB TURIBDI (prosidural, template asosli emas)  │
└─────────────────────────────────────────────────────────────────┘
```

**Hozirgi holatda ishlaydi:** A → C prosidural rendering bilan.
**Qurilmagan:** B (real sotuvchi shabloni) va B ⇢ C bog'lanish.

---

## 2. Har bosqich uchun batafsil

### 2.A Face Template (✅ ishlaydi)

**Modellar:**
- MediaPipe FaceMesh (refine_landmarks=True) — 478 nuqta
- MediaPipe SelfieSegmentation — bosh maskasi

**Chiqish JSON namunasi:**
```json
{
  "views": [{
    "view": "front",
    "detected": true,
    "landmarks_2d": [{"x": 0.5, "y": 0.4}, ...],   // 478 nuqta
    "image_size": [1126, 2000]
  }],
  "skin_tone": {"hex": "#e3c6a4", "lab": [81.5, 5.0, 21.0]},
  "proportions": {"head_width": 0.37, ...},
  "head_mask_png_base64": "iVBORw0K..."           // ~30-50 KB
}
```

**Test rejasi (§4 da batafsil):**
- T-A1: real selfie → 478 landmark chiqsin
- T-A2: yuzsiz rasm → 422 xatolik
- T-A3: bir vaqtda 3 rakurs → hammasi detektlansin
- T-A4: past sifat/kam yorug'lik → maslahat qaytarsin (warning)
- T-A5: latency <500 ms bir rasm uchun

### 2.B Garment Template (❌ qurilishi kerak)

**Maqsad:** Sotuvchi maneken foto yuklaganda avtomatik:
1. Fon o'chirish (background removal)
2. Kiyim mask (kiyim vs maneken tanasi)
3. Landmark aniqlash:
   - Ro'mol: bosh chegarasi, yuz teshigi, drape nuqtalari, tying_style shakli
   - Ko'ylak: yelka, bel, yoqa, hemline, sleeve
4. Standart canvas ga normalizatsiya (bosh markazi = (0.5, 0.4), yelka kengligi = fixed)
5. Rang paletka ekstraksiyasi

**Model tanlash:**

| Vazifa | Model | GPU kerak | Notes |
|---|---|---|---|
| Background removal | `rembg` (u2net) yoki SAM 2 | Ha (SAM), yo'q (u2net) | u2net = 176 MB, ishonchli |
| Kiyim segmentatsiya | SAM 2 (prompt bilan) | Ha | Aniqroq |
| Pose (dress) | MediaPipe Pose | Yo'q | 33 landmark tanada |
| Custom scarf landmark | Fine-tune (o'zimiz) | Ha (training) | 500 misol yig'ish kerak |

**MVP taktika:**
- **U2Net** bilan background removal (CPU da 500 ms)
- **Pose landmarks** (dress uchun) — MediaPipe Pose
- **Scarf landmark** — custom prompt-based (SAM 2 orqali)
- Sotuvchi tekshiruvi (approve/reject)

**Chiqish shabloni:**
```json
{
  "variant_id": "uuid",
  "category": "scarves",
  "canonical_image_key": "seller/.../canonical.png",  // fon yo'q
  "alpha_mask_key": "seller/.../mask.png",
  "landmarks": {
    "type": "scarf",
    "face_opening": [{"x": 0.5, "y": 0.3}, ...],
    "hair_coverage_top": {"x": 0.5, "y": 0.1},
    "drape_left": {"x": 0.2, "y": 0.75},
    "drape_right": {"x": 0.8, "y": 0.75},
    "tying_style_variants": ["classical", "loose"]
  },
  "standard_pose": {"model_height_cm": 178, "shoulder_width_px": 320},
  "color_palette": ["#D4C3A0", "#8A5A3C"]
}
```

**Test rejasi:**
- T-B1: real maneken foto → alpha mask chiqsin (fon 0, kiyim 255)
- T-B2: mask nuqtalari kiyim chegarasida bo'lsin
- T-B3: face_opening polygon yuz uchun bo'lsin (drape emas)
- T-B4: standart canvas ga normalizatsiya to'g'ri (1200×1600)
- T-B5: 5 xil sotuvchi rasmda ishlashi (turli fon, yorug'lik)

### 2.C Compositor (✅ prosidural, real template ga ulanishi kerak)

**Ikki rejim:**

**Hozirgi (prosidural)** — MVP demo uchun:
- Yuz landmarklari asosida polygon chiziladi
- Bir rang bilan to'ldiriladi
- Face_oval indekslari bilan face opening
- Poisson blending

**Kelajakdagi (template-based)** — real sifat uchun:
1. Load garment_template mask
2. Load garment_template landmarks
3. Face landmark → garment face_opening landmark: **Thin Plate Spline (TPS)** warp
4. Warp bilan garment mask ni foydalanuvchi bosh o'lchamiga moslash
5. Layer stack: bg → dress → neck → face → scarf → accessory
6. LAB color match (bo'yin ↔ yuz)
7. `seamlessClone` (Poisson) chegarada
8. Alpha matting (soch va scarf ilon chegarasi)
9. Post: yorug'lik yo'nalish, contrast

**Latency budjeti:**
| Bosqich | Prosidural | Template-based |
|---|---|---|
| Landmark align | 10 ms | 15 ms |
| Warp | 5 ms (rectangle) | 30 ms (TPS 478 nuqta) |
| Mask + composite | 30 ms | 60 ms |
| Blending | 20 ms | 40 ms |
| Post | 5 ms | 15 ms |
| **Jami** | **~70 ms** | **~160 ms** |
| Server GPU (Metal) | tez | ~60 ms |

**Test rejasi:**
- T-C1: face landmarks berilganda tayyor JPEG qaytsin
- T-C2: 3 style (classical/loose/double) turli natija bersin
- T-C3: rang o'zgartirilganda faqat scarf rangi o'zgarsin (yuz teri emas)
- T-C4: bosh burilganda (yaw ±30°) scarf ham buriladi
- T-C5: latency <500 ms local
- T-C6: template-based mode: real seller mask bilan warp aniqligini o'lchash (IoU)

---

## 3. Ma'lumot oqimi (data flow)

### 3.1 Sotuvchi mahsulot yuklaydi

```
Sotuvchi (web) ─── multipart image
      │
      ▼
NestJS /seller/uploads
      │
      ├─ Storage: saqlash /uploads/seller/X/
      └─ (Y) POST /garment/extract → ml-garment
                   │
                   ├─ rembg → alpha mask
                   ├─ SAM 2 → variant mask (scarf/dress)
                   ├─ Landmark detection → JSON
                   └─ Standard canvas → PNG
      │
      ▼
NestJS: garment_templates jadval yozish
      │
      ▼
Sotuvchi mahsulot yaratadi → variant.template_id bog'lanadi
      │
      ▼
Moderator approve → status=published
```

### 3.2 Foydalanuvchi try-on qiladi

```
Mobile (foydalanuvchi) ─── selfie + variant_id + tying_style
       │
       ▼
NestJS /tryon/preview
       │
       ├─ ml-face: yangi landmarks (fresh pose uchun)
       │
       └─ ml-compositor:
              ├─ Load user landmarks
              ├─ Load garment_template (from DB)
              ├─ TPS warp: user face → garment face_opening
              ├─ Layer compose
              ├─ Blend + color match
              └─ JPEG
       │
       ▼
NestJS: RAM cache + URL qaytarish
       │
       ▼
Mobile: <Image source={url} />
```

---

## 4. Test strategiyasi

### 4.1 Test darajalar

```
┌────────────────────────────────────────────┐
│  L1 Unit (pytest)                          │
│  Har bir Python function alohida            │
│  Fixture rasm bilan input/output taqqoslash │
│  Coverage >70%                              │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│  L2 Integration (pytest + docker)          │
│  Servis darajasi: HTTP endpoint sinovi      │
│  Real MediaPipe + rembg + OpenCV bilan      │
│  10 xil real foto fixture                   │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│  L3 End-to-end (Playwright + curl)         │
│  Mobile → API → ML zanjiri to'liq           │
│  Response latency + correctness             │
└────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────┐
│  L4 Regression (visual)                    │
│  Har commit da 20 ta fixture image          │
│  Composited chiqish PIL bilan taqqoslash    │
│  ΔE (LAB colour distance) < threshold       │
└────────────────────────────────────────────┘
```

### 4.2 Fixture ma'lumotlar

Har bir servis uchun `tests/fixtures/` da:

```
fixtures/
├── faces/
│   ├── hijabi-front-good.jpg      # Ideal light + pose
│   ├── hijabi-front-lowlight.jpg   # Kam yorug'lik
│   ├── hijabi-side-left.jpg
│   ├── hijabi-side-right.jpg
│   ├── no-face.jpg                 # Peyzaj (negative)
│   ├── multiple-faces.jpg          # 2+ yuz (edge case)
│   └── ...
├── garments/
│   ├── scarf-beige-classical.jpg
│   ├── scarf-multi-loose.jpg
│   ├── dress-olive-abaya.jpg
│   ├── dress-black-classical.jpg
│   └── ...
└── expected/
    ├── face-1-landmarks.json       # Golden output
    ├── scarf-1-template.json
    └── ...
```

### 4.3 Muvaffaqiyat mezonlari

**Face Template:**
- ✅ Detection rate: 95% real selfielarda
- ✅ Latency: p95 < 500 ms (CPU)
- ✅ Landmark stabilligi: bir yuz + 2 fotoda o'rtacha ΔL < 3px (normalized)

**Garment Template:**
- ✅ Mask IoU vs qo'l bilan chizilgan ground truth: > 0.85
- ✅ Landmark aniqligi (scarf face opening): mean error < 5% face width
- ✅ Latency: p95 < 3 s (CPU), < 1 s (GPU)

**Compositor:**
- ✅ Latency: p95 < 500 ms (server), < 200 ms (client-side scarf)
- ✅ Ranglar sotuvchi ranglari bilan mos (LAB ΔE < 5)
- ✅ Yuz identifikatsiyasi buzilmaydi (face_recognition kutubxonasi similarity > 0.9)

---

## 5. Ish tartibi (bosqichma-bosqich)

### Sprint 1 — Testlar hozirgi holatga (**HOZIR**)

- [x] AI plan hujjati
- [ ] Face Template unit + integration testlari
- [ ] Compositor unit + integration testlari
- [ ] Fixture ma'lumotlar to'plash (10 rasm)
- [ ] CI da avtomatik ishga tushish
- [ ] E2E: mobile → API → ML zanjirini yozib sinash

### Sprint 2 — Garment Template Engine

- [ ] `services/ml-garment` skeleton
- [ ] rembg integratsiya (background removal)
- [ ] SAM 2 integratsiya (variant segmentation)
- [ ] Scarf landmark detektor (custom)
- [ ] Dress landmark (MediaPipe Pose)
- [ ] Standart canvas normalizatsiya
- [ ] NestJS `POST /seller/products` upload dan chaqirish
- [ ] Testlar

### Sprint 3 — Template-based Compositor

- [ ] TPS warp implementatsiyasi (OpenCV `createThinPlateSplineShapeTransformer`)
- [ ] Real garment_template dan mask + landmark yuklash
- [ ] Layer stack (bg → dress → neck → face → scarf)
- [ ] Alpha matting soch chegarasida
- [ ] Client-side (RN Skia) real-time preview
- [ ] Testlar + visual regression

### Sprint 4 — Dress/Abaya (Faza 2)

- [ ] MediaPipe Pose (33 body landmark)
- [ ] Full-body compositor
- [ ] Body proportion warping (rost + vazn)
- [ ] Testlar

---

## 6. Hozirgi tekshirish rejasi

Hozir mavjud ishlarni to'liq sinov qilamiz:

### R1: ml-face health + real foto

```bash
# T-A1
curl http://localhost:5001/health
curl -X POST http://localhost:5001/face/extract -F "front=@fixtures/faces/hijabi-front-good.jpg"
# Kutilyapti: {status: "ready", views[0].landmarks_2d.length == 478}

# T-A2 (negative)
curl -X POST http://localhost:5001/face/extract -F "front=@fixtures/faces/no-face.jpg"
# Kutilyapti: HTTP 422, detail: "NO_FACE_IN_FRONT_VIEW"
```

### R2: ml-compositor health + prosidural chiqish

```bash
# T-C1: barcha 3 style
for STYLE in classical loose double; do
  # ... face extract → compose scarf → save file
done
# Kutilyapti: 3 xil natija, 100-300 ms har biri
```

### R3: end-to-end mobile → API → ML

```bash
# Login → face upload → tryon preview
# Kutilyapti: {resultUrl: "..."} → GET url → JPEG binary
```

### R4: latency benchmark

```bash
# 10 marta take onni ketma-ket ishga tushirish
# p50, p95, p99 chiqarish
```

### R5: multi-user isolation

```bash
# 2 xil foydalanuvchi paralel try-on qilsin
# Har biri o'z session ni ko'rsin, ma'lumot aralashmasin
```

---

## 7. Xatarlarni baholash

| Xatar | Ehtimol | Ta'sir | Yechim |
|---|---|---|---|
| MediaPipe macOS 26 da yaxshi ishlamaydi | O'rta | Yuqori | Docker/Linux binary tayyor |
| U2Net past sifatli fonlarda buziladi | Yuqori | O'rta | SAM 2 fallback |
| Custom scarf landmark model 500 misol yig'ish qiyin | Yuqori | O'rta | Prosidural ni tutash yechim sifatida saqlash |
| Server GPU narxi kutilganidan yuqori | O'rta | Yuqori | Client-side scarf compositor (RN Skia) |
| TPS warp katta rasmda sekin | Past | O'rta | Downscale 800px, keyin upscale |
| Face template avtomatik topilmasa | O'rta | Yuqori | Fallback: onboarding paytida "sifatsiz" xabari |

---

## 8. Yakuniy checklist

Hozir bilan har oyda:

- [ ] **Latency SLA**: p95 tryon < 500 ms
- [ ] **Detection rate**: 95%
- [ ] **Uptime**: 99% (ml-face, ml-compositor)
- [ ] **Cost**: GPU $500/oy dan kam (Faza 2)
- [ ] **Test coverage**: 70% + visual regression tayyor

---

## Xulosa

Hozir ishlab turadi:
- ✅ Face template extraction (real selfielarda)
- ✅ Prosidural scarf compositor (3 style)
- ✅ End-to-end mobile → API → ML → mobile

Qurilishi kerak (prioritet tartibda):
1. **Testlar** — hozirgi holatni ishonchli sinovdan o'tkazish
2. **ml-garment servisi** — sotuvchi mahsulotlariga real template
3. **Template-based compositor** — sifat sakrashi
4. **Client-side (RN Skia) real-time** — camera preview'da AR effekt
5. **Dress/abaya (Faza 2)** — MediaPipe Pose + full-body

Keyingi qadam: **Sprint 1 testlari** (§5 dagi ish tartibi).
