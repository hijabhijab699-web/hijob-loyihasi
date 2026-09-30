# N24:31

Modest fashion virtual try-on marketplace. Template-based compositor (not full AI generation).

## Struktura

```
n2431/
├── apps/
│   └── mobile/                # React Native + Expo (iOS/Android)
├── services/
│   ├── api/                   # NestJS main REST API
│   ├── ml-face/               # Python FastAPI — face template extraction
│   └── ml-compositor/         # Python FastAPI — try-on compositor (GPU)
├── packages/
│   ├── design-tokens/         # Shared colors, type, spacing
│   ├── i18n/                  # uz / ru translations
│   └── shared-types/          # TypeScript types
├── infra/
│   └── docker-compose.yml     # Postgres + Redis + MinIO for local dev
└── docs/
    └── ARCHITECTURE.md        # Full system architecture
```

## Talablar

- Node.js 22+
- pnpm 9+
- Docker Desktop
- Python 3.12 (ML services uchun, keyingi fazada)
- Xcode 16 (iOS build) / Android Studio (Android build)

## Ishga tushirish

```bash
# 1. Dependencies
pnpm install

# 2. Environment
cp .env.example .env

# 3. Docker (Postgres + Redis + MinIO)
pnpm db:up

# 4. Prisma migration
cd services/api && pnpm prisma migrate dev

# 5. Hammasi bir vaqtda
pnpm dev
```

### Faqat mobile ilovani ishga tushirish

```bash
cd apps/mobile
pnpm dev              # Expo dev server
# Keyin `i` — iOS simulator, `a` — Android emulator
```

### Faqat backend

```bash
cd services/api
pnpm dev              # http://localhost:4000
```

## Fazalar

- **Faza 1 (MVP)** — Platklar (scarves). On-device try-on. 3 oy.
- **Faza 2** — Koylaklar (dresses/abaya). Server GPU. 2 oy.
- **Faza 3** — Aksessuarlar, full outfit, sotuvchi analytics. 2 oy.

To'liq arxitektura: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

## Ranglar (design tokens)

- Bg: `#F1EBDB` · Surface: `#FAF6EA`
- Ink: `#2A2820` · Muted: `#857E6E`
- Olive: `#8A8D5B` · Olive dark: `#4E5230`
- Gold: `#C9A96E` · Rule: `#D9D0BE`

## Litsenziya

Proprietary — barcha huquqlar himoyalangan.
