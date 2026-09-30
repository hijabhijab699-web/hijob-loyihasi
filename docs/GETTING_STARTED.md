# Ishga tushirish qo'llanmasi

## 1. Talab qilinadigan tools

```bash
node -v      # >= 22
pnpm -v      # >= 9
docker --version
```

Yo'q bo'lsa:
- Node.js 22+: https://nodejs.org/
- pnpm: `npm i -g pnpm@9`
- Docker Desktop: https://www.docker.com/products/docker-desktop/
- Xcode 16 (iOS uchun): App Store dan
- Android Studio (Android uchun)

## 2. Loyihani boshlab yuborish

```bash
# 1. Dependencies
pnpm install

# 2. Env fayl
cp .env.example .env

# 3. Docker (Postgres + Redis + MinIO)
pnpm db:up

# 4. Database migratsiya
cd services/api
pnpm prisma migrate dev --name init
pnpm prisma:seed
cd ../..

# 5. Fonts yuklab olish
cd apps/mobile/assets/fonts
# README ni o'qing va fontlarni yuklab tashlang
cd ../../../..
```

## 3. Ishga tushirish

### Butun stack:
```bash
pnpm dev
```

### Faqat backend:
```bash
cd services/api
pnpm dev
# API → http://localhost:4000/api/v1
# Swagger → http://localhost:4000/api/docs
```

### Faqat mobile:
```bash
cd apps/mobile
pnpm dev
# Expo dev server ochiladi
# `i` — iOS simulator
# `a` — Android emulator
```

## 4. Test credentials (seed dan)

- **Xaridor:** `@diyor` / parol `test1234`
- **Sotuvchi:** `@noor` / parol `seller1234` (va boshqa: hijabhouse, sabr, amani, zahra)

## 5. Foydali URL-lar

| Xizmat | URL |
|---|---|
| API | http://localhost:4000/api/v1 |
| Swagger | http://localhost:4000/api/docs |
| Health check | http://localhost:4000/api/v1/health |
| MinIO console | http://localhost:9001 (`minioadmin` / `minioadmin`) |
| Prisma Studio | `cd services/api && pnpm prisma:studio` |

## 6. Tuzilma

```
apps/
  mobile/           # React Native (Expo Router)
    app/            # File-based routes
      _layout.tsx
      index.tsx     # Splash + redirect
      (auth)/       # /register, /login, /otp
      (onboarding)/ # /face, /body
      (tabs)/       # /home, /catalog, /tryon, /cart, /profile
      product/[id]  # Product detail
    src/
      api/          # Axios client
      components/   # Button, Input, Text, Screen, Logo
      i18n/         # i18next setup
      store/        # Zustand stores
      theme/        # ThemeProvider

services/
  api/              # NestJS backend
    src/
      auth/         # Register, login, OTP, JWT
      users/        # /users/me
      onboarding/   # Body params, face status
      catalog/      # Products, stores, home
      tryon/        # Try-on preview + history (MVP stub)
      cart/         # Cart CRUD
      orders/       # Checkout, order history
      health/
    prisma/
      schema.prisma # 10 MVP tables
      seed.ts       # 5 stores + 10 products

packages/
  design-tokens/    # colors, typography, spacing
  i18n/             # uz + ru translations
  shared-types/     # User, Product, Cart types
```

## 7. MVP fazasi rejasi

- ✓ Auth + Onboarding
- ✓ Catalog + Home
- ✓ Cart + basic Checkout
- ✓ Try-on stub (on-device MediaPipe integratsiyasi keyingi qadamda)
- ☐ Payme/Click to'lov integratsiyasi
- ☐ Sotuvchi portal (web)
- ☐ Face template extraction (Python + MediaPipe)
- ☐ Scarf compositor (client-side WebGL/Skia)

## 8. Muammolar

**"Cannot find module '@n2431/design-tokens'"**
→ `pnpm install` orqasidan `pnpm --filter mobile install` ishlating

**"Metro can't resolve workspace packages"**
→ `apps/mobile/metro.config.js` da watchFolders to'g'ri sozlangan bo'lishi kerak

**"Prisma client not generated"**
→ `cd services/api && pnpm prisma generate`

**iOS build fail: pod install**
→ `cd apps/mobile/ios && pod install`

**Docker: port already in use**
→ `pnpm db:down` keyin `pnpm db:up`
