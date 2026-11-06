import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import {
  LayoutDashboard,
  QrCode,
  Users,
  FileBarChart,
  MessageSquare,
  UserPlus,
  ShieldCheck,
  Building2,
  HardHat,
  Database,
  History,
  CalendarCheck,
  ShieldAlert,
  AlertOctagon
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();

  const mainNavItems = [
    {
      to: '/',
      label: t('menuDashboard'),
      icon: LayoutDashboard,
      roles: ['ADMIN', 'SECURITY', 'HOST_PIC', 'MANAGEMENT']
    },
    {
      to: '/scanner',
      label: t('menuSecurityScanner'),
      icon: QrCode,
      roles: ['ADMIN', 'SECURITY']
    },
    {
      to: '/visitors',
      label: t('menuVisitorManagement'),
      icon: Users,
      roles: ['ADMIN', 'SECURITY', 'HOST_PIC', 'MANAGEMENT']
    },
    {
      to: '/reports',
      label: t('menuReports'),
      icon: FileBarChart,
      roles: ['ADMIN', 'SECURITY', 'HOST_PIC', 'MANAGEMENT']
    },
    {
      to: '/blacklist',
      label: t('menuBlacklist'),
      icon: ShieldAlert,
      roles: ['ADMIN', 'SECURITY', 'MANAGEMENT']
    }
  ];

  const masterDataItems = [
    {
      to: '/master/departments',
      label: t('menuMasterDepartments'),
      icon: Building2,
      roles: ['ADMIN']
    },
    {
      to: '/master/employees',
      label: t('menuMasterEmployees'),
      icon: Users,
      roles: ['ADMIN']
    },
    {
      to: '/whatsapp',
      label: t('menuWhatsApp'),
      icon: MessageSquare,
      roles: ['ADMIN']
    },
    {
      to: '/activity-logs',
      label: t('menuActivityLogs'),
      icon: History,
      roles: ['ADMIN', 'MANAGEMENT']
    }
  ];

  const filterItems = (items) => {
    if (!user) return [];
    return items.filter((item) => item.roles.includes(user.role));
  };

  const visibleMain = filterItems(mainNavItems);
  const visibleMaster = filterItems(masterDataItems);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* User Role Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cemindo-red/10 text-cemindo-red flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                {t(`role_${user?.role}`)}
              </p>
              {user?.employeeId && (
                <p className="text-[9px] font-mono text-slate-400">
                  NIK: {user.employeeId}
                </p>
              )}
              {user?.department && (
                <p className="text-[10px] text-cemindo-red font-semibold truncate">
                  Dept: {user.department.name}
                </p>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="space-y-1">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Operations & Gate
            </p>
            {visibleMain.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-cemindo-red text-white shadow-sm shadow-red-200'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Master Data Menu */}
          {visibleMaster.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('menuMasterData')}</span>
              </p>
              <div className="space-y-1">
                {visibleMaster.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          )}

          {/* Public Portal Shortcut */}
          <div className="pt-2 border-t border-slate-100">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Visitor Portal
            </p>
            <NavLink
              to="/register"
              target="_blank"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition border border-dashed border-slate-300"
            >
              <UserPlus className="w-4 h-4 text-cemindo-red shrink-0" />
              <span>{t('menuPublicRegister')}</span>
            </NavLink>
          </div>
        </div>

        {/* Bottom Safety Box */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-start gap-2.5 text-slate-600 text-[11px] leading-snug">
            <HardHat className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Safety First!</p>
              <p className="text-[10px] text-slate-500">
                PT Cemindo Gemilang Tbk – Plant Batam K3 Golden Rules.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
