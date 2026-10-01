#!/usr/bin/env bash
# Full deploy: rsync repo up, rebuild, migrate, restart.
#
# Usage (from your Mac):
#   deploy/scripts/deploy.sh root@<host>
#
# The remote must have already been through first-time-setup.sh and ssl-init.sh.

set -euo pipefail

REMOTE="${1:?usage: deploy.sh user@host}"
REMOTE_DIR="${REMOTE_DIR:-/opt/n2431}"
LOCAL_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "== N24:31 · deploy to ${REMOTE}:${REMOTE_DIR} =="

echo "1. Syncing repo (excluding node_modules, build artifacts, secrets)…"
rsync -avz --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'apps/mobile/ios/Pods' \
    --exclude 'apps/mobile/ios/build' \
    --exclude 'apps/mobile/android/build' \
    --exclude 'apps/mobile/android/.gradle' \
    --exclude '**/dist' \
    --exclude '**/.turbo' \
    --exclude '**/.next' \
    --exclude '**/__pycache__' \
    --exclude '.venv' \
    --exclude 'services/*/uploads' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude '**/.expo' \
    --exclude 'services/ml-*/models' \
    "${LOCAL_ROOT}/" "${REMOTE}:${REMOTE_DIR}/"

echo "2. Building images + starting stack…"
ssh "${REMOTE}" bash -s <<'REMOTE_SCRIPT'
set -euo pipefail
cd /opt/n2431/deploy
if [[ ! -f ../.env.production ]]; then
    echo "✗ /opt/n2431/.env.production missing. Copy .env.production.example, fill in, then rerun." >&2
    exit 1
fi
COMPOSE="docker compose --env-file ../.env.production -f docker-compose.prod.yml"
$COMPOSE build --parallel
# `up -d --remove-orphans` handles the first bring-up and subsequent rolling restart.
$COMPOSE up -d --remove-orphans
sleep 4
$COMPOSE ps
REMOTE_SCRIPT

echo "3. Waiting for API health…"
DOMAIN="$(ssh "${REMOTE}" 'grep ^API_DOMAIN /opt/n2431/.env.production | cut -d= -f2')"
for i in $(seq 1 30); do
    if curl -fsS "https://${DOMAIN}/api/v1/health" >/dev/null 2>&1; then
        echo "✔ API responding at https://${DOMAIN}/api/v1"
        exit 0
    fi
    sleep 2
done

echo "✗ API not responding after 60s. Check: ssh ${REMOTE} 'docker compose -f /opt/n2431/deploy/docker-compose.prod.yml logs api'" >&2
exit 1
