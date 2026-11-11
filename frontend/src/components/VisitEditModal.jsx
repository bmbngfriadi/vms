import React, { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, X, Eye } from 'lucide-react';
import { endpoints, errMsg } from '../lib/api.js';
import { useDialog } from '../lib/dialog.jsx';
import PhotoPreviewModal from './PhotoPreviewModal.jsx';

const STATUS_OPTIONS = [
  ['WAITING_VALIDATION', 'Menunggu Validasi'],
  ['APPROVED', 'Terjadwal'],
  ['CHECKED_IN', 'Di Dalam'],
  ['CHECKED_OUT', 'Selesai'],
  ['REJECTED', 'Ditolak'],
  ['CANCELLED', 'Dibatalkan']
];

const toDateInput = (v) => (v ? new Date(v).toISOString().slice(0, 10) : '');

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={onClose} />
      <div
        className={`relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} shadow-2xl my-auto max-h-[92vh] flex flex-col`}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/** Hapus kunjungan dengan konfirmasi. Mengembalikan true bila terhapus. */
export async function confirmDeleteVisit(visit, confirmFn) {
  const label = `${visit.visitNumber} — ${visit.visitorName}`;
  if (confirmFn) {
    const ok = await confirmFn({
      title: 'Hapus Kunjungan Tamu',
      message: `Hapus kunjungan ${label}?\n\nData kunjungan dan token barcode-nya akan dihapus permanen.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      danger: true,
      icon: 'trash'
    });
    if (!ok) return false;
  }
  await endpoints.deleteVisit(visit.id);
  return true;
}

export default function VisitEditModal({ visit, onClose, onSaved, onDeleted }) {
  const { confirm } = useDialog();
  const [departments, setDepartments] = useState([]);
  const [pics, setPics] = useState([]);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [form, setForm] = useState({
    fullName: visit.visitorName || '',
    phone: visit.phone || '',
    company: visit.company || '',
    identityNumber: visit.identityNumber || '',
    departmentId: visit.department?.id || '',
    picUserId: visit.picUser?.id || '',
    picNameManual: visit.picNameManual || '',
    purpose: visit.purpose || '',
    scheduledDate: toDateInput(visit.scheduledDate),
    expectedTime: visit.expectedTime || '',
    numberOfVisitors: visit.numberOfVisitors || 1,
    vehiclePlate: visit.vehiclePlate || '',
    badgeNumber: visit.badgeNumber || '',
    note: visit.note || '',
    status: visit.status
  });
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    endpoints.departments().then(setDepartments).catch(() => { });
    endpoints.pics().then(setPics).catch(() => { });
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, numberOfVisitors: Number(form.numberOfVisitors) || 1 };
      if (!payload.picUserId) payload.picNameManual = form.picNameManual || null;
      const updated = await endpoints.updateVisit(visit.id, payload);
      onSaved?.(updated);
      onClose();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan perubahan'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setError('');
    const ok = await confirm({
      title: 'Hapus Kunjungan Tamu',
      message: `Hapus kunjungan ${visit.visitNumber} (${visit.visitorName})?\n\nData kunjungan dan token barcode-nya akan dihapus permanen.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      danger: true,
      icon: 'trash'
    });
    if (!ok) return;

    setDeleting(true);
    try {
      await endpoints.deleteVisit(visit.id);
      onDeleted?.(visit);
      onClose();
    } catch (err) {
      setError(errMsg(err, 'Gagal menghapus kunjungan'));
    } finally {
      setDeleting(false);
    }
  };

  const picsInDept = pics.filter((p) => !form.departmentId || p.department?.id === form.departmentId);

  return (
    <Modal title={`Edit Kunjungan ${visit.visitNumber}`} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nama Tamu *</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div>
            <label className="label">No. WhatsApp</label>
            <input className="input" value={form.phone} onChange={set('phone')} placeholder="0812xxxxxxx" />
          </div>
          <div>
            <label className="label">Perusahaan</label>
            <input className="input" value={form.company} onChange={set('company')} />
          </div>
          <div>
            <label className="label">No. Identitas</label>
            <input className="input" value={form.identityNumber} onChange={set('identityNumber')} />
          </div>
          {visit.identityPhoto && (
            <div className="sm:col-span-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={visit.identityPhoto}
                  alt="Foto Identitas"
                  className="w-16 h-11 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowPhotoPreview(true)}
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Foto Identitas Terlampir</span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">KTP/SIM/Paspor terunggah saat pendaftaran</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-ghost text-xs py-1.5 px-3 rounded-lg font-bold text-brand-600 dark:text-brand-400"
                onClick={() => setShowPhotoPreview(true)}
              >
                Lihat Foto
              </button>
            </div>
          )}
          <div>
            <label className="label">Status *</label>
            <select className="input" value={form.status} onChange={set('status')}>
              {STATUS_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Departemen *</label>
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
            <label className="label">PIC</label>
            <select className="input" value={form.picUserId} onChange={set('picUserId')}>
              <option value="">— Tanpa PIC / isi manual —</option>
              {picsInDept.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.department ? ` · ${p.department.name}` : ''}
                </option>
              ))}
            </select>
          </div>
          {!form.picUserId && (
            <div className="sm:col-span-2">
              <label className="label">Nama PIC (manual)</label>
              <input className="input" value={form.picNameManual} onChange={set('picNameManual')} />
            </div>
          )}
          <div>
            <label className="label">Tanggal Rencana *</label>
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
            <label className="label">Keperluan *</label>
            <textarea className="input min-h-[70px]" value={form.purpose} onChange={set('purpose')} required />
          </div>
          <div>
            <label className="label">Jumlah Orang</label>
            <input
              type="number"
              min="1"
              className="input"
              value={form.numberOfVisitors}
              onChange={set('numberOfVisitors')}
            />
          </div>
          <div>
            <label className="label">No. Polisi</label>
            <input className="input" value={form.vehiclePlate} onChange={set('vehiclePlate')} />
          </div>
          <div>
            <label className="label">No. Badge</label>
            <input className="input" value={form.badgeNumber} onChange={set('badgeNumber')} />
          </div>
          <div>
            <label className="label">Catatan</label>
            <input className="input" value={form.note} onChange={set('note')} />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={remove}
            disabled={busy || deleting}
            title="Hapus kunjungan"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Hapus
          </button>
          <button type="submit" className="btn-primary flex-1" disabled={busy || deleting}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Simpan Perubahan
          </button>
        </div>
      </form>

      {showPhotoPreview && (
        <PhotoPreviewModal
          photoUrl={visit.identityPhoto}
          visitorName={visit.visitorName}
          identityNumber={visit.identityNumber}
          onClose={() => setShowPhotoPreview(false)}
        />
      )}
    </Modal>
  );
}