import React from 'react';

const MAP = {
  WAITING_VALIDATION: { label: 'Menunggu Validasi', cls: 'bg-amber-100 text-amber-800' },
  APPROVED: { label: 'Terjadwal', cls: 'bg-blue-100 text-blue-800' },
  CHECKED_IN: { label: 'Di Dalam', cls: 'bg-emerald-100 text-emerald-800' },
  CHECKED_OUT: { label: 'Selesai', cls: 'bg-slate-200 text-slate-700' },
  REJECTED: { label: 'Ditolak', cls: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Dibatalkan', cls: 'bg-slate-200 text-slate-600' }
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || { label: status, cls: 'bg-slate-100 text-slate-600' };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

export const TYPE_LABEL = {
  WALK_IN: 'Walk-In',
  PRE_REGISTERED: 'Janji Temu'
};
