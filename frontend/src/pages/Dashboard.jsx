import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Users, LogOut, CalendarDays, ScanLine } from 'lucide-react';
import { endpoints, fmtTime, errMsg } from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    endpoints
      .stats()
      .then(setData)
      .catch((e) => setError(errMsg(e, 'Gagal memuat dashboard')));
  }, []);

  // Selalu tampilkan 7 hari terakhir, termasuk hari tanpa kunjungan
  const series = (() => {
    const map = Object.fromEntries((data?.trend || []).map((t) => [t.day, t.count]));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`;
      return { day: key, date: d, count: map[key] || 0 };
    });
  })();

  if (error) return <div className="card p-6 text-sm text-red-600 dark:text-red-400">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500 dark:text-slate-400">Memuat dashboard…</div>;

  const maxTrend = Math.max(1, ...series.map((t) => t.count));

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('dashboard.title', 'Dashboard Kunjungan')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('dashboard.subtitle', 'Ringkasan aktivitas tamu dan operasional pabrik hari ini.')}
          </p>
        </div>
        {['ADMIN', 'SECURITY'].includes(user?.role) ? (
          <div className="flex items-center gap-2">
            <Link to="/scan" className="btn-primary">
              <ScanLine size={16} /> {t('dashboard.btn_scan', 'Scan Barcode')}
            </Link>
            <button
              className="btn-ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              title="Keluar dari sistem"
            >
              <LogOut size={16} /> {t('nav.logout', 'Keluar')}
            </button>
          </div>
        ) : (
          <button
            className="btn-ghost self-start sm:self-auto"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            title="Keluar dari sistem"
          >
            <LogOut size={16} /> {t('nav.logout', 'Keluar')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat
          icon={Clock}
          label={t('dashboard.waiting_validation', 'Menunggu Validasi')}
          value={data.waiting}
          tone="amber"
        />
        <Stat
          icon={Users}
          label={t('dashboard.inside_plant', 'Di Dalam Pabrik')}
          value={data.onsite}
          tone="emerald"
        />
        <Stat
          icon={LogOut}
          label={t('dashboard.completed_today', 'Selesai Hari Ini')}
          value={data.checkedOutToday}
          tone="slate"
        />
        <Stat
          icon={CalendarDays}
          label={t('dashboard.today_visitors', 'Total Hari Ini')}
          value={data.todayTotal}
          tone="red"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Kunjungan 7 Hari Terakhir
          </h2>
          <div className="mt-5 flex items-end justify-between gap-2 h-44">
            {series.map((t) => (
              <div key={t.day} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{t.count}</div>
                <div
                  className={`w-9 rounded-t transition-all ${
                    t.count > 0 ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                  style={{ height: `${t.count > 0 ? Math.max(6, (t.count / maxTrend) * 110) : 4}px` }}
                />
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {t.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Tamu per Departemen
          </h2>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Hari ini</p>
          <div className="mt-4 space-y-3">
            {data.byDepartment.length === 0 && (
              <div className="text-xs text-slate-400 dark:text-slate-500">Belum ada tamu hari ini.</div>
            )}
            {data.byDepartment.slice(0, 6).map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 dark:text-slate-300 truncate pr-2">{d.name}</span>
                  <span className="text-slate-800 dark:text-slate-100 font-medium">{d.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full"
                    style={{
                      width: `${(d.count / Math.max(1, data.byDepartment[0].count)) * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t('dashboard.recent_activity', 'Aktivitas Kunjungan Terkini')}
          </h2>
          <Link
            to="/visits"
            className="text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 font-medium transition-colors"
          >
            Lihat semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="th">{t('visits.col_number', 'No. Kunjungan')}</th>
                <th className="th">{t('visits.col_visitor', 'Tamu')}</th>
                <th className="th">{t('visits.col_dept', 'Departemen')}</th>
                <th className="th">{t('visits.col_pic', 'PIC')}</th>
                <th className="th">{t('visits.col_status', 'Status')}</th>
                <th className="th">{t('visits.col_in', 'Masuk')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.recent.length === 0 && (
                <tr>
                  <td className="td text-slate-400 dark:text-slate-500 text-center py-8" colSpan={6}>
                    Belum ada kunjungan.
                  </td>
                </tr>
              )}
              {data.recent.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="td font-mono text-xs">{v.visitNumber}</td>
                  <td className="td">
                    <div className="font-medium text-slate-800 dark:text-slate-200">{v.visitorName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{v.company || '-'}</div>
                  </td>
                  <td className="td text-slate-600 dark:text-slate-400">{v.department?.name || '-'}</td>
                  <td className="td text-slate-600 dark:text-slate-400">{v.picName}</td>
                  <td className="td">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="td text-slate-600 dark:text-slate-400 font-mono text-xs">
                    {v.checkInAt ? fmtTime(v.checkInAt) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    red: 'bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200/60 dark:border-brand-900/40'
  };
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
