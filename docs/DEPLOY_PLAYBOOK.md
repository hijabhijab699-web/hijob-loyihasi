# N24:31 · Prod deploy playbook

**Nishonlangan konfiguratsiya:** Hetzner Cloud (Frankfurt/Nürnberg) + BunnyCDN + PostgreSQL native + native Redis + MinIO.

Bu hujjat MVP faza uchun (~1000 foydalanuvchi). Faza 3 dagi masshtab uchun AWS/GCP ga o'tish o'zgargan bo'ladi (ayn hujjat).

---

## 1. Server topologiyasi

| Server | Rol | Xarajat/oy |
|---|---|---|
| **CPX41** (8 vCPU, 16 GB) | NestJS API + ml-face + ml-compositor + ml-garment | €30 |
| **CPX31** (4 vCPU, 8 GB) | PostgreSQL 16 + Redis 7 | €18 |
| **CPX21** (3 vCPU, 4 GB) | MinIO (S3-compatible) + Nginx reverse proxy | €10 |
| BunnyCDN | Static + upload CDN | $5-15 |
| Domain (.uz + .com) | | $30/yil |
| **JAMI** | | **~$75/oy** |

Faza 2 (GPU compositor) — RunPod L4 spot-instance $200-350/oy qo'shiladi.

---

## 2. DNS

Hetzner Load Balancer (yoki Cloudflare) orqasidagi 4 sub-domain:

```
n2431.app                → Marketing / landing (static)
api.n2431.app            → NestJS API (port 4000)
seller.n2431.app         → Next.js seller portal (port 3001)
cdn.n2431.app            → BunnyCDN pull-zone → MinIO/uploads
```

TLS: Let's Encrypt (auto-renewal via Certbot / Traefik). HSTS `max-age=31536000`.

---

## 3. Server 1 — API + ML servislar

### 3.1 OS setup (bir marta)

```bash
apt update && apt upgrade -y
apt install -y ufw nginx docker.io docker-compose-plugin certbot python3-certbot-nginx
ufw allow 22,80,443/tcp
ufw enable
```

### 3.2 Node + pnpm

```bash
curl -fsSL https://nodejs.org/download/release/latest-v22.x/... | tar -xz
ln -s /opt/node/bin/{node,npm} /usr/local/bin/
corepack enable
corepack prepare pnpm@9 --activate
```

### 3.3 Python + uv

```bash
apt install -y python3.12-venv build-essential libssl-dev libffi-dev
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 3.4 Repo va build

```bash
git clone https://github.com/n2431/n2431.git /opt/n2431
cd /opt/n2431
pnpm install --frozen-lockfile
pnpm --filter @n2431/api build
pnpm --filter @n2431/seller-web build

# Python venvlar
for svc in ml-face ml-compositor ml-garment; do
  cd services/$svc
  uv venv --python 3.12 .venv
  uv pip install --python .venv/bin/python -r requirements.txt
  cd -
done
```

### 3.5 systemd unit lar

`/etc/systemd/system/n2431-api.service`:
```ini
[Unit]
Description=N24:31 API
After=network.target

[Service]
Type=simple
User=n2431
WorkingDirectory=/opt/n2431/services/api
EnvironmentFile=/etc/n2431/api.env
ExecStart=/usr/local/bin/node dist/main.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Xuddi shu narsalar `n2431-ml-face`, `n2431-ml-compositor`, `n2431-ml-garment`, `n2431-seller-web` uchun.

### 3.6 Nginx reverse proxy

```nginx
server {
  listen 443 ssl http2;
  server_name api.n2431.app;

  ssl_certificate     /etc/letsencrypt/live/api.n2431.app/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/api.n2431.app/privkey.pem;
  add_header Strict-Transport-Security "max-age=31536000";

  client_max_body_size 20M;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
  }

  location /uploads/ {
    proxy_pass http://127.0.0.1:4000;
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
  }
}
```

ML servislari (5001, 5002, 5003) — **faqat 127.0.0.1** da bind qilinadi, tashqariga chiqmaydi. Faqat NestJS API ularga kiradi.

---

## 4. Server 2 — Postgres + Redis

```bash
apt install -y postgresql-16 redis-server
sudo -u postgres createuser -P n2431      # parol so'raladi
sudo -u postgres createdb -O n2431 n2431

# /etc/postgresql/16/main/postgresql.conf
listen_addresses = '10.0.0.1'   # private interface
shared_buffers = 2GB
work_mem = 32MB

# /etc/postgresql/16/main/pg_hba.conf
host  n2431  n2431  10.0.0.0/24  scram-sha-256

systemctl enable --now postgresql redis-server
```

**Prisma migratsiyalar** deploy paytida:
```bash
cd /opt/n2431/services/api
pnpm prisma migrate deploy
```

Backup: `pg_dumpall` har kuni 03:00, S3-uyum ga (Backblaze B2 $0.005/GB).

---

## 5. Server 3 — MinIO + BunnyCDN

```bash
docker run -d --name minio --restart unless-stopped \
  -p 9000:9000 -p 9001:9001 \
  -v /srv/minio:/data \
  -e MINIO_ROOT_USER=n2431admin \
  -e MINIO_ROOT_PASSWORD='...' \
  minio/minio server /data --console-address :9001

# Bucket + policy
mc alias set local http://localhost:9000 n2431admin '...'
mc mb local/n2431-prod
mc anonymous set download local/n2431-prod
```

**BunnyCDN**:
- Pull zone: `n2431-prod`
- Origin: `https://s3.n2431.app` (MinIO)
- Cache 7 kun, ranganini yoqish
- Custom hostname: `cdn.n2431.app` + LE TLS

Prod da `STORAGE_ROOT` → MinIO, `API_URL` da `/uploads/*` ni MinIO SDK ga qayta yozish (loosely coupled, joriy `StorageService` intefeysini alma:shtirmasdan).

---

## 6. SMS / OTP — Eskiz.uz

1. Ro'yxatdan o'tish: https://eskiz.uz/ru/user/register
2. Ma'muriyat kabinetidan test balance (bepul 20 SMS)
3. Prod uchun tariff: **1 SMS = ~$0.006-0.012** (traffic ga qarab)
4. API doc: https://documenter.getpostman.com/view/663428/eskiz

`services/api/src/auth/auth.service.ts` da `sendOtp()` ni Eskiz REST API bilan almashtirish:

```typescript
// Prod: real SMS
if (env.NODE_ENV === 'production') {
  await fetch('https://notify.eskiz.uz/api/message/sms/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${eskizToken}` },
    body: new URLSearchParams({
      mobile_phone: phone.replace('+', ''),
      message: `N24:31 kodi: ${code}`,
      from: '4546',
    }),
  });
}
```

---

## 7. To'lov — Payme + Click

**Payme merchant sign-up:**
1. https://business.paycom.uz → ro'yxatdan o'tish
2. Merchant test tokenlarni olish (KEY_TEST, KEY_TEST_SECRET)
3. `services/api/src/orders/` ga Payme webhook endpoint qo'shish:
   - `POST /payment/payme/webhook` — CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction, CheckTransaction
   - Auth: Basic base64(login:password) tekshirish
   - Prisma da `orders.paymentTxId` bilan bog'lash

**Click**:
- https://merchant.click.uz — service_id + secret_key
- Webhook: `POST /payment/click/prepare` + `/complete`
- Sign md5 hash

**Test rejim**: `PAYMENT_PROVIDER_SANDBOX=true` env bilan production kod path o'zgarsin.

---

## 8. Monitoring

**Grafana Cloud free tier** — 10K seriya, 50 GB log.

```bash
# Prometheus node exporter har server
apt install -y prometheus-node-exporter
# Loki via Docker
docker run -d ... grafana/loki:latest
# Promtail — /var/log dan /var/log/nginx dan
```

Alertlar (Slack webhook orqali):
- API 5xx > 5% (5 min)
- Latency p95 > 2 s
- Disk > 80%
- Memory > 90%
- DB down

**Sentry** (frontend + backend errors) — free tier 5K events/oy.

---

## 9. CI/CD

`main` push → GitHub Actions:
1. **Test** — 67 pytest, TS typecheck (allaqachon setup, `.github/workflows/ci.yml`)
2. **Build** — Docker images (yoki tarball)
3. **Deploy** — SSH → git pull + `systemctl restart n2431-*`
4. **Smoke test** — `curl` health endpointlar

Deploy workflow qo'shish uchun `.github/workflows/deploy.yml` (Sprint 7 da).

**Rollback**: `git checkout <old-sha> && pnpm build && systemctl restart` — <1 min.

---

## 10. Xavfsizlik checklist (deploy oldidan)

- [ ] Barcha secrets `.env` ichida (git da yo'q), server da `chmod 600`
- [ ] `JWT_SECRET` — `openssl rand -base64 64`
- [ ] Postgres parol — 32+ tasodifiy belgi
- [ ] SSH — faqat kalit bilan (parol taqiqlangan)
- [ ] Fail2ban SSH + Nginx
- [ ] UFW: faqat 22, 80, 443. 5432/6379 — faqat private tarmoq
- [ ] MinIO admin kalitlari — 40+ belgi
- [ ] Prod DB backup — kuniga, 30 kun saqlash
- [ ] TLS Let's Encrypt auto-renew cron
- [ ] Rate limiting NestJS `@Throttle` bor
- [ ] Helmet + CSP header lar
- [ ] Face fotolar hech qachon diskda plaintext (Sprint 8 shifr)

---

## 11. App Store / Play Store submit

**iOS**:
1. Apple Developer 99$/yil
2. EAS Build: `eas build --platform ios --profile production`
3. TestFlight → 10 tester
4. App Store Connect submit — 2-7 kun review

**Android**:
1. Google Play $25 (bir marta)
2. `eas build --platform android`
3. Internal testing track → open beta → production

**Yordamchi ma'lumot**:
- Privacy policy URL (`n2431.app/privacy`)
- Support email
- Screenshots (5x har bir device size, iPhone 15 Pro + iPad + Android)
- App icon 1024×1024
- Age rating: 12+ (kamera + xarid)
- Category: Shopping / Lifestyle

---

## 12. Xarajat modeli (birinchi 3 oy)

| Modda | Oyiga |
|---|---|
| 3 Hetzner server | €58 |
| BunnyCDN | $10 |
| Backblaze B2 backup | $3 |
| Grafana Cloud | 0 |
| Sentry | 0 |
| SMS (5K/oy) | $30 |
| Domain + email | $10 |
| Apple + Google | $10 avg |
| Payme komissiya | 1-3% turnover |
| **Umumiy sobit** | **~$120/oy** |

Faza 2 (koylak + GPU): +$300/oy → **~$450/oy**.

---

## 13. Launch checklist

- [ ] Domain + TLS live
- [ ] 3 server up, systemd unit lar enable
- [ ] Prisma migrate + seed (real do'konlar)
- [ ] MinIO bucket + BunnyCDN pull zone
- [ ] SMS gateway (Eskiz) test yuborish ✓
- [ ] Payme test to'lov ✓
- [ ] Backup skriptlar cron da
- [ ] Monitoring dashboards ochildi
- [ ] App Store + Play Store submit
- [ ] Marketing landing (n2431.app) live
- [ ] Privacy policy + Terms sahifalari
- [ ] 2-3 pilot sotuvchi bilan real ma'lumot
- [ ] Feedback formasi tayyor
