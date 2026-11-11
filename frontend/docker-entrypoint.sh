#!/bin/sh
set -e

CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/vms.crt" ] || [ ! -f "$CERT_DIR/vms.key" ]; then
  echo "[vms] Membuat sertifikat self-signed (agar kamera/QR scanner aktif di HTTPS)..."
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout "$CERT_DIR/vms.key" -out "$CERT_DIR/vms.crt" \
    -subj "/C=ID/ST=Kepulauan Riau/L=Batam/O=PT Cemindo Gemilang Tbk/CN=vms.local" >/dev/null 2>&1
fi

# Buat symlink /vms agar semua static file (logo.png, icon-512.png, dll) langsung tersedia di subpath /vms/
if [ ! -e /usr/share/nginx/html/vms ]; then
  ln -sfn /usr/share/nginx/html /usr/share/nginx/html/vms 2>/dev/null || true
fi

echo "[vms] Siap. Akses via https://<ip-server> untuk fitur kamera."
