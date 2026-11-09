import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { endpoints, errMsg } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';

const ROLE_LABEL = {
  ADMIN: 'Administrator',
  SECURITY: 'Security',
  PIC: 'PIC',
  MANAGEMENT: 'Management'
};

export default function Features() {
  const { refreshUser } = useAuth();
  const [features, setFeatures] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = () => {
    setLoading(true);
    endpoints
      .featureUsers()
      .then((d) => {
        setFeatures(d.features);
        setUsers(d.users);
        setError('');
        setSelectedId((id) => id || d.users.find((u) => u.isActive)?.id || d.users[0]?.id || '');
      })
      .catch((e) => setError(errMsg(e, 'Gagal memuat data fitur')))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const selected = users.find((u) => u.id === selectedId) || null;

  // Draft = nilai yang sedang diatur; null berarti "ikut bawaan role".
  useEffect(() => {
    if (!selected) {
      setDraft({});
      return;
    }
    const next = {};
    features.forEach((f) => {
      next[f.key] = Object.prototype.hasOwnProperty.call(selected.overrides, f.key)
        ? selected.overrides[f.key]
        : null;
    });
    setDraft(next);
  }, [selectedId, users, features]);

  const groups = useMemo(() => {
    const map = new Map();
    features.forEach((f) => {
      if (!map.has(f.group)) map.set(f.group, []);
      map.get(f.group).push(f);
    });
    return [...map.entries()];
  }, [features]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const valueFor = (f) => {
    if (!selected) return false;
    if (f.locked) return !!selected.features[f.key];
    const v = draft[f.key];
    if (v === null || v === undefined) return selected.features[f.key];
    return v;
  };

  const dirtyKeys = useMemo(
    () =>
      Object.keys(draft).filter((k) => {
        const current = Object.prototype.hasOwnProperty.call(selected?.overrides || {}, k)
          ? selected.overrides[k]
          : null;
        return draft[k] !== current;
      }),
    [draft, selected]
  );

  const toggle = (f) => {
    if (!selected || f.locked) return;
    const current = valueFor(f);
    const isDefault = f.defaultRoles.includes(selected.role);
    const next = !current;
    // Bila kembali ke nilai bawaan, simpan sebagai null (tanpa override).
    setDraft((d) => ({ ...d, [f.key]: next === isDefault ? null : next }));
  };

  const resetFeature = (f) => setDraft((d) => ({ ...d, [f.key]: null }));

  const save = async () => {
    if (!selected || !dirtyKeys.length) return;
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const payload = Object.fromEntries(dirtyKeys.map((k) => [k, draft[k]]));
      const res = await endpoints.saveUserFeatures(selected.id, payload);
      setUsers((list) =>
        list.map((u) =>
          u.id === selected.id ? { ...u, overrides: res.overrides, features: res.features } : u
        )
      );
      setNotice(`Hak fitur ${selected.name} tersimpan. User perlu memuat ulang halaman agar berlaku.`);
      if (res.user?.id) refreshUser();
    } catch (err) {
      setError(errMsg(err, 'Gagal menyimpan hak fitur'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Manajemen Fitur</h1>
          <p className="text-sm text-slate-500">
            Atur halaman dan aksi yang boleh dipakai tiap user. Fitur baru otomatis muncul di daftar
            ini.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck size={15} className="text-emerald-600" />
          {features.length} fitur · {users.length} user
        </div>
      </div>

      {error && <div className="card p-4 text-sm text-red-600">{error}</div>}
      {notice && (
        <div className="card p-4 text-sm text-emerald-700 bg-emerald-50 border-emerald-200 flex gap-2">
          <CheckCircle2 size={16} className="shrink-0" /> {notice}
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-slate-400">
          <Loader2 className="animate-spin inline" size={18} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-5 items-start">
          {/* Daftar user */}
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-slate-200">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  className="input pl-9"
                  placeholder="Cari nama / email / role"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-[560px] overflow-y-auto divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    u.id === selectedId ? 'bg-brand-50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-slate-800 truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                        u.role === 'ADMIN'
                          ? 'bg-brand-100 text-brand-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-400 mt-0.5">
                    {u.department?.name || 'Tanpa departemen'}
                    {!u.isActive && ' · nonaktif'}
                  </div>
                </button>
              ))}
              {filteredUsers.length === 0 && (
                <div className="px-4 py-8 text-center text-xs text-slate-400">User tidak ditemukan.</div>
              )}
            </div>
          </div>

          {/* Matriks fitur */}
          <div className="card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {selected ? selected.name : 'Pilih user'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {selected
                    ? `${ROLE_LABEL[selected.role] || selected.role}${
                        selected.department ? ` · ${selected.department.name}` : ''
                      }`
                    : 'Pilih user di kolom kiri untuk mengatur hak fitur.'}
                </div>
              </div>
              <button className="btn-primary" onClick={save} disabled={!dirtyKeys.length || saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Simpan
                {dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}
              </button>
            </div>

            {selected && (
              <div className="divide-y divide-slate-100">
                {groups.map(([group, items]) => (
                  <div key={group} className="p-5">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-2.5">
                      {group}
                    </div>
                    <div className="space-y-2">
                      {items.map((f) => {
                        const on = valueFor(f);
                        const overridden = !f.locked && draft[f.key] !== null && draft[f.key] !== undefined;
                        const isDefault = f.defaultRoles.includes(selected.role);
                        return (
                          <div
                            key={f.key}
                            className="flex items-start justify-between gap-3 rounded-md border border-slate-200 px-3 py-2.5"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[13px] font-medium text-slate-800">{f.label}</span>
                                <code className="text-[10px] text-slate-400">{f.key}</code>
                                {f.locked && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    <Lock size={9} /> terkunci
                                  </span>
                                )}
                                {overridden && (
                                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                                    khusus
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{f.description}</div>
                              <div className="text-[10.5px] text-slate-400 mt-0.5">
                                Bawaan role: {f.defaultRoles.join(', ') || '-'}
                                {isDefault ? ' · role ini termasuk' : ''}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {overridden && !f.locked && (
                                <button
                                  className="p-1 text-slate-400 hover:text-slate-700"
                                  title="Kembalikan ke bawaan role"
                                  onClick={() => resetFeature(f)}
                                >
                                  <RotateCcw size={14} />
                                </button>
                              )}
                              <button
                                type="button"
                                role="switch"
                                aria-checked={on}
                                disabled={f.locked}
                                onClick={() => toggle(f)}
                                title={f.locked ? 'Fitur terkunci mengikuti role' : 'Aktif / nonaktif'}
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                  on ? 'bg-emerald-500' : 'bg-slate-300'
                                } ${f.locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                              >
                                <span
                                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    on ? 'translate-x-5' : ''
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <div className="p-4 bg-slate-50 flex gap-2 text-[11.5px] text-slate-500">
                  <AlertTriangle size={14} className="shrink-0 mt-0.5 text-amber-500" />
                  Perubahan berlaku saat user memuat ulang halaman atau login kembali. Menu dan tombol
                  mengikuti hak fitur ini, dan server tetap memvalidasi setiap aksi.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}