import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageToggle from './LanguageToggle';
import WhatsAppStatusModal from './WhatsAppStatusModal';
import { vmsApi } from '../services/api';
import {
  ShieldAlert,
  LogOut,
  User as UserIcon,
  MessageSquare,
  Menu,
  X,
  Factory
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [waStatus, setWaStatus] = useState('DISCONNECTED');
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);

  useEffect(() => {
    checkWaStatus();
    const interval = setInterval(checkWaStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkWaStatus = async () => {
    try {
      const data = await vmsApi.getWhatsAppStatus();
      setWaStatus(data?.status || 'DISCONNECTED');
    } catch {
      setWaStatus('DISCONNECTED');
    }
  };

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand & Mobile Sidebar Toggle */}
            <div className="flex items-center gap-3">
              {isAuthenticated && onToggleSidebar && (
                <button
                  type="button"
                  onClick={onToggleSidebar}
                  className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden focus:outline-none"
                  aria-label="Toggle menu"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}

              <Link to="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-xl bg-cemindo-red flex items-center justify-center text-white shadow-md shadow-red-200 group-hover:scale-105 transition-transform">
                  <Factory className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                      CEMINDO GEMILANG
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-100 text-cemindo-red">
                      Plant Batam
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500">
                    {t('appName')}
                  </p>
                </div>
              </Link>
            </div>

            {/* Right: Actions, Language, WA, User */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* WhatsApp Service Status Pill */}
              <button
                onClick={() => setIsWaModalOpen(true)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition ${
                  waStatus === 'CONNECTED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : waStatus === 'SCAN_QR'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 animate-pulse'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title="WhatsApp Baileys Status - Click for settings & QR pairing"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WA:</span>
                <span className="capitalize">{waStatus === 'SCAN_QR' ? 'Scan QR' : waStatus.toLowerCase()}</span>
              </button>

              {/* Language Switcher */}
              <LanguageToggle />

              {/* User Dropdown or Login */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {user?.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {t(`role_${user?.role}`)}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                    title={t('logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition shadow-sm"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  <span>{t('login')}</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* WhatsApp QR & Status modal */}
      <WhatsAppStatusModal
        isOpen={isWaModalOpen}
        onClose={() => {
          setIsWaModalOpen(false);
          checkWaStatus();
        }}
      />
    </>
  );
}

