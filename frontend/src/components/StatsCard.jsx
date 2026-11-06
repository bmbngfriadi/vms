import React from 'react';

export default function StatsCard({ title, value, icon: Icon, color = 'red', subtitle }) {
  const colorMap = {
    red: 'bg-red-50 text-cemindo-red border-red-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {value !== undefined ? value : '—'}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl border ${colorMap[color] || colorMap.red}`}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
    </div>
  );
}

