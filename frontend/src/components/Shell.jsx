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
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT'] },
  { to: '/scan', label: 'Scan Barcode', icon: ScanLine, roles: ['ADMIN', 'SECURITY'] },
  { to: '/visits', label: 'Data Kunjungan', icon: Users, roles: ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT'] },
  { to: '/reports', label: 'Laporan', icon: FileText, roles: ['ADMIN', 'MANAGEMENT', 'SECURITY'] },
  { to: '/master', label: 'Master Data', icon: Database, roles: ['ADMIN'] },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, roles: ['ADMIN', 'MANAGEMENT'] }
];

function SidebarBrand() {
  return (
    <div className="px-5 pt-5 pb-4">
      <div className="flex items-center gap-2.5">
        <img src="/logo.png" alt="PT Cemindo Gemilang" className="h-9 w-auto shrink-0" />
        <div className="min-w-0">
          <div className="text-[12.5px] font-semibold text-slate-900 leading-tight">PT CEMINDO GEMILANG</div>
          <div className="text-[10.5px] text-slate-500 mt-0.5">Visitor Management · Batam</div>
        </div>
      </div>
    </div>
  );
}

function AccountCard({ user }) {
  return (
    <div className="px-3 pb-4">
      <div className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 flex items-center gap-2.5 shadow-sm">
        <div className="w-8 h-8 rounded-md bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
          <UserRound size={15} strokeWidth={1.9} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-slate-800 truncate leading-tight">{user?.name}</div>
          <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
            {user?.role}
            {user?.department ? ` · ${user.department.code}` : ''}
          </div>
        </div>
        <ChevronDown size={14} className="text-slate-400 shrink-0" />
      </div>
    </div>
  );
}

function SidebarNav({ items, onNavigate }) {
  return (
    <nav className="flex-1 px-3 pb-3 space-y-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] transition-colors ${
              isActive
                ? 'bg-brand-500 text-white font-semibold'
                : 'text-slate-600 font-medium hover:bg-slate-200/70 hover:text-slate-900'
            }`
          }
        >
          <item.icon size={17} strokeWidth={1.9} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarFooter({ onLogout }) {
  return (
    <div className="px-3 py-3 border-t border-slate-200 space-y-1">
      <a
        href="/register"
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
      >
        <ExternalLink size={15} strokeWidth={1.9} /> Form Tamu (Publik)
      </a>
      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-[12.5px] font-medium text-slate-600 hover:bg-red-50 hover:text-brand-600"
      >
        <LogOut size={15} strokeWidth={1.9} /> Keluar
      </button>
    </div>
  );
}

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const items = NAV_ITEMS.filter((n) => n.roles.includes(user?.role));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-slate-50 border-r border-slate-200 flex-col">
        <SidebarBrand />
        <AccountCard user={user} />
        <SidebarNav items={items} />
        <SidebarFooter onLogout={handleLogout} />
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
            <div className="flex items-start justify-between">
              <SidebarBrand />
              <button onClick={() => setOpen(false)} className="p-3 text-slate-500">
                <X size={18} />
              </button>
            </div>
            <AccountCard user={user} />
            <SidebarNav items={items} onNavigate={() => setOpen(false)} />
            <SidebarFooter onLogout={handleLogout} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 text-slate-600" onClick={() => setOpen(true)}>
              <Menu size={20} />
            </button>
            <span className="text-sm font-medium text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight lg:hidden">
              <div className="text-sm font-medium text-slate-800">{user?.name}</div>
              <div className="text-[11px] text-slate-500">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
              title="Keluar"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
