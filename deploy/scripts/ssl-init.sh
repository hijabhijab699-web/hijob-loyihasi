#!/usr/bin/env bash
# Issue the initial Let's Encrypt certificate. Idempotent — safe to re-run.
#
# Prereqs:
#   - DNS A record for ${API_DOMAIN} points at this server
#   - .env.production exists next to docker-compose.prod.yml
#   - ports 80/443 are open (first-time-setup.sh handled that)

set -euo pipefail
cd "$(dirname "$0")/.."
: "${ENV_FILE:=../.env.production}"

if [[ ! -f "$ENV_FILE" ]]; then
    echo "✗ $ENV_FILE not found" >&2
    exit 1
fi

# shellcheck disable=SC1090
set -a && source "$ENV_FILE" && set +a

: "${API_DOMAIN:?not set in $ENV_FILE}"
: "${LETSENCRYPT_EMAIL:?not set in $ENV_FILE}"

COMPOSE="docker compose --env-file $ENV_FILE -f docker-compose.prod.yml"

echo "1. Starting nginx in HTTP-only mode for the ACME challenge…"
# Temporarily replace n2431.conf with a HTTP-only server so nginx can boot
# without the cert files existing yet.
BACKUP="nginx/conf.d/n2431.conf.bak.$(date +%s)"
cp nginx/conf.d/n2431.conf "$BACKUP"
cat >nginx/conf.d/n2431.conf <<EOF
server {
    listen 80;
    server_name ${API_DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 404; }
}
EOF

$COMPOSE up -d nginx

echo "2. Issuing certificate for ${API_DOMAIN}…"
$COMPOSE run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    -d "${API_DOMAIN}" \
    --email "${LETSENCRYPT_EMAIL}" \
    --agree-tos --no-eff-email --non-interactive

echo "3. Restoring the full nginx config with SSL…"
mv "$BACKUP" nginx/conf.d/n2431.conf
$COMPOSE exec nginx nginx -s reload

echo "✔ SSL ready for https://${API_DOMAIN}"
