# N24:31 · Sprint 7 natijalari — Payme + Eskiz + Order tracking + Push + tests

**Sana:** 2026-09-30
**Reja:** [AI_PLAN.md](./AI_PLAN.md) Sprint 7 (post-MVP payment + notifications)

---

## Xulosa

| Vazifa | Holati |
|---|---|
| Payme JSON-RPC 2.0 webhook (sandbox) | ✅ 5 metod + idempotency |
| Eskiz.uz SMS klienti | ✅ Token refresh + dev fallback |
| Buyurtma tracking (mobile + backend) | ✅ 5-qadam timeline |
| Push notifications (Expo Push) | ✅ Dead-token pruning |
| Backend test qamrovi | ✅ **27 test, 4 suite, ~0.7 s** |

---

## 1. Payme JSON-RPC 2.0 integratsiya

`services/api/src/payment/payme/`

**5 metod, hammasi idempotent:**
- `CheckPerformTransaction` — buyurtma to'lanadigan holatdami?
- `CreateTransaction` — mablag'ni rezervlash (qayta chaqiruvda bir xil result)
- `PerformTransaction` — mablag' hisobga olindi → `paid` + `push` yuboriladi
- `CancelTransaction` — bekor qilish. State `-1` (unpaid) yoki `-2` (refund)
- `CheckTransaction` — status so'rov (payme retrying flow uchun)

**Auth:** HTTP Basic `Paycom:merchant_key` — non-prod uchun kalitsiz bypass, prod uchun `PAYME_KEY` env orqali strict.

**Amount validation:** UZS/USD kursini `USD_UZS_RATE` env dan oladi, tiyin (1/100 UZS) hisob-kitobi bilan taqqoslaydi.

**Kod:**
```typescript
// performTransaction — muvaffaqiyatli to'lovda push fire-and-forget
void this.push.sendToUser(
  updated.userId,
  "To'lov qabul qilindi",
  `Buyurtmangiz #${updated.id.slice(0, 8)} tasdiqlandi. Tayyorlanmoqda.`,
  { orderId: updated.id, event: 'payment.paid' },
).catch(...);
```

**Testda:** 13 ta test — happy path, idempotency (`tx_new` ikki marta yuborilsa bir xil `state:1`), amount mismatch, wrong Basic auth, competing tx.

---

## 2. Eskiz.uz SMS klienti

`services/api/src/sms/eskiz.client.ts`

**Ishlash usuli:**
- `NODE_ENV !== 'production'` yoki kredensiallar yo'q → `[dev SMS → +998…] {message}` log qiladi, `true` qaytaradi (dev/staging da OTP burnamiz).
- Prod: `POST /auth/login` orqali token oladi (lazy), keyin `POST /message/sms/send`
- 401 qaytsa — token stale hisoblanadi, bitta marta refresh + retry
- `from` — env `ESKIZ_FROM` (default `4546`)

**Test qamrovi (3 test):**
- Dev fallback fetch chaqirmasligini isbotlaydi
- `isConfigured()` env ga qarab true/false
- **401 → re-login → retry** — 2 `/auth/login` va 2 `/message/sms/send` chaqiruv kutiladi

---

## 3. Buyurtma tracking

### 3.1 Backend timeline

`services/api/src/orders/orders.service.ts` → `orderTimeline()`

5-qadam sxema, `deliveryType` ga qarab 4-chi step o'zgaradi:

| deliveryType | Step 4 |
|---|---|
| `delivery` | "Yo'lda" |
| `pickup` | "Do'konda tayyor" |
| `proba` | "Proba jo'natildi" |

Status → rank: `pending=0, confirmed=1, processing=2, shipped/proba_scheduled=3, delivered=4, cancelled=-1`.

**Test qamrovi (6 test):**
- Pending → faqat `placed` active
- Shipped → `shipped` active, `delivered` reached false
- Delivered → hamma steplar reached
- Pickup → `ready`, `shipped` yo'q
- Proba → `proba` step
- Cancelled → hech qaysi step reached emas

### 3.2 Mobile order screen

`apps/mobile/app/orders/index.tsx` + `apps/mobile/app/orders/[id].tsx`

- Ro'yxat: har order card (order id + status chip + total)
- Detail: timeline (dot + line), items, address, receipt

---

## 4. Push notifications (Expo Push)

`services/api/src/push/`

**Push token registrat:**
- `POST /push/register` (JWT + platform: ios/android/web)
- Upsert on `token` (unique), so‘nggi `lastUsedAt` yangilanadi

**Push yuborish:**
- `POST https://exp.host/--/api/v2/push/send` — Expo push service (kredensial talab qilmaydi)
- Response da `DeviceNotRegistered` bo'lsa — o'sha token DB dan o'chiriladi (lazy prune)
- Network xato bo'lsa — log + `sent:0`, hech qachon caller ni rollback qildirmaydi (fire-and-forget)

**Prisma:** yangi `PushToken` model — `id, userId, token@unique, platform, createdAt, lastUsedAt`.

**Test qamrovi (5 test):**
- No tokens → `sent:0`
- Expo call → body verify (title/data payload)
- Dead token → DB dan o'chiriladi
- Fetch xato → throw qilmaydi, `sent:0` qaytaradi
- `registerToken` upsert qiladi

---

## 5. Backend test qamrovi

`services/api/test/` — **27 test, 4 suite, 0.7 sekund**.

Runner: **Node.js 24 built-in `node --test`** + **tsx** (zero-config, jest dev deps yo'q).

```
test/payme.test.ts          — 13 test
test/push.test.ts           —  5 test
test/eskiz.test.ts          —  3 test
test/orders-timeline.test.ts —  6 test
────────────────────────────────
                              27 test, all green
```

**Prisma mocking:** in-memory fake — `findUnique`, `findFirst`, `update` closure ustida ishlaydi. NestJS DI shell qilinmaydi — servislar `new PaymeService(fakePrisma, fakeConfig, fakePush)` sifatida chaqiriladi.

**Fetch mocking:** `globalThis.fetch` swap, keyin restore. Push testi capture qilingan body ni verify qiladi.

**Ishga tushirish:**
```bash
pnpm --filter @n2431/api test
```

Chiqish:
```
✔ CheckPerformTransaction returns allow when amount matches
✔ CheckPerformTransaction returns InvalidAmount on mismatch
✔ CreateTransaction is idempotent for same txId
✔ PerformTransaction marks paid + fires push notification
✔ sendToUser prunes DeviceNotRegistered tokens
✔ prod path logs in, sends, and retries after a 401
...
ℹ tests 27
ℹ pass 27
ℹ fail 0
ℹ duration_ms 174
```

---

## 6. Yakuniy holat (7 sprint bilan)

**Test qamrovi:**
- ml-face + ml-compositor + ml-garment — **67 pytest**, ~15 s
- API — **27 node:test**, ~0.7 s
- **Jami: 94 avtomat test**

**Kod (Sprint 7 yangi):**
- Payme: ~250 qator
- Eskiz: ~90 qator
- Push: ~90 qator
- Order timeline + mobile screens: ~250 qator
- Testlar: ~450 qator
- **Sprint 7 jami: ~1 100 qator**

**Servislar (barcha sog'lom):**
- ml-face, ml-compositor, ml-garment — Python 3.12
- NestJS API — Payme + Eskiz + Push + Orders + Auto-routing
- Next.js seller portal — CMS + analytics
- Expo mobile — try-on + orders + haptic + Skia

---

## 7. Sprint 7+ dan keyingi ish (post-MVP roadmap)

1. **Real Payme merchant sandbox** — Paycom account, sandbox key, uchdan test
2. **Real Eskiz prod SMS** — kredit sotib olib prod env ga qo'yish
3. **Kamera-stream real-time Skia** — `vision-camera-mediapipe` bilan on-device 30 fps
4. **Click.uz integratsiya** — Click API v2
5. **Face encryption** — on-device AES-256, kalit iOS Keychain / Android Keystore
6. **Multi-region deploy** — CDN edge lar (Cloudflare R2)
7. **Admin panel** — moderatsiya, banni, kontent nazorati
8. **AB testing** — GrowthBook (dark mode, style tanlash)
9. **Loyalty program** — foydalanuvchi ballari, referral

Sprint 7 **✅ tugadi**. MVP + payment + notifications tayyor.
