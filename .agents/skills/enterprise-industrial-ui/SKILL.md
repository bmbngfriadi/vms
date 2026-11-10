---
name: enterprise-industrial-ui
description: >-
  Standard design system, UI/UX guidelines, component patterns, and styling rules
  for industrial enterprise web applications (free of AI slop, high-density, professional).
  Use whenever creating, redesigning, or styling web user interfaces, dashboards,
  forms, tables, or modals to ensure consistent enterprise aesthetic.
---

# Enterprise Industrial UI/UX Design System

Standar arsitektur antarmuka dan pengalaman pengguna (UI/UX) untuk aplikasi web enterprise industri (pabrik, manufaktur, logistik, corporate internal tools). Menjamin seluruh sistem memiliki konsistensi visual, fungsional, dan bebas dari tampilan kecerdasan buatan murahan ("AI slop").

---

## 1. Prinsip Utama Desain

1. **Anti-AI Slop**:
   - Dilarang menggunakan efek gradien neon/pastel melayang, border radius raksasa (pill/bubble), dan bayangan bercahaya (glowing shadow).
   - Dilarang membuat halaman kosong berjarak besar (low density) hanya demi terlihat "estetik".
   - Utamakan struktur berbasis kotak yang rapi (`rounded-lg` pada card/container, `rounded-md` pada input & button).

2. **Kepadatan Informasi Tinggi (High Density)**:
   - Pengguna industri (operator, security, admin, management) membutuhkan data yang cepat dibaca dalam satu layar tanpa scroll berlebihan.
   - Gunakan tabel padat dengan `th` uppercase 11px, `td` 13px–14px, dan badge status ringkas.

3. **Operasional Lapangan & Mobile-Ready**:
   - Untuk tombol aksi lapangan utama (misal: tombol Scan Barcode, Check-in, Check-out, Validasi), sediakan touch target berukuran besar dan jelas (tinggi minimal 48px–56px) dengan kontras tinggi agar mudah digunakan oleh Security / Petugas Lapangan menggunakan smartphone.

4. **Hierarki Warna Perusahaan**:
   - Background canvas: Slate terang (`bg-slate-100`).
   - Card/Surface: Putih bersih (`bg-white border border-slate-200 shadow-sm`).
   - Warna Utama Brand: Merah bata industrial Cemindo (`#b52025` / `brand-500`).
   - Teks: Slate gelap (`text-slate-900` judul, `text-slate-800` body, `text-slate-500` caption).

---

## 2. Struktur Referensi Detail

Sebelum membuat komponen atau halaman baru, pelajari referensi berikut:

- [Design Tokens & Styling Guidelines](./references/design-tokens.md): Aturan lengkap token warna, konfigurasi Tailwind, CSS base/components, dan palet semantic.
- [Component Patterns](./references/component-patterns.md): Template kode React siap pakai untuk `Shell` (Sidebar & Layout), `StatCard`, `DataTable`, `Modal`, dan `StatusBadge`.

---

## 3. Langkah Implementasi pada Proyek Baru

Ketika menerapkan standar ini pada sistem atau proyek baru:

### Langkah 1: Pasang Tailwind CSS & Lucide Icons
Pastikan proyek frontend memiliki paket pendukung standar:
```bash
npm install lucide-react clsx tailwind-merge
```

### Langkah 2: Terapkan Tailwind Config
Salin konfigurasi palet `brand` dan `fontFamily` ke `tailwind.config.js` sesuai panduan di [design-tokens.md](./references/design-tokens.md).

### Langkah 3: Definisikan Komponen CSS Dasar
Tambahkan layer komponen standar pada file CSS utama (`src/index.css`):
- `.card`: `bg-white border border-slate-200 rounded-lg`
- `.btn-primary`: `btn bg-brand-500 text-white hover:bg-brand-600`
- `.btn-ghost`: `btn bg-white text-slate-700 border border-slate-300 hover:bg-slate-50`
- `.input`: `w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm`
- `.th` & `.td`: Padding tabel padat dan terstruktur.

### Langkah 4: Gunakan Layout Shell
Bungkus seluruh rute aplikasi internal dengan layout `Shell.jsx` (lihat [component-patterns.md](./references/component-patterns.md)) yang mencakup:
- Header brand perusahaan di kiri atas.
- Kartu informasi akun login di bawah navigasi.
- Menu navigasi dengan badge penanda route aktif (warna solid `brand-500` dengan teks putih).
- Responsif: Sidebar permanen di desktop, drawer sliding di perangkat mobile.

### Langkah 5: Standar Form & Modal
- Gunakan `Modal.jsx` untuk setiap aksi edit, tambah data, atau konfirmasi penting.
- Header modal memiliki judul tebal dan tombol close (X).
- Form inputs selalu memiliki label berukuran 12px font semibold (`.label`).
- Footer modal wajib memiliki tombol aksi sekunder (*Batal*) di kiri dan aksi primer (*Simpan/Hapus*) di kanan.

---

## 4. Checklist Kualitas UI

Sebelum menyelesaikan pengerjaan UI pada sistem apapun, lakukan verifikasi:
- [ ] Tidak ada gradien neon / background ungu-pink AI slop.
- [ ] Semua kartu data menggunakan border tipis `border-slate-200` dengan rounded halus (8px).
- [ ] Tombol utama menggunakan `bg-brand-500` atau semantic color yang jelas (`bg-emerald-600` untuk sukses, `bg-red-600` untuk bahaya).
- [ ] Tabel memiliki baris pencarian, header yang jelas, dan indikator status badge.
- [ ] Tampilan nyaman dibuka di layar desktop maupun smartphone operasional.

