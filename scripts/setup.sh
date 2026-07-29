#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> JASHUVA GAMES setup"
if [[ ! -f .env ]]; then
  cp .env.example .env
  OWNER_PASS=$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)
  if grep -q '^OWNER_PASSWORD=$' .env; then
    sed -i "s/^OWNER_PASSWORD=$/OWNER_PASSWORD=${OWNER_PASS}/" .env
  else
    echo "OWNER_PASSWORD=${OWNER_PASS}" >> .env
  fi
  JWT=$(openssl rand -hex 48)
  JWT_R=$(openssl rand -hex 48)
  COOKIE=$(openssl rand -hex 32)
  sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT}/" .env
  sed -i "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=${JWT_R}/" .env
  sed -i "s/^COOKIE_SECRET=.*/COOKIE_SECRET=${COOKIE}/" .env
  echo "Generated .env with secure OWNER_PASSWORD (also printed below)"
  echo "OWNER_PASSWORD=${OWNER_PASS}"
fi

corepack enable
pnpm install
pnpm --filter @jashuva/shared build

if command -v docker >/dev/null 2>&1; then
  docker compose -f docker/docker-compose.yml up -d postgres redis || true
fi

export $(grep -v '^#' .env | xargs -d '\n' || true)
cd apps/api
pnpm prisma:generate
npx prisma db push || true
cd "$ROOT"
echo "==> Setup complete. Run: pnpm dev"
