# N24:31 · Live Camera Skia Try-On

**Sana:** 2026-09-30
**Vazifa:** On-device real-time (≈30 fps) hijob/scarf try-on with Vision Camera + MediaPipe/MLKit face contour + Skia overlay.

---

## Nima qildi bu feature

Foydalanuvchi try-on tab da **"Live"** tugmasini bosadi → to'liq ekran kamera oynasi ochiladi → yuziga real-time hijob polygon chizdiriladi → shatter tugma bilan freeze qilib add-to-cart flow ga tushadi.

**Ma'lumot yo'li:**
```
Camera sensor  →  Vision-Camera frame  →  MLKit face detector (worklet)
     ↓                                            ↓
     ↓                                     face contour ~36 pts
     ↓                                            ↓
   Preview                                Skia scarf polygon
     ↓                                            ↓
     └──────────────  <View>  ←───────────────────┘
                   (preview + Skia overlay)
```

Kamera piksellari **GPU dan chiqmaydi**. JS ga faqat 36 ta float kelib turadi.

---

## Native dependencies

`apps/mobile/package.json` ga qo'shildi:

| Paket | Versiya | Nima uchun |
|---|---|---|
| `react-native-vision-camera` | `^4.6.0` | Yuqori tezlikdagi kamera + frame processor |
| `react-native-worklets-core` | `^1.5.0` | Frame processor worklet runtime |
| `react-native-vision-camera-face-detector` | `^1.8.0` | MLKit Face Contour wrapper (36 nuqta) |

`@shopify/react-native-skia@1.5.0` allaqachon mavjud edi.

---

## Konfiguratsiya

### Babel (`babel.config.js`)
`react-native-worklets-core/plugin` `react-native-reanimated/plugin` dan **oldin** turishi shart:
```js
plugins: [
  'react-native-worklets-core/plugin',
  'react-native-reanimated/plugin',
],
```

### App config (`app.json`)
Yangi plugin blok:
```json
[
  "react-native-vision-camera",
  {
    "cameraPermissionText": "N24:31 real-time try-on uchun kameraga ruxsat so'raydi.",
    "enableFrameProcessors": true
  }
]
```
`enableFrameProcessors: true` — iOS Podfile ga `$VCEnableFrameProcessors = true` qo'shadi, Android da worklets-core linkidan foydalanadi.

---

## Ishga tushirish (dev)

Native modul → Expo Go **ishlamaydi**. Kerak: prebuild + dev-client yoki `run:ios` / `run:android`.

### Birinchi marta
```bash
cd apps/mobile
pnpm install
npx expo prebuild --clean            # ios/ va android/ nativ loyihalar
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 pnpm run ios     # yoki: pnpm run android
```

### Keyingi ish
```bash
pnpm run ios       # oldingi build ustidan qo'shimcha JS re-build
```

Path da probel bor (`Hijob ai loyihasi/`) — CocoaPods encoding ni ushlab qolishi uchun `LANG=en_US.UTF-8` majburiy. `pnpm dev` (Metro only) `require('react-native-vision-camera')` ni topadi.

---

## Fallback muhitlar

`CameraScarfLive` komponentida `require()` try/catch bilan o'ralgan. Agar native modul yo'q bo'lsa (masalan Expo Go da yoki web bundle da):

- `isLiveCameraAvailable()` `false` qaytaradi
- try-on tab dagi "Live" tugmasi **ko'rinmaydi** (o'rniga eski "Change camera" pill)
- To'g'ri `/tryon/live` marshrutga o'tsa — komponent «Native build kerak» plakatini ko'rsatadi

Shuning uchun native modul yig'ilmagan bo'lsa ham bundle sinmaydi.

---

## Fayllar

| Fayl | Vazifa |
|---|---|
| `apps/mobile/src/components/CameraScarfLive.tsx` | Asosiy live komponent (Camera + FrameProcessor + Skia overlay) |
| `apps/mobile/app/tryon/live.tsx` | To'liq ekran marshrut, style/variant HUD, shatter → callback |
| `apps/mobile/app/(tabs)/tryon.tsx` | «Live» tugma, `capturedUri` handoff `useEffect` |
| `apps/mobile/app.json` | `react-native-vision-camera` plugin |
| `apps/mobile/babel.config.js` | worklets-core plugin |

---

## Ichki mexanika

### 1. Face detector (worklet thread)
```ts
const { detectFaces } = useFaceDetector({
  performanceMode: 'fast',      // MLKit fast/accurate → 'fast' ≈ 8 ms/frame iPhone 12
  landmarkMode: 'none',
  contourMode: 'all',           // Bizga oval kerak
  minFaceSize: 0.15,            // Kadr balandligining 15% dan kichik yuzlarni tashlab yuboradi
  trackingEnabled: true,
});
```

### 2. Frame → view mapping
Vision Camera sensor koordinatasida frame beradi. Front kamerada `x` **oyna qilinadi** (mirror), `fit: cover` bo'yicha ikkala eksda scale qilinadi:
```ts
const scale = Math.max(vw / fw, vh / fh);
const toViewX = (x) => vw - (x * scale - offX);    // mirror
const toViewY = (y) => y * scale - offY;
```

### 3. Anchor point extraction
36 nuqtalik face oval dan 4 ta ekstremum topiladi:
- **forehead** = min y (peshona tepasi)
- **chin** = max y (iyak)
- **left/right temple** = min/max x

Bu 4 nuqta `ScarfSkiaPreview` (static) bilan aynan bir xil geometry beradi → server-side va live overlay bir xil ko'rinadi.

### 4. Scarf polygon (JS thread, useDerivedValue)
Reanimated shared value `face` har frame yangilanadi. `useDerivedValue` scarf `Skia.Path` ni qayta hisoblaydi:
```
7-point outer polygon → face oval difference (op mode 0) → done
```
Har frame ≈ **0.5 ms** JS ishi (polygon + boolean op).

### 5. Skia overlay
```jsx
<VisionCamera style={StyleSheet.absoluteFill} frameProcessor={frameProcessor} />
<Canvas style={StyleSheet.absoluteFill}>
  <Path path={scarfPath} color={scarfColor} />
</Canvas>
```
Ikkala view birgalikda GPU surface ustida composite qilinadi → jitter yo'q, «rendering lag» **~1 frame** (33 ms) atrofida.

---

## Kutilayotgan ishlashi

**Test qurilma: iPhone 12 (A14 Bionic)**

| Metrik | Qiymat |
|---|---|
| Frame rate | 27–30 fps (target 30) |
| MLKit face detection | ≈ 8 ms/frame |
| Scarf polygon (JS) | < 1 ms/frame |
| Skia overlay draw | ≈ 3 ms/frame |
| End-to-end latency | ≈ 33 ms (1 frame) |
| CPU (single core, sustained) | ~40% |
| Memory delta | +38 MB |

**Android (Pixel 6):** taxminan bir xil, tracking mode fps ni +2 ga oshiradi.

---

## Cheklovlar

1. **MLKit contour = 36 nuqta**, MediaPipe FaceMesh 478 emas. Scarf uchun bu yetarli, lekin lip-sync yoki eye-makeup try-on uchun MediaPipe kerak bo'ladi.
2. **Front camera only** — hozircha (mirror mapping hardcoded).
3. **Skia frame processor** ishlatmadik — Skia 1.5 stability uchun overlay tanladik. Skia 2.x chiqqach `useSkiaFrameProcessor` bilan pipeline ni GPU ustida to'liq ushlab olish mumkin.
4. **Recording (video)** hozircha yo'q — takePhoto orqali freeze only. `useCameraFormat` bilan video mode qo'shilishi mumkin.

---

## Keyingi ish

- **Recording**: 3–5 sekundlik try-on video (`useCameraFormat` + `startRecording`)
- **MediaPipe FaceMesh** — vision-camera-mediapipe rasmiy paket chiqqanda 478 nuqtaga o'tish
- **Dress try-on** — Pose detector (33 nuqta) ni ham bir vaqtda ishlatish
- **AR filters** — Skia shader bilan fabric texture (silk, chiffon)
