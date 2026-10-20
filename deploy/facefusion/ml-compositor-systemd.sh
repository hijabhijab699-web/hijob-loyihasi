#!/usr/bin/env bash
# ml-compositor-systemd.sh — ml-compositor servisini VPS'ga joylash.
#
# Oldindan: deploy/facefusion/install.sh ishlagan va kod
# /opt/ml-compositor (yoki ML_COMPOSITOR_DIR) ga ko'chirilgan.

set -euo pipefail

ML_DIR="${ML_COMPOSITOR_DIR:-/opt/ml-compositor}"
RUN_USER="${RUN_USER:-mlcomp}"
UNIT_SRC="$(dirname "$(readlink -f "$0")")/ml-compositor.service"

log() { printf "\033[1;34m[systemd]\033[0m %s\n" "$*"; }
err() { printf "\033[1;31m[xato]\033[0m %s\n" "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || err "sudo bilan ishga tushiring"
[[ -d "$ML_DIR/app" ]] || err "$ML_DIR topilmadi. Avval repo'ni $ML_DIR ga joylang."
[[ -f "$UNIT_SRC" ]] || err "ml-compositor.service fayli topilmadi: $UNIT_SRC"

log "venv va dependency'lar"
if [[ ! -x "$ML_DIR/.venv/bin/python" ]]; then
  python3.12 -m venv "$ML_DIR/.venv"
fi
"$ML_DIR/.venv/bin/pip" install --upgrade pip wheel
"$ML_DIR/.venv/bin/pip" install -r "$ML_DIR/requirements.txt" \
  || "$ML_DIR/.venv/bin/pip" install fastapi 'uvicorn[standard]' \
      opencv-python-headless numpy pillow python-multipart mediapipe==0.10.20

chown -R "$RUN_USER:$RUN_USER" "$ML_DIR"

log "systemd unit o'rnatish"
install -m 0644 "$UNIT_SRC" /etc/systemd/system/ml-compositor.service

if [[ ! -f /etc/ml-compositor.env ]]; then
  cat >/etc/ml-compositor.env <<'EOF'
# Qo'shimcha env qiymatlar bu yerga. Masalan:
# DATABASE_URL=postgres://...
# S3_ENDPOINT=https://...
EOF
  chmod 600 /etc/ml-compositor.env
  chown root:"$RUN_USER" /etc/ml-compositor.env
  log "/etc/ml-compositor.env yaratildi (bo'sh — kerakli env'ni to'ldiring)"
fi

systemctl daemon-reload
systemctl enable --now ml-compositor
sleep 2
systemctl --no-pager --lines=20 status ml-compositor || true

cat <<EOF

===========================================================
ml-compositor servisi ishga tushdi.

Loglar:  journalctl -u ml-compositor -f
Restart: sudo systemctl restart ml-compositor
Sinov:   curl -i http://127.0.0.1:5002/health

API serveridan ushbu VPS IP'siga ulanish uchun:
  ML_COMPOSITOR_BASE=http://<vps-ip>:5002
(odatda nginx orqasiga qo'yiladi, deploy/nginx/ ga qarang)
===========================================================
EOF
