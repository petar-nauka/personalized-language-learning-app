#!/usr/bin/env bash
set -euo pipefail

VPS_HOST="${VPS_HOST:-your-vps-host}"
VPS_USER="${VPS_USER:-root}"
REMOTE_DIR="${REMOTE_DIR:-/opt/ezik}"

echo "==> Syncing Ezik PWA to ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR} ..."
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.venv' --exclude 'архив' \
  ./ "${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/"

echo "==> Rebuilding and restarting ezik-web container..."
ssh "${VPS_USER}@${VPS_HOST}" "cd ${REMOTE_DIR}/deploy && docker compose up -d --build"

echo "==> Deployment complete"
