#!/usr/bin/env bash
# Build locally and rsync dist/ to the server.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

DEPLOY_USER="${DEPLOY_USER:-root}"
DEPLOY_HOST="${DEPLOY_HOST:-80.47.227.48}"

npm ci && npm run build

chmod -R u=rwX,go=rX dist
rsync -az --delete --no-owner --no-group dist/ "${DEPLOY_USER}@${DEPLOY_HOST}:/var/www/upcloud/"

echo "Deployed to ${DEPLOY_USER}@${DEPLOY_HOST}:/var/www/upcloud/"
