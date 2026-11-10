import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanLine,
  Users,
  FileText,
  Database,
  MessageCircle,
  LogOut,
  X,
  ExternalLink,
  UserRound,
  SlidersHorizontal,
  Sun,
  Moon,
  Globe,
  UserCheck,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

function SidebarBrand() {
  return (
    <div className="px-5 pt-5 pb-4 border-b border-slate-200/80 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="bg-white dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700 shrink-0">
          <img src="/logo.png" alt="PT Cemindo Gemilang" className="h-8 w-auto" />
        </div>
        <div className="min-w-0">
          <div className="text-[12.5px] font-bold text-slate-900 dark:text-white leading-tight">
            PT CEMINDO GEMILANG
          </div>
          <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
            Visitor Management · Batam
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ user, onNavigate }) {
  const navigate = useNavigate();
  return (
    <div className="px-3 py-3 border-b border-slate-200/80 dark:border-slate-800">
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          navigate('/profile');
        }}
        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 flex items-center gap-2.5 shadow-xs hover:border-brand-500 dark:hover:border-brand-500 transition-colors text-left"
        title="Buka Halaman Profil & Ganti Password"
      >
        <div className="w-8 h-8 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
          <UserRound size={16} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
            {user?.name}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
            {user?.role}
            {user?.department ? ` · ${user.department.code}` : ''}
          </div>
        </div>
        <div className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
          Profil
        </div>
      </button>
    </div>
  );
}

function SidebarNav({ items, onNavigate, t }) {
  return (
    <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive
                ? 'bg-brand-500 text-white font-semibold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`
          }
        >
          <item.icon size={16} strokeWidth={2} />
          <span>{t(item.labelKey, item.label)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ onLogout, t, lang, toggleLang, isDark, toggleTheme }) {
  return (
    <div className="px-3 py-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2">
      {/* Tombol Pengaturan Cepat: Mode & Bahasa */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleLang}
          className="btn-ghost flex-1 py-1.5 px-2 text-xs flex items-center justify-center gap-1.5 rounded-md"
          title="Ganti Bahasa (ID / EN)"
        >
          <Globe size={14} />
          <span className="font-bold">{lang === 'id' ? 'ID (Bahasa)' : 'EN (English)'}</span>
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          className="btn-ghost p-1.5 rounded-md"
          title={isDark ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
        </button>
      </div>

      <a
        href="/register"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
      >
        <ExternalLink size={14} strokeWidth={2} />
        <span>{t('nav.register_guest', 'Form Tamu (Publik)')}</span>
      </a>

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
      >
        <LogOut size={14} strokeWidth={2} />
        <span>{t('nav.logout', 'Keluar')}</span>
      </button>
    </div>
  );
}

export default function Shell() {
  const { user, logout, can } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  const NAV_ITEMS = [
    { to: '/', label: 'Dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, feature: 'page.dashboard' },
    { to: '/scan', label: 'Scan Barcode', labelKey: 'nav.scan', icon: ScanLine, feature: 'page.scan' },
    { to: '/visits', label: 'Data Kunjungan', labelKey: 'nav.visits', icon: Users, feature: 'page.visits' },
    { to: '/reports', label: 'Laporan', labelKey: 'nav.reports', icon: FileText, feature: 'page.reports' },
    { to: '/master', label: 'Master Data', labelKey: 'nav.master', icon: Database, feature: 'page.master' },
    { to: '/whatsapp', label: 'WhatsApp', labelKey: 'nav.whatsapp', icon: MessageCircle, feature: 'page.whatsapp' },
    { to: '/features', label: 'Manajemen Fitur', labelKey: 'nav.features', icon: SlidersHorizontal, feature: 'page.features' },
    { to: '/profile', label: 'Profil Saya', labelKey: 'nav.profile', icon: UserCheck, feature: 'always' }
  ];

  const items = NAV_ITEMS.filter((n) => n.feature === 'always' || can(n.feature));

  // Menu tambahan untuk Bottom Sheet Mobile (menu sekunder selain Home, Tamu, Laporan, Profil)
  const secondaryMenuItems = [
    ...(can('page.scan') ? [{ to: '/scan', label: t('nav.scan', 'Scan Barcode'), desc: 'Pindai barcode tamu kedatangan & kepulangan', icon: ScanLine }] : []),
    ...(can('page.master') ? [{ to: '/master', label: t('nav.master', 'Master Data'), desc: 'Kelola departemen, pengguna & PIC internal', icon: Database }] : []),
    ...(can('page.whatsapp') ? [{ to: '/whatsapp', label: t('nav.whatsapp', 'WhatsApp Gateway'), desc: 'Monitor sesi Baileys & riwayat pesan OTP', icon: MessageCircle }] : []),
    ...(can('page.features') ? [{ to: '/features', label: t('nav.features', 'Manajemen Fitur'), desc: 'Role permissions & kontrol modul sistem', icon: SlidersHorizontal }] : [])
  ];

  const handleLogout = () => {
    setShowMoreSheet(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop Saja (Hanya tampil di Desktop lg:flex, TIDAK ADA di Mobile) */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col fixed inset-y-0 z-30">
        <SidebarBrand />
        <AccountCard user={user} />
        <SidebarNav items={items} t={t} />
        <SidebarFooter
          onLogout={handleLogout}
          t={t}
          lang={lang}
          toggleLang={toggleLang}
          isDark={isDark}
          toggleTheme={toggleTheme}
        />
      </aside>

      {/* Spacer desktop agar konten tidak tertutup sidebar fixed */}
      <div className="hidden lg:block w-64 shrink-0" />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Atas (Lebih besar, lega & mudah diklik di mobile) */}
        <header className="h-16 lg:h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-3.5 sm:px-4 lg:px-6 sticky top-0 z-20 transition-colors">
          <div className="flex items-center gap-2.5">
            {/* Logo untuk Mobile */}
            <div className="lg:hidden bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="PT Cemindo Gemilang" className="h-8 w-auto" />
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

          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Quick Toggle Bahasa - Touch target besar */}
            <button
              type="button"
              onClick={toggleLang}
              className="px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors min-h-[38px]"
              title="Ganti Bahasa (ID / EN)"
            >
              <Globe size={16} />
              <span className="tracking-wide">{lang.toUpperCase()}</span>
            </button>

            {/* Quick Toggle Dark Mode - Touch target besar */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100/80 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
            </button>

            {/* Profil Avatar Quick Link - Touch target besar */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Buka Profil"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs shadow-sm ring-2 ring-white dark:ring-slate-800">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </button>
          </div>
        </header>

        {/* Konten Halaman dengan padding bawah khusus mobile agar tidak terhalang bottom bar yang lebih besar */}
        <main className="flex-1 p-3.5 sm:p-4 lg:p-6 max-w-[1400px] w-full mx-auto pb-28 lg:pb-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* ================= FLOATING ACTION BUTTON (FAB) SCAN ================= */}
        {/* HANYA MUNCUL DI HALAMAN HOME ('/') PADA MOBILE VIEW (< lg) SESUAI PERMINTAAN USER */}
        {location.pathname === '/' && can('page.scan') && (
          <div className="lg:hidden fixed bottom-[82px] right-5 z-40 flex flex-col items-center select-none">
            <button
              type="button"
              onClick={() => navigate('/scan')}
              className="w-15 h-15 rounded-full bg-brand-500 hover:bg-brand-600 active:scale-95 text-white flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-slate-900 transition-all duration-150"
              title="Scan Barcode Tamu"
              aria-label="Scan Barcode Tamu"
            >
              <ScanLine size={28} strokeWidth={2.4} />
            </button>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 drop-shadow-sm">
              Scan
            </span>
          </div>
        )}

        {/* ================= NATIVE MOBILE BOTTOM BAR ================= */}
        {/* Menu Navigasi Bawah Lebih Besar, Lega & Mudah Di-klik Jari */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 py-2 shadow-2xl h-[68px]">
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
            <LayoutDashboard size={22} strokeWidth={2.2} />
            <span>Home</span>
          </NavLink>

          {/* 2. Tamu / Kunjungan */}
          {can('page.visits') && (
            <NavLink
              to="/visits"
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all min-h-[50px] ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`
              }
            >
              <Users size={22} strokeWidth={2.2} />
              <span>{t('nav.visits', 'Tamu')}</span>
            </NavLink>
          )}

          {/* 3. Laporan */}
          {can('page.reports') && (
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
              <FileText size={22} strokeWidth={2.2} />
              <span>{t('nav.reports', 'Laporan')}</span>
            </NavLink>
          )}

          {/* 4. Profil */}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl text-[11px] font-bold transition-all min-h-[50px] ${
                isActive
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`
            }
          >
            <UserCheck size={22} strokeWidth={2.2} />
            <span>{t('nav.profile', 'Profil')}</span>
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
            <MoreHorizontal size={22} strokeWidth={2.2} />
            <span>Menu</span>
          </button>
        </nav>

        {/* ================= NATIVE MOBILE BOTTOM SHEET ================= */}
        {/* Seluruh menu sistem dapat diakses langsung dari Bottom Sheet tanpa sidebar samping */}
        {showMoreSheet && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setShowMoreSheet(false)}
            />

            {/* Bottom Sheet Drawer */}
            <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-800 p-4 max-h-[85vh] overflow-y-auto">
              {/* Drag Indicator Bar */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                      {user?.name}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {user?.role} {user?.department ? `· ${user.department.code}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMoreSheet(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Daftar Menu Sistem Lengkap */}
              <div className="py-2 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 py-1">
                  Menu Operasional & Administrasi
                </div>

                {secondaryMenuItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setShowMoreSheet(false);
                      navigate(item.to);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                        <item.icon size={17} strokeWidth={2} />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                          {item.label}
                        </div>
                        <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))}

                <a
                  href="/register"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setShowMoreSheet(false)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <ExternalLink size={17} strokeWidth={2} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {t('nav.register_guest', 'Form Registrasi Tamu')}
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400">
                        Buka formulir pendaftaran walk-in publik
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400" />
                </a>
              </div>

              {/* Pengaturan Cepat & Logout */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleLang}
                    className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Globe size={15} />
                    <span>{lang === 'id' ? 'Bahasa: Indonesia' : 'Language: English'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                    <span>{isDark ? 'Light' : 'Dark'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-950/60 transition-colors"
                >
                  <LogOut size={16} strokeWidth={2} />
                  <span>{t('nav.logout', 'Keluar dari Sistem')}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
