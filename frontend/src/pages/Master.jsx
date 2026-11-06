import React, { useEffect, useState } from 'react';
import { Plus, Loader2, X, Pencil } from 'lucide-react';
import { endpoints, errMsg } from '../lib/api.js';

const ROLES = [
  ['PIC', 'PIC / Tuan Rumah'],
  ['SECURITY', 'Security'],
  ['MANAGEMENT', 'Management'],
  ['ADMIN', 'Administrator']
];

export default function Master() {
  const [tab, setTab] = useState('departments');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Master Data</h1>
        <p className="text-sm text-slate-500">Kelola departemen dan akun pengguna sistem.</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200">
        {[
          ['departments', 'Departemen'],
          ['users', 'Pengguna & PIC']
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === k
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ name: '', code: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = () =>
    endpoints
      .departments()
      .then(setRows)
      .catch((e) => setError(errMsg(e)));

  useEffect(load, []);

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

  return (
    <div className="grid lg:grid-cols-3 gap-5 items-start">
      <div className="card p-5 lg:col-span-2 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="th">Departemen</th>
              <th className="th">Kode</th>
              <th className="th">PIC</th>
              <th className="th">Status</th>
              <th className="th"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="td font-medium text-slate-800">{d.name}</td>
                <td className="td font-mono text-xs">{d.code}</td>
                <td className="td text-slate-600">{d._count?.users ?? 0}</td>
                <td className="td">
                  <span
                    className={`badge ${
                      d.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {d.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="td text-right">
                  <button className="text-xs text-brand-600 hover:underline" onClick={() => toggle(d)}>
                    {d.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="td text-center py-8 text-slate-400" colSpan={5}>
                  Belum ada departemen.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Tambah Departemen</h3>
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
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Simpan
          </button>
        </form>
      </div>
    </div>
  );
}

function Users() {
  const [rows, setRows] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    endpoints.users().then(setRows).catch((e) => setError(errMsg(e)));
    endpoints.departments().then(setDepartments).catch(() => {});
  };

  useEffect(load, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="btn-primary" onClick={() => setEditing({})}>
          <Plus size={16} /> Tambah Pengguna
        </button>
      </div>

      {error && <div className="card p-4 text-sm text-red-600">{error}</div>}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">Nama</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Departemen</th>
                <th className="th">WhatsApp</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60">
                  <td className="td font-medium text-slate-800">{u.name}</td>
                  <td className="td text-slate-600 text-xs">{u.email}</td>
                  <td className="td">
                    <span className="badge bg-slate-100 text-slate-700">{u.role}</span>
                  </td>
                  <td className="td text-slate-600">{u.department?.name || '-'}</td>
                  <td className="td text-slate-600 text-xs">{u.phone || '-'}</td>
                  <td className="td">
                    <span
                      className={`badge ${
                        u.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {u.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="td text-right">
                    <button
                      className="text-slate-400 hover:text-brand-600"
                      onClick={() => setEditing(u)}
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
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
    </div>
  );
}

function UserModal({ user, departments, onClose, onSaved }) {
  const isNew = !user.id;
  const [form, setForm] = useState({
    name: user.name || '',
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
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg w-full max-w-lg shadow-xl my-auto">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800">
            {isNew ? 'Tambah Pengguna' : 'Edit Pengguna'}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <label className="label">Nama Lengkap *</label>
            <input className="input" value={form.name} onChange={set('name')} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={set('email')}
              disabled={!isNew}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role *</label>
              <select className="input" value={form.role} onChange={set('role')}>
                {ROLES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Departemen</label>
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
            <label className="label">Nomor WhatsApp {form.role === 'PIC' ? '*' : ''}</label>
            <input
              className="input"
              value={form.phone}
              onChange={set('phone')}
              placeholder="62812xxxxxxx"
              required={form.role === 'PIC'}
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Notifikasi kedatangan tamu dikirim ke nomor ini.
            </p>
          </div>
          <div>
            <label className="label">{isNew ? 'Password *' : 'Password baru (opsional)'}</label>
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
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.canReceiveVisits} onChange={set('canReceiveVisits')} />
              Dapat menerima tamu
            </label>
            {!isNew && (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
                Akun aktif
              </label>
            )}
          </div>

          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-ghost flex-1" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : null} Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
