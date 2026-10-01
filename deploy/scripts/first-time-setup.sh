#!/usr/bin/env bash
# One-shot server bootstrap. Run once per Hetzner VPS.
# Usage (on server as root):
#   curl -fsSL https://raw.githubusercontent.com/<you>/n2431/main/deploy/scripts/first-time-setup.sh | bash
# Or scp then bash.

set -euo pipefail

echo "== N24:31 · Hetzner first-time setup =="

# Non-interactive apt.
export DEBIAN_FRONTEND=noninteractive

echo "1. System packages…"
apt-get update -q
apt-get install -y -q \
    ca-certificates curl gnupg git ufw fail2ban unattended-upgrades

echo "2. Docker Engine…"
if ! command -v docker >/dev/null; then
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    chmod a+r /etc/apt/keyrings/docker.asc
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
        https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -q
    apt-get install -y -q docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable --now docker
fi
docker --version

echo "3. Firewall…"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp comment 'ACME + redirect'
ufw allow 443/tcp comment 'HTTPS'
ufw --force enable

echo "4. Automatic security updates…"
cat >/etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Origins-Pattern {
    "origin=Debian,codename=${distro_codename},label=Debian-Security";
    "origin=Ubuntu,codename=${distro_codename}-security";
};
Unattended-Upgrade::Automatic-Reboot "true";
Unattended-Upgrade::Automatic-Reboot-Time "04:00";
EOF
systemctl enable --now unattended-upgrades

echo "5. Application directory…"
mkdir -p /opt/n2431
chown -R "$(id -u):$(id -g)" /opt/n2431

echo "6. Fail2ban SSH jail…"
cat >/etc/fail2ban/jail.d/sshd.conf <<'EOF'
[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 1h
findtime = 10m
EOF
systemctl enable --now fail2ban

echo
echo "✔ Server ready. Next:"
echo "  1. Point ${API_DOMAIN:-your api DNS} A record to $(hostname -I | awk '{print $1}')"
echo "  2. scp deploy/, docker-compose.prod.yml, .env.production up to /opt/n2431/"
echo "  3. Run scripts/ssl-init.sh once to issue Let's Encrypt certificates"
echo "  4. Run scripts/deploy.sh to bring the stack up"
