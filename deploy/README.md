# N24:31 · Production deploy

One-server Docker Compose stack on Hetzner Cloud. Nginx fronts everything;
the API, ML services and Postgres live on a private Docker network and are
never exposed directly.

```
                          Internet
                             │
                             ▼
                     ┌───────────────┐
                     │  Nginx  :443  │  ← Let's Encrypt SSL
                     └──────┬────────┘
                            │
             ┌──────────────┼────────────────┐
             ▼              ▼                ▼
        ┌────────┐    ┌──────────┐   ┌──────────────┐
        │  API   │    │ Postgres │   │    Redis     │
        │ :4000  │    │  :5432   │   │    :6379     │
        └───┬────┘    └──────────┘   └──────────────┘
            │
   ┌────────┼────────┐
   ▼        ▼        ▼
┌──────┐ ┌───────┐ ┌────────┐
│face  │ │compos │ │garment │  ← MediaPipe + OpenCV + rembg
└──────┘ └───────┘ └────────┘
```

## Cost

| Item | Monthly |
|------|---------|
| Hetzner CPX21 (3 vCPU · 4 GB · 80 GB · Falkenstein) | **€8** |
| Domain (Namecheap `.app`) | ~$1 |
| Cloudflare R2 (10 GB storage + 1M read/write) | Free |
| **Total** | **~€9 / ~$10** |

Scale up to CX32 (€15) when > 100 daily active try-on sessions.

## Files

```
deploy/
├── docker-compose.prod.yml   # every service wired on a private network
├── .env.production.example   # env template (do NOT commit filled copy)
├── nginx/
│   ├── nginx.conf            # global http config
│   └── conf.d/
│       ├── n2431.conf        # api.n2431.app vhost with SSL + rate limits
│       └── proxy_headers.conf
└── scripts/
    ├── first-time-setup.sh   # one-shot server bootstrap
    ├── ssl-init.sh           # issue initial Let's Encrypt cert
    └── deploy.sh             # rsync + rebuild + restart
```

## First deploy — step by step

**On Hetzner Cloud console:**
1. New Project → `n2431`
2. Add Server → Location **Falkenstein** → Image **Ubuntu 24.04**
   → Type **CPX21** (€8/mo) → SSH keys: add your public key
3. Note the IP address that appears

**On your domain registrar (e.g. Namecheap):**
4. Add DNS A record: `api.n2431.app` → `<server IP>` (TTL 5 min)
5. Add another for `cdn.n2431.app` → CNAME to your R2 public URL

**From your Mac:**
6. First-time bootstrap:
   ```bash
   scp deploy/scripts/first-time-setup.sh root@<IP>:/tmp/
   ssh root@<IP> bash /tmp/first-time-setup.sh
   ```
7. Copy env template up and fill in on the server:
   ```bash
   scp deploy/.env.production.example root@<IP>:/opt/n2431/.env.production
   ssh root@<IP> nano /opt/n2431/.env.production
   # generate secrets on your Mac:
   openssl rand -hex 32   # → JWT_SECRET
   openssl rand -hex 24   # → POSTGRES_PASSWORD
   ```
8. Issue the initial SSL cert (needs DNS to be propagated):
   ```bash
   ssh root@<IP>
   cd /opt/n2431/deploy && ./scripts/ssl-init.sh
   ```
9. Full deploy — from your Mac:
   ```bash
   deploy/scripts/deploy.sh root@<IP>
   ```

The script waits for `https://api.n2431.app/api/v1/health` to return 200
before it exits; if it doesn't, it prints the log command to inspect.

## Subsequent deploys

Every time you push a change on your Mac:
```bash
deploy/scripts/deploy.sh root@<IP>
```
This rsync's the code, rebuilds affected Docker images, runs
`prisma migrate deploy`, and restarts services. Zero downtime for the DB;
API restart is ~5 s.

## Migrating uploaded images to R2

Only needed once, after switching `STORAGE_DRIVER` from `local` to `r2`.
Run **on the server** (has DB access + can hit R2):

```bash
ssh root@<IP>
cd /opt/n2431/services/api
pnpm exec tsx prisma/scripts/migrate-uploads-to-r2.ts
# Dry-run first:
# MIGRATE_DRY_RUN=1 pnpm exec tsx prisma/scripts/migrate-uploads-to-r2.ts
```

## Mobile app pointing at prod

Rebuild the iOS Release bundle with the prod API URL baked in:

```bash
cd apps/mobile
EXPO_PUBLIC_API_URL=https://api.n2431.app/api/v1 \
  xcodebuild ... -configuration Release ...
```

Then upload the resulting `.ipa` to TestFlight (see mobile deploy doc).

## Observability

Every request logs a JSON line to `stdout`, which Docker captures. Tail on
the server:

```bash
docker compose --env-file /opt/n2431/.env.production \
  -f /opt/n2431/deploy/docker-compose.prod.yml \
  logs -f --tail 200 api
```

For persistent logs and metrics, add Grafana Cloud free tier — the API is
already OTel-friendly.

## Rollback

Every deploy leaves the previous Docker image tagged. To roll back:

```bash
ssh root@<IP>
docker tag n2431-api:previous n2431-api:latest
docker compose -f /opt/n2431/deploy/docker-compose.prod.yml up -d api
```
