import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, X, Loader2, CalendarPlus, Pencil, Trash2, FileSpreadsheet, QrCode, ShieldCheck, Eye, RefreshCw } from 'lucide-react';
import { api, endpoints, errMsg, fmtDateTime, fmtDate, fmtTime, todayISO } from '../lib/api.js';
import StatusBadge, { TYPE_LABEL } from '../components/StatusBadge.jsx';
import VisitEditModal from '../components/VisitEditModal.jsx';
import PhotoPreviewModal from '../components/PhotoPreviewModal.jsx';
import WalkInQrModal from '../components/WalkInQrModal.jsx';
import IdentityPhotoCapture from '../components/IdentityPhotoCapture.jsx';
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
            className="input w-full max-w-full min-w-0"
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
    identityPhoto: '',
    departmentId: user?.role === 'ADMIN' ? '' : user?.departmentId || '',
    picUserId: user?.role === 'ADMIN' ? '' : user?.id || '',
    purpose: '',
    scheduledDate: todayISO(),
    expectedTime: '09:00',
    numberOfVisitors: 1,
    vehiclePlate: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  // Status auto-lookup tamu berulang (returning visitor)
  const [returningVisitor, setReturningVisitor] = useState(null);
  const [useExistingPhoto, setUseExistingPhoto] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [previewPhotoModal, setPreviewPhotoModal] = useState(false);

  useEffect(() => {
    endpoints.departments().then(setDepartments).catch(() => { });
    endpoints.pics().then(setPics).catch(() => { });
  }, []);

  // Auto-lookup database: jika nama lengkap dan nomor WhatsApp cocok dengan database,
  // tampilkan foto identitas dan data KTP tamu yang tersimpan tanpa perlu foto/input manual lagi.
  useEffect(() => {
    const trimmedName = (form.fullName || '').trim().toLowerCase();
    const cleanPhone = (form.phone || '').replace(/\D/g, '');

    if (trimmedName.length < 3 || cleanPhone.length < 8) {
      if (returningVisitor) {
        setReturningVisitor(null);
        setUseExistingPhoto(false);
        setForm((curr) => ({ ...curr, identityPhoto: '' }));
      }
      return;
    }

    const timer = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await endpoints.publicLookupVisitor({
          fullName: form.fullName,
          phone: form.phone
        });

        if (res?.found && res?.visitor?.identityPhoto) {
          setReturningVisitor(res.visitor);
          setUseExistingPhoto(true);
          setForm((curr) => ({
            ...curr,
            identityPhoto: res.visitor.identityPhoto,
            identityNumber: curr.identityNumber || res.visitor.identityNumber || '',
            company: curr.company || res.visitor.company || ''
          }));
        } else {
          // Jika nama atau nomor WA tidak cocok dengan database
          if (returningVisitor) {
            setReturningVisitor(null);
            setUseExistingPhoto(false);
            setForm((curr) => ({
              ...curr,
              identityPhoto: ''
            }));
          }
        }
      } catch (err) {
        console.error('[LookupVisitor Error]', err);
      } finally {
        setLookupLoading(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [form.fullName, form.phone]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Filter PIC agar hanya menampilkan staf di departemen yang dipilih
  const filteredPics = form.departmentId
    ? pics.filter(
        (p) => p.departmentId === form.departmentId || p.department?.id === form.departmentId
      )
    : pics;

  const handleDepartmentChange = (e) => {
    const newDeptId = e.target.value;
    setForm((prev) => {
      // Jika PIC yang dipilih sebelumnya bukan dari departemen baru ini, reset pilihan PIC
      const isPicStillValid = pics.some(
        (p) =>
          p.id === prev.picUserId &&
          (p.departmentId === newDeptId || p.department?.id === newDeptId)
      );
      return {
        ...prev,
        departmentId: newDeptId,
        picUserId: isPicStillValid ? prev.picUserId : ''
      };
    });
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
          <div className="sm:col-span-2 w-full min-w-0">
            <label className="label">{t('register.full_name', 'Nama Tamu *')}</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div className="w-full min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">{t('register.phone', 'No. WhatsApp Tamu *')}</label>
              {lookupLoading && (
                <span className="text-[11px] text-brand-600 dark:text-brand-400 flex items-center gap-1 font-medium">
                  <Loader2 size={12} className="animate-spin" />
                  Mengecek data...
                </span>
              )}
              {!lookupLoading && returningVisitor && useExistingPhoto && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck size={13} />
                  Tamu Terdaftar Ditemukan
                </span>
              )}
            </div>
            <input
              className="input font-mono"
              value={form.phone}
              onChange={set('phone')}
              placeholder="0812xxxxxxx"
              inputMode="tel"
              required
            />
          </div>
          <div className="w-full min-w-0">
            <label className="label">{t('register.company', 'Perusahaan')}</label>
            <input className="input" value={form.company} onChange={set('company')} />
          </div>

          {/* Foto Identitas Tamu (Otomatis tampil jika tamu berulang) */}
          <div className="sm:col-span-2 w-full min-w-0">
            {returningVisitor && useExistingPhoto ? (
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 sm:p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-200">
                      Data Identitas Ditemukan
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 rounded-full">
                    Tamu Terdaftar
                  </span>
                </div>

                <div className="flex items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoModal(true)}
                      className="relative group shrink-0 cursor-pointer overflow-hidden rounded-xl border border-emerald-300 dark:border-emerald-700 shadow-xs"
                      title="Klik untuk melihat foto lebih besar"
                    >
                      <img
                        src={form.identityPhoto || returningVisitor.identityPhoto}
                        alt="Foto Identitas Tersimpan"
                        className="w-16 h-12 sm:w-20 sm:h-14 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye size={15} />
                      </div>
                    </button>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-white truncate">
                        {form.fullName}
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {form.identityNumber ? `No. Identitas: ${form.identityNumber}` : 'Foto Identitas Tersedia'}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium mt-0.5">
                        ✓ Foto KTP & NIK otomatis terisi, PIC tidak perlu isi manual lagi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewPhotoModal(true)}
                      className="btn-ghost text-xs p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                      title="Lihat foto"
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">Lihat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseExistingPhoto(false);
                        setForm((curr) => ({ ...curr, identityPhoto: '' }));
                      }}
                      className="btn-ghost text-xs p-2 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                      title="Foto Ulang atau Ganti Foto"
                    >
                      <RefreshCw size={14} />
                      <span className="hidden sm:inline">Ganti Foto</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {returningVisitor && !useExistingPhoto && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200">
                    <span>Mengambil / mengunggah foto baru untuk tamu ini.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setUseExistingPhoto(true);
                        setForm((curr) => ({
                          ...curr,
                          identityPhoto: returningVisitor.identityPhoto,
                          identityNumber: curr.identityNumber || returningVisitor.identityNumber || ''
                        }));
                      }}
                      className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
                    >
                      ← Gunakan Data Tersimpan
                    </button>
                  </div>
                )}
                <IdentityPhotoCapture
                  value={form.identityPhoto}
                  onChange={(photo) => setForm((c) => ({ ...c, identityPhoto: photo }))}
                  onNikDetected={(detectedNik) => {
                    setForm((c) => ({
                      ...c,
                      identityNumber: detectedNik
                    }));
                  }}
                  label="Foto Identitas (KTP/SIM/Paspor) — Opsional"
                  required={false}
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Jika belum ada foto, petugas Security akan mengambil foto fisik identitas saat tamu tiba di pos gerbang.
                </p>
              </div>
            )}
          </div>

          <div className="sm:col-span-2 w-full min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">No. Identitas (KTP/SIM/Paspor)</label>
              {form.identityNumber && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                  Terbaca / Diisi
                </span>
              )}
            </div>
            <input
              className="input font-mono"
              value={form.identityNumber}
              onChange={set('identityNumber')}
              placeholder="Nomor identitas (opsional)..."
            />
          </div>
          <div className="w-full min-w-0">
            <label className="label">{t('register.department', 'Departemen *')}</label>
            <select
              className="input"
              value={form.departmentId}
              onChange={handleDepartmentChange}
              required
            >
              <option value="">— Pilih —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full min-w-0">
            <label className="label">
              PIC {user.role === 'ADMIN' ? '(boleh pilih PIC lain)' : '(Anda)'}
            </label>
            <select
              className="input"
              value={form.picUserId}
              onChange={set('picUserId')}
              disabled={user.role !== 'ADMIN'}
            >
              <option value="">
                {user.role === 'ADMIN'
                  ? form.departmentId && filteredPics.length === 0
                    ? '— Tidak ada PIC aktif di departemen ini —'
                    : '— Pilih PIC —'
                  : user.name}
              </option>
              {user.role === 'ADMIN' &&
                filteredPics.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {!form.departmentId && p.department ? ` · ${p.department.name}` : ''}
                  </option>
                ))}
            </select>
          </div>
          <div className="w-full min-w-0">
            <label className="label">Tanggal *</label>
            <input
              type="date"
              className="input w-full max-w-full min-w-0"
              value={form.scheduledDate}
              onChange={set('scheduledDate')}
              required
            />
          </div>
          <div className="w-full min-w-0">
            <label className="label">Perkiraan Jam</label>
            <input
              type="time"
              className="input w-full max-w-full min-w-0"
              value={form.expectedTime}
              onChange={set('expectedTime')}
            />
          </div>
          <div className="sm:col-span-2 w-full min-w-0">
            <label className="label">{t('register.purpose', 'Keperluan *')}</label>
            <textarea className="input min-h-[70px]" value={form.purpose} onChange={set('purpose')} required />
          </div>
          <div className="w-full min-w-0">
            <label className="label">{t('register.visitors_count', 'Jumlah Orang')}</label>
            <input
              type="number"
              min="1"
              className="input"
              value={form.numberOfVisitors}
              onChange={set('numberOfVisitors')}
            />
          </div>
          <div className="w-full min-w-0">
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

      {/* Modal Preview Foto Dokumen KTP */}
      {previewPhotoModal && (
        <PhotoPreviewModal
          photoUrl={form.identityPhoto || returningVisitor?.identityPhoto}
          visitorName={form.fullName}
          identityNumber={form.identityNumber}
          onClose={() => setPreviewPhotoModal(false)}
        />
      )}
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
