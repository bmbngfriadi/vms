#!/bin/sh
set -e

echo "Waiting for PostgreSQL database to be ready..."
until npx prisma db push --skip-generate --accept-data-loss; do
  echo "Database is unavailable - sleeping 2 seconds..."
  sleep 2
done

echo "Generating Prisma Client..."
npx prisma generate

echo "Seeding initial database (PT Cemindo Gemilang Tbk - Plant Batam)..."
node prisma/seed.js || true

echo "Starting VMS Backend API Server..."
exec "$@"
