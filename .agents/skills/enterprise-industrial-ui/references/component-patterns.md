# Ready-to-Use Industrial Component Patterns

Kumpulan pola komponen React + Tailwind CSS siap pakai dengan estetika industrial enterprise dan **100% Native Mobile App Layout**.

---

## 1. App Shell Layout Lengkap (`Shell.jsx`)
Mengintegrasikan Sidebar Desktop permanen dan Native Mobile Navigation (Enlarged Topbar, Bottombar, Native Bottom Sheet, & FAB).

```jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Database,
  LogOut,
  X,
  UserRound,
  MoreHorizontal,
  ChevronRight,
  Globe,
  Sun,
  Moon,
  ScanLine
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Shell() {
  const { user, logout, can } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, feature: 'page.dashboard' },
    { to: '/visits', label: 'Data Kunjungan', icon: Users, feature: 'page.visits' },
    { to: '/reports', label: 'Laporan', icon: FileText, feature: 'page.reports' },
    { to: '/profile', label: 'Profil Saya', icon: UserRound, feature: 'always' }
  ];

  const handleLogout = () => {
    setShowMoreSheet(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* ================= 1. SIDEBAR DESKTOP (lg:flex) ================= */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col fixed inset-y-0 z-30">
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-slate-900 dark:text-white leading-tight">
                PT CEMINDO GEMILANG
              </div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                Industrial Plant Batam
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-3 py-3 border-b border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 flex items-center gap-2.5 shadow-xs text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <UserRound size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user?.name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.role}</div>
            </div>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <item.icon size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer Settings & Logout */}
        <div className="px-3 py-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="btn-ghost flex-1 py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 rounded-xl"
            >
              <Globe size={14} />
              <span className="font-bold">{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="btn-ghost p-2 rounded-xl"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
          >
            <LogOut size={15} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      <div className="hidden lg:block w-64 shrink-0" />

      {/* ================= 2. MAIN AREA ================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Enlarged Mobile Top Bar Header (h-16 / 64px) */}
        <header className="h-16 lg:h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3.5 sm:px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="lg:hidden bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight">
                PT Cemindo Gemilang
              </span>
              <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                Visitor Management · Batam
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 min-h-[38px]"
            >
              <Globe size={15} />
              <span>{lang.toUpperCase()}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-8 h-8 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-white dark:ring-slate-800"
            >
              {user?.name?.charAt(0) || 'U'}
            </button>
          </div>
        </header>

        {/* Content Viewport with pb-32 for Mobile Bottom Bar & Floating Center Dock */}
        <main className="flex-1 p-3.5 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto pb-32 lg:pb-6">
          <Outlet />
        </main>

        {/* ================= 3. NATIVE MOBILE BOTTOM BAR DENGAN CENTER FLOATING DOCK ================= */}
        {/* Tepat 5 Slot: 1. Home, 2. Kunjungan, 3. [FLOATING ACTION DOCK DI TENGAH], 4. Laporan, 5. Menu */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-1 shadow-2xl h-[68px]">
          {/* 1. Home / Dashboard */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all min-h-[50px] ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <LayoutDashboard size={21} strokeWidth={2.2} />
            <span>Home</span>
          </NavLink>

          {/* 2. Operasional / Kunjungan */}
          <NavLink
            to="/visits"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all min-h-[50px] active:scale-95 ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <Users size={21} strokeWidth={2.2} />
            <span className="truncate max-w-full">Kunjungan</span>
          </NavLink>

          {/* 3. TOMBOL AKSI UTAMA FLOATING DI TENGAH (DIPERBESAR & ERGONOMIS) */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center -mt-6 sm:-mt-7 group select-none ${
                  isActive ? 'scale-105' : 'active:scale-90 transition-transform'
                }`
              }
              title="Aksi Utama / Scan Barcode"
            >
              <div
                className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full bg-gradient-to-tr from-brand-600 via-brand-500 to-rose-500 text-white flex items-center justify-center shadow-xl ring-4 ring-white dark:ring-slate-900 transition-all ${
                  location.pathname === '/scan'
                    ? 'shadow-brand-600/70 ring-brand-100 dark:ring-brand-950 scale-105'
                    : 'shadow-brand-600/40 group-hover:shadow-brand-600/60'
                }`}
              >
                <ScanLine size={28} strokeWidth={2.4} />
              </div>
              <span
                className={`text-[10px] font-extrabold mt-0.5 tracking-tight drop-shadow-xs transition-colors ${
                  location.pathname === '/scan'
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-700 dark:text-slate-300 group-hover:text-brand-600'
                }`}
              >
                Scan
              </span>
            </NavLink>
          </div>

          {/* 4. Laporan / Riwayat */}
          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all min-h-[50px] ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <FileText size={21} strokeWidth={2.2} />
            <span>Laporan</span>
          </NavLink>

          {/* 5. Menu Lainnya (Buka Native Bottom Sheet Modal) */}
          <button
            type="button"
            onClick={() => setShowMoreSheet(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all min-h-[50px] ${
              showMoreSheet
                ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MoreHorizontal size={21} strokeWidth={2.2} />
            <span>Menu</span>
          </button>
        </nav>

        {/* ================= 4. NATIVE MOBILE BOTTOM SHEET ================= */}
        {showMoreSheet && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs"
              onClick={() => setShowMoreSheet(false)}
            />
            <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-4 max-h-[85vh] overflow-y-auto">
              {/* Drag Handle Bar */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

              {/* User Summary Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div
                  className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 active:scale-98 transition-all"
                  onClick={() => {
                    setShowMoreSheet(false);
                    navigate('/profile');
                  }}
                  title="Buka Profil Saya"
                >
                  <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {user?.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user?.role} {user?.department ? `· ${user.department}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowMoreSheet(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Secondary Actions List */}
              <div className="py-2 space-y-1">
                <button
                  onClick={() => {
                    setShowMoreSheet(false);
                    navigate('/master');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <Database size={17} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Master Data</div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400">Departemen & Akun User</div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </button>
              </div>

              {/* Footer Logout */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Keluar dari Sistem</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 2. Formulir Publik Mobile Native (`Register.jsx` Pattern)

```jsx
<div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-3 sm:py-6 px-3 sm:px-4 transition-colors">
  <div className="max-w-2xl mx-auto space-y-3 sm:space-y-4">
    {/* Header Mobile Lega */}
    <header className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-2 min-w-0">
        <img src="/logo.png" alt="Logo" className="h-7 sm:h-8 w-auto shrink-0" />
        <div className="min-w-0">
          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
            PT Cemindo Gemilang
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            Pendaftaran Tamu · Plant Batam
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={toggleLang} className="btn-ghost text-xs px-2 py-1.5 rounded-lg font-bold">
          {lang.toUpperCase()}
        </button>
        <button onClick={toggleTheme} className="btn-ghost text-xs p-1.5 rounded-lg">
          {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
        </button>
      </div>
    </header>

    {/* Kartu Formulir */}
    <div className="card rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 py-4 sm:px-6 sm:py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
          Formulir Kunjungan Tamu
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 mt-1">
          Isi data berikut sebelum memasuki kawasan pabrik.
        </p>
      </div>

      <form className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div>
          <label className="label">Nama Lengkap *</label>
          <input className="input" placeholder="Nama sesuai KTP" required />
        </div>
        <div>
          <label className="label">Nomor WhatsApp *</label>
          <input className="input font-mono" placeholder="0812xxxxxxx" inputMode="tel" required />
        </div>
        
        {/* Tombol Submit Full-Width Mobile */}
        <button
          type="submit"
          className="btn-primary w-full py-3.5 sm:py-3 text-sm font-bold rounded-xl shadow-lg shadow-brand-500/20 active:scale-[0.99]"
        >
          Kirim & Dapatkan Barcode
        </button>
      </form>
    </div>
  </div>
</div>
```

---

## 3. Pola Smart Returning User / Auto-Lookup Identitas

Ketika membangun sistem operasional publik/karyawan/tamu, gunakan pola deteksi otomatis data tersimpan berdasarkan Nama + Nomor Telepon/WhatsApp agar pengguna tidak perlu input berulang atau foto ulang kartu fisiknya:

```jsx
{/* Jika data ditemukan di database, tampilkan Kartu Terverifikasi */}
{returningUser && useExistingPhoto ? (
  <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 sm:p-4 shadow-xs space-y-3">
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">
          Data Identitas Ditemukan
        </span>
      </div>
      <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
        Terdaftar
      </span>
    </div>

    <div className="flex items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setPreviewPhotoModal(true)}
          className="relative group shrink-0 cursor-pointer overflow-hidden rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs"
        >
          <img
            src={returningUser.photoUrl}
            alt="Kartu Identitas"
            className="w-16 h-12 sm:w-20 sm:h-14 object-cover group-hover:scale-105 transition-transform"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
            <Eye size={15} />
          </div>
        </button>

        <div className="min-w-0">
          <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
            {returningUser.fullName}
          </p>
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
            {returningUser.identityNumber ? `No: ${returningUser.identityNumber}` : 'Foto Tersedia'}
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
            ✓ Data tersimpan otomatis digunakan, tidak perlu foto manual lagi
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setPreviewPhotoModal(true)}
          className="btn-ghost text-xs p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
        >
          <Eye size={14} />
          <span className="hidden sm:inline">Lihat</span>
        </button>
        <button
          type="button"
          onClick={() => setUseExistingPhoto(false)}
          className="btn-ghost text-xs p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
        >
          <RefreshCw size={14} />
          <span className="hidden sm:inline">Foto Ulang</span>
        </button>
      </div>
    </div>
  </div>
) : (
  <IdentityPhotoCapture required />
)}
```

---

## 4. Pola Form Input Tanggal & Jam Anti-Offside (iOS Safari Fix)

Gunakan pola berikut agar input tanggal dan jam di iOS Safari tidak melar keluar batas layar:

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
  <div className="min-w-0 flex-1">
    <label className="label">Tanggal *</label>
    <input
      type="date"
      className="input text-sm py-2.5 px-3 rounded-xl w-full min-w-0 max-w-full appearance-none box-border"
      value={form.date}
      onChange={(e) => setForm({ ...form, date: e.target.value })}
      required
    />
  </div>

  <div className="min-w-0 flex-1">
    <label className="label">Jam *</label>
    <input
      type="time"
      className="input text-sm py-2.5 px-3 rounded-xl font-mono w-full min-w-0 max-w-full appearance-none box-border"
      value={form.time}
      onChange={(e) => setForm({ ...form, time: e.target.value })}
      required
    />
  </div>
</div>
```

---

## 5. Pola Modal Pratinjau Foto Resolusi Penuh (`PhotoPreviewModal.jsx`)

Komponen modal portal di level `z-[90]` untuk inspeksi KTP, foto kendaraan, atau bukti fisik:

```jsx
import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Shield } from 'lucide-react';

export default function PhotoPreviewModal({ photoUrl, visitorName, identityNumber, onClose }) {
  if (!photoUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5">
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
              <Shield size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Foto Dokumen Identitas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {visitorName} {identityNumber ? `· NIK: ${identityNumber}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="my-4 bg-slate-950 rounded-2xl p-2 flex items-center justify-center overflow-hidden min-h-[220px]">
          <img src={photoUrl} alt="Pratinjau" className="max-h-[60vh] max-w-full object-contain rounded-xl" />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="btn-ghost py-2 px-4 text-xs font-bold rounded-xl">
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
```
