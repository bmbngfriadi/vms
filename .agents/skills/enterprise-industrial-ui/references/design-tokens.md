# Design Tokens & Styling Guidelines

Standard design system for Industrial Enterprise Web Applications (PT Cemindo Gemilang Tbk standard).

---

## 1. Anti-AI Slop Manifesto
Setiap UI yang dihasilkan dengan standar ini **HARUS BEBAS DARI AI SLOP**:
1. **DILARANG menggunakan gradient neon/pastel berlebihan**: Jangan gunakan background radial gradient ungu/merah muda/cyan melayang yang khas template AI murahan.
2. **DILARANG menggunakan border radius raksasa pada kontainer**: Gunakan `rounded-xl` (12px) untuk card/modal/input/button, dan `rounded-lg` untuk badge status. Hindari `rounded-3xl` atau `rounded-full` pada kartu data atau formulir.
3. **Kepadatan Informasi Tinggi (High Density) di Desktop**: Di desktop, hindari padding berlebihan yang membuat layar kosong dan boros scroll.
4. **Ergonomi Ramah Jempol di Mobile (Native Experience)**: Di mobile, seluruh tombol aksi dan input memiliki touch target minimal 42px – 48px agar tidak meleset saat ditekan.
5. **DILARANG glowing shadows**: Gunakan subtle borders (`border-slate-200 dark:border-slate-800`) dan shadow ringan/tegas (`shadow-sm`, `shadow-md`, `shadow-xl`), jangan gunakan `drop-shadow-[0_0_25px_rgba(...)]`.
6. **DILARANG teks dummy / placeholder palsu**: Gunakan terminologi nyata operasional industri (NIK, Department, PIC, No Polisi, Check-In, Check-Out, Barcode, Audit Log).

---

## 2. Tailwind Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class', // Wajib class-based dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf3f3',
          100: '#f9e2e3',
          200: '#f2c6c9',
          300: '#e79aa0',
          400: '#d95f68',
          500: '#b52025', // Primary Corporate Brand Red (Cemindo)
          600: '#9e1c21',
          700: '#82171b',
          800: '#611114',
          900: '#470d10',
          950: '#2b0709'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    }
  },
  plugins: []
};
```

---

## 3. Base & Utility Classes (`src/index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply bg-slate-100 text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased;
  }
}

@layer components {
  /* Surfaces & Containers */
  .card {
    @apply bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800 rounded-xl transition-colors;
  }

  /* Form Elements */
  .label {
    @apply block text-xs sm:text-[13px] font-bold text-slate-700 dark:text-slate-300 mb-1.5;
  }

  .input {
    @apply w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 sm:py-2 text-sm text-slate-800
      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30
      focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-500
      dark:bg-slate-800/90 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500
      dark:disabled:bg-slate-900 dark:disabled:text-slate-600 transition-colors min-h-[42px] sm:min-h-[38px];
  }

  /* Buttons - Mobile Ergonomic Touch Targets */
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:py-2 text-sm font-bold
      transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none
      active:scale-[0.98] min-h-[42px] sm:min-h-[38px];
  }

  .btn-primary {
    @apply btn bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm hover:shadow;
  }

  .btn-ghost {
    @apply btn bg-white text-slate-700 border border-slate-300 hover:bg-slate-50
      dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700 dark:hover:border-slate-600 shadow-sm;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm;
  }

  .btn-success {
    @apply btn bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm;
  }

  /* High-Density Data Tables (Desktop only) */
  .th {
    @apply px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200
      dark:text-slate-400 dark:bg-slate-800/60 dark:border-slate-800;
  }

  .td {
    @apply px-4 py-3.5 text-sm text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800/60 align-middle;
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider;
  }

  /* iOS Safari Mobile Form Input Safeguards */
  input[type='date'],
  input[type='time'] {
    width: 100% !important;
    min-width: 0 !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    -webkit-appearance: none;
    appearance: none;
  }
}
```

---

## 4. Semantic Color & Status Mapping (Dark & Light)

| State / Kategori | Light Mode Classes | Dark Mode Classes | Makna & Penggunaan |
| :--- | :--- | :--- | :--- |
| **Active / Success** | `bg-emerald-50 text-emerald-800 border-emerald-200` | `dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50` | Selesai, Terhubung, Aktif, Di Dalam Pabrik |
| **Pending / Warning** | `bg-amber-50 text-amber-800 border-amber-200` | `dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50` | Menunggu Validasi, Terjadwal, OTP Pending |
| **Danger / Rejected** | `bg-red-50 text-red-700 border-red-200` | `dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/50` | Ditolak, Dibatalkan, Terputus, Gagal Kirim |
| **Neutral / Muted** | `bg-slate-100 text-slate-700 border-slate-200` | `dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700` | Nonaktif, Selesai Diperiksa, Arsip |
| **Brand Highlight** | `bg-brand-50 text-brand-700 border-brand-200` | `dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-900/50` | Identitas Nomor, Role Admin, Tag Khusus |

---

## 5. Standar Notifikasi WhatsApp & Pesan Operasional

Agar pesan WhatsApp yang dikirimkan oleh sistem tidak terpotong atau berantakan pada layar smartphone pengguna:
1. **Header Baku**:
   ```text
   🏭 *PT CEMINDO GEMILANG Tbk*
   📍 *Plant Batam — <Nama Modul/Sistem>*
   ```
2. **Divider Anti-Offside**:
   - WAJIB tepat 17 karakter monospaced: `─────────────────`.
   - Jangan gunakan garis lebih dari 20 karakter karena akan melar ke bawah (*wrap line/offside*) di HP dengan setting font besar.
3. **Pembeda Ikon Status**:
   - 🟢 untuk pesan kedatangan / proses masuk / check-in / aktif.
   - 🔴 untuk pesan kepulangan / selesai / check-out / tertutup.
   - 📅 untuk undangan jadwal resmi.
4. **Standardisasi Lokasi**:
   - Lokasi pos penjagaan ditulis baku: `POS 1` (bukan string acak).
5. **Footer Standar**:
   - `_Pesan Otomatis, <Nama Sistem>_` (misal: `_Pesan Otomatis, Visitor Management System_`).
