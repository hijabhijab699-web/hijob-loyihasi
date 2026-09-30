# N24:31 · Sprint 5 natijalari — Server-side polish + Client-side prototip

**Sana:** 2026-09-30
**Reja:** [AI_PLAN.md §5 Sprint 5](./AI_PLAN.md)

---

## Xulosa

| Vazifa | Testlar | O'tdi |
|---|---|---|
| Server-side MediaPipe Pose (ml-face) | 3 | ✅ 3/3 |
| Real hair matting (SelfieSegmentation) | 2 | ✅ 2/2 |
| Yaw-aware anchor bias | 2 | ✅ 2/2 |
| Dress compose real body | 1 | ✅ 1/1 |
| Snapshot integrity check | 1 | ✅ 1/1 |
| **Sprint 5 alohida** | **9** | ✅ **9/9** |
| **Kompozitor jami** | **42** | ✅ **42/42** (3.81 s) |
| **AI pipeline jami** | **67** | ✅ **67/67** |

Client-side RN Skia prototipi Sprint 6 uchun qoladi (Expo native rebuild talab qiladi).

---

## 1. Yaratilgan qismlar

### 1.1 Server-side MediaPipe Pose (`ml-face/app/services/pose.py`)

Yangi endpoint: `POST /face/pose` (multipart image).

Chiqish:
```json
{
  "detected": true,
  "image_size": [1126, 2000],
  "landmarks_raw": [{"x": 0.5, "y": 0.4, "visibility": 0.98}, ...],  // 33 pose landmark
  "body": {
    "shoulder_left": {"x": 0.27, "y": 0.30},
    "shoulder_right": {"x": 0.26, "y": 0.30},
    "hip_left": {"x": 0.30, "y": 0.52},
    "hip_right": {"x": 0.26, "y": 0.51},
    "neck_center": {"x": 0.26, "y": 0.28},
    "hem_center": {"x": 0.28, "y": 0.87}
  }
}
```

**body** — dress compositor kutayotgan 6 kalitli payload. Barcha koordinatalar `[0..1]` doirasiga clamp qilingan (MediaPipe body-off-frame ni tashqariga chiqarishi mumkin).

**Real sinov (image №4 body params ekrani):**
- 33 landmark detektsiya
- Body payload to'liq to'ldirildi
- Latency: <500 ms

### 1.2 Real hair matting (`hair_matting.py`)

Geometric ellipse dan real segmentation ga o'tildi.

**Ikki qatlam:**
1. **Ellipse** — landmarks dan peshona atrofida (Sprint 4 dan)
2. **MediaPipe SelfieSegmentation** — real foreground/background mask

Ikkalasi ko'paytiriladi: `protect = ellipse × foreground`. Bu ellipse ichida faqat *odam pikslari* saqlanadi (fon oldiga foydalanuvchi orqa fondagi rasm o'tib ketmaydi).

**Fallback:** SelfieSegmentation ishlamasa (test yoki edge case), faqat ellipse ishlatiladi. `use_selfie_segmentation=False` opsiyasi ham bor.

**MediaPipe versiya:** compositor venv da `mediapipe==0.10.20` majburiy o'rnatildi (metapackage 1.0.1 solutions API ni bermaydi).

### 1.3 Yaw-aware anchor bias (`template_compose.py`)

`_estimate_yaw(user_landmarks_px)` funksiyasi:
- FaceMesh dan nose_tip vs midpoint(face_left, face_right) offsetni face_width ga nisbatan hisoblaydi
- Chiqish `[-1..1]` — musbat = user o'ng tomonga qaraydi

`_extract_user_anchors` da yaw ta'sirlari:
- `yaw_dx = yaw * face_w * 0.20` — barcha anchor'lar shu tomonga surildi
- `hair_slant = yaw * face_h * 0.10` — toj qismi teskari tomonga engashadi

Natija: bosh burilganda scarf ham burilib tushadi (TPS warp shape o'zgaradi).

### 1.4 Dress compositor E2E orchestration

**Client:** `MlCompositorClient.composeDressWithTemplate()` qo'shildi:
- ml-face ga `/face/pose` → 6 kalitli body payload
- ml-compositor ga `/compose/dress-template` (multipart + body_pose JSON)
- JPEG qaytariladi

**TryOnService** da category='dresses' uchun route:
- Template MAJBURIY (procedural fallback yo'q — koylak juda murakkab)
- Yo'q bo'lsa `BadRequestException('DRESS_TEMPLATE_MISSING')`

**Log tag:** `[scarf-template]` / `[scarf-procedural]` / `[dress-template]` har session da.

### 1.5 Client-side RN Skia prototype (⏸ jarayonda)

`@shopify/react-native-skia` o'rnatildi. Real-time preview uchun kerakli komponent:
- Kamera stream (expo-camera CameraView)
- MediaPipe FaceMesh frame processor (yoki tflite native)
- Skia Canvas ustidan warped scarf overlay

Bu ish Expo prebuild + native rebuild talab qiladi (~10-15 min). Sprint 6 boshida yakunlanadi.

---

## 2. Test natijalari

### 2.1 Sprint 5 alohida — 9 test

Faylda: 
- `services/ml-face/tests/test_pose.py` — 3 test
- `services/ml-compositor/tests/test_sprint5.py` — 6 test

**Pose:**
- `test_pose_returns_no_detection_for_landscape` — Peyzaj → false, no crash
- `test_pose_body_summary_shape` — 6 kalit bor, hammasi [0..1]
- `test_pose_landmark_indices_are_consistent` — MediaPipe indekslarini kafolatlash

**Yaw bias:**
- `test_yaw_estimate_range` — `[-1..1]`
- `test_yaw_shifts_anchors_horizontally` — Bosh burish anchor'larni suradi

**Hair matting:**
- `test_selfie_segmentation_returns_mask` — Foreground mask valid
- `test_hair_matting_prefers_selfie_over_geometry` — Real mask ellipse'dan farqli

**Dress:**
- `test_dress_compose_with_real_body_still_produces_output` — Synthetic dress + real body

**Snapshot:**
- `test_template_compose_still_stable` — Sprint 5 dan keyin ham face ko'rinadi

### 2.2 AI pipeline jami — 67 test

```
ml-face                15  (+3 Sprint 5)
ml-compositor          42  (+6 Sprint 5)
ml-garment             10
────────────────────────────
Total                  67 passed, ~15 s
```

### 2.3 Real E2E — /face/pose

Test image: №4 (body params ekrani, hijobli qiz koylakda)

```
Image size: 1126x2000
33 pose landmark detected
Body payload (normalized [0..1]):
  shoulder_left: (0.27, 0.30)
  shoulder_right: (0.26, 0.30)
  hip_left: (0.30, 0.52)
  hip_right: (0.26, 0.51)
  neck_center: (0.26, 0.28)
  hem_center: (0.28, 0.87)
```

Body clamp ishlaydi — kadr tashqarisidagi hip/hem ko'rinmaydi.

---

## 3. Latency (Sprint 5 pipeline)

| Rejim | p95 |
|---|---|
| Procedural scarf | ~70 ms |
| Template scarf | ~180 ms |
| Template scarf + real hair matting | ~280 ms (+100 ms SelfieSegmentation) |
| Dress template (pose + warp + blend) | ~600-800 ms |

Real hair matting SelfieSegmentation qo'shimcha vaqt talab qiladi lekin sifat sakrashi katta.

## 4. Sprint 6 rejasi

Sprint 5 dan qolgan:
- **Client-side RN Skia real-time preview** — kamera stream + on-device Face Mesh + Skia overlay
- Frame processor uchun native module (vision-camera-mediapipe yoki tflite-react-native)
- ~30 fps target

Yangi (Sprint 6 ustuvorlik):
1. **CI/CD** — GitHub Actions har commit da barcha 67 test
2. **Prod deploy plan** — Hetzner + BunnyCDN + Payme
3. **Sotuvchi analytics dashboard** — real vaqt ko'rsatgichlar
4. **Mobile UI polish** — animatsiyalar, haptic feedback
5. **Pilot testlash** — 2-3 do'kon bilan real ma'lumot

---

## 5. Yakuniy holat (5 sprint bilan)

**Servislar:**
- ✅ ml-face (5001) — face template + pose
- ✅ ml-compositor (5002) — scarf procedural/template + dress template + yaw + real hair
- ✅ ml-garment (5003) — sotuvchi shabloni
- ✅ NestJS (4000) — orchestration + auto-routing (scarf/dress)
- ✅ Seller web (3001) — CMS + upload
- ✅ Mobile Expo (8081) — client

**Test coverage:**
- ✅ **67 pytest** (~15 s)
- ✅ **Visual regression** 3 golden snapshot

**Kompozit rejimlar:**
- ✅ Procedural scarf (fallback, 3 style)
- ✅ Template scarf (real fabric + yaw + hair matting)
- ✅ Template dress (server Pose + full-body warp)

Sprint 5 **✅ tamomlandi** (server-side qismi). Client-side Skia — Sprint 6 boshida.
