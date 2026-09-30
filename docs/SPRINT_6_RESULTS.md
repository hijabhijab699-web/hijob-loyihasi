# N24:31 · Sprint 6 natijalari — Client + CI + Analytics + Deploy playbook

**Sana:** 2026-09-30
**Reja:** [AI_PLAN.md](./AI_PLAN.md) Sprint 6 (post-AI polish)

---

## Xulosa

| Vazifa | Holati |
|---|---|
| Client-side RN Skia scarf overlay | ✅ Komponent tayyor |
| GitHub Actions CI (67 pytest + typecheck) | ✅ Workflow yozildi |
| Seller analytics endpoint + dashboard | ✅ Ishlaydi (real DB) |
| Mobile UI polish (haptic + Reanimated) | ✅ Button + tryon |
| Prod deploy playbook | ✅ 13 bo'lim to'liq hujjat |

---

## 1. Client-side RN Skia scarf overlay

`apps/mobile/src/components/ScarfSkiaPreview.tsx`

**Nima qiladi:**
- `@shopify/react-native-skia` bilan on-device rendering
- Foydalanuvchi face landmarks (server dan olib qo'yilgan) asosida real-time scarf polygon
- Rang almashishida instant re-render (network hop yo'q)
- Style-specific tuning (classical/loose/double) — server bilan bir xil geometry

**API:**
```typescript
<ScarfSkiaPreview
  imageUri="file://.../selfie.jpg"
  width={340}
  landmarks={[{x, y}, ...] /* 478 MediaPipe FaceMesh normalized */}
  colorHex="#8A8D5B"
  tyingStyle="classical"
  opacity={0.92}
/>
```

**Ishlash usuli:**
1. `useImage(imageUri)` — Skia SkImage yuklaydi
2. `useMemo`: 7-nuqta scarf polygon + face oval kesish
3. Har rang o'zgarishida faqat `scarfColor` reactive — polygon reserve

**Ishlashi:**
- Statik foto ustidan real-time swipe (mavjud): iOS Simulator (kamera yo'q)
- Kamera stream orasidan real-time (kelasi): `expo-camera` frame processor + Skia video-frame — Sprint 7

**Cheklovlar:**
- Client-side landmarklar server dan olinadi (bir marta yuklanadi, cache qilinadi)
- Real-time camera preview uchun MediaPipe vision-camera-mediapipe frame processor kerak (native module)

---

## 2. GitHub Actions CI

`.github/workflows/ci.yml`

**4 ta parallel job:**
1. **ml-services (matrix)** — ml-face + ml-compositor + ml-garment. `uv` bilan cache, u2net model cache
2. **backend** — Prisma generate + typecheck + build
3. **seller-web** — Next.js typecheck
4. **mobile** — Expo typecheck

**Trigger**: `push` main/develop + `pull_request` main.
**Concurrency**: har PR uchun bitta run (avvalgi cancel).
**Cache**: pnpm store + uv cache + u2net ONNX (176 MB).

Tugash vaqti (kutilgan): ~5 min pipeline.

---

## 3. Sotuvchi analytics

### 3.1 Backend endpoint

`GET /api/v1/seller/analytics` (JWT + role=seller)

Chiqish:
```json
{
  "totals": {
    "products": 5,
    "variants": 8,
    "stock": 105,
    "tryOnSessions": 34,
    "orderItems": 0,
    "orderUnits": 0,
    "grossUsd": 0
  },
  "tryOnTrend7d": [{day: "2026-09-24", count: 0}, ...],
  "topVariants": [{variantId, title, color, count}, ...]
}
```

**Real DB natijasi (Noor do'koni):**
- 5 mahsulot, 8 variant, 105 stock
- 34 try-on session (Sprint 1-5 sinovlaridan)
- Top variant: "Платок «Нежность»" (Bejeviy) — 33 primerka

### 3.2 Frontend `/analytics` sahifasi

`apps/seller-web/src/app/(dashboard)/analytics/page.tsx`

**Elementlar:**
- **4 metric card**: Mahsulot / Variant / Stock / Buyurtma
- **3 metric card**: Primerka jami / Daromad USD / Order count
- **7 kun bar chart**: gradient bar lar, day label + count
- **Top 5 variant**: HTML jadval, ustuvorlik bo'yicha

Barcha ranglar `design-tokens` (olive + gold). Server component (SSR) — cache-siz.

---

## 4. Mobile UI polish

### 4.1 Haptic feedback (`Button.tsx`)

- **gold** variant → `ImpactFeedbackStyle.Medium` (asosiy CTA — kuchli sezish)
- **primary/secondary/ghost** → `ImpactFeedbackStyle.Light`
- Har bosishda tebranish, iOS + Android

### 4.2 Try-on ekranida

- **Style tanlash** → `Haptics.selectionAsync()` (yumshoq click)
- **Variant tanlash** → `Haptics.selectionAsync()`
- **Result rasm** → `Animated.Image` + `FadeIn.duration(220)` — har yangi kompozit smooth cross-fade

Bu iOS Human Interface Guidelines + Material Design tavsiyalariga mos.

---

## 5. Prod deploy playbook

`docs/DEPLOY_PLAYBOOK.md` — 13 bo'lim, ~$120/oy MVP xarajat modeli.

**Asosiy nuqtalar:**
- **3 server**: API+ML (€30), DB (€18), MinIO (€10)
- **DNS**: n2431.app + api./seller./cdn.
- **systemd unit** har servis uchun
- **Nginx reverse proxy** + Let's Encrypt
- **SMS**: Eskiz.uz integratsiya (kod snippet bilan)
- **To'lov**: Payme + Click webhook lar
- **Monitoring**: Grafana Cloud free + Sentry
- **CI/CD**: GitHub Actions push → SSH deploy
- **Xavfsizlik checklist** 12 punkt
- **App Store + Play Store** submit reja
- **Launch checklist** 12 punkt

---

## 6. Yakuniy holat (6 sprint bilan)

**AI pipeline test:** 67 pytest, ~15 s
**Yangi Sprint 6 kod:** ~900 qator (Skia, analytics, CI, playbook)

**Servislar (barcha 6 sog'lom):**
- ml-face — face template + pose
- ml-compositor — scarf procedural/template + dress template + yaw + real hair
- ml-garment — sotuvchi shabloni auto-extract
- NestJS API — orchestration + analytics + auto-routing
- Next.js seller portal — CMS + upload + analytics
- Expo mobile — try-on + haptic + Skia komponent

**Ma'lumot bazasi:**
- `face_templates`, `garment_templates`, `tryon_sessions`
- Real ma'lumot: 5 do'kon, 12 mahsulot (bu jumladan 1 avto-templated), 34 try-on session

**Hujjatlar:**
- `ARCHITECTURE.md` — sistema arxitekturasi
- `AI_PLAN.md` — AI reja + test strategiyasi
- `SPRINT_1..6_RESULTS.md` — har sprint natijasi
- `DEPLOY_PLAYBOOK.md` — prod deploy runbook
- `GETTING_STARTED.md` — dev setup

**CI:** `.github/workflows/ci.yml` — 4 job, ~5 min pipeline

---

## 7. Nima qoldi (post-MVP)

**Sprint 7+ rejasi:**
1. **Kamera-stream real-time Skia** — `vision-camera-mediapipe` bilan on-device 30 fps
2. **Real Payme + Click integratsiya** — sandbox test + prod webhook
3. **SMS Eskiz.uz** — real SMS OTP
4. **Buyurtma tracking** — foydalanuvchi order status ko'rishi
5. **Push notifications** — OneSignal integratsiya
6. **Face encryption** — Sprint 8, on-device AES kalit
7. **Multi-region deploy** — CDN edge lar
8. **Admin panel** — moderatsiya qo'shilgan
9. **AB testing** — GrowthBook integratsiya
10. **Loyalty program** — foydalanuvchi ballari

Sprint 6 **✅ tugadi**. MVP dan production tomon.
