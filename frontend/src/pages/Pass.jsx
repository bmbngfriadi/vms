import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LogOut, LogIn, Loader2 } from 'lucide-react';
import { endpoints, errMsg, fmtTime } from '../lib/api.js';

export default function Pass() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () =>
    endpoints
      .publicPass(token)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((e) => setError(errMsg(e, 'Pass tidak ditemukan')))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const id = setInterval(load, 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        <Loader2 className="animate-spin mr-2" size={16} /> Memuat pass…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100">
        <div className="card p-6 max-w-sm w-full text-center">
          <img src="/logo.png" alt="Logo" className="h-10 mx-auto mb-4 opacity-80" />
          <AlertCircle className="mx-auto text-red-500" size={28} />
          <h1 className="mt-3 font-semibold text-slate-900">Pass tidak ditemukan</h1>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
          <a href="/register" className="btn-ghost mt-4 w-full">
            Daftar kunjungan baru
          </a>
        </div>
      </div>
    );
  }

  const isCheckout = data.action === 'CHECK_OUT';
  const isDone = data.status === 'CHECKED_OUT';

  const tone = isDone
    ? { bg: 'bg-slate-50', border: 'border-slate-200', icon: 'text-slate-500', title: 'Kunjungan Selesai' }
    : isCheckout
    ? {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        title: 'Barcode Check-Out'
      }
    : {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'text-blue-600',
        title: 'Barcode Check-In'
      };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-md mx-auto">
        <div className="mb-4 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-9 w-auto" />
          <div className="text-left">
            <div className="text-sm font-semibold text-slate-900 leading-tight">PT CEMINDO GEMILANG Tbk</div>
            <div className="text-[11px] text-slate-500">Plant Batam · Visitor Pass</div>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className={`px-5 py-4 border-b ${tone.bg} ${tone.border}`}>
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2 className={tone.icon} size={18} />
              ) : isCheckout ? (
                <LogOut className={tone.icon} size={18} />
              ) : (
                <LogIn className={tone.icon} size={18} />
              )}
              <span className="text-sm font-semibold text-slate-800">{tone.title}</span>
            </div>
          </div>

          <div className="p-5">
            {data.qrDataUrl ? (
              <div className="text-center">
                <div className="inline-block p-3 bg-white border border-slate-200 rounded-lg">
                  <img src={data.qrDataUrl} alt="Barcode" className="w-60 h-60" />
                </div>
                <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                  {isCheckout
                    ? 'Tunjukkan barcode ini kepada petugas Security saat keluar dari area pabrik.'
                    : 'Tunjukkan barcode ini kepada petugas Security di pos gerbang untuk validasi.'}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto text-emerald-500" size={36} />
                <p className="text-sm text-slate-600 mt-2">
                  Tidak ada barcode aktif. Kunjungan Anda telah selesai.
                </p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-200 space-y-2 text-sm">
              <Row label="Nama" value={data.visitorName} />
              <Row label="Perusahaan" value={data.company || '-'} />
              <Row label="Departemen" value={data.department} />
              <Row label="PIC" value={data.picName || '-'} />
              <Row label="No. Kunjungan" value={data.visitNumber} mono />
              {data.checkInAt && <Row label="Masuk" value={`${fmtTime(data.checkInAt)} WIB`} />}
              {data.checkOutAt && <Row label="Keluar" value={`${fmtTime(data.checkOutAt)} WIB`} />}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-4">
          Halaman ini diperbarui otomatis. Jangan tutup sebelum kunjungan selesai.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-slate-800 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
