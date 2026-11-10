import React, { useEffect, useState } from 'react';
import { Plus, Loader2, X, Pencil, Trash2, Save, User as UserIcon } from 'lucide-react';
import { endpoints, errMsg } from '../lib/api.js';
import { useI18n } from '../lib/i18n.jsx';

const ROLES = [
  ['PIC', 'PIC / Tuan Rumah'],
  ['SECURITY', 'Security'],
  ['MANAGEMENT', 'Management'],
  ['ADMIN', 'Administrator']
];

export default function Master() {
  const { t } = useI18n();
  const [tab, setTab] = useState('departments');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t('master.title', 'Master Data')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('master.subtitle', 'Kelola departemen dan akun pengguna sistem.')}
        </p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
        {[
          ['departments', t('master.tab_departments', 'Departemen')],
          ['users', t('master.tab_users', 'Pengguna & PIC')]
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === k
                ? 'border-brand-600 text-brand-700 dark:text-brand-400 dark:border-brand-500'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'departments' ? <Departments /> : <Users />}
    </div>
  );
}

function Departments() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    endpoints
      .departments()
      .then(setRows)
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await endpoints.createDepartment(form);
      setForm({ name: '', code: '' });
      load();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan'));
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (d) => {
    try {
      await endpoints.updateDepartment(d.id, { isActive: !d.isActive });
      load();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const saveEdit = async () => {
    if (!editing?.name || !editing?.code) return;
    setBusy(true);
    try {
      await endpoints.updateDepartment(editing.id, { name: editing.name, code: editing.code });
      setEditing(null);
      load();
    } catch (err) {
      alert(errMsg(err, 'Gagal memperbarui departemen'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Hapus departemen ${d.name}?`)) return;
    try {
      await endpoints.deleteDepartment(d.id);
      load();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus departemen'));
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-5 items-start">
      <div className="card p-4 sm:p-5 lg:col-span-2 overflow-hidden">
        {/* ================= CARD LIST DEPARTEMEN MOBILE (< md) ================= */}
        <div className="md:hidden space-y-2.5">
          {rows.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              Belum ada departemen.
            </div>
          )}
          {rows.map((d) => (
            <div
              key={d.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50">
                    {d.code}
                  </span>
                </div>
                <span
                  className={`badge border ${
                    d.isActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                      : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {d.isActive ? t('master.active', 'Aktif') : t('master.inactive', 'Nonaktif')}
                </span>
              </div>

              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                  {editing?.id === d.id ? (
                    <input
                      className="input py-1 text-sm mt-1"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  ) : (
                    d.name
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total Pengguna / PIC: <b>{d._count?.users ?? 0} orang</b>
                </div>
              </div>

              {/* Tombol Aksi Mobile */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {editing?.id === d.id ? (
                  <>
                    <button
                      className="btn-primary py-1 px-3 text-xs rounded-lg min-h-[32px]"
                      onClick={saveEdit}
                      disabled={busy}
                    >
                      <Save size={14} /> Simpan
                    </button>
                    <button
                      className="btn-ghost py-1 px-3 text-xs rounded-lg min-h-[32px]"
                      onClick={() => setEditing(null)}
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => toggle(d)}
                      className="btn-ghost py-1 px-2.5 text-xs rounded-lg min-h-[34px]"
                    >
                      {d.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...d })}
                      className="btn-ghost py-1 px-2.5 text-xs rounded-lg min-h-[34px] text-brand-600 dark:text-brand-400"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(d)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[34px] min-w-[34px] flex items-center justify-center"
                    >
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ================= TABEL DEPARTEMEN DESKTOP (hidden md:block) ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="th">{t('master.col_dept', 'Departemen')}</th>
                <th className="th">Kode</th>
                <th className="th">PIC</th>
                <th className="th">{t('master.col_status', 'Status')}</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rows.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="td font-medium text-slate-800 dark:text-slate-200">
                    {editing?.id === d.id ? (
                      <input
                        className="input py-1.5"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      />
                    ) : (
                      d.name
                    )}
                  </td>
                  <td className="td font-mono text-xs text-slate-600 dark:text-slate-400">
                    {editing?.id === d.id ? (
                      <input
                        className="input py-1.5 font-mono"
                        value={editing.code}
                        onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                      />
                    ) : (
                      d.code
                    )}
                  </td>
                  <td className="td text-slate-600 dark:text-slate-400">{d._count?.users ?? 0}</td>
                  <td className="td">
                    <span
                      className={`badge border ${
                        d.isActive
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                          : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {d.isActive ? t('master.active', 'Aktif') : t('master.inactive', 'Nonaktif')}
                    </span>
                  </td>
                  <td className="td">
                    <div className="flex items-center justify-end gap-2">
                      {editing?.id === d.id ? (
                        <>
                          <button className="text-brand-600 dark:text-brand-400 p-1" onClick={saveEdit} title="Simpan" disabled={busy}>
                            <Save size={15} />
                          </button>
                          <button className="text-slate-400 hover:text-slate-600 p-1" onClick={() => setEditing(null)} title="Batal">
                            <X size={15} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1" onClick={() => setEditing({ ...d })} title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1" onClick={() => remove(d)} title="Hapus">
                            <Trash2 size={15} />
                          </button>
                          <button className="text-xs text-brand-600 dark:text-brand-400 hover:underline" onClick={() => toggle(d)}>
                            {d.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="td text-center py-8 text-slate-400 dark:text-slate-500" colSpan={5}>
                    Belum ada departemen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4">
          {t('master.btn_add_dept', 'Tambah Departemen')}
        </h3>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="label">Nama Departemen</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Kode</label>
            <input
              className="input"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="HRGA"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}{' '}
            {t('action.save', 'Simpan')}
          </button>
        </form>
      </div>
    </div>
  );
}

function Users() {
  const { t } = useI18n();
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    endpoints.users().then(setRows).catch((e) => setError(errMsg(e)));
    endpoints.departments().then(setDepartments).catch(() => {});
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} /> {t('master.btn_add_user', 'Tambah Pengguna')}
        </button>
      </div>

      {error && <div className="card p-4 text-sm text-red-600 dark:text-red-400">{error}</div>}

      <div className="card overflow-hidden">
        {/* ================= CARD LIST PENGGUNA & PIC KHUSUS MOBILE (< md) ================= */}
        <div className="md:hidden p-3 space-y-2.5">
          {rows.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">
              Belum ada data pengguna atau PIC.
            </div>
          )}
          {rows.map((u) => (
            <div
              key={u.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {u.name}
                  </span>
                  {u.username && (
                    <span className="font-mono text-[11px] font-bold text-brand-600 dark:text-brand-400">
                      @{u.username}
                    </span>
                  )}
                </div>
                <span
                  className={`badge border ${
                    u.isActive
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                      : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  {u.isActive ? t('master.active', 'Aktif') : t('master.inactive', 'Nonaktif')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                    Email
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate block">
                    {u.email}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">
                    Role & Dept
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 truncate block font-semibold">
                    {u.role} · {u.department?.code || '-'}
                  </span>
                </div>
              </div>

              {u.phone && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span>WhatsApp:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {u.phone}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditing(u)}
                  className="btn-ghost py-1.5 px-3 text-xs rounded-lg font-bold text-brand-600 dark:text-brand-400 min-h-[34px]"
                >
                  <Pencil size={13} /> Edit Pengguna
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(u)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 min-h-[34px] min-w-[34px] flex items-center justify-center"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ================= TABEL PENGGUNA DESKTOP (hidden md:block) ================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800/80">
              <tr>
                <th className="th">{t('master.col_name', 'Nama')}</th>
                <th className="th">{t('master.col_username', 'Username')}</th>
                <th className="th">{t('master.col_email', 'Email')}</th>
                <th className="th">{t('master.col_role', 'Role')}</th>
                <th className="th">{t('master.col_dept', 'Departemen')}</th>
                <th className="th">{t('master.col_phone', 'WhatsApp')}</th>
                <th className="th">{t('master.col_status', 'Status')}</th>
                <th className="th text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="td font-medium text-slate-800 dark:text-slate-200">{u.name}</td>
                  <td className="td">
                    {u.username ? (
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700">
                        @{u.username}
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic text-xs">-</span>
                    )}
                  </td>
                  <td className="td text-slate-600 dark:text-slate-400 text-xs">{u.email}</td>
                  <td className="td">
                    <span className="badge border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                      {u.role}
                    </span>
                  </td>
                  <td className="td text-slate-600 dark:text-slate-400">{u.department?.name || '-'}</td>
                  <td className="td text-slate-600 dark:text-slate-400 text-xs font-mono">{u.phone || '-'}</td>
                  <td className="td">
                    <span
                      className={`badge border ${
                        u.isActive
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/50'
                          : 'bg-slate-200 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}
                    >
                      {u.isActive ? t('master.active', 'Aktif') : t('master.inactive', 'Nonaktif')}
                    </span>
                  </td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 p-1 transition-colors"
                        onClick={() => setEditing(u)}
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 p-1 transition-colors"
                        onClick={() => setDeleteTarget(u)}
                        title="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <UserModal
          user={editing}
          departments={departments}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteUser
          user={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => {
            setDeleteTarget(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ConfirmDeleteUser({ user, onClose, onDeleted }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    setBusy(true);
    try {
      await endpoints.deleteUser(user.id);
      onDeleted();
    } catch (err) {
      alert(errMsg(err, 'Gagal menghapus pengguna'));
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-sm shadow-xl p-5">
        <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mb-3">
          <Trash2 size={18} />
        </div>
        <h3 className="font-semibold text-slate-900 dark:text-white">Hapus pengguna?</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Akun <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong> akan dihapus. Riwayat kunjungan tetap tersimpan.
        </p>
        <div className="flex gap-2 mt-5">
          <button className="btn-ghost flex-1" onClick={onClose}>
            {t('action.cancel', 'Batal')}
          </button>
          <button className="btn-danger flex-1" onClick={remove} disabled={busy}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}{' '}
            {t('action.delete', 'Hapus')}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserModal({ user, departments, onClose, onSaved }) {
  const { t } = useI18n();
  const isNew = !user.id;
  const [form, setForm] = useState({
    name: user.name || '',
    username: user.username || '',
    email: user.email || '',
    phone: user.phone || '',
    role: user.role || 'PIC',
    departmentId: user.department?.id || user.departmentId || '',
    password: '',
    canReceiveVisits: user.canReceiveVisits !== false,
    isActive: user.isActive !== false
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) =>
    setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isNew) {
        await endpoints.createUser(form);
      } else {
        const { password, ...rest } = form;
        await endpoints.updateUser(user.id, password ? { ...rest, password } : rest);
      }
      onSaved();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan pengguna'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg w-full max-w-lg shadow-xl my-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {isNew ? t('master.btn_add_user', 'Tambah Pengguna') : 'Edit Pengguna'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3.5">
          <div>
            <label className="label">{t('master.col_name', 'Nama Lengkap')} *</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('master.col_username', 'Username')}</label>
              <div className="relative">
                <input
                  className="input pl-8"
                  value={form.username}
                  onChange={set('username')}
                  placeholder="mis. bambang123"
                  autoComplete="off"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-mono">
                  @
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                {t('master.username_hint', 'Digunakan untuk login selain email.')}
              </p>
            </div>
            <div>
              <label className="label">{t('master.col_email', 'Email')} *</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('master.col_role', 'Role')} *</label>
              <select className="input" value={form.role} onChange={set('role')}>
                {ROLES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('master.col_dept', 'Departemen')}</label>
              <select className="input" value={form.departmentId} onChange={set('departmentId')}>
                <option value="">— Tidak ada —</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">
              {t('master.col_phone', 'Nomor WhatsApp')} {form.role === 'PIC' ? '*' : ''}
            </label>
            <input
              className="input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="0812xxxxxxx atau 62812xxxxxxx"
              required={form.role === 'PIC'}
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Notifikasi kedatangan tamu dikirim ke nomor ini.
            </p>
          </div>

          <div>
            <label className="label">
              {isNew ? 'Password *' : 'Password baru (opsional)'}
            </label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={set('password')}
              required={isNew}
              placeholder={isNew ? '' : 'Kosongkan bila tidak diubah'}
            />
          </div>

          <div className="flex gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                checked={form.canReceiveVisits}
                onChange={set('canReceiveVisits')}
              />
              {t('master.can_receive', 'Dapat menerima tamu')}
            </label>
            {!isNew && (
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  checked={form.isActive}
                  onChange={set('isActive')}
                />
                {t('master.active', 'Akun aktif')}
              </label>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>
              {t('action.cancel', 'Batal')}
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null} {t('action.save', 'Simpan')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
