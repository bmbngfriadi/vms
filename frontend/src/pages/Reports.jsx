import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { api, endpoints, errMsg, fmtDateTime, fmtTime, todayISO } from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default function Reports() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(todayISO());
  const [status, setStatus] = useState('ALL');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    endpoints
      .visits({ date: undefined, page: 1, limit: 200 })
      .then((d) => {
        const filtered = d.data.filter((v) => {
          const created = v.createdAt.slice(0, 10);
          const inRange = created >= startDate && created <= endDate;
          const statusOk = status === 'ALL' || v.status === status;
          return inRange && statusOk;
        });
        setRows(filtered);
        setError('');
      })
      .catch((e) => setError(errMsg(e, 'Gagal memuat laporan')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const download = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/visits/export/csv', {
        params: { startDate, endDate, status },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-tamu-${startDate}_${endDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(errMsg(err, 'Gagal mengunduh laporan'));
    } finally {
      setDownloading(false);
    }
  };

  const totalOnsite = rows.filter((r) => r.status === 'CHECKED_IN').length;
  const totalDone = rows.filter((r) => r.status === 'CHECKED_OUT').length;
  const avgDuration = (() => {
    const list = rows.filter((r) => r.durationMinutes != null);
    if (!list.length) return '-';
    const avg = Math.round(list.reduce((a, r) => a + r.durationMinutes, 0) / list.length);
    return `${Math.floor(avg / 60)} jam ${avg % 60} mnt`;
  })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Laporan Kunjungan</h1>
        <p className="text-sm text-slate-500">Rekapitulasi data tamu berdasarkan periode.</p>
      </div>

      <div className="card p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="label">Dari tanggal</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Sampai tanggal</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">Semua</option>
              <option value="WAITING_VALIDATION">Menunggu Validasi</option>
              <option value="APPROVED">Terjadwal</option>
              <option value="CHECKED_IN">Di Dalam</option>
              <option value="CHECKED_OUT">Selesai</option>
              <option value="REJECTED">Ditolak</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
          <button className="btn-ghost" onClick={load}>
            <FileText size={16} /> Terapkan
          </button>
          <button className="btn-primary" onClick={download} disabled={downloading}>
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Unduh CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MiniStat label="Total Kunjungan" value={rows.length} />
        <MiniStat label="Masih di Dalam" value={totalOnsite} />
        <MiniStat label="Rata-rata Durasi" value={avgDuration} />
      </div>

      {error && <div className="card p-4 text-sm text-red-600">{error}</div>}

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 text-sm font-semibold text-slate-800">
          Rincian ({rows.length} baris)
        </div>
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="th">No. Kunjungan</th>
                <th className="th">Tamu</th>
                <th className="th">Perusahaan</th>
                <th className="th">Departemen</th>
                <th className="th">PIC</th>
                <th className="th">Status</th>
                <th className="th">Masuk</th>
                <th className="th">Keluar</th>
                <th className="th">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td className="td text-center py-10 text-slate-400" colSpan={9}>
                    <Loader2 className="animate-spin inline" size={16} />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="td text-center py-10 text-slate-400" colSpan={9}>
                    Tidak ada data pada periode ini.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60">
                    <td className="td font-mono text-xs">{v.visitNumber}</td>
                    <td className="td">{v.visitorName}</td>
                    <td className="td text-slate-600">{v.company || '-'}</td>
                    <td className="td text-slate-600">{v.department?.name || '-'}</td>
                    <td className="td text-slate-600">{v.picName}</td>
                    <td className="td">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="td text-slate-600">{v.checkInAt ? fmtTime(v.checkInAt) : '-'}</td>
                    <td className="td text-slate-600">{v.checkOutAt ? fmtTime(v.checkOutAt) : '-'}</td>
                    <td className="td text-slate-600">
                      {v.durationMinutes != null
                        ? `${Math.floor(v.durationMinutes / 60)}j ${v.durationMinutes % 60}m`
                        : '-'}
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

function MiniStat({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-semibold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
