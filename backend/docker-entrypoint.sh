#!/bin/sh
set -e

echo "[entrypoint] Menyelaraskan skema database..."
npx prisma db push --skip-generate --accept-data-loss

if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] Menjalankan seed data awal..."
  node prisma/seed.js || echo "[entrypoint] Seed dilewati (kemungkinan data sudah ada)"
fi

echo "[entrypoint] Menjalankan aplikasi..."
exec "$@"
