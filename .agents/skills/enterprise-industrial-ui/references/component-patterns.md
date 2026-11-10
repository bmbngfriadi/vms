# Ready-to-Use Industrial Component Patterns

Kumpulan pola komponen React + Tailwind CSS siap pakai dengan estetika industrial enterprise.

---

## 1. App Shell Layout (`Shell.jsx`)
Sidebar tetap di desktop, drawer di mobile, dilengkapi kartu profil user di bawah.

```jsx
import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  Database,
  LogOut,
  Menu,
  X,
  UserRound,
  ChevronDown
} from 'lucide-react';

export default function Shell({ user, navItems, onLogout, appTitle = "INDUSTRIAL VMS", plantName = "Plant Batam" }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-brand-500 text-white font-bold flex items-center justify-center text-sm">
            CG
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 leading-tight">{appTitle}</div>
            <div className="text-[10px] text-slate-500">{plantName}</div>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-md text-slate-600 hover:bg-slate-100"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Sidebar Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-50 border-r border-slate-200 flex flex-col transition-transform
        md:translate-x-0 md:static md:h-screen
        ${mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:shadow-none'}
      `}>
        {/* Brand */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-brand-500 text-white font-extrabold flex items-center justify-center text-base shrink-0 shadow-sm">
              CG
            </div>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-900 leading-tight truncate">{appTitle}</div>
              <div className="text-[10.5px] text-slate-500 mt-0.5">{plantName}</div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-3 py-3 border-b border-slate-200 bg-white/50">
          <div className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center gap-2.5 shadow-sm">
            <div className="w-8 h-8 rounded bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <UserRound size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-800 truncate">{user?.name || 'Operator'}</div>
              <div className="text-[10px] text-slate-500 truncate">{user?.role} {user?.department ? `· ${user.department}` : ''}</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                }`
              }
            >
              <item.icon size={16} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-200">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto max-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
```

---

## 2. Stat Card / KPI Widget (`StatCard.jsx`)

```jsx
export function StatCard({ label, value, subtext, icon: Icon, color = "blue" }) {
  const colorMap = {
    brand: "bg-brand-50 text-brand-600 border-brand-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200"
  };

  return (
    <div className="card p-4 sm:p-5 flex items-start justify-between shadow-sm">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        {subtext && <p className="text-[11px] text-slate-500 mt-1">{subtext}</p>}
      </div>
      {Icon && (
        <div className={`p-2.5 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
```

---

## 3. Data Table & Filter Bar (`DataTable.jsx`)

```jsx
import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function FilterBar({ search, onSearchChange, children }) {
  return (
    <div className="card p-3 sm:p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
      <div className="relative flex-1 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Cari data..."
          className="input pl-9 text-xs"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

export function TableContainer({ children }) {
  return (
    <div className="card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
}
```

---

## 4. Modal Dialog Standar Industri (`Modal.jsx`)

```jsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-xl" }) {
  useEffect(() => {
    const handleEsc = (e) => e.key === 'Escape' && onClose();
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className={`bg-white rounded-lg border border-slate-200 shadow-xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh]`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 py-3 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 5. Status Badge Universal (`StatusBadge.jsx`)

```jsx
export function StatusBadge({ status }) {
  const config = {
    CHECKED_IN: { label: 'CHECKED IN', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    APPROVED: { label: 'DISETUJUI', bg: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
    PENDING_VALIDATION: { label: 'MENUNGGU VALIDASI', bg: 'bg-amber-50 text-amber-700 border-amber-300' },
    CHECKED_OUT: { label: 'CHECKED OUT', bg: 'bg-slate-100 text-slate-700 border-slate-300' },
    REJECTED: { label: 'DITOLAK', bg: 'bg-red-50 text-red-700 border-red-300' },
    CANCELLED: { label: 'DIBATALKAN', bg: 'bg-red-50 text-red-700 border-red-300' }
  };

  const current = config[status] || { label: status, bg: 'bg-slate-100 text-slate-600 border-slate-200' };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold border tracking-wide uppercase ${current.bg}`}>
      {current.label}
    </span>
  );
}
```

