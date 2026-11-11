import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, X, Loader2, CalendarPlus, Pencil, Trash2, FileSpreadsheet, QrCode } from 'lucide-react';
import { api, endpoints, errMsg, fmtDateTime, fmtDate, fmtTime, todayISO } from '../lib/api.js';
import StatusBadge, { TYPE_LABEL } from '../components/StatusBadge.jsx';
import VisitEditModal from '../components/VisitEditModal.jsx';
import PhotoPreviewModal from '../components/PhotoPreviewModal.jsx';
import WalkInQrModal from '../components/WalkInQrModal.jsx';
import { useAuth } from '../lib/auth.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useDialog } from '../lib/dialog.jsx';

const STATUSES = [
  ['ALL', 'Semua Status'],
  ['WAITING_VALIDATION', 'Menunggu Validasi'],
  ['APPROVED', 'Terjadwal'],
  ['CHECKED_IN', 'Di Dalam Pabrik'],
  ['CHECKED_OUT', 'Selesai'],
  ['REJECTED', 'Ditolak'],
  ['CANCELLED', 'Dibatalkan']
];

export default function Visits() {
  const { user, can } = useAuth();
  const { t } = useI18n();
  const { confirm, alert: customAlert } = useDialog();
  const canCreate = can('visit.create');
  const canEdit = can('visit.edit');
  const canDelete = can('visit.delete');
  const canExport = can('report.export');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const removeRow = async (v) => {
    try {
      const ok = await confirm({
        title: 'Hapus Kunjungan Tamu',
        message: `Apakah Anda yakin ingin menghapus kunjungan ${v.visitNumber} (${v.visitorName})?\n\nData kunjungan dan token barcode-nya akan dihapus permanen dari sistem.`,
        confirmText: 'Ya, Hapus',
        cancelText: 'Batal',
        danger: true,
        icon: 'trash'
      });
      if (!ok) return;

      await endpoints.deleteVisit(v.id);
      setDetail(null);
      load();
    } catch (err) {
      customAlert({ title: 'Gagal Menghapus', message: errMsg(err, 'Gagal menghapus kunjungan'), type: 'error' });
    }
  };

  const load = useCallback(() => {
    setLoading(true);
    endpoints
      .visits({ status, date: date || undefined, search: search || undefined, page, limit: 20 })
      .then((d) => {
        setRows(d.data);
        setTotal(d.total);
        setPages(d.pages);
        setError('');
      })
      .catch((e) => setError(errMsg(e, 'Gagal memuat data')))
      .finally(() => setLoading(false));
  }, [status, date, search, page]);

  useEffect(() => {
    const timer = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(timer);
  }, [load, search]);

  const downloadExcel = async () => {
    setExporting(true);
    try {
      const res = await api.get('/visits/export/excel', {
        params: { status, startDate: date || undefined, endDate: date || undefined },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-kunjungan-batam-${date || todayISO()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      customAlert({ title: 'Gagal Unduh', message: errMsg(err, 'Gagal mengunduh Excel'), type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('visits.title', 'Data Kunjungan Tamu')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {total} {t('visits.subtitle', 'kunjungan tercatat dalam sistem')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tombol QR Barcode Walk-In */}
          <button
            type="button"
            className="btn-ghost font-bold text-brand-600 dark:text-brand-400 py-2.5 px-3 min-h-[42px] rounded-xl"
            onClick={() => setShowQrModal(true)}
            title="Tampilkan & cetak barcode registrasi tamu walk-in"
          >
            <QrCode size={16} />
            <span className="hidden sm:inline">QR Walk-In</span>
          </button>

          {canExport && (
            <button
              className="btn-ghost py-2.5 px-3 min-h-[42px] rounded-xl"
              onClick={downloadExcel}
              disabled={exporting}
              title="Unduh laporan Excel (.xlsx)"
            >
              {exporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
              <span className="hidden sm:inline">{t('action.export', 'Unduh Excel')}</span>
            </button>
          )}
          {canCreate && (
            <button className="btn-primary py-2.5 px-3.5 min-h-[42px] rounded-xl font-bold" onClick={() => setShowCreate(true)}>
              <CalendarPlus size={16} /> {t('visits.btn_preregister', 'Buat Janji Temu')}
            </button>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              className="input pl-9"
              placeholder={t('visits.search_placeholder', 'Cari no. kunjungan, nama tamu, instansi...')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select
            className="input"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {STATUSES.map(([v, l]) => (
              <option key={v} value={v}>
                {t(`status.${v}`, l)}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setPage(1);
            }}
          />
          <button
            className="btn-ghost"
            onClick={() => {
              setStatus('ALL');
              setDate('');
              setSearch('');
              setPage(1);
            }}
          >
            {t('visits.filter_reset', 'Reset Filter')}
          </button>
        </div>
      </div>

      {error && <div className="card p-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="card overflow-hidden">
        {/* ================= CARD LIST KHUSUS MOBILE VIEW (< md) ================= */}
        <div className="md:hidden p-3 space-y-3">
          {loading && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Loader2 className="animate-spin inline mr-2" size={18} />
              Memuat data kunjungan...
            </div>
          )}

          {!loading && rows.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
              {t('visits.empty', 'Tidak ada data kunjungan yang cocok.')}
            </div>
          )}

          {!loading &&
            rows.map((v) => (
              <div
                key={v.id}
                onClick={() => setDetail(v)}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5 active:scale-[0.99] transition-transform cursor-pointer"
              >
                {/* Header Kartu: No. Kunjungan + Type + Status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {v.visitNumber}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                      {t(`type.${v.visitType}`, TYPE_LABEL[v.visitType] || v.visitType)}
                    </span>
                  </div>
                  <StatusBadge status={v.status} />
                </div>

                {/* Info Tamu */}
                <div>
                  <div className="text-[13.5px] font-bold text-slate-900 dark:text-white leading-tight">
                    {v.visitorName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {v.company || 'Pribadi / Perorangan'}
                  </div>
                </div>

                {/* Rincian Departemen & PIC */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11.5px]">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                      Departemen
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {v.department?.name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                      PIC
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate block">
                      {v.picName || '-'}
                    </span>
                  </div>
                </div>

                {/* Waktu Masuk & Keluar */}
                {(v.checkInAt || v.checkOutAt) && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <div>
                      {v.checkInAt && (
                        <span>
                          Masuk: <b className="text-slate-700 dark:text-slate-300 font-mono">{fmtTime(v.checkInAt)}</b>
                        </span>
                      )}
                    </div>
                    <div>
                      {v.checkOutAt && (
                        <span>
                          Keluar: <b className="text-slate-700 dark:text-slate-300 font-mono">{fmtTime(v.checkOutAt)}</b>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Tombol Aksi Mobile */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetail(v);
                    }}
                    className="btn-ghost py-1.5 px-3 text-xs rounded-lg font-bold min-h-[34px]"
                  >
                    Rincian
                  </button>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(v);
                      }}
                      className="btn-ghost py-1.5 px-3 text-xs rounded-lg font-bold text-brand-600 dark:text-brand-400 min-h-[34px]"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                  )}

                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRow(v);
                      }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[34px] min-w-[34px] flex items-center justify-center"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
        </div>

        {/* ================= TABEL DESKTOP VIEW (hidden md:block) ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="th">{t('visits.col_number', 'No. Kunjungan')}</th>
                <th className="th">{t('visits.col_visitor', 'Tamu')}</th>
                <th className="th">{t('visits.col_dept', 'Departemen')}</th>
                <th className="th">{t('visits.col_pic', 'PIC')}</th>
                <th className="th">{t('visits.col_type', 'Tipe')}</th>
                <th className="th">{t('visits.col_status', 'Status')}</th>
                <th className="th">{t('visits.col_in', 'Masuk')}</th>
                <th className="th">{t('visits.col_out', 'Keluar')}</th>
                {(canEdit || canDelete) && <th className="th text-right">{t('visits.col_action', 'Aksi')}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading && (
                <tr>
                  <td
                    className="td text-center py-10 text-slate-400 dark:text-slate-500"
                    colSpan={canEdit || canDelete ? 9 : 8}
                  >
                    <Loader2 className="animate-spin inline mr-2" size={16} />
                    Memuat data...
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    className="td text-center py-10 text-slate-400 dark:text-slate-500"
                    colSpan={canEdit || canDelete ? 9 : 8}
                  >
                    {t('visits.empty', 'Tidak ada data kunjungan.')}
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 cursor-pointer"
                    onClick={() => setDetail(v)}
                  >
                    <td className="td font-mono text-xs">{v.visitNumber}</td>
                    <td className="td">
                      <div className="font-medium text-slate-800 dark:text-slate-200">{v.visitorName}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{v.company || '-'}</div>
                    </td>
                    <td className="td text-slate-600 dark:text-slate-300">{v.department?.name || '-'}</td>
                    <td className="td text-slate-600 dark:text-slate-300">{v.picName}</td>
                    <td className="td text-xs text-slate-600 dark:text-slate-400">
                      {t(`type.${v.visitType}`, TYPE_LABEL[v.visitType] || v.visitType)}
                    </td>
                    <td className="td">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="td text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {v.checkInAt ? fmtTime(v.checkInAt) : '-'}
                    </td>
                    <td className="td text-slate-600 dark:text-slate-400 font-mono text-xs">
                      {v.checkOutAt ? fmtTime(v.checkOutAt) : '-'}
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              className="p-1.5 rounded text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit kunjungan"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(v);
                              }}
                            >
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                              title="Hapus kunjungan"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeRow(v);
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

        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>
              Halaman {page} dari {pages}
            </span>
            <div className="flex gap-2">
              <button className="btn-ghost py-1 px-2.5" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Sebelumnya
              </button>
              <button
                className="btn-ghost py-1 px-2.5"
                disabled={page >= pages}
                onClick={() => setPage(page + 1)}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <DetailModal
          visit={detail}
          onClose={() => setDetail(null)}
          onChanged={load}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={() => {
            setEditing(detail);
            setDetail(null);
          }}
          onDelete={() => removeRow(detail)}
          onViewPhoto={(url, name, nik) => setPreviewPhoto({ url, name, nik })}
        />
      )}
      {editing && (
        <VisitEditModal
          visit={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
          onDeleted={load}
        />
      )}
      {showCreate && (
        <CreateModal
          user={user}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}

      {/* Modal Popup Foto Identitas di Halaman yang Sama */}
      {previewPhoto && (
        <PhotoPreviewModal
          photoUrl={previewPhoto.url}
          visitorName={previewPhoto.name}
          identityNumber={previewPhoto.nik}
          onClose={() => setPreviewPhoto(null)}
        />
      )}

      {/* Modal Barcode Statis Walk-In Tamu */}
      {showQrModal && <WalkInQrModal onClose={() => setShowQrModal(false)} />}
    </div>
  );
}

function DetailModal({ visit, onClose, onChanged, canEdit, canDelete, onEdit, onDelete, onViewPhoto }) {
  const { can } = useAuth();
  const { t } = useI18n();
  const { prompt, alert: customAlert } = useDialog();
  const [busy, setBusy] = useState(false);
  const canCancel = can('visit.cancel') && ['WAITING_VALIDATION', 'APPROVED'].includes(visit.status);

  const cancel = async () => {
    const reason = await prompt({
      title: 'Batalkan Kunjungan Tamu',
      message: `Masukkan alasan pembatalan untuk kunjungan ${visit.visitNumber}:`,
      placeholder: 'Contoh: Tamu berhalangan hadir / dibatalkan oleh PIC',
      defaultValue: 'Dibatalkan oleh PIC',
      confirmText: 'Batalkan Kunjungan',
      variant: 'warning'
    });
    if (!reason) return;

    setBusy(true);
    try {
      await endpoints.cancel(visit.id, reason);
      onChanged();
      onClose();
    } catch (err) {
      customAlert({ title: 'Gagal Membatalkan', message: errMsg(err, 'Gagal membatalkan kunjungan'), type: 'error' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Detail Kunjungan" onClose={onClose}>
      <div className="space-y-2.5 text-sm">
        <Row label="No. Kunjungan" value={visit.visitNumber} mono />
        <Row label="Status" value={<StatusBadge status={visit.status} />} />
        <Row label="Tipe" value={t(`type.${visit.visitType}`, TYPE_LABEL[visit.visitType] || visit.visitType)} />
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />
        <Row label="Nama Tamu" value={visit.visitorName} />
        {visit.identityNumber && <Row label="No. Identitas" value={visit.identityNumber} mono />}
        <Row label="Perusahaan" value={visit.company || '-'} />
        {visit.phone && <Row label="WhatsApp" value={visit.phone} />}
        {visit.identityPhoto && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={visit.identityPhoto}
                alt="Foto Identitas"
                className="w-16 h-11 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-85 shadow-xs transition-opacity"
                onClick={() => onViewPhoto(visit.identityPhoto, visit.visitorName, visit.identityNumber)}
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                Foto Identitas (KTP/SIM)
              </span>
            </div>
            <button
              type="button"
              className="btn-ghost text-xs py-1.5 px-3 rounded-lg font-bold text-brand-600 dark:text-brand-400"
              onClick={() => onViewPhoto(visit.identityPhoto, visit.visitorName, visit.identityNumber)}
            >
              Lihat Foto
            </button>
          </div>
        )}
        <Row label="Departemen" value={visit.department?.name || '-'} />
        <Row label="PIC" value={visit.picName} />
        <Row label="Keperluan" value={visit.purpose} />
        <Row label="Jumlah" value={`${visit.numberOfVisitors} orang`} />
        {visit.vehiclePlate && <Row label="Kendaraan" value={visit.vehiclePlate} />}
        <Row label="Rencana" value={`${fmtDate(visit.scheduledDate)} ${visit.expectedTime || ''}`} />
        <div className="h-px bg-slate-100 dark:bg-slate-800 my-3" />
        <Row label="Masuk" value={visit.checkInAt ? fmtDateTime(visit.checkInAt) : '-'} />
        <Row label="Security In" value={visit.checkInBy || '-'} />
        <Row label="Keluar" value={visit.checkOutAt ? fmtDateTime(visit.checkOutAt) : '-'} />
        <Row label="Security Out" value={visit.checkOutBy || '-'} />
        {visit.badgeNumber && <Row label="Badge" value={visit.badgeNumber} />}
        {visit.durationMinutes != null && (
          <Row
            label="Durasi"
            value={`${Math.floor(visit.durationMinutes / 60)} jam ${visit.durationMinutes % 60} menit`}
          />
        )}
        {visit.cancelReason && <Row label="Alasan" value={visit.cancelReason} />}
      </div>

      <div className="flex flex-wrap gap-2 mt-5">
        <button className="btn-ghost" onClick={onClose}>
          {t('action.close', 'Tutup')}
        </button>
        {canDelete && (
          <button className="btn-ghost text-red-600 dark:text-red-400" onClick={onDelete}>
            <Trash2 size={15} /> {t('action.delete', 'Hapus')}
          </button>
        )}
        {canCancel && (
          <button className="btn-ghost" onClick={cancel} disabled={busy}>
            {t('visits.btn_cancel', 'Batalkan')}
          </button>
        )}
        {canEdit && (
          <button className="btn-primary flex-1" onClick={onEdit}>
            <Pencil size={15} /> {t('action.edit', 'Edit Kunjungan')}
          </button>
        )}
      </div>
    </Modal>
  );
}

function CreateModal({ user, onClose, onCreated }) {
  const { t } = useI18n();
  const [departments, setDepartments] = useState([]);
  const [pics, setPics] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    company: '',
    identityNumber: '',
    departmentId: '',
    picUserId: '',
    purpose: '',
    scheduledDate: todayISO(),
    expectedTime: '09:00',
    numberOfVisitors: 1,
    vehiclePlate: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  useEffect(() => {
    endpoints.departments().then(setDepartments).catch(() => {});
    endpoints.pics().then(setPics).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await endpoints.createVisit({
        ...form,
        numberOfVisitors: Number(form.numberOfVisitors) || 1,
        picUserId: form.picUserId || undefined
      });
      setCreated(data);
    } catch (err) {
      setError(errMsg(err, 'Gagal membuat janji temu'));
    } finally {
      setBusy(false);
    }
  };

  if (created) {
    return (
      <Modal title="Janji Temu Dibuat" onClose={onCreated}>
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Undangan dan barcode telah dikirim ke WhatsApp tamu.
          </p>
          <div className="mt-4 inline-block p-3 bg-white rounded-lg border border-slate-200">
            <img src={created.qrDataUrl} alt="Barcode" className="w-48 h-48" />
          </div>
          <div className="mt-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{created.visitNumber}</div>
          <button className="btn-primary w-full mt-5" onClick={onCreated}>
            Selesai
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title={t('visits.btn_preregister', 'Buat Janji Temu Tamu')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">{t('register.full_name', 'Nama Tamu *')}</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div>
            <label className="label">{t('register.phone', 'No. WhatsApp Tamu *')}</label>
            <input
              className="input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="0812xxxxxxx"
              required
            />
          </div>
          <div>
            <label className="label">{t('register.company', 'Perusahaan')}</label>
            <input className="input" value={form.company} onChange={set('company')} />
          </div>
          <div>
            <label className="label">{t('register.department', 'Departemen *')}</label>
            <select className="input" value={form.departmentId} onChange={set('departmentId')} required>
              <option value="">— Pilih —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              PIC {user.role === 'ADMIN' ? '(boleh pilih PIC lain)' : '(Anda)'}
            </label>
            <select
              className="input"
              value={form.picUserId}
              onChange={set('picUserId')}
              disabled={user.role !== 'ADMIN'}
            >
              <option value="">{user.role === 'ADMIN' ? '— Pilih PIC —' : user.name}</option>
              {user.role === 'ADMIN' &&
                pics.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.department ? `· ${p.department.name}` : ''}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="label">Tanggal *</label>
            <input
              type="date"
              className="input"
              value={form.scheduledDate}
              onChange={set('scheduledDate')}
              required
            />
          </div>
          <div>
            <label className="label">Perkiraan Jam</label>
            <input type="time" className="input" value={form.expectedTime} onChange={set('expectedTime')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">{t('register.purpose', 'Keperluan *')}</label>
            <textarea className="input min-h-[70px]" value={form.purpose} onChange={set('purpose')} required />
          </div>
          <div>
            <label className="label">{t('register.visitors_count', 'Jumlah Orang')}</label>
            <input
              type="number"
              min="1"
              className="input"
              value={form.numberOfVisitors}
              onChange={set('numberOfVisitors')}
            />
          </div>
          <div>
            <label className="label">{t('register.vehicle_plate', 'No. Polisi')}</label>
            <input className="input" value={form.vehiclePlate} onChange={set('vehiclePlate')} />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            {t('action.cancel', 'Batal')}
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Buat & Kirim
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />
      <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={`text-right text-slate-800 dark:text-slate-200 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
