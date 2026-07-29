#!/bin/sh
set -eu
cd /app/apps/api

PRISMA_BIN="./node_modules/.bin/prisma"
if [ ! -x "$PRISMA_BIN" ]; then
  PRISMA_BIN="$(node -p "require('path').join(require('path').dirname(require.resolve('prisma/package.json')), 'build/index.js')")"
  echo "Using prisma via node: $PRISMA_BIN"
  node "$PRISMA_BIN" db push --skip-generate --schema=/app/apps/api/prisma/schema.prisma
else
  echo "Using prisma binary: $PRISMA_BIN"
  "$PRISMA_BIN" db push --skip-generate --schema=/app/apps/api/prisma/schema.prisma
fi

echo "Starting JASHUVA GAMES API..."
exec node dist/main.js
