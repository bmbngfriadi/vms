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
  Menu,
  X,
  ExternalLink,
  UserRound,
  SlidersHorizontal,
  Sun,
  Moon,
  Globe,
  UserCheck,
  Download
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
  const [open, setOpen] = useState(false);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop */}
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

      {/* Drawer Mobile Slider */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pr-2">
              <SidebarBrand />
              <button onClick={() => setOpen(false)} className="p-2 text-slate-500 hover:text-slate-800">
                <X size={20} />
              </button>
            </div>
            <AccountCard user={user} onNavigate={() => setOpen(false)} />
            <SidebarNav items={items} onNavigate={() => setOpen(false)} t={t} />
            <SidebarFooter
              onLogout={handleLogout}
              t={t}
              lang={lang}
              toggleLang={toggleLang}
              isDark={isDark}
              toggleTheme={toggleTheme}
            />
          </aside>
        </div>
      )}

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Atas */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 hidden sm:inline">
                PT Cemindo Gemilang Tbk
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">· Plant Batam</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Toggle Bahasa */}
            <button
              type="button"
              onClick={toggleLang}
              className="p-1.5 rounded-md text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
              title="Ganti Bahasa (ID / EN)"
            >
              <Globe size={15} />
              <span>{lang.toUpperCase()}</span>
            </button>

            {/* Quick Toggle Dark Mode */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
            </button>

            {/* Profil Avatar Quick Link */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Buka Profil"
            >
              <div className="w-7 h-7 rounded-full bg-brand-500 text-white font-bold flex items-center justify-center text-xs">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </button>
          </div>
        </header>

        {/* Konten Halaman dengan padding bawah untuk Mobile Bottom Bar */}
        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto pb-20 lg:pb-6">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>

        {/* ================= NATIVE MOBILE BOTTOM BAR ================= */}
        {/* Bar navigasi bawah bergaya aplikasi mobile native untuk operasional smartphone */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around py-1.5 px-2 shadow-lg">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <LayoutDashboard size={18} strokeWidth={2} />
            <span>Home</span>
          </NavLink>

          {can('page.scan') && (
            <NavLink
              to="/scan"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-md -mt-3 border-2 border-white dark:border-slate-900">
                <ScanLine size={19} strokeWidth={2.3} />
              </div>
              <span className="mt-0.5">Scan</span>
            </NavLink>
          )}

          {can('page.visits') && (
            <NavLink
              to="/visits"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <Users size={18} strokeWidth={2} />
              <span>Tamu</span>
            </NavLink>
          )}

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <UserRound size={18} strokeWidth={2} />
            <span>Profil</span>
          </NavLink>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg text-[10px] font-semibold text-slate-500 dark:text-slate-400"
          >
            <Menu size={18} strokeWidth={2} />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
