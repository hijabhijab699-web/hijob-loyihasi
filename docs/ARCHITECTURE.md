# N24:31 — To'liq Arxitektura

**Versiya:** 0.1 (draft, ko'rib chiqish uchun)
**Sana:** 2026-09-29
**Ishlab chiquvchi:** Umidjon Afforov

---

## 0. Loyihaning falsafasi

**Muammo:** Har bir "примерка" da to'liq AI generation qilish qimmat, sekin, va natija har safar farq qiladi (yuz doim boshqacha chiqadi).

**Yechim:** *Template-based Virtual Try-On Engine*. AI hech qachon yuzni qaytadan chizmaydi. Uning o'rniga:

1. Foydalanuvchi yuzi bir marta shablon sifatida saqlanadi.
2. Sotuvchi maxsulotlari oldindan **standart maneken shabloniga** tayyorlanadi.
3. Примерка paytida — bu ikki shablon **matematik yo'l bilan biriktiriladi** (warping + blending + tone matching). Generation emas.

Bu shu ma'noda "*mosaic assembly*" — mozaikni yig'ish.

---

## 1. Yuqori darajali tizim (High-level system)

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile app)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │ Buyer UI │  │ Seller UI│  │ On-device│  │ Try-on cache │    │
│  │          │  │          │  │  ML kit  │  │ (per-user)   │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘    │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS / gRPC
┌──────────────────────────▼──────────────────────────────────────┐
│                      API GATEWAY (Nginx / Kong)                  │
│                   Auth · Rate-limit · TLS · CDN edge             │
└─┬───────────┬───────────┬───────────┬───────────┬───────────────┘
  │           │           │           │           │
┌─▼──────┐ ┌─▼──────┐ ┌──▼─────┐ ┌───▼────┐ ┌────▼─────┐
│ Auth   │ │Catalog │ │ Face   │ │Garment │ │ Try-On   │
│Service │ │Service │ │Template│ │Template│ │Compositor│
│        │ │        │ │Service │ │Service │ │  (GPU)   │
└─┬──────┘ └─┬──────┘ └──┬─────┘ └───┬────┘ └────┬─────┘
  │          │           │           │           │
  │          │           │           │           │
┌─▼──────────▼───────────▼───────────▼───────────▼─────────────┐
│   PostgreSQL     │     Redis      │   S3 / MinIO storage    │
│   (metadata)     │  (cache/queue) │  (images, templates)    │
└──────────────────┴────────────────┴─────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │      CDN        │
                    │  (BunnyCDN /    │
                    │   CloudFront)   │
                    └─────────────────┘
```

**Asosiy servislar:**

| Servis | Vazifasi | Til/Framework |
|---|---|---|
| API Gateway | Auth, routing, rate-limit | Nginx / Kong |
| Auth Service | Ro'yxatdan o'tish, JWT, sessions | Node.js (NestJS) yoki Go |
| Catalog Service | Do'konlar, maxsulotlar, kategoriyalar | Node.js (NestJS) |
| Face Template Service | Yuz shabloni chiqarish va saqlash | Python (FastAPI + MediaPipe) |
| Garment Template Service | Kiyim shabloni tayyorlash | Python (FastAPI + rembg + SAM) |
| Try-On Compositor | Warping + blending pipeline | Python (FastAPI + OpenCV + GPU) |
| Order Service | Savat, buyurtma, to'lov | Node.js (NestJS) |
| Notification Service | Push, SMS, Email | Node.js |

---

## 2. Foydalanuvchi oqimlari (User Flows)

### 2.1 Xaridor (Buyer) oqimi

```
Splash (24:31 logo)
   ↓
Til tanlash + Registratsiya (name, @username, +998 tel, parol)
   ↓ [role = "Покупатель"]
Face Capture (3 raqurs: front, chap yarim, o'ng yarim)
   ↓
Body Parameters (rost, vazn, yosh, kiyim o'lchami)
   ↓
Home (do'konlar carousel, kategoriyalar, yangi tovarlar)
   ↓
Catalog (Платки / Платья / Сумки / Аксессуары + filter)
   ↓
Product tanlash → Примерочная (Try-On)
   ↓
Savat → Yetkazib berish tanlash (Доставка / Самовывоз / **Проба**) → To'lov
```

**Muhim:** "Проба" (test-before-buy) — sotuvchi kiyimni olib kelib kiyib ko'rish uchun beradi, foydalanuvchi faqat yetkazib berish uchun to'laydi. Bu N24:31 ning noyob xususiyati.

### 2.2 Sotuvchi (Seller) oqimi

```
Registratsiya [role = "Продавец"]
   ↓
Do'kon profili (logo, nom, brend, joylashuv)
   ↓
Mahsulot qo'shish (photo studio ish jarayoni):
   ├─ Maneken/model fotolari yuklash (3-6 rakurs)
   ├─ AI avtomatik ravishda:
   │    • Fon o'chirish (rembg / SAM)
   │    • Landmark aniqlash (yelka, kokrak, bel, bo'yin chegarasi)
   │    • Standart pose ga normallash
   │    • Rang varyatsiyalari
   ├─ Sotuvchi tekshiradi va tasdiqlaydi
   └─ Template galereyaga saqlanadi
   ↓
Narx, kategoriya, filtr atributlari (rang, o'lcham, model)
   ↓
Publish → Moderation → Live
```

---

## 3. Face Template Engine (yuz shabloni)

### 3.1 Nima saqlaymiz

Fotoni saqlash **taqiqlanadi** (privacy). O'rniga strukturali shablon:

```typescript
interface FaceTemplate {
  userId: string;
  version: string;                    // "1.0"
  landmarks: Point3D[];               // 468 nuqta (MediaPipe FaceMesh)
  skinTone: {
    lab: [number, number, number];    // LAB rang model
    dominantHex: string;
    variance: number;
  };
  headMask: PngBase64;                // faqat bosh silueti (alpha mask)
  neckMask: PngBase64;                // bo'yin
  proportions: {
    headWidth: number;                // pikselda emas, nisbatda
    headHeight: number;
    neckLength: number;
    chinToEyes: number;
    eyeDistance: number;
  };
  textures: {
    forehead: PngBase64;              // kichik patch (peshona teri)
    cheekLeft: PngBase64;
    cheekRight: PngBase64;
    chin: PngBase64;
  };
  reference: {
    frontEncrypted: EncryptedBlob;    // faqat AES bilan, foydalanuvchi kalitida
    leftEncrypted: EncryptedBlob;
    rightEncrypted: EncryptedBlob;
  };
  createdAt: Date;
  lastUsedAt: Date;
}
```

**Muhim qoidalar:**

- Xom fotolar faqat **shifrlanib** saqlanadi (agar foydalanuvchi rozi bo'lsa). Kalit foydalanuvchi qurilmasida.
- Landmarklar va nisbatlar — anonim ma'lumot, ML servis uchun.
- 30 kunlik ishlatilmagan template avtomatik o'chiriladi (GDPR compliance).

### 3.2 Yuzni olish oqimi (client-side)

Rasm №3 dagi "Поместите лицо в рамку" ekrani.

```
[Camera preview] → [MediaPipe Face Detector on-device]
  ├─ Face bbox aniqlash
  ├─ Yuzning ramka ichida ekanini tekshirish
  ├─ Yorug'lik yetarli emasligini ogohlantirish
  ├─ Boshni burish/harakat ko'rsatmasi (front/left/right)
  └─ 3 rakurs olingandan keyin → server ga yuborish
```

**Client tech:** MediaPipe iOS/Android SDK (yoki React Native uchun `react-native-vision-camera` + MediaPipe plugin).

### 3.3 Server-side template chiqarish

Python service (FastAPI + MediaPipe + OpenCV):

```
Input: 3 shifrlangan foto (front, left, right)
   ↓
1. MediaPipe FaceMesh → 468 landmark har bir fotodan
2. Multi-view fusion → 3D landmarks (soddalashtirilgan)
3. Head segmentation (BiSeNet yoki MediaPipe Selfie Segmentation)
4. Skin patches extraction (small crops)
5. Skin tone analysis (LAB space, dominant + variance)
6. Head/neck proportions calculation
7. Alpha matting (Matting Refiner) — chegaralar aniq bo'lishi uchun
   ↓
Output: FaceTemplate JSON + binary masks → PostgreSQL + S3
```

**GPU kerakmi?** Yo'q. MediaPipe CPU da 200-500ms da ishlaydi. Faqat batch ishlash uchun keyingi bosqichda GPU ga ko'chirishimiz mumkin.

---

## 4. Garment Template Engine (kiyim shabloni)

### 4.1 Nima saqlaymiz

```typescript
interface GarmentTemplate {
  productId: string;
  category: "scarf" | "dress" | "abaya" | "bag" | "accessory";
  variants: GarmentVariant[];         // rang, print, o'lcham bo'yicha
}

interface GarmentVariant {
  variantId: string;
  color: string;
  size: string;
  images: {
    canonical: PngUrl;                // fon yo'q, standart pose
    front: PngUrl;
    side?: PngUrl;
    back?: PngUrl;
  };
  alphaMask: PngUrl;                  // aniq alpha kanal
  landmarks: {
    // Kiyim turiga qarab boshqacha
    // Dress uchun:
    shoulderLeft: Point;
    shoulderRight: Point;
    neckline: Point[];
    waist: Point;
    hemline: Point[];
    // Scarf uchun:
    tyingStyle: "classical" | "loose" | "double" | "turban";
    hairCoverage: Point[];            // qaysi hududlarni yopadi
    faceOpening: Point[];              // yuz uchun teshik chegarasi
    drapePoints: Point[];              // taxlanish nuqtalari
  };
  standardPose: {
    modelHeight: number;              // masalan 178cm ni mos keladi
    torsoLength: number;
    shoulderWidth: number;
  };
  colorPalette: string[];              // extract qilingan asosiy ranglar
  approvedBy: string;                  // qaysi moderator tasdiqlagan
  createdAt: Date;
}
```

### 4.2 Sotuvchi upload flow

Sotuvchi 3-6 dona rasm yuklaydi (front / side / back / detail). Backend avtomatik quyidagilarni qiladi:

```
1. Background removal (SAM 2 yoki rembg-u2net)
2. Product segmentation (kiyim vs maneken tanasi vs boshqa)
3. Landmark detection:
   - Dress uchun: DensePose yoki OpenPose yordamida yelka/bel
   - Scarf uchun: Custom trained model (bosh chegarasi + drape points)
4. Pose normalization → standart canvas (masalan 1080x1920)
5. Color palette extraction (K-means, 5 dominant colors)
6. Approval queue → moderator ko'rib chiqadi
   ↓
7. Approved bo'lsa — S3 ga templatelar + PostgreSQL ga metadata
```

**Muhim qaror:** Sotuvchilar **iloji boricha stanadart maneken foto** yuklashi kerak. Bu compositing sifatini oshiradi. Guideline PDF beriladi.

### 4.3 Scarf uchun maxsus holat

Rasm №9 da 3 xil bog'lash usuli: **Классический / С напуском / Двойной**.

Har bir tying style uchun alohida template kerak, chunki:
- Yuzning ochiq qismi har xil.
- Sochni yopish darajasi har xil.
- Drape (taxlanish) fizikasi boshqacha.

```
scarf.template = {
  fabric: "chiffon" | "silk" | "cotton",
  tyingStyles: [
    { name: "classical", faceOpening: [...], hairCoverage: [...], drapePoints: [...] },
    { name: "loose",     faceOpening: [...], hairCoverage: [...], drapePoints: [...] },
    { name: "double",    faceOpening: [...], hairCoverage: [...], drapePoints: [...] },
  ]
}
```

---

## 5. Try-On Compositor (asosiy engine)

Bu — loyihaning eng muhim qismi. Rasm №9 va №10 da ko'ringan natijani ishlab chiqaradi.

### 5.1 Pipeline

```
INPUT:
  - userId → FaceTemplate (cache dan)
  - productId + variantId + tyingStyle → GarmentTemplate
  - userBodyParams (rost, vazn) → scale factor

Step 1: Load templates
   ↓
Step 2: Landmark alignment
   • Foydalanuvchi yuz landmarklarini kiyim shabloni maneken yuzi joyiga
     mos ravishda affine transform bilan tekislash
   • Similarity transform (rotation + scale + translation)
   ↓
Step 3: Mesh warping
   • Thin Plate Spline (TPS) yoki Delaunay triangulation
   • Yuzni kiyim standard poseiga mos qilib egish
   • Bo'yin qismi kiyim yoqasiga silliq o'tishi uchun
   ↓
Step 4: Compositing (layer stack, orqadan oldga)
   Layer 1: Background (studio yoki gradient)
   Layer 2: Kiyim (dress/abaya) — canonical image
   Layer 3: Bo'yin (foydalanuvchi neckMask + skin tone)
   Layer 4: Yuz (warp qilingan face template)
   Layer 5: Scarf (agar bor bo'lsa) — with faceOpening cutout
   Layer 6: Aksessuarlar (savdo bag, ring) — foreground
   ↓
Step 5: Color matching
   • Yuz teri rangi kiyim yoqasi joyida bir xil bo'lishi kerak
   • LAB color space da histogram matching
   • Bo'yin va yuz o'rtasidagi rang farqi minimallashtiriladi
   ↓
Step 6: Seamless blending
   • Poisson blending (OpenCV seamlessClone) — yuz-bo'yin chegarasida
   • Alpha matting refinement — soch va scarf chegarasida
   ↓
Step 7: Post-processing
   • Yorug'lik moslashtirish (lighting direction from garment analysis)
   • Contrast/brightness match
   • Optional: subtle noise/grain (realistik ko'rinish uchun)
   ↓
Step 8: Output
   • JPEG (quality 92) → CDN cache (1 soatgacha)
   • Result URL client ga qaytariladi
```

### 5.2 Performance target

| Kiyim turi | Target latency | GPU kerakmi |
|---|---|---|
| Scarf (client-side warm) | < 400ms | Yo'q (on-device MediaPipe) |
| Scarf (cold cache) | < 1.5s | Ixtiyoriy |
| Dress/Abaya | < 2.5s | Ha (GPU 30x tezroq) |
| Full outfit (scarf + dress) | < 3.5s | Ha |

### 5.3 Caching strategiyasi

```
Redis cache keys:
  face_template:{userId}                 → 24h TTL (memory)
  garment_template:{productId}:{vId}    → 7d TTL (memory)
  tryon_result:{userId}:{prodId}:{tie}  → 1h TTL (CDN + Redis)

S3 caching:
  Try-on natija: bir marta hisoblanib, foydalanuvchi swipe qilsa
  cache dan olinadi. Faqat parameter o'zgarganda qayta hisoblash.
```

### 5.4 Client-side (on-device) engine

Scarflar uchun **ba'zilarini butunlay qurilmada** bajarish mumkin:

```
Client-side try-on (React Native + native module):
   MediaPipe FaceMesh (real-time)
   ↓
   Scarf template (pre-downloaded, cached)
   ↓
   WebGL / Metal shader-based warping
   ↓
   Real-time render 30fps
```

Bu, ayniqsa, ro'yxatdan o'tishdagi "camera preview" holatida (rasm №9 kabi) juda foydali. Foydalanuvchi to'g'ridan-to'g'ri ko'rib turadi.

**Dress/abaya uchun** — server-side (GPU) yaxshiroq, chunki tana pose estimation og'irroq.

---

## 6. Ma'lumotlar modeli (Database schema)

### 6.1 PostgreSQL asosiy jadvallar

```sql
-- Foydalanuvchilar
users (
  id UUID PRIMARY KEY,
  username VARCHAR(32) UNIQUE NOT NULL,     -- @diyor
  phone VARCHAR(20) UNIQUE NOT NULL,        -- +998...
  full_name VARCHAR(120),
  role user_role_enum NOT NULL,             -- 'buyer' | 'seller'
  password_hash TEXT NOT NULL,
  language VARCHAR(5) DEFAULT 'ru',         -- ru/uz/en
  created_at TIMESTAMPTZ,
  onboarding_state JSONB                    -- {face_done: true, body_done: true}
);

-- Body parametrlari (rasm №4)
user_body_params (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  height_cm SMALLINT,
  weight_kg SMALLINT,
  age SMALLINT,
  preferred_size VARCHAR(4),                -- 'XS' 'S' 'M' 'L' 'XL' 'XXL'
  updated_at TIMESTAMPTZ
);

-- Face template metadata (asosiy binary S3 da)
face_templates (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  version VARCHAR(10) NOT NULL,
  landmarks JSONB NOT NULL,                 -- 468 nuqta
  skin_tone JSONB NOT NULL,
  proportions JSONB NOT NULL,
  s3_head_mask_key TEXT,
  s3_neck_mask_key TEXT,
  s3_textures_prefix TEXT,
  s3_encrypted_photos_prefix TEXT,
  created_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ                    -- 30 kun ishlatilmasa null bo'lmagan
);

-- Sotuvchilar / Do'konlar
sellers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  brand_name VARCHAR(120) NOT NULL,          -- 'Noor', 'Salsabil', 'Amina'
  logo_url TEXT,
  description TEXT,
  rating NUMERIC(3,2),
  reviews_count INT DEFAULT 0,
  location POINT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);

-- Kategoriyalar
categories (
  id VARCHAR(32) PRIMARY KEY,               -- 'scarves', 'dresses', 'bags', 'accessories'
  name_uz VARCHAR(80),
  name_ru VARCHAR(80),
  name_en VARCHAR(80),
  icon_url TEXT
);

-- Mahsulotlar
products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES sellers(id),
  category_id VARCHAR(32) REFERENCES categories(id),
  title JSONB NOT NULL,                     -- {uz, ru, en}
  description JSONB,
  base_price_usd NUMERIC(10,2) NOT NULL,
  attributes JSONB,                         -- {model: "classical", fabric: "chiffon"}
  filters JSONB,                            -- {color: ["olive"], size: ["90x90"]}
  status product_status_enum,               -- 'draft' 'pending' 'published' 'archived'
  created_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  popularity_score REAL DEFAULT 0
);

-- Mahsulot variantlari (rang + o'lcham)
product_variants (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  color VARCHAR(32),
  size VARCHAR(10),
  stock INT NOT NULL,
  price_usd NUMERIC(10,2),                  -- null bo'lsa product.base_price
  sku VARCHAR(64) UNIQUE
);

-- Garment template
garment_templates (
  variant_id UUID PRIMARY KEY REFERENCES product_variants(id),
  canonical_image_key TEXT NOT NULL,
  alpha_mask_key TEXT NOT NULL,
  side_image_key TEXT,
  back_image_key TEXT,
  landmarks JSONB NOT NULL,
  standard_pose JSONB NOT NULL,
  color_palette JSONB,
  tying_styles JSONB,                       -- faqat scarf uchun
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);

-- Try-On tarixi (analytics uchun)
tryon_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  variant_id UUID REFERENCES product_variants(id),
  tying_style VARCHAR(32),
  result_url TEXT,
  latency_ms INT,
  added_to_cart BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ
);

-- Sevimlilar
wishlist (
  user_id UUID REFERENCES users(id),
  variant_id UUID REFERENCES product_variants(id),
  added_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, variant_id)
);

-- Savat
cart_items (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INT NOT NULL,
  added_at TIMESTAMPTZ
);

-- Buyurtmalar
orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  delivery_type VARCHAR(20) NOT NULL,        -- 'delivery' | 'pickup' | 'proba'
  delivery_speed VARCHAR(20),                -- 'today' | 'tomorrow' | 'scheduled'
  scheduled_at TIMESTAMPTZ,
  address JSONB,                             -- {city, district, street, ...}
  comment TEXT,
  subtotal_usd NUMERIC(10,2),
  delivery_fee_usd NUMERIC(10,2),
  total_usd NUMERIC(10,2),
  payment_method VARCHAR(20),                -- 'click' | 'payme' | 'visa' | 'mastercard'
  payment_status VARCHAR(20),
  order_status VARCHAR(30),
  created_at TIMESTAMPTZ
);

order_items (
  order_id UUID REFERENCES orders(id),
  variant_id UUID REFERENCES product_variants(id),
  quantity INT,
  price_snapshot_usd NUMERIC(10,2),
  PRIMARY KEY (order_id, variant_id)
);
```

### 6.2 Redis kalitlari

```
session:{jwtId}                     → user session (TTL 30d)
face_template:{userId}              → serialized template (TTL 24h)
garment_template:{variantId}        → template (TTL 7d)
catalog:home:{lang}                 → home feed (TTL 5m)
catalog:new:{category}:{lang}       → new products (TTL 10m)
tryon:queue                         → GPU rendering queue (list)
rate_limit:{userId}:{endpoint}      → sliding window
```

---

## 7. API dizayn (asosiy endpointlar)

Barchasi `/api/v1/` prefiksi bilan. Auth: JWT Bearer (30 kun TTL, refresh token 90 kun).

### 7.1 Auth

```
POST /auth/register           { username, phone, name, role, password }
POST /auth/verify-otp         { phone, code }
POST /auth/login              { phone|username, password }
POST /auth/refresh            { refreshToken }
POST /auth/social/google      { idToken }
POST /auth/social/apple       { authCode }
POST /auth/social/facebook    { accessToken }
```

### 7.2 Onboarding

```
POST /onboarding/face/upload
     multipart: front.jpg, left.jpg, right.jpg (encrypted client-side)
     → { templateId, status: "processing" }

GET  /onboarding/face/status/:templateId
     → { status: "ready" | "failed", error? }

PUT  /onboarding/body
     { height, weight, age, size }
```

### 7.3 Catalog

```
GET  /catalog/home?lang=ru
     → { stores: [...], categories: [...], newArrivals: [...] }

GET  /catalog/stores?category=scarves&limit=10
GET  /catalog/products?category=dresses&color=green&size=M&sort=popularity
GET  /catalog/products/:id
GET  /catalog/products/:id/variants
```

### 7.4 Try-On

```
POST /tryon/preview
     { variantId, tyingStyle? }
     → { resultUrl, cacheKey, latencyMs }

GET  /tryon/history?limit=20
POST /tryon/save                    // saqlangan look
DELETE /tryon/save/:id
```

### 7.5 Wishlist / Cart / Orders

```
GET  /wishlist
POST /wishlist { variantId }
DELETE /wishlist/:variantId

GET  /cart
POST /cart { variantId, quantity }
PATCH /cart/:itemId { quantity }
DELETE /cart/:itemId

POST /orders/checkout
     { items, deliveryType, address, paymentMethod, comment? }
     → { orderId, paymentUrl }

GET  /orders/:id
GET  /orders?status=active
```

### 7.6 Seller Portal

```
POST /seller/products                          // Draft yaratish
POST /seller/products/:id/images               // Rasmlar yuklash
GET  /seller/products/:id/template-preview     // Auto-generated template ko'rish
POST /seller/products/:id/submit               // Moderatsiyaga yuborish
GET  /seller/analytics
```

### 7.7 Admin / Moderator

```
GET  /admin/moderation-queue
POST /admin/products/:id/approve
POST /admin/products/:id/reject { reason }
```

---

## 8. Mobil ilova arxitekturasi

### 8.1 Tavsiya etilgan stack

**Variant A — React Native (tez ishga tushirish):**
- Framework: React Native 0.75+
- Navigation: `react-navigation/native` (native-stack)
- State: Zustand + React Query (server state)
- Camera: `react-native-vision-camera` + MediaPipe frame processor
- Rendering: `react-native-skia` (compositor UI uchun)
- i18n: `i18next` (ru/uz/en)

**Variant B — Native (yuqori sifat, ko'proq xarajat):**
- iOS: SwiftUI + AVFoundation + CoreML
- Android: Jetpack Compose + CameraX + MediaPipe

**Mening tavsiyam:** React Native + native modules faqat critical joylarda (camera preview + on-device try-on). Bu 1 team bilan 2 platformada ishlash imkonini beradi.

### 8.2 Rasm №1-10 asosida ekranlar ro'yxati

| # | Ekran | Route |
|---|---|---|
| 1 | Splash | `/splash` |
| 2 | Registration | `/auth/register` |
| 2b | Login | `/auth/login` |
| 3 | Face Capture | `/onboarding/face` |
| 4 | Body Parameters | `/onboarding/body` |
| 5 | Home | `/home` |
| 6 | Catalog: Scarves | `/catalog/scarves` |
| 7 | Catalog: Dresses | `/catalog/dresses` |
| 8 | Product Detail | `/product/:id` |
| 9 | Try-On: Scarf | `/tryon/scarf/:id` |
| 10 | Try-On: Dress | `/tryon/dress/:id` |
| — | Cart | `/cart` |
| — | Wishlist | `/wishlist` |
| — | Profile | `/profile` |
| — | Order tracking | `/orders/:id` |

### 8.3 Dizayn tizimi (design tokens)

Rasmlardan chiqarilgan:

```typescript
const tokens = {
  color: {
    bg: '#EFE9DE',              // krem fon
    bgDark: '#3E4229',          // olive dark
    primary: '#8A8D5B',         // olive
    primaryDark: '#6B6F45',
    accent: '#C9A96E',          // gold
    accentLight: '#E4C98F',
    text: '#2E2A20',
    textMuted: '#7A756B',
    surface: '#FDFAF3',
    surfaceGlass: 'rgba(253, 250, 243, 0.7)',
    danger: '#B85450',
    success: '#7A8A5B',
  },
  radius: {
    sm: 8, md: 16, lg: 24, xl: 32, pill: 999,
  },
  spacing: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  typography: {
    display: { family: 'Playfair Display', weight: 700 },
    body: { family: 'Inter', weight: 400 },
    button: { family: 'Inter', weight: 500 },
  },
  shadow: {
    soft: '0 4px 24px rgba(60, 50, 20, 0.08)',
    card: '0 2px 12px rgba(60, 50, 20, 0.06)',
  },
};
```

---

## 9. Xavfsizlik va Privacy (juda muhim)

### 9.1 Yuz ma'lumotlari

- **Fotolar hech qachon plaintext saqlanmaydi.** Server ga kelishdan oldin client da AES-256 shifrlanadi. Kalit foydalanuvchi qurilmasida (keychain / keystore).
- Faqat **derived template** (landmarks + masks + tone) qayta ishlash uchun ishlatiladi.
- Foydalanuvchi istagan vaqtda `/onboarding/face/delete` orqali o'chirishi mumkin.
- Login qilmagan 30 kundan keyin avtomatik o'chiriladi.
- **Uchinchi tomonlarga hech qachon yuborilmaydi.** Rasm №3 dagi "Мы не передаем фото третьим лицам" — kod bilan tasdiqlangan.

### 9.2 Umumiy

- HTTPS everywhere, HSTS.
- JWT rotation, refresh token rotation.
- Rate limiting: 60 req/min per user, 10 req/min try-on.
- OWASP Top 10 checklist (SQL injection, XSS, CSRF).
- Sotuvchi verification: pasport skani (agar Uzbekistan Business ID mavjud bo'lsa — ular orqali).
- Payment: PCI-DSS compliant tomonlar orqali (Click, Payme, Visa gateway). Kredit karta ma'lumotlarini biz saqlamaymiz.

### 9.3 GDPR / O'zbekiston qonuni

- Ochiq privacy policy (rasm №2 pastdagi link).
- Ma'lumotlarni eksport qilish huquqi (`/user/export`).
- Ma'lumotlarni o'chirish huquqi (`/user/delete-account`).
- Audit log (kim, qachon, qanday ma'lumotni ko'rgan).

---

## 10. Tavsiya etilgan Tech Stack (yakuniy)

| Qatlam | Texnologiya | Sabab |
|---|---|---|
| **Mobile** | React Native 0.75 + Skia | 2 platformada 1 team; native modules kerak joylarda |
| **API Gateway** | Nginx + Kong (open source) | Yetuk, rate-limit, OSS |
| **API services** | Node.js 22 + NestJS + TypeScript | Ekosistema, yollash oson |
| **ML/Compositor** | Python 3.12 + FastAPI + OpenCV + MediaPipe + PyTorch (agar kerak bo'lsa) | Standart ML stack |
| **Database** | PostgreSQL 16 | ACID, JSONB, PostGIS |
| **Cache/Queue** | Redis 7 + BullMQ | Async job, cache |
| **Object storage** | MinIO (self-hosted) yoki Backblaze B2 | S3 API, arzon |
| **CDN** | BunnyCDN yoki Cloudflare | O'zbekistonga yaqin PoP |
| **Search** | Meilisearch | Yengil, tez, RU/UZ til qo'llab-quvvatlaydi |
| **Monitoring** | Grafana + Prometheus + Loki | OSS, self-hosted |
| **Error tracking** | Sentry | Mobile va backend |
| **CI/CD** | GitHub Actions + Docker + Kubernetes (k3s dastlab) | Standart |
| **Deployment** | Hetzner / DigitalOcean (dastlab), keyin AWS/GCP (o'sganda) | Xarajat |

### 10.1 GPU planlash

- Dastlabki 1000 foydalanuvchigacha: bitta GPU server (NVIDIA A10 yoki L4, ~$0.5/soat).
- 10K foydalanuvchi: 2-3 GPU + queue.
- 100K: auto-scaling GPU pool (RunPod / Vast.ai kabi).

Kutubxonalar: **PyTorch + torchvision + kornia** (differentiable warping uchun).

---

## 11. Roadmap (bosqichma-bosqich reja)

### Faza 1 — MVP (3 oy)

- [x] Arxitektura hujjati (bu)
- [ ] Design system va Figma
- [ ] Auth + Onboarding (rasm 1-4)
- [ ] Seller portal (asosiy)
- [ ] Catalog + Home (rasm 5-7)
- [ ] **Scarf try-on** (eng oson) — client-side MediaPipe + simple warp
- [ ] Cart + Order + 1 to'lov usuli (Payme)
- [ ] 2 til (ru, uz)

**Maqsad:** Faqat platklar bilan bozorga chiqish. 2-3 do'kon bilan pilot.

### Faza 2 — Dresses (2 oy)

- [ ] Dress try-on (server-side GPU)
- [ ] "Проба" delivery option
- [ ] Barcha to'lov usullari
- [ ] Notifikatsiyalar (push, SMS)

### Faza 3 — Scaling (2 oy)

- [ ] Aksessuarlar (sumkalar, taqinchoqlar)
- [ ] Full outfit assembly (scarf + dress + bag birga)
- [ ] Analytics dashboard sotuvchilar uchun
- [ ] Ingliz tili

### Faza 4 — AI Enhancement

- [ ] Foydalanuvchi tanasi bo'yicha kiyim tavsiyasi
- [ ] Rang moslashtirish AI
- [ ] Style profil (foydalanuvchi likelaridan)

---

## 12. Ochiq savollar (siz bilan hal qilishimiz kerak)

Quyidagilarni birga muhokama qilishimiz kerak. Har biriga qaror qabul qilib, arxitekturani yakunlaymiz:

1. **Yuz shabloni saqlash joyi:** faqat serverda emas, balki qurilmada ham dublikat saqlaymizmi? (Offline try-on uchun kerak.)
2. **Sotuvchi rasm sifati kafolati:** biz photo studio guideline beramizmi, yoki AI avtomatik "sifatsiz" fotoni rad etadimi?
3. **Try-on natijasini foydalanuvchi ijtimoiy tarmoqda ulasha oladimi?** (agar ha, watermark kerak.)
4. **"Проба" mexanizmi:** kurier kutadimi, yoki foydalanuvchi kiyib ko'radi va bir necha kundan keyin qaytaradimi?
5. **Ko'p do'kondan tovar bir savatda:** yetkazib berish har biridan alohida bo'ladimi (yig'ilib bittada)?
6. **Til dastlab qaysi 2 ta:** ru + uz, yoki uz + en?
7. **Sotuvchi komissiyasi:** har savdodan necha foiz?
8. **Reklama va promotion:** ichida bannerlar / boosted products bo'ladimi?

---

## 13. Xulosa

Arxitekturaning asosiy g'oyasi:

> **Generatsiya emas, kompozitsiya.**
> Har safar yuzni yangidan chizmaymiz — bir marta shablon olamiz.
> Har safar kiyimni sim qilib chiqarmaymiz — sotuvchi shablon yuklaydi.
> Ekranda ko'rilayotgan narsa — matematik moslashtirish + silliq yopishtirish natijasi.

Bu qaror bizga beradi:
- **Tezlik:** 10x tezroq har bir try-on.
- **Narx:** GPU vaqti 5-10x kamayadi.
- **Sifat izchilligi:** Foydalanuvchi yuzi doim bir xil ko'rinadi.
- **Privacy:** Xom fotolar hech qachon oshkora bo'lmaydi.
- **Scale:** Bir GPU 100+ concurrent foydalanuvchi xizmatida.

**Keyingi qadam:** Ochiq savollar (§12) bo'yicha kelishuv → Figma dizayn tizimi → Faza 1 MVP kod tuzilishi.
