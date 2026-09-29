#!/usr/bin/env bash
# One-time server setup (Ubuntu 24.04, run as root): nginx + certbot + ufw.
# Usage: bootstrap-nginx.sh [email]   — pass an email to also issue the TLS cert.
set -euo pipefail
DOMAIN=upcloud.danidev.fi
HERE="$(cd "$(dirname "$0")" && pwd)"

apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx ufw rsync

ufw allow 22/tcp && ufw allow 80/tcp && ufw allow 443/tcp
ufw --force enable

mkdir -p /var/www/upcloud
install -m 644 "$HERE/nginx.conf" /etc/nginx/sites-available/upcloud
ln -sf /etc/nginx/sites-available/upcloud /etc/nginx/sites-enabled/upcloud
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

if [ -n "${1:-}" ]; then
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$1" --redirect
  systemctl enable --now certbot.timer
fi
