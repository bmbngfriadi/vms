# Visitor Management System (VMS)

**PT Cemindo Gemilang Tbk — Plant Batam**

Sistem pendataan tamu berbasis barcode untuk kawasan pabrik. Tamu mendaftar sendiri atau
didaftarkan oleh PIC, menerima barcode, dan Security memvalidasi masuk/keluar dengan kamera HP.
Setiap transisi check-in dan check-out mengirim notifikasi WhatsApp ke tamu, PIC, dan management.

---

## 1. Alur Sistem

### A. Tamu tanpa janji (Walk-In)

```
Tamu tiba di gerbang
   │  scan QR gerbang / buka /register
   ▼
Isi formulir: nama, no. WhatsApp, perusahaan, departemen (dropdown), PIC (isi manual), keperluan
   │  submit
   ▼
Sistem membuat kunjungan (status: MENUNGGU VALIDASI) + barcode CHECK-IN
   │
   ├─► Barcode tampil di HP tamu (/pass/<token>)
   └─► Barcode + tautan dikirim ke WhatsApp tamu
   ▼
Security scan barcode tamu dengan kamera HP
   │
   ▼
Security konfirmasi ke PIC, lalu memilih nama PIC di sistem (PIC sudah punya no. WhatsApp)
   │  tombol "Validasi & Check-In"
   ▼
Status: DI DALAM
   ├─► WhatsApp ke TAMU   : barcode baru untuk CHECK-OUT
   ├─► WhatsApp ke PIC    : "tamu Anda telah tiba"
   └─► WhatsApp ke MGMT   : laporan tamu masuk
   ▼
Saat pulang: tamu menunjukkan barcode check-out → Security scan → "Konfirmasi Check-Out"
   ▼
Status: SELESAI
   ├─► WhatsApp ke TAMU   : konfirmasi keluar + durasi
   ├─► WhatsApp ke PIC    : tamu telah keluar
   └─► WhatsApp ke MGMT   : laporan tamu keluar
```

### B. Tamu dengan janji (Pre-Registered)

```
PIC login → menu Data Kunjungan → "Buat Janji Temu"
   │  isi data tamu + tanggal + keperluan
   ▼
Sistem membuat kunjungan (status: TERJADWAL) + barcode CHECK-IN
   │
   └─► Barcode + undangan dikirim ke WhatsApp tamu
   ▼
Tamu tiba → tunjukkan barcode → Security scan → validasi → Check-In
   ▼
(alur selanjutnya sama dengan Walk-In)
```

### Aturan barcode

| Aturan | Keterangan |
| :--- | :--- |
| Satu barcode satu fungsi | Barcode check-in tidak bisa dipakai untuk check-out |
| Sekali pakai | Setelah dipakai, barcode ditandai `is_used` dan ditolak bila dipindai ulang |
| Barcode baru saat masuk | Check-in otomatis menerbitkan barcode check-out |
| Akses pass lewat token acak | URL pass memakai token 32 karakter, bukan nomor kunjungan yang bisa ditebak |

---

## 2. Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| Frontend | React 18, Vite 5, Tailwind CSS 3, React Router 6, Axios, html5-qrcode (kamera HP) |
| Backend | Node.js 20, Express 4, Prisma 5, JWT, bcrypt |
| Database | PostgreSQL 15 (Docker, tidak diekspos ke host) |
| WhatsApp | `@whiskeysockets/baileys` — terpasang langsung di backend, tanpa gateway pihak ketiga |
| Reverse proxy | Nginx (serve SPA + proxy `/api`) |
| Kontainer | Docker Compose — **3 service**: `postgres`, `backend`, `app` |

Tidak ada Redis, tidak ada worker terpisah, tidak ada message broker. Antrian notifikasi berjalan
in-process dengan retry otomatis dan pencatatan ke tabel `notification_logs`.

---

## 3. Struktur Proyek

```
vms/
├── docker-compose.yml
├── .env                        # konfigurasi (jangan di-commit)
├── backend/
│   ├── Dockerfile
│   ├── docker-entrypoint.sh    # prisma db push + seed
│   ├── prisma/
│   │   ├── schema.prisma       # 8 tabel
│   │   └── seed.js
│   └── src/
│       ├── index.js            # bootstrap express
│       ├── db.js
│       ├── middleware/auth.js  # JWT + role gate
│       ├── routes/
│       │   ├── auth.js         # login, me
│       │   ├── master.js       # departemen, PIC, user
│       │   ├── visits.js       # inti: register, scan, check-in/out
│       │   └── wa.js           # status gateway, penerima management, log
│       └── wa/
│           ├── client.js       # socket Baileys + auto reconnect
│           ├── messages.js     # 8 template pesan
│           └── notify.js       # antrian + retry + log DB
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   ├── Register.jsx    # form tamu (publik)
        │   ├── Pass.jsx        # halaman barcode tamu (publik)
        │   ├── Scan.jsx        # kamera security
        │   ├── Dashboard.jsx
        │   ├── Visits.jsx
        │   ├── Reports.jsx
        │   ├── Master.jsx
        │   └── WhatsApp.jsx
        ├── components/
        └── lib/
```

---

## 4. Model Data (8 tabel)

| Tabel | Fungsi |
| :--- | :--- |
| `departments` | Master departemen tujuan |
| `users` | Akun internal: ADMIN, SECURITY, PIC, MANAGEMENT (PIC wajib punya nomor WhatsApp) |
| `visitors` | Profil identitas tamu (dipisah dari transaksi agar riwayat tetap utuh) |
| `visits` | Transaksi kunjungan: tipe, status, PIC, jadwal, badge, kendaraan, waktu masuk/keluar |
| `qr_tokens` | Barcode: token unik, tipe CHECK_IN / CHECK_OUT, status pakai |
| `notification_logs` | Audit setiap pengiriman WhatsApp (status, error, jumlah percobaan) |
| `management_recipients` | Nomor WhatsApp pimpinan penerima laporan otomatis |
| `settings` | Konfigurasi umum |

### Status kunjungan

`WAITING_VALIDATION` → `CHECKED_IN` → `CHECKED_OUT`
Cabang: `APPROVED` (janji temu terjadwal), `REJECTED` (ditolak security), `CANCELLED` (dibatalkan PIC).

---

## 5. Hak Akses

| Role | Kemampuan |
| :--- | :--- |
| **ADMIN** | Semua fitur: master data, WhatsApp, laporan, scan, buat janji temu untuk PIC mana pun |
| **SECURITY** | Scan barcode, validasi check-in/out, tolak tamu, lihat data & laporan |
| **PIC** | Buat janji temu untuk tamunya sendiri, lihat kunjungannya, batalkan janji |
| **MANAGEMENT** | Dashboard, data kunjungan (read-only), laporan, log WhatsApp |

PIC hanya melihat kunjungan miliknya. Nomor WhatsApp & NIK tamu hanya terlihat oleh ADMIN dan SECURITY.

---

## 6. Menjalankan Sistem

### Prasyarat
Docker Desktop / Docker Engine + Docker Compose.

### Langkah

```bash
cd vms
cp .env.example .env      # lalu edit nilainya
docker compose up -d --build
```

Akses:

| Halaman | URL |
| :--- | :--- |
| Aplikasi internal | `http://localhost` |
| Form tamu (publik) | `http://localhost/register` |
| Halaman barcode tamu | `http://localhost/pass/<token>` |
| Health check API | `http://localhost/api/health` |

### Wajib diubah di `.env`

```env
POSTGRES_PASSWORD=...          # password database
JWT_SECRET=...                 # minimal 24 karakter, acak
PUBLIC_APP_URL=https://...     # alamat yang bisa dibuka dari HP tamu
```

> `PUBLIC_APP_URL` dipakai untuk menyusun tautan barcode di pesan WhatsApp. Kalau diisi
> `localhost`, tautan tidak akan bisa dibuka dari HP tamu. Isi dengan IP server atau domain.

### Akun awal

| Role | Email | Password |
| :--- | :--- | :--- |
| Administrator | `admin@cemindo.com` | `admin123` |
| Security | `security.agus@cemindo.com` | `security123` |
| Security | `security.bambang@cemindo.com` | `security123` |
| PIC Production | `pic.production@cemindo.com` | `pic123` |
| PIC IT | `pic.it@cemindo.com` | `pic123` |
| PIC HRGA | `pic.hrga@cemindo.com` | `pic123` |
| PIC SHE | `pic.she@cemindo.com` | `pic123` |
| PIC Logistic | `pic.logistic@cemindo.com` | `pic123` |
| Management | `management@cemindo.com` | `management123` |

**Ganti seluruh password default sebelum sistem dipakai produksi.**

---

## 7. Menghubungkan WhatsApp

1. Login sebagai ADMIN → menu **WhatsApp**.
2. Tunggu QR muncul di panel Status Koneksi (biasanya < 20 detik).
3. Di HP yang akan menjadi gateway: **WhatsApp → Pengaturan → Perangkat Tertaut → Tautkan Perangkat**.
4. Scan QR di layar.
5. Status berubah menjadi **Terhubung** dan nomor perangkat tampil.

Sesi tersimpan di volume `vms_wa_auth`, jadi tetap tersambung setelah container restart.
Gunakan tombol **Kirim Pesan Uji** untuk memverifikasi pengiriman.

> Gunakan nomor khusus (bukan nomor pribadi) untuk gateway. Satu nomor hanya boleh tertaut ke satu sesi.

---

## 8. Catatan Kamera & HTTPS

Browser hanya mengizinkan akses kamera pada **HTTPS** atau `localhost`. Karena Security memakai
kamera HP, aplikasi sudah menyediakan port **443 dengan sertifikat self-signed** yang dibuat
otomatis saat container pertama kali jalan.

- Akses lewat `https://<ip-server>` → browser menampilkan peringatan sertifikat → pilih
  **Advanced → Proceed** (sekali saja per perangkat).
- Untuk produksi, ganti dengan sertifikat resmi (Let's Encrypt) dengan menaruh `vms.crt` dan
  `vms.key` di volume `/etc/nginx/certs`.
- Bila kamera tetap tidak bisa diakses, halaman Scan menyediakan **input kode manual** sebagai
  cadangan.

---

## 9. Pengujian

Tersedia smoke test end-to-end yang menguji seluruh alur lewat HTTP API:

```bash
node scripts/smoke-test.mjs
```

Mencakup: login & otorisasi role, registrasi walk-in, penerbitan barcode, scan, check-in
(termasuk penolakan check-in ganda), check-out, alur janji temu, penolakan tamu, dashboard,
export CSV, dan pemastian seluruh jenis notifikasi terpicu. Hasil yang diharapkan: **60 lulus, 0 gagal**.

> Catatan: pada lingkungan yang memblokir `github.com`, dependensi `libsignal` milik Baileys
> diarahkan ke paket npm resmi lewat blok `overrides` di `backend/package.json`. Jangan hapus
> blok tersebut.

---

## 10. Operasional

```bash
# Lihat log
docker compose logs -f backend

# Restart
docker compose restart backend

# Backup database
docker exec vms-postgres pg_dump -U vms_user -d vms_batam > backup_$(date +%F).sql

# Restore
cat backup_2026-11-06.sql | docker exec -i vms-postgres psql -U vms_user -d vms_batam

# Backup sesi WhatsApp
docker run --rm -v vms_vms_wa_auth:/data -v "$PWD":/backup alpine tar czf /backup/wa_auth.tar.gz -C /data .
```

---

## 11. Pemecahan Masalah

| Gejala | Penyebab & solusi |
| :--- | :--- |
| QR WhatsApp tidak muncul | Cek `docker compose logs backend`. Pastikan container punya akses internet. Coba tombol **Hubungkan** |
| Pesan gagal terkirim | Buka menu WhatsApp → Riwayat Pengiriman, lihat kolom Keterangan. Pastikan status **Terhubung** |
| Tautan barcode di WA tidak bisa dibuka | `PUBLIC_APP_URL` masih `localhost`. Isi dengan IP/domain server lalu `docker compose up -d` |
| Kamera tidak aktif | Halaman harus dibuka via HTTPS (bukan HTTP) dan izin kamera diberikan |
| Login gagal setelah ganti `.env` | `JWT_SECRET` berubah → semua token lama tidak valid. Login ulang |
| Data hilang setelah `docker compose down -v` | Perintah `-v` menghapus volume. Gunakan `docker compose down` tanpa `-v` |
