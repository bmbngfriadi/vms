import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Search, X, Loader2, CalendarPlus, Pencil, Trash2 } from 'lucide-react';
import { endpoints, errMsg, fmtDateTime, fmtDate, fmtTime, todayISO } from '../lib/api.js';
import StatusBadge, { TYPE_LABEL } from '../components/StatusBadge.jsx';
import VisitEditModal, { confirmDeleteVisit } from '../components/VisitEditModal.jsx';
import { useAuth } from '../lib/auth.jsx';

const STATUSES = [
  ['ALL', 'Semua status'],
  ['WAITING_VALIDATION', 'Menunggu Validasi'],
  ['APPROVED', 'Terjadwal'],
  ['CHECKED_IN', 'Di Dalam'],
  ['CHECKED_OUT', 'Selesai'],
  ['REJECTED', 'Ditolak'],
  ['CANCELLED', 'Dibatalkan']
];

export default function Visits() {
  const { user, can } = useAuth();
  const canCreate = can('visit.create');
  const canEdit = can('visit.edit');
  const canDelete = can('visit.delete');
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('ALL');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null);

  const removeRow = async (v) => {
    try {
      if (await confirmDeleteVisit(v)) {
        setDetail(null);
        load();
      }
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus kunjungan'));
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
    const t = setTimeout(load, search ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Data Kunjungan</h1>
          <p className="text-sm text-slate-500">{total} kunjungan tercatat</p>
        </div>
        {canCreate && (
          <button className="btn-primary" onClick={() => setShowCreate(true)}>
            <CalendarPlus size={16} /> Buat Janji Temu
          </button>
        )}
      </div>

      <div className="card p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Cari nama / perusahaan / no. kunjungan"
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
                {l}
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
            Reset filter
          </button>
        </div>
      </div>

      {error && <div className="card p-4 text-sm text-red-600">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">No. Kunjungan</th>
                <th className="th">Tamu</th>
                <th className="th">Departemen</th>
                <th className="th">PIC</th>
                <th className="th">Tipe</th>
                <th className="th">Status</th>
                <th className="th">Masuk</th>
                <th className="th">Keluar</th>
                {(canEdit || canDelete) && <th className="th text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td
                    className="td text-center py-10 text-slate-400"
                    colSpan={canEdit || canDelete ? 9 : 8}
                  >
                    <Loader2 className="animate-spin inline" size={16} />
                  </td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    className="td text-center py-10 text-slate-400"
                    colSpan={canEdit || canDelete ? 9 : 8}
                  >
                    Tidak ada data kunjungan.
                  </td>
                </tr>
              )}
              {!loading &&
                rows.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/70 cursor-pointer"
                    onClick={() => setDetail(v)}
                  >
                    <td className="td font-mono text-xs">{v.visitNumber}</td>
                    <td className="td">
                      <div className="font-medium text-slate-800">{v.visitorName}</div>
                      <div className="text-xs text-slate-500">{v.company || '-'}</div>
                    </td>
                    <td className="td">{v.department?.name || '-'}</td>
                    <td className="td">{v.picName}</td>
                    <td className="td text-xs text-slate-600">{TYPE_LABEL[v.visitType]}</td>
                    <td className="td">
                      <StatusBadge status={v.status} />
                    </td>
                    <td className="td text-slate-600">{v.checkInAt ? fmtTime(v.checkInAt) : '-'}</td>
                    <td className="td text-slate-600">{v.checkOutAt ? fmtTime(v.checkOutAt) : '-'}</td>
                    {(canEdit || canDelete) && (
                      <td className="td">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              className="p-1.5 rounded text-slate-500 hover:bg-slate-100 hover:text-brand-600"
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
                              className="p-1.5 rounded text-slate-500 hover:bg-red-50 hover:text-red-600"
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
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
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
    </div>
  );
}

function DetailModal({ visit, onClose, onChanged, canEdit, canDelete, onEdit, onDelete }) {
  const { can } = useAuth();
  const [busy, setBusy] = useState(false);
  const canCancel = can('visit.cancel') && ['WAITING_VALIDATION', 'APPROVED'].includes(visit.status);

  const cancel = async () => {
    const reason = window.prompt('Alasan pembatalan:', 'Dibatalkan oleh PIC');
    if (reason === null) return;
    setBusy(true);
    try {
      await endpoints.cancel(visit.id, reason);
      onChanged();
      onClose();
    } catch (err) {
      alert(errMsg(err, 'Gagal membatalkan'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Detail Kunjungan" onClose={onClose}>
      <div className="space-y-2.5 text-sm">
        <Row label="No. Kunjungan" value={visit.visitNumber} mono />
        <Row label="Status" value={<StatusBadge status={visit.status} />} />
        <Row label="Tipe" value={TYPE_LABEL[visit.visitType]} />
        <div className="h-px bg-slate-100 my-3" />
        <Row label="Nama Tamu" value={visit.visitorName} />
        <Row label="Perusahaan" value={visit.company || '-'} />
        {visit.phone && <Row label="WhatsApp" value={visit.phone} />}
        <Row label="Departemen" value={visit.department?.name || '-'} />
        <Row label="PIC" value={visit.picName} />
        <Row label="Keperluan" value={visit.purpose} />
        <Row label="Jumlah" value={`${visit.numberOfVisitors} orang`} />
        {visit.vehiclePlate && <Row label="Kendaraan" value={visit.vehiclePlate} />}
        <Row label="Rencana" value={`${fmtDate(visit.scheduledDate)} ${visit.expectedTime || ''}`} />
        <div className="h-px bg-slate-100 my-3" />
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
          Tutup
        </button>
        {canDelete && (
          <button className="btn-ghost text-red-600" onClick={onDelete}>
            <Trash2 size={15} /> Hapus
          </button>
        )}
        {canCancel && (
          <button className="btn-ghost" onClick={cancel} disabled={busy}>
            Batalkan
          </button>
        )}
        {canEdit && (
          <button className="btn-primary flex-1" onClick={onEdit}>
            <Pencil size={15} /> Edit Kunjungan
          </button>
        )}
      </div>
    </Modal>
  );
}

function CreateModal({ user, onClose, onCreated }) {
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
          <p className="text-sm text-slate-600">
            Undangan dan barcode telah dikirim ke WhatsApp tamu.
          </p>
          <div className="mt-4 inline-block p-3 bg-white border border-slate-200 rounded-lg">
            <img src={created.qrDataUrl} alt="Barcode" className="w-48 h-48" />
          </div>
          <div className="mt-3 font-mono text-sm font-semibold">{created.visitNumber}</div>
          <button className="btn-primary w-full mt-5" onClick={onCreated}>
            Selesai
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Buat Janji Temu Tamu" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Nama Tamu *</label>
            <input className="input" value={form.fullName} onChange={set('fullName')} required />
          </div>
          <div>
            <label className="label">No. WhatsApp Tamu *</label>
            <input
              className="input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="0812xxxxxxx"
              required
            />
          </div>
          <div>
            <label className="label">Perusahaan</label>
            <input className="input" value={form.company} onChange={set('company')} />
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
        </div>

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button type="button" className="btn-ghost flex-1" onClick={onClose}>
            Batal
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
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-lg shadow-xl my-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={17} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-right text-slate-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
