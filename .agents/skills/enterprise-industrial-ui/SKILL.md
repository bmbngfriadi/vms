---
name: enterprise-industrial-ui
description: >-
  Standard design system, UI/UX guidelines, component patterns, and styling rules
  for industrial enterprise web applications (free of AI slop, high-density, professional).
  Includes full specifications for both Desktop and Native Mobile Layouts (Bottom Bar,
  Native Bottom Sheet, Floating Action Buttons, and Mobile Data Cards).
---

# Enterprise Industrial UI/UX Design System (v2.5)

Standar arsitektur antarmuka dan pengalaman pengguna (UI/UX) untuk aplikasi web & mobile enterprise industri (pabrik, manufaktur, logistik, corporate internal tools, dan visitor management). 

Menjamin seluruh sistem perusahaan memiliki konsistensi visual, fungsional, adaptif terhadap mode gelap/terang (Dark & Light Mode), dwibahasa (i18n), bebas dari tampilan AI murahan (*anti-AI slop*), serta memberikan **pengalaman aplikasi mobile native (100% Native Mobile App Style)** di perangkat smartphone.

---

## 1. Prinsip Utama Desain & Layout

1. **Anti-AI Slop & Presisi Industri**:
   - Dilarang keras menggunakan efek gradien neon/pastel melayang, border radius raksasa (pill/bubble berlebihan), dan bayangan bercahaya (*glowing shadow*).
   - Dilarang membuat halaman kosong berjarak besar (*low density*) hanya demi terlihat "estetik".
   - Utamakan struktur berbasis kotak yang presisi dan tegas (`rounded-xl` pada card/container, `rounded-xl` pada input & button, border tipis `border-slate-200` / `dark:border-slate-800`).

2. **Dua Mode Tampilan: Desktop High-Density & Mobile Native App**:
   - **Pada Desktop (`≥ lg` / `≥ 1024px`)**:
     - Sidebar tetap (*fixed sidebar*) selebar 256px (`w-64`) dengan logo perusahaan, info user, dan menu vertikal.
     - Tabel data padat (*high-density data tables*) dengan `th` uppercase 11px, `td` 13px–14px, pagination, dan filter terintegrasi.
   - **Pada Mobile (`< lg` / `< 1024px`)**:
     - **Tanpa Sidebar Drawer Samping**: Drawer slider samping dihilangkan sepenuhnya agar tidak menghambat operasional smartphone.
     - **Enlarged Top Bar (`h-16` / 64px)**: Header atas lega dengan logo perusahaan, teks brand `PT Cemindo Gemilang Tbk`, tombol toggle bahasa (`ID/EN`), mode terang/gelap, dan avatar profil.
     - **Enlarged Bottom Navigation Bar (`h-[68px]`) dengan 5 Slot & Center Floating Action Dock**:
       1. Slot 1: **Home** (Dashboard)
       2. Slot 2: **Kunjungan** / Operasional Utama
       3. Slot 3: **CENTER FLOATING ACTION DOCK**: Tombol aksi utama (misal: Scan Barcode, Transaksi Baru) melayang di tengah bar (`-mt-6 sm:-mt-7`, `w-14 h-14 sm:w-15 sm:h-15`, `bg-gradient-to-tr from-brand-600 via-brand-500 to-rose-500`, shadow tebal, cincin pelindung `ring-4 ring-white dark:ring-slate-900`, ikon besar `size={28}`).
       4. Slot 4: **Laporan** / Arsip
       5. Slot 5: **Menu** (Membuka Native Bottom Sheet Modal)
     - **Halaman Profil Pengguna**: Diposisikan di dalam Bottom Sheet Menu agar 5 slot navigasi di Bottom Bar tetap seimbang dan lapang.
     - **Native Bottom Sheet**: Menu sekunder dan administratif (Profil Saya, Master Data, Gateway, Fitur, Logout) dibuka melalui modal sheet yang meluncur halus dari bawah layar smartphone.
     - **Semua Data List Menggunakan Card Layout di Mobile (`< md`)**: Dilarang menggunakan scroll horizontal tabel yang sempit di HP. Semua tabel wajib otomatis berubah menjadi deretan kartu data (*Card List*) terstruktur.

3. **Tombol Sentuh Ramah Jempol (Ergonomic Touch Targets) & iOS Input Safeguard**:
   - Seluruh tombol memiliki tinggi sentuhan minimal `min-h-[42px]` hingga `48px` di mobile dengan sudut `rounded-xl`, padding lega, dan efek tekan `active:scale-[0.98]`.
   - **iOS Safari Safeguard**: Khusus input `type="date"` dan `type="time"`, wajib menggunakan `w-full min-w-0 max-w-full appearance-none -webkit-appearance: none; box-sizing: border-box;` agar lebar kolom tidak melar (*offside*) di iPhone.

4. **Hierarki Warna Perusahaan & Adaptasi Penuh Dark/Light Mode**:
   - **Light Mode**: Canvas `bg-slate-100`, Surface Card `bg-white border-slate-200`, Teks `text-slate-900` (judul), `text-slate-700` (body), `text-slate-500` (caption).
   - **Dark Mode**: Canvas `bg-slate-950`, Surface Card `bg-slate-900 border-slate-800`, Teks `text-white` (judul), `text-slate-200` (body), `text-slate-400` (caption).
   - **Brand Color**: Merah Bata Korporat Cemindo (`#b52025` / `brand-500` hover `brand-600`), aksen rose dan emerald.
   - **Nama PT Baku**: `PT Cemindo Gemilang Tbk` (Plant Batam atau unit operasional terkait).

5. **Smart Returning User / Auto-Lookup & OCR**:
   - Sistem publik melakukan pencarian otomatis (*debounced lookup*) berdasarkan Nama Lengkap + Nomor WhatsApp/Telepon.
   - Jika pengguna sudah pernah terdaftar, sistem langsung menampilkan **Kartu Status Terverifikasi** dengan thumbnail foto KTP, tombol zoom pratinjau, dan opsi foto ulang. Data identitas otomatis digunakan kembali tanpa perlu foto manual lagi.
   - Jika nama atau nomor telepon berbeda/baru, sistem wajib mewajibkan pengambilan/pengunggahan foto identitas fisik baru secara ketat di frontend dan backend.

6. **Standar Notifikasi WhatsApp & Pesan Operasional**:
   - Header baku: emoji pabrik 🏭 `*PT CEMINDO GEMILANG Tbk*`, pin lokasi 📍 `*Plant Batam — <Nama Sistem>*`.
   - Garis pemisah monospaced aman mobile: **tepat 17 karakter `─────────────────`** (mencegah teks wrapping/offside di layar smartphone).
   - Indikator status emoji: 🟢 untuk Masuk / Datang / Aktif, 🔴 untuk Keluar / Selesai / Arsip, 📅 untuk Undangan Resmi.
   - Nama pos lokasi seragam: `POS 1`.
   - Footer baku di setiap pesan: `_Pesan Otomatis, <Nama Sistem>_`.

7. **Standar Keamanan Gate Tanpa Bypass (No-Bypass Validation)**:
   - Petugas Security/Gate dapat langsung memindai barcode menggunakan open camera smartphone tanpa perlu login ke sistem.
   - Alur scan ketat 2 fase: Barcode Check-In hanya valid untuk masuk. Setelah masuk, sistem menghasilkan Barcode Check-Out terpisah untuk proses keluar.

8. **Arsitektur Translasi Otomatis (i18n)**:
   - Dukungan penuh Bahasa Indonesia (`ID`) dan English (`EN`).
   - Seluruh teks, label input, placeholder, opsi select, badge status, alert box, pesan konfirmasi, hingga halaman publik wajib dibungkus dengan hook translasi `t(key, fallback)`.

---

## 2. Struktur Referensi Detail

Sebelum membuat komponen atau halaman baru pada proyek apapun, rujuk dokumen berikut:

- [Design Tokens & Styling Guidelines](./references/design-tokens.md): Token warna lengkap, palet semantic, konfigurasi Tailwind, dan layer komponen CSS dasar (`index.css`).
- [Component Patterns](./references/component-patterns.md): Template kode React siap pakai untuk `Shell.jsx` (Desktop & Mobile), `StatCard`, `DataTable`, `Modal`, `StatusBadge`, dan formulir pendaftaran.
- [Mobile Native Layout & Card List Patterns](./references/mobile-native-layout.md): Pola spesifik Native Mobile App (Enlarged Topbar, Bottom Navigation Bar, Native Bottom Sheet, FAB, dan Card List).

---

## 3. Langkah Menerapkan Standar pada Proyek Baru

### Langkah 1: Pasang Paket Dependensi
```bash
npm install lucide-react clsx tailwind-merge
```

### Langkah 2: Salin Konfigurasi Tailwind (`tailwind.config.js`)
Gunakan konfigurasi warna brand korporat dan font sans sesuai panduan di [design-tokens.md](./references/design-tokens.md).

### Langkah 3: Definisikan Komponen CSS Dasar (`src/index.css`)
Pasang utility classes `.card`, `.input`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.btn-success`, `.th`, `.td`, `.badge` yang telah disesuaikan untuk responsivitas mobile native.

### Langkah 4: Terapkan Arsitektur Layout `Shell.jsx`
Gunakan `Shell.jsx` yang memiliki:
- Sidebar desktop (`hidden lg:flex w-64`)
- Top bar mobile lega (`h-16 lg:h-14`)
- Bottom navigation bar native (`h-[68px] lg:hidden`)
- Native bottom sheet untuk menu pendukung
- Floating action button pada halaman operasional

### Langkah 5: Terapkan Dual View pada Setiap Data List
Setiap kali menampilkan data tabel:
- Buat container mobile (`md:hidden space-y-3`) berisi deretan komponen **Card**.
- Buat container desktop (`hidden md:block overflow-x-auto`) berisi komponen **Table**.

---

## 4. Checklist Kualitas UI & Operasional

Sebelum merilis halaman atau fitur baru pada proyek apapun, pastikan:
- [ ] **Anti-AI Slop**: Tidak ada gradien ungu-pink, bayangan bercahaya, atau elemen bulat raksasa yang tidak perlu.
- [ ] **Desktop & Mobile Responsif**: Tampilan desktop rapi dan tampilan mobile terasa 100% seperti aplikasi native smartphone.
- [ ] **Data List di Mobile**: Semua tabel otomatis tampil dalam bentuk Card di mobile (`< md`).
- [ ] **Top Bar & Bottom Bar**: Memiliki tinggi lega (`h-16` dan `h-[68px]`) dengan touch target besar dan mudah ditekan.
- [ ] **Center Floating Action Dock**: Slot ke-3 di Bottom Bar memuat tombol aksi utama melayang (`-mt-6 sm:-mt-7`, bulat besar, gradient korporat, ring pelindung).
- [ ] **Menu Profil di Bottom Sheet**: Profil pengguna dapat diakses dari menu Bottom Sheet, menjaga 5 slot Bottom Bar tetap simetris.
- [ ] **iOS Safari Input Safeguard**: Input `date` dan `time` menggunakan `w-full min-w-0 max-w-full appearance-none box-border` agar tidak melar keluar layar.
- [ ] **Smart Auto-Lookup**: Formulir publik membaca data riwayat tamu terdaftar dan menampilkan kartu status terverifikasi tanpa wajib foto ulang.
- [ ] **Notifikasi WhatsApp Baku**: Divider tepat 17 karakter `─────────────────`, emoji status 🟢/🔴, lokasi area `POS 1`, dan footer `_Pesan Otomatis, <Nama Sistem>_`.
- [ ] **Validasi Gate Tanpa Bypass**: Barcode check-in & check-out terpisah; scan langsung dari kamera tanpa wajib login.
- [ ] **Dark Mode & Light Mode**: Semua teks otomatis kontras dan terbaca di kedua mode tanpa bug warna.
- [ ] **i18n Translation**: Semua kata/kalimat terdaftar di dictionary dan berubah saat toggle bahasa diklik.
- [ ] **Touch Target**: Semua tombol aksi memiliki tinggi sentuhan minimal 42px - 48px.
