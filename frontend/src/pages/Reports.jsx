import React, { useEffect, useState } from 'react';
import { Download, FileText, Loader2, Pencil, Trash2, FileSpreadsheet } from 'lucide-react';
import { api, endpoints, errMsg, fmtDateTime, fmtTime, todayISO } from '../lib/api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import VisitEditModal, { confirmDeleteVisit } from '../components/VisitEditModal.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';

const firstOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

export default function Reports() {
  const { can } = useAuth();
  const { t } = useI18n();
  const canEdit = can('visit.edit');
  const canDelete = can('visit.delete');
  const canExport = can('report.export');
  const [editing, setEditing] = useState(null);
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
      .visits({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status: status && status !== 'ALL' ? status : undefined,
        limit: 1000,
        page: 1
      })
      .then((res) => {
        const list = res?.data || res?.rows || (Array.isArray(res) ? res : []);
        setRows(list);
      })
      .catch((e) => setError(errMsg(e, 'Gagal memuat laporan')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const downloadExcel = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/visits/export/excel', {
        params: { startDate, endDate, status },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-kunjungan-batam-${startDate}_${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(errMsg(err, 'Gagal mengunduh laporan Excel'));
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
    return `${Math.floor(avg / 60)}j ${avg % 60}m`;
  })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t('reports.title', 'Laporan Kunjungan')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('reports.subtitle', 'Rekapitulasi data tamu berdasarkan periode dan status.')}
        </p>
      </div>

      <div className="card p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="label">{t('reports.from_date', 'Dari tanggal')}</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('reports.to_date', 'Sampai tanggal')}</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{t('reports.status', 'Status')}</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">Semua</option>
              <option value="WAITING_VALIDATION">Menunggu Validasi</option>
              <option value="APPROVED">Terjadwal</option>
              <option value="CHECKED_IN">Di Dalam Pabrik</option>
              <option value="CHECKED_OUT">Selesai</option>
              <option value="REJECTED">Ditolak</option>
              <option value="CANCELLED">Dibatalkan</option>
            </select>
          </div>
          <button className="btn-ghost" onClick={load}>
            <FileText size={16} /> {t('reports.btn_apply', 'Terapkan Filter')}
          </button>
          {canExport && (
            <button className="btn-primary" onClick={downloadExcel} disabled={downloading}>
              {downloading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileSpreadsheet size={16} />
              )}
              {t('reports.btn_download_excel', 'Unduh Excel (.xlsx)')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MiniStat label={t('reports.stat_total', 'Total Kunjungan')} value={rows.length} />
        <MiniStat label={t('reports.stat_onsite', 'Masih di Dalam')} value={totalOnsite} />
        <MiniStat label={t('reports.stat_duration', 'Rata-rata Durasi')} value={avgDuration} />
      </div>

      {error && <div className="card p-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200">
          {t('reports.details', 'Rincian Data')} ({rows.length} baris)
        </div>
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10">
              <tr>
                <th className="th">{t('visits.col_number', 'No. Kunjungan')}</th>
                <th className="th">{t('visits.col_visitor', 'Tamu')}</th>
                <th className="th">Perusahaan</th>
                <th className="th">{t('visits.col_dept', 'Departemen')}</th>
                <th className="th">{t('visits.col_pic', 'PIC')}</th>
                <th className="th">{t('visits.col_status', 'Status')}</th>
                <th className="th">{t('visits.col_in', 'Masuk')}</th>
                <th className="th">{t('visits.col_out', 'Keluar')}</th>
                <th className="th">Durasi</th>
                {(canEdit || canDelete) && <th className="th text-right">{t('visits.col_action', 'Aksi')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && (
                <tr>
                  <td className="td text-center py-10 text-slate-400 dark:text-slate-500" colSpan={canEdit || canDelete ? 10 : 9}>
                    <Loader2 className="animate-spin inline mr-2" size={16} />
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td className="td text-center py-10 text-slate-400 dark:text-slate-500" colSpan={canEdit || canDelete ? 10 : 9}>
                    {t('reports.empty', 'Tidak ada data pada periode ini.')}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="td font-mono text-xs">{v.visitNumber}</td>
                    <td className="td font-medium text-slate-800 dark:text-slate-200">{v.visitorName}</td>
                    <td className="td text-slate-600 dark:text-slate-400">{v.company || '-'}</td>
                    <td className="td text-slate-600 dark:text-slate-400">{v.department?.name || '-'}</td>
                    <td className="td text-slate-600 dark:text-slate-400">{v.picName}</td>
                    <td className="td">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="td text-slate-600 dark:text-slate-400">{v.checkInAt ? fmtTime(v.checkInAt) : '-'}</td>
                    <td className="td text-slate-600 dark:text-slate-400">{v.checkOutAt ? fmtTime(v.checkOutAt) : '-'}</td>
                    <td className="td text-slate-600 dark:text-slate-400">
                      {v.durationMinutes != null
                        ? `${Math.floor(v.durationMinutes / 60)}j ${v.durationMinutes % 60}m`
                        : '-'}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              className="p-1.5 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit kunjungan"
                              onClick={() => setEditing(v)}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus kunjungan"
                              onClick={async () => {
                                try {
                                  if (await confirmDeleteVisit(v)) {
                                    setRows((list) => list.filter((r) => r.id !== v.id));
                                  }
                                } catch (err) {
                                  alert(errMsg(err, 'Gagal menghapus kunjungan'));
                                }
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <VisitEditModal
          visit={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
          onDeleted={(v) => setRows((list) => list.filter((r) => r.id !== v.id))}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
