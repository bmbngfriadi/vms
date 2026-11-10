---
name: enterprise-industrial-ui
description: >-
  Standard design system, UI/UX guidelines, component patterns, and styling rules
  for industrial enterprise web applications (free of AI slop, high-density, professional).
  Includes full specifications for both Desktop and Native Mobile Layouts (Bottom Bar,
  Native Bottom Sheet, Floating Action Buttons, and Mobile Data Cards).
---

# Enterprise Industrial UI/UX Design System (v2.0)

Standar arsitektur antarmuka dan pengalaman pengguna (UI/UX) untuk aplikasi web & mobile enterprise industri (pabrik, manufaktur, logistik, corporate internal tools, dan visitor management). 

Menjamin seluruh sistem perusahaan memiliki konsistensi visual, fungsional, adaptif terhadap mode gelap/terang (Dark & Light Mode), dwibahasa (i18n), bebas dari tampilan AI murahan (*anti-AI slop*), serta memberikan **pengalaman aplikasi mobile native (100% Native Mobile App Style)** di perangkat smartphone.

---

## 1. Prinsip Utama Desain

1. **Anti-AI Slop**:
   - Dilarang keras menggunakan efek gradien neon/pastel melayang, border radius raksasa (pill/bubble berlebihan), dan bayangan bercahaya (*glowing shadow*).
   - Dilarang membuat halaman kosong berjarak besar (*low density*) hanya demi terlihat "estetik".
   - Utamakan struktur berbasis kotak yang presisi dan tegas (`rounded-xl` pada card/container, `rounded-xl` pada input & button, border tipis `border-slate-200` / `dark:border-slate-800`).

2. **Dua Mode Tampilan: Desktop High-Density & Mobile Native App**:
   - **Pada Desktop (`≥ lg` / `≥ 1024px`)**:
     - Sidebar tetap (*fixed sidebar*) selebar 256px (`w-64`).
     - Tabel data padat (*high-density data tables*) dengan `th` uppercase 11px, `td` 13px–14px, pagination, dan filter terintegrasi.
   - **Pada Mobile (`< lg` / `< 1024px`)**:
     - **Tanpa Sidebar Drawer Samping**: Drawer sidebar slider samping dihilangkan sepenuhnya agar tidak mengganggu operasional.
     - **Enlarged Top Bar (h-16 / 64px)**: Header atas lega dengan branding perusahaan, judul tidak terpotong, touch target besar untuk toggle bahasa, dark mode, dan avatar profil.
     - **Enlarged Bottom Navigation Bar (h-17 / 68px)**: Bar navigasi bawah bergaya native app dengan ikon besar (`size={22}`), label teks `11px font-bold`, dan area sentuh `min-h-[50px]`.
     - **Native Bottom Sheet ("Menu Lainnya")**: Menu administratif/sekunder diakses melalui modal sheet yang meluncur halus dari bawah layar.
     - **Floating Action Button (FAB)**: Tombol aksi utama (misal: Scan Barcode, Buat Transaksi) melayang bundar merah di kanan bawah (`fixed bottom-[82px] right-5 z-40`) hanya pada halaman operasional utama.
     - **Semua Data List Menggunakan Card Layout di Mobile (`< md`)**: Tidak ada tabel scroll horizontal yang sempit di HP. Semua tabel otomatis berubah menjadi deretan kartu data (*Card List*) yang rapi dan terstruktur.

3. **Tombol Sentuh Ramah Jempol (Ergonomic Touch Targets)**:
   - Seluruh tombol (`.btn`, `.btn-primary`, `.btn-ghost`, dll) memiliki tinggi sentuhan minimal `min-h-[42px]` hingga `48px` di mobile dengan padding `px-4 py-2.5`, sudut `rounded-xl`, dan efek tekan `active:scale-[0.98]`.
   - Input formulir dibuat dengan tinggi minimal `min-h-[42px]` untuk mencegah auto-zoom mengganggu di mobile browser iOS/Android.

4. **Hierarki Warna Perusahaan & Adaptasi Penuh Dark/Light Mode**:
   - **Light Mode**: Canvas `bg-slate-100`, Surface Card `bg-white border-slate-200`, Teks `text-slate-900` (judul), `text-slate-700` (body), `text-slate-500` (caption).
   - **Dark Mode**: Canvas `bg-slate-950`, Surface Card `bg-slate-900 border-slate-800`, Teks `text-white` (judul), `text-slate-200` (body), `text-slate-400` (caption).
   - **Brand Color**: Merah Bata Korporat Cemindo (`#b52025` / `brand-500` hover `brand-600`).
   - Seluruh huruf/teks otomatis beradaptasi dengan kontras tinggi tanpa teks silau atau tak terbaca.

5. **Arsitektur Translasi Otomatis (i18n)**:
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

## 4. Checklist Kualitas UI

Sebelum merilis halaman atau fitur baru, pastikan:
- [ ] **Anti-AI Slop**: Tidak ada gradien ungu-pink, bayangan bercahaya, atau elemen bulat raksasa yang tidak perlu.
- [ ] **Desktop & Mobile Responsif**: Tampilan desktop rapi dan tampilan mobile terasa seperti aplikasi native smartphone.
- [ ] **Data List di Mobile**: Semua tabel otomatis tampil dalam bentuk Card di mobile (`< md`).
- [ ] **Top Bar & Bottom Bar**: Memiliki tinggi lega (`h-16` dan `h-[68px]`) dengan touch target besar dan mudah ditekan.
- [ ] **Dark Mode & Light Mode**: Semua teks otomatis kontras dan terbaca di kedua mode tanpa bug warna.
- [ ] **i18n Translation**: Semua kata/kalimat terdaftar di dictionary dan berubah saat toggle bahasa diklik.
- [ ] **Touch Target**: Semua tombol aksi memiliki tinggi sentuhan minimal 42px - 44px.
