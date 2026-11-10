import React from 'react';
import { useI18n } from '../lib/i18n.jsx';

const STATUS_CONFIG = {
  WAITING_VALIDATION: {
    key: 'status.WAITING_VALIDATION',
    label: 'Menunggu Validasi',
    cls: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900/50'
  },
  APPROVED: {
    key: 'status.APPROVED',
    label: 'Terjadwal',
    cls: 'bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-900/50'
  },
  CHECKED_IN: {
    key: 'status.CHECKED_IN',
    label: 'Di Dalam Pabrik',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
  },
  CHECKED_OUT: {
    key: 'status.CHECKED_OUT',
    label: 'Selesai',
    cls: 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
  },
  REJECTED: {
    key: 'status.REJECTED',
    label: 'Ditolak',
    cls: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/50'
  },
  CANCELLED: {
    key: 'status.CANCELLED',
    label: 'Dibatalkan',
    cls: 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  }
};

export default function StatusBadge({ status }) {
  const { t } = useI18n();
  const cfg = STATUS_CONFIG[status] || {
    key: status,
    label: status,
    cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  };

  return (
    <span className={`badge border ${cfg.cls}`}>
      {t(cfg.key, cfg.label)}
    </span>
  );
}

export const TYPE_LABEL = {
  WALK_IN: 'Walk-In',
  PRE_REGISTERED: 'Janji Temu'
};
