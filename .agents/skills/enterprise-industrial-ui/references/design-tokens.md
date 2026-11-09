# Design Tokens & Styling Guidelines

Standard design system for Industrial Enterprise Web Applications (PT Cemindo Gemilang Tbk standard).

---

## 1. Anti-AI Slop Manifesto
Setiap UI yang dihasilkan dengan standar ini **HARUS BEBAS DARI AI SLOP**:
1. **DILARANG menggunakan gradient neon/pastel berlebihan**: Jangan gunakan background radial gradient ungu/merah muda/cyan melayang yang khas template AI murahan.
2. **DILARANG menggunakan border radius raksasa**: Gunakan `rounded-lg` (8px) untuk card/modal dan `rounded-md` (6px) untuk tombol dan form inputs. Hindari `rounded-3xl` atau `rounded-full` pada kartu data.
3. **DILARANG low-density padding**: Aplikasi industri membutuhkan kepadatan informasi yang efisien (high density). Hindari padding 64px yang membuat layar kosong dan boros scroll.
4. **DILARANG glowing shadows**: Gunakan subtle borders (`border-slate-200`) dan shadow ringan (`shadow-sm` atau `shadow-md`), jangan gunakan `drop-shadow-[0_0_25px_rgba(...)]`.
5. **DILARANG teks dummy / placeholder palsu**: Gunakan terminologi nyata operasional industri (NIK, Department, PIC, No Polisi, Check-In, Barcode, Audit Log).
6. **Desain Mobile-First untuk Operasional Lapangan**: Tombol aksi utama (Scan Barcode, Check-In, Validasi) harus berukuran besar dan mudah ditekan oleh jari operator di lapangan dengan touch target minimal 44px.

---

## 2. Tailwind Configuration (`tailwind.config.js`)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf3f3',
          100: '#f9e2e3',
          200: '#f2c6c9',
          300: '#e79aa0',
          400: '#d95f68',
          500: '#b52025', // Primary Corporate Brand Red
          600: '#9e1c21',
          700: '#82171b',
          800: '#611114',
          900: '#470d10'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
};
```

---

## 3. Base & Utility Classes (`index.css`)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    -webkit-tap-highlight-color: transparent;
  }
  body {
    @apply bg-slate-100 text-slate-800 antialiased;
  }
}

@layer components {
  /* Surfaces */
  .card {
    @apply bg-white border border-slate-200 rounded-lg;
  }

  /* Form Elements */
  .label {
    @apply block text-xs font-semibold text-slate-700 mb-1.5;
  }

  .input {
    @apply w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800
      placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30
      focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-500 transition-colors;
  }

  /* Buttons */
  .btn {
    @apply inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold
      transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer;
  }

  .btn-primary {
    @apply btn bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700;
  }

  .btn-ghost {
    @apply btn bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 active:bg-slate-100;
  }

  .btn-danger {
    @apply btn bg-red-600 text-white hover:bg-red-700 active:bg-red-800;
  }

  .btn-success {
    @apply btn bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800;
  }

  /* High-Density Data Tables */
  .th {
    @apply px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200;
  }

  .td {
    @apply px-4 py-3 text-sm text-slate-700 border-b border-slate-100 align-middle;
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-[11px] font-semibold tracking-wide uppercase;
  }
}
```

---

## 4. Semantic Color Mapping

| State / Kategori | Background | Text | Border | Kegunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Active / Success** | `bg-emerald-50` | `text-emerald-700` | `border-emerald-200` | Checked-in, Aktif, Selesai, Disetujui |
| **Pending / Warning** | `bg-amber-50` | `text-amber-700` | `border-amber-200` | Menunggu Validasi, Menunggu Approval |
| **Info / Walk-In** | `bg-blue-50` | `text-blue-700` | `border-blue-200` | Pre-Registered, Tamu Walk-in, Kunjungan Baru |
| **Neutral / Muted** | `bg-slate-100` | `text-slate-700` | `border-slate-200` | Checked-out, Draft, Diarsipkan |
| **Danger / Error** | `bg-red-50` | `text-red-700` | `border-red-200` | Ditolak, Dibatalkan, Expired, Error |
| **Special / VIP** | `bg-purple-50` | `text-purple-700` | `border-purple-200` | Tamu Khusus, Management, VIP |
