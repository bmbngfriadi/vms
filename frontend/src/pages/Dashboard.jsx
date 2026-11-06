import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, LogOut, CalendarDays, ScanLine } from 'lucide-react';
import { endpoints, fmtTime, errMsg } from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { useAuth } from '../lib/auth.jsx';

export default function Dashboard() {
  const { user } = useAuth();
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

  if (error) return <div className="card p-6 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="text-sm text-slate-500">Memuat dashboard…</div>;

  const maxTrend = Math.max(1, ...series.map((t) => t.count));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Ringkasan aktivitas tamu{user?.role === 'PIC' ? ' yang Anda terima' : ' hari ini'}
          </p>
        </div>
        {['ADMIN', 'SECURITY'].includes(user?.role) && (
          <Link to="/scan" className="btn-primary">
            <ScanLine size={16} /> Scan Barcode
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Clock} label="Menunggu Validasi" value={data.waiting} tone="amber" />
        <Stat icon={Users} label="Di Dalam Area" value={data.onsite} tone="emerald" />
        <Stat icon={LogOut} label="Keluar Hari Ini" value={data.checkedOutToday} tone="slate" />
        <Stat icon={CalendarDays} label="Total Hari Ini" value={data.todayTotal} tone="blue" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-800">Kunjungan 7 Hari Terakhir</h2>
          <div className="mt-5 flex items-end justify-between gap-2 h-44">
            {series.map((t) => (
              <div key={t.day} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <div className="text-[11px] font-medium text-slate-600">{t.count}</div>
                <div
                  className={`w-9 rounded-t ${t.count > 0 ? 'bg-brand-500' : 'bg-slate-200'}`}
                  style={{ height: `${t.count > 0 ? Math.max(6, (t.count / maxTrend) * 110) : 4}px` }}
                />
                <div className="text-[10px] text-slate-500">
                  {t.date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-800">Tamu per Departemen</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Hari ini</p>
          <div className="mt-4 space-y-3">
            {data.byDepartment.length === 0 && (
              <div className="text-xs text-slate-400">Belum ada tamu hari ini.</div>
            )}
            {data.byDepartment.slice(0, 6).map((d) => (
              <div key={d.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 truncate pr-2">{d.name}</span>
                  <span className="text-slate-800 font-medium">{d.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500"
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
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Kunjungan Terbaru</h2>
          <Link to="/visits" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Lihat semua →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">No. Kunjungan</th>
                <th className="th">Tamu</th>
                <th className="th">Departemen</th>
                <th className="th">PIC</th>
                <th className="th">Status</th>
                <th className="th">Masuk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recent.length === 0 && (
                <tr>
                  <td className="td text-slate-400 text-center py-8" colSpan={6}>
                    Belum ada kunjungan.
                  </td>
                </tr>
              )}
              {data.recent.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/60">
                  <td className="td font-mono text-xs">{v.visitNumber}</td>
                  <td className="td">
                    <div className="font-medium text-slate-800">{v.visitorName}</div>
                    <div className="text-xs text-slate-500">{v.company || '-'}</div>
                  </td>
                  <td className="td">{v.department?.name || '-'}</td>
                  <td className="td">{v.picName}</td>
                  <td className="td">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="td text-slate-600">{v.checkInAt ? fmtTime(v.checkInAt) : '-'}</td>
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
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-50 text-blue-600'
  };
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-md flex items-center justify-center ${tones[tone]}`}>
        <Icon size={17} />
      </div>
      <div className="mt-3 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-600 mt-0.5">{label}</div>
    </div>
  );
}
