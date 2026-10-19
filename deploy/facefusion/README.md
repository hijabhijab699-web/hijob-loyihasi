# FaceFusion VPS deploy

ml-compositor servisi face swap uchun FaceFusion CLI'ni subprocess
sifatida chaqiradi (`services/ml-compositor/app/services/facefusion.py`).
Production VPS'da u o'rnatilgan va `FACEFUSION_DIR` env to'g'ri
yo'nalganida ishlaydi; aks holda API `facefusion failed, falling back
to InsightFace` warning beradi va past sifatli natijaga tushadi.

Bu papka ikki marshrutni qamrab oladi:

| Variant | Qachon | Nimada ishlaydi |
|---|---|---|
| **Docker** (`Dockerfile`) | Yangi VPS, docker-compose ishlatasiz | Hamma narsa bitta imageda, oson redeploy |
| **Bare metal** (`install.sh` + systemd) | Mavjud VPS, docker yo'q | `/opt/facefusion` ga klonlanadi, systemd unit boshqaradi |

Boshida 2000 foydalanuvchi uchun **Hetzner CCX33** (8 vCPU, 32 GB, €35/oy)
yetarli. Face swap faqat ro'yxatdan o'tganda bir marta ishlaydi (background
worker), peakda 5-10 bir vaqtda bo'lsa ham VPS uddalaydi.

---

## 1-variant: Docker (tavsiya)

```bash
# VPS'da (Ubuntu 22.04/24.04):
curl -fsSL https://get.docker.com | sh
sudo apt install -y docker-compose-plugin

# Repo'ni klonlang
git clone https://github.com/umidjon-devvloper/hijob-loyihasi.git /opt/hijob
cd /opt/hijob

# Image'ni build qiling (~5-10 daq, ~3 GB)
sudo docker build -f deploy/facefusion/Dockerfile -t hijob/ml-compositor:ff .

# Env fayli
sudo cp deploy/facefusion/env.example /etc/ml-compositor.env
sudo nano /etc/ml-compositor.env   # DATABASE_URL va boshqalarni to'ldiring

# Ishga tushiring
sudo docker run -d --name ml-compositor --restart=always \
  -p 5002:5002 \
  --env-file /etc/ml-compositor.env \
  -v /opt/facefusion-models:/root/.facefusion \
  hijob/ml-compositor:ff
```

Model fayllari (~1-2 GB) birinchi face swap chaqirig'ida avtomatik
yuklanadi va `-v` volume orqali qayta ishga tushishdan omon qoladi.

Loglar: `sudo docker logs -f ml-compositor`

---

## 2-variant: Bare metal (systemd)

```bash
# VPS'da (root):
cd /opt/hijob      # repo

# 1) FaceFusion CLI'ni o'rnating
sudo bash deploy/facefusion/install.sh
# ⤷ /opt/facefusion ga klonlaydi va venv tayyorlaydi

# 2) ml-compositor kodini joylang
sudo mkdir -p /opt/ml-compositor
sudo cp -r services/ml-compositor/* /opt/ml-compositor/
sudo chown -R mlcomp:mlcomp /opt/ml-compositor

# 3) systemd servicega qo'ying
sudo bash deploy/facefusion/ml-compositor-systemd.sh
```

Keyin:

```bash
# Env'ni to'ldiring
sudo nano /etc/ml-compositor.env

# Restart
sudo systemctl restart ml-compositor

# Loglar
sudo journalctl -u ml-compositor -f

# Sinov
curl -i http://127.0.0.1:5002/health
```

---

## API serveri bilan ulash

`services/api/.env` (yoki prod env'da):

```
ML_COMPOSITOR_BASE=http://<vps-ip>:5002
# yoki nginx orqasida: https://ml.hijob.uz
```

Backend `ml-compositor.client.ts` ushbu URL'ga `POST /compose/facefusion`
yuboradi. User ro'yxatdan o'tganda, `UserFaceRendersWorker` har variant
uchun bitta chaqiruv qiladi va natijani `UserFaceRender` jadvaliga
saqlaydi.

---

## Nima qanday ishlaydi

```
Mobile ilova
   ↓  (ro'yxatdan o'tishda bir marta)
POST /tryon/prepare  →  Nest API
                           ↓  (background queue)
                      UserFaceRendersWorker
                           ↓  (har variant uchun)
                      POST ML_COMPOSITOR_BASE/compose/facefusion
                           ↓
                      ml-compositor (FastAPI)
                           ↓  (subprocess)
                      /opt/facefusion/.venv/bin/python
                      /opt/facefusion/facefusion.py headless-run
                           ↓
                      jpeg qaytadi
                           ↓
                      storage'ga saqlash
                           ↓
                      UserFaceRender.url ga URL yoziladi
```

Keyin mobile ilova faqat `GET /tryon/my-renders` chaqiradi va tayyor
URL'larni oladi — qayta face swap chaqiruvi yo'q.

---

## Resurs sarfi

| Hajm | 1 foydalanuvchi | 2000 foydalanuvchi |
|---|---|---|
| Face swap chaqiruvi | 1 marta × N variant | 2000 × N variant (background) |
| Diskda rasm | ~200 KB × N | ~400 MB / 1 variant / 2k user |
| CPU vaqt (bir swap) | ~15-25 s (CCX33) | queue — sekin, lekin idemp |

Model fayllari `~/.facefusion/models/` da keshlanadi (~1-2 GB).

---

## Diagnostika

| Simptom | Ehtimoliy sabab | Yechim |
|---|---|---|
| `FACEFUSION_FAILED` loglarda | CLI topilmadi | `FACEFUSION_DIR` env'ni tekshiring, `install.sh` qayta |
| `NO_MANNEQUIN_FACE` 422 | Mannequin rasmida yuz yo'q | OK — fallback coverUrl ko'rsatiladi |
| Birinchi so'rov 2-3 daqiqa | Model fayllari yuklanmoqda | Keyingi chaqiruv ~5 s bo'ladi |
| OOM / qulash | 8 GB RAM yetmayapti | Swap qo'shing yoki CCX33+ ga chiqing |
| 50% past sifat | Fallback InsightFace ishlagan | FaceFusion ishlamayapti — loglarni tekshiring |

---

## Yangilash

```bash
# Docker:
cd /opt/hijob && git pull
sudo docker build -f deploy/facefusion/Dockerfile -t hijob/ml-compositor:ff .
sudo docker restart ml-compositor

# Bare metal:
cd /opt/hijob && git pull
sudo cp -r services/ml-compositor/* /opt/ml-compositor/
sudo systemctl restart ml-compositor
```

FaceFusion CLI'ni alohida yangilash:

```bash
sudo -u mlcomp git -C /opt/facefusion pull
sudo systemctl restart ml-compositor
```
