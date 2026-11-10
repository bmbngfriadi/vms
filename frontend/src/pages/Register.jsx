import React, { useEffect, useState } from 'react';
import { CheckCircle2, QrCode, ArrowRight, Loader2, LogIn } from 'lucide-react';
import { endpoints, errMsg } from '../lib/api.js';
import IdentityPhotoCapture from '../components/IdentityPhotoCapture.jsx';

const EMPTY = {
  fullName: '',
  phone: '',
  company: '',
  identityNumber: '',
  identityPhoto: '',
  departmentId: '',
  picUserId: '',
  purpose: '',
  numberOfVisitors: 1,
  vehiclePlate: ''
};

export default function Register() {
  const [form, setForm] = useState(EMPTY);
  const [departments, setDepartments] = useState([]);
  const [pics, setPics] = useState([]);
  const [picsLoading, setPicsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    endpoints
      .publicDepartments()
      .then(setDepartments)
      .catch(() => setError('Gagal memuat daftar departemen. Periksa koneksi.'));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const selectDepartment = async (e) => {
    const departmentId = e.target.value;
    setForm((current) => ({ ...current, departmentId, picUserId: '' }));
    setPics([]);
    if (!departmentId) return;
    setPicsLoading(true);
    try {
      setPics(await endpoints.publicPics(departmentId));
    } catch {
      setError('Gagal memuat daftar PIC. Silakan pilih departemen kembali.');
    } finally {
      setPicsLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.identityPhoto) {
      setError('Foto identitas (KTP/SIM/Paspor) wajib dilampirkan.');
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      const data = await endpoints.publicRegister({
        ...form,
        numberOfVisitors: Number(form.numberOfVisitors) || 1
      });
      setResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(errMsg(err, 'Gagal mengirim pendaftaran'));
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen bg-slate-100 py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center gap-2 mb-6">
            <img src="/logo.png" alt="Logo" className="h-9 w-auto" />
            <div className="text-left">
              <div className="text-sm font-semibold text-slate-900 leading-tight">PT CEMINDO GEMILANG Tbk</div>
              <div className="text-[11px] text-slate-500">Plant Batam · Visitor Pass</div>
            </div>
          </div>
          <div className="card p-6 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="text-emerald-600" size={26} />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-slate-900">Pendaftaran Berhasil</h1>
            <p className="text-sm text-slate-500 mt-1">
              Tunjukkan barcode berikut kepada petugas Security di pos gerbang.
            </p>

            <div className="mt-5 inline-block p-3 bg-white border border-slate-200 rounded-lg">
              <img src={result.qrDataUrl} alt="Barcode kunjungan" className="w-56 h-56" />
            </div>

            <div className="mt-4 text-sm">
              <div className="text-slate-500 text-xs uppercase tracking-wide">No. Kunjungan</div>
              <div className="font-mono font-semibold text-slate-900">{result.visitNumber}</div>
            </div>

            <div className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-left">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Simpan halaman ini. Barcode juga dikirim ke WhatsApp Anda. Setelah Security memvalidasi,
                barcode baru untuk keluar akan muncul otomatis di halaman pass.
              </p>
            </div>

            <a
              href={`/pass/${result.passToken}`}
              className="btn-primary w-full mt-5"
              onClick={() => setResult(null)}
            >
              <QrCode size={16} /> Buka Halaman Pass <ArrowRight size={15} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img src="/logo.png" alt="Logo" className="h-10 w-auto shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">PT CEMINDO GEMILANG Tbk</div>
              <div className="text-xs text-slate-500">Plant Batam · Pendaftaran Tamu</div>
            </div>
          </div>
          <a href="/login" className="btn-ghost text-xs shrink-0">
            <LogIn size={14} /> Masuk
          </a>
        </div>

        <div className="card">
          <div className="px-6 py-5 border-b border-slate-200">
            <h1 className="text-lg font-semibold text-slate-900">Formulir Kunjungan Tamu</h1>
            <p className="text-sm text-slate-500 mt-1">
              Isi data berikut sebelum memasuki kawasan pabrik. Petugas Security akan memvalidasi
              kedatangan Anda.
            </p>
          </div>

          <form onSubmit={submit} className="p-6 space-y-5">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Data Tamu
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Nama Lengkap (sesuai KTP) *</label>
                  <input className="input" value={form.fullName} onChange={set('fullName')} required />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Nomor WhatsApp *</label>
                  <input
                    className="input"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="0812xxxxxxx"
                    inputMode="tel"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Barcode & notifikasi dikirim ke nomor ini.</p>
                </div>

                {/* Kolom Foto Identitas (Mandatory) - Kamera Langsung & Upload File */}
                <div className="sm:col-span-2">
                  <IdentityPhotoCapture
                    value={form.identityPhoto}
                    onChange={(photo) => setForm((curr) => ({ ...curr, identityPhoto: photo }))}
                    onNikDetected={(detectedNik) => {
                      setForm((curr) => ({
                        ...curr,
                        identityNumber: detectedNik
                      }));
                    }}
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="label">No. Identitas (KTP/SIM/Paspor)</label>
                    {form.identityNumber && (
                      <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">
                        Dapat Dikoreksi
                      </span>
                    )}
                  </div>
                  <input
                    className="input font-mono"
                    value={form.identityNumber}
                    onChange={set('identityNumber')}
                    placeholder="Nomor identitas (otomatis terisi dari foto)"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Terbaca otomatis dari foto. Tamu dapat mengoreksi data jika diperlukan.
                  </p>
                </div>
                <div>
                  <label className="label">Perusahaan / Instansi</label>
                  <input className="input" value={form.company} onChange={set('company')} placeholder="PT Contoh / Pribadi" />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Tujuan Kunjungan
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Departemen Tujuan *</label>
                  <select className="input" value={form.departmentId} onChange={selectDepartment} required>
                    <option value="">— Pilih departemen —</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">PIC / Orang yang Dituju *</label>
                  <select
                    className="input"
                    value={form.picUserId}
                    onChange={set('picUserId')}
                    disabled={!form.departmentId || picsLoading}
                    required
                  >
                    <option value="">
                      {!form.departmentId
                        ? '— Pilih departemen terlebih dahulu —'
                        : picsLoading
                        ? 'Memuat PIC…'
                        : pics.length === 0
                        ? '— Tidak ada PIC aktif —'
                        : '— Pilih PIC —'}
                    </option>
                    {pics.map((pic) => (
                      <option key={pic.id} value={pic.id}>
                        {pic.name}
                      </option>
                    ))}
                  </select>
                  {form.departmentId && !picsLoading && pics.length === 0 && (
                    <p className="text-[11px] text-brand-600 mt-1">
                      Departemen ini belum memiliki PIC aktif. Hubungi petugas Security.
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Keperluan Kunjungan *</label>
                  <textarea
                    className="input min-h-[76px]"
                    value={form.purpose}
                    onChange={set('purpose')}
                    placeholder="Contoh: Meeting teknis, pengiriman material, maintenance alat"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
                Lainnya
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Jumlah Orang</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    className="input"
                    value={form.numberOfVisitors}
                    onChange={set('numberOfVisitors')}
                  />
                </div>
                <div>
                  <label className="label">Nomor Polisi Kendaraan</label>
                  <input
                    className="input"
                    value={form.vehiclePlate}
                    onChange={set('vehiclePlate')}
                    placeholder="BP 1234 XY"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
              {loading ? 'Mengirim…' : 'Kirim & Dapatkan Barcode'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-5">
          © {new Date().getFullYear()} PT Cemindo Gemilang Tbk — Visitor Management System
        </p>
      </div>
    </div>
  );
}
