#!/usr/bin/env bash
# One-time (idempotent) server setup for Ubuntu 24.04. Run as root.
# Usage: scp deploy/Caddyfile deploy/bootstrap.sh root@HOST:/tmp/ && ssh root@HOST 'bash /tmp/bootstrap.sh'
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CADDYFILE_SRC="${CADDYFILE_SRC:-$SCRIPT_DIR/Caddyfile}"
WEB_ROOT=/var/www/upcloud

if [[ $EUID -ne 0 ]]; then
  echo "Run as root." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# --- Caddy from the official apt repo ---
if ! command -v caddy >/dev/null 2>&1; then
  apt-get update
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  if [[ ! -f /usr/share/keyrings/caddy-stable-archive-keyring.gpg ]]; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
      | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  fi
  if [[ ! -f /etc/apt/sources.list.d/caddy-stable.list ]]; then
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
      > /etc/apt/sources.list.d/caddy-stable.list
  fi
  chmod o+r /usr/share/keyrings/caddy-stable-archive-keyring.gpg /etc/apt/sources.list.d/caddy-stable.list
  apt-get update
  apt-get install -y caddy
fi

# --- Firewall ---
if ! command -v ufw >/dev/null 2>&1; then
  apt-get install -y ufw
fi
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp   # HTTP/3
ufw --force enable

# --- Web root ---
mkdir -p "$WEB_ROOT"
chown -R caddy:caddy "$WEB_ROOT" 2>/dev/null || true
chmod 755 "$WEB_ROOT"

# --- Caddyfile ---
if [[ -f "$CADDYFILE_SRC" ]]; then
  install -m 644 "$CADDYFILE_SRC" /etc/caddy/Caddyfile
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
else
  echo "Warning: $CADDYFILE_SRC not found; leaving /etc/caddy/Caddyfile unchanged." >&2
fi

systemctl enable caddy >/dev/null
if systemctl is-active --quiet caddy; then
  systemctl reload caddy
else
  systemctl start caddy
fi

echo "Bootstrap complete. Web root: $WEB_ROOT"
