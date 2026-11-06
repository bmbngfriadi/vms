import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT'] },
  { to: '/scan', label: 'Scan Barcode', icon: ScanLine, roles: ['ADMIN', 'SECURITY'] },
  { to: '/visits', label: 'Data Kunjungan', icon: Users, roles: ['ADMIN', 'SECURITY', 'PIC', 'MANAGEMENT'] },
  { to: '/reports', label: 'Laporan', icon: FileText, roles: ['ADMIN', 'MANAGEMENT', 'SECURITY'] },
  { to: '/master', label: 'Master Data', icon: Database, roles: ['ADMIN'] },
  { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, roles: ['ADMIN', 'MANAGEMENT'] }
];

export default function Shell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const items = NAV.filter((n) => n.roles.includes(user?.role));

  const Nav = ({ onNavigate }) => (
    <nav className="flex-1 px-2 py-4 space-y-0.5">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-white/10 text-white font-medium'
                : 'text-slate-300 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <item.icon size={17} strokeWidth={1.8} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );

  const Brand = () => (
    <div className="px-4 py-4 border-b border-white/10">
      <div className="text-[13px] font-semibold text-white leading-tight">PT CEMINDO GEMILANG</div>
      <div className="text-[11px] text-slate-400 mt-0.5">Visitor Management · Plant Batam</div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-slate-900 flex-col">
        <Brand />
        <Nav />
        <div className="p-3 border-t border-white/10">
          <a
            href="/register"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <ExternalLink size={14} /> Form Tamu (Publik)
          </a>
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-slate-900 flex flex-col">
            <div className="flex items-center justify-between">
              <Brand />
              <button onClick={() => setOpen(false)} className="p-3 text-slate-400">
                <X size={18} />
              </button>
            </div>
            <Nav onNavigate={() => setOpen(false)} />
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
            <div className="text-right leading-tight">
              <div className="text-sm font-medium text-slate-800">{user?.name}</div>
              <div className="text-[11px] text-slate-500">
                {user?.role}
                {user?.department ? ` · ${user.department.code}` : ''}
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              title="Keluar"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 max-w-[1400px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
