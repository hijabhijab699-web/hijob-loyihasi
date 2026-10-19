#!/usr/bin/env bash
# install.sh — VPS'da facefusion CLI'ni o'rnatish uchun idempotent skript.
#
# Qo'llanish:
#   sudo bash install.sh
#
# Tekshirilgan: Ubuntu 22.04/24.04 LTS. 4+ vCPU, 8+ GB RAM tavsiya qilinadi.
# Birinchi face swap chaqiruvi ~1-2 GB model fayllarini yuklab oladi.

set -euo pipefail

FACEFUSION_DIR="${FACEFUSION_DIR:-/opt/facefusion}"
FACEFUSION_REPO="${FACEFUSION_REPO:-https://github.com/facefusion/facefusion.git}"
FACEFUSION_REF="${FACEFUSION_REF:-master}"
RUN_USER="${RUN_USER:-mlcomp}"
PY_VERSION="${PY_VERSION:-3.12}"

log() { printf "\033[1;34m[install]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[xato]\033[0m %s\n" "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || err "sudo bilan ishga tushiring: sudo bash $0"

log "APT paketlarini yangilash va dependency o'rnatish"
apt-get update -y
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  git curl ca-certificates build-essential \
  "python${PY_VERSION}" "python${PY_VERSION}-venv" "python${PY_VERSION}-dev" \
  ffmpeg libgl1 libglib2.0-0 libgomp1 libsm6 libxext6

if ! id -u "$RUN_USER" >/dev/null 2>&1; then
  log "Foydalanuvchi $RUN_USER yaratilmoqda"
  useradd --system --create-home --shell /usr/sbin/nologin "$RUN_USER"
fi

log "FaceFusion repo'ni $FACEFUSION_DIR ga klonlash/yangilash"
if [[ -d "$FACEFUSION_DIR/.git" ]]; then
  git -C "$FACEFUSION_DIR" fetch --depth 1 origin "$FACEFUSION_REF"
  git -C "$FACEFUSION_DIR" reset --hard FETCH_HEAD
else
  mkdir -p "$FACEFUSION_DIR"
  git clone --depth 1 --branch "$FACEFUSION_REF" "$FACEFUSION_REPO" "$FACEFUSION_DIR"
fi

log "Python $PY_VERSION venv yaratilmoqda"
if [[ ! -x "$FACEFUSION_DIR/.venv/bin/python" ]]; then
  "python${PY_VERSION}" -m venv "$FACEFUSION_DIR/.venv"
fi

log "FaceFusion dependency'larini pip bilan o'rnatish (~2-3 daq)"
"$FACEFUSION_DIR/.venv/bin/pip" install --upgrade pip wheel
# CPU-only build: GPU bo'lsa alohida onnxruntime-gpu o'rnating.
"$FACEFUSION_DIR/.venv/bin/pip" install \
  onnxruntime \
  numpy opencv-python-headless pillow \
  "insightface>=0.7.3" \
  gradio-rangeslider \
  tqdm psutil

if [[ -f "$FACEFUSION_DIR/requirements.txt" ]]; then
  "$FACEFUSION_DIR/.venv/bin/pip" install -r "$FACEFUSION_DIR/requirements.txt"
fi

log "Dastlabki model fayllarini yuklab olish uchun smoke-test"
if "$FACEFUSION_DIR/.venv/bin/python" "$FACEFUSION_DIR/facefusion.py" --help \
   >/dev/null 2>&1; then
  log "CLI javob beryapti ✓"
else
  err "FaceFusion CLI javob bermayapti. requirements.txt'ni qo'lda ko'rib chiqing: $FACEFUSION_DIR"
fi

log "Papka egaligini $RUN_USER:$RUN_USER ga o'tkazish"
chown -R "$RUN_USER:$RUN_USER" "$FACEFUSION_DIR"

cat <<EOF

===========================================================
FaceFusion o'rnatildi:
  Papka : $FACEFUSION_DIR
  Python: $FACEFUSION_DIR/.venv/bin/python
  User  : $RUN_USER

ml-compositor serviceda env sozlang (systemd unit yoki .env'da):
  FACEFUSION_DIR=$FACEFUSION_DIR
  FACEFUSION_PY=$FACEFUSION_DIR/.venv/bin/python
  FACEFUSION_TIMEOUT_S=240

Keyingi qadam:
  bash $(dirname "$0")/ml-compositor-systemd.sh
===========================================================
EOF
