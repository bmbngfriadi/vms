import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Clock,
  CheckCircle,
  LogIn,
  LogOut,
  XCircle,
  Ban,
  AlertCircle
} from 'lucide-react';

export default function StatusBadge({ status, size = 'sm', className = '' }) {
  const { t } = useLanguage();

  const getStatusConfig = (st) => {
    switch (st) {
      case 'CHECKED_IN':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: LogIn,
          label: t('status_CHECKED_IN') || 'Di Pabrik (Check-In)'
        };
      case 'CHECKED_OUT':
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          icon: LogOut,
          label: t('status_CHECKED_OUT') || 'Selesai (Check-Out)'
        };
      case 'PENDING_VALIDATION':
      case 'PENDING_APPROVAL':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500 animate-pulse',
          icon: Clock,
          label: t('status_PENDING_VALIDATION') || 'Menunggu Validasi'
        };
      case 'APPROVED':
        return {
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          dot: 'bg-blue-500',
          icon: CheckCircle,
          label: t('status_APPROVED') || 'Disetujui'
        };
      case 'REJECTED':
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          icon: XCircle,
          label: t('status_REJECTED') || 'Ditolak'
        };
      case 'CANCELLED':
        return {
          bg: 'bg-orange-50 text-orange-800 border-orange-200',
          dot: 'bg-orange-500',
          icon: Ban,
          label: t('status_CANCELLED') || 'Dibatalkan'
        };
      case 'EXPIRED':
        return {
          bg: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          dot: 'bg-zinc-400',
          icon: AlertCircle,
          label: t('status_EXPIRED') || 'Kadaluarsa'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          icon: Clock,
          label: st || '-'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeStyles = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-[11px] gap-1.5',
    md: 'px-3 py-1.5 text-xs gap-2',
    lg: 'px-4 py-2 text-sm gap-2 font-bold'
  };

  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-wider rounded-full border shadow-2xs ${
        config.bg
      } ${sizeStyles[size] || sizeStyles.sm} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
      <span className="truncate">{config.label}</span>
    </span>
  );
}

