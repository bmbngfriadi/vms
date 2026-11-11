#!/bin/sh
set -e

echo "[entrypoint] Menunggu database PostgreSQL siap..."
node -e "
const net = require('net');
const url = new URL(process.env.DATABASE_URL || 'postgresql://vms_user:vms@postgres:5432/vms_batam');
const host = url.hostname || 'postgres';
const port = parseInt(url.port || '5432', 10);

let attempts = 0;
const maxAttempts = 30;

function tryConnect() {
  attempts++;
  const client = new net.Socket();
  client.setTimeout(2000);

  client.connect(port, host, () => {
    console.log('[entrypoint] Terhubung ke PostgreSQL (' + host + ':' + port + ')');
    client.destroy();
    process.exit(0);
  });

  client.on('error', (err) => {
    client.destroy();
    if (attempts >= maxAttempts) {
      console.error('[entrypoint] Gagal terhubung ke database setelah ' + attempts + ' percobaan:', err.message);
      process.exit(1);
    }
    setTimeout(tryConnect, 1500);
  });

  client.on('timeout', () => {
    client.destroy();
    if (attempts >= maxAttempts) {
      process.exit(1);
    }
    setTimeout(tryConnect, 1500);
  });
}

tryConnect();
"

echo "[entrypoint] Menyelaraskan skema database..."
npx prisma db push --skip-generate --accept-data-loss

if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] Menjalankan seed data awal..."
  node prisma/seed.js || echo "[entrypoint] Seed dilewati (kemungkinan data sudah ada)"
fi

echo "[entrypoint] Menjalankan aplikasi..."
exec "$@"
