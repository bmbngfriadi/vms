import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  UserCheck,
  LogOut,
  RotateCcw
} from 'lucide-react';
import { endpoints, errMsg, fmtDateTime, fmtTime } from '../lib/api.js';
import StatusBadge, { TYPE_LABEL } from '../components/StatusBadge.jsx';

export default function Scan() {
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pics, setPics] = useState([]);
  const [picUserId, setPicUserId] = useState('');
  const [badge, setBadge] = useState('');
  const [note, setNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const stopCamera = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {
        /* ignore */
      }
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startCamera = async () => {
    setError('');
    try {
      const scanner = new Html5Qrcode('qr-reader', { verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 230, height: 230 } },
        async (decoded) => {
          await stopCamera();
          lookup(decoded);
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      setScanning(false);
      setError(
        'Kamera tidak dapat diakses. Pastikan halaman dibuka via HTTPS dan izin kamera diberikan. ' +
          'Anda tetap dapat mengetik kode secara manual.'
      );
    }
  };

  const lookup = async (value) => {
    const v = (value || code).trim();
    if (!v) return;
    setLoading(true);
    setError('');
    setSuccess(null);
    try {
      const data = await endpoints.scan(v);
      setResult(data);
      setPicUserId(data.visit.picUser?.id || '');
      setBadge('');
      setNote('');
      if (data.action === 'CHECK_IN') {
        endpoints
          .pics(data.visit.department?.id)
          .then((list) => setPics(list))
          .catch(() => setPics([]));
      }
    } catch (err) {
      setResult(null);
      setError(errMsg(err, 'Barcode tidak dikenali'));
    } finally {
      setLoading(false);
    }
  };

  const doCheckIn = async () => {
    if (!picUserId) {
      setError('Pilih PIC / user yang dituju terlebih dahulu');
      return;
    }
    setActionLoading(true);
    setError('');
    try {
      const data = await endpoints.checkIn(result.visit.id, { picUserId, badgeNumber: badge, note });
      setSuccess({
        kind: 'CHECK_IN',
        title: 'Check-In berhasil',
        lines: [
          `Tamu: ${data.visitorName}`,
          `PIC dinotifikasi: ${data.picNotified}`,
          'Barcode check-out telah dikirim ke WhatsApp tamu.'
        ],
        passUrl: data.guestPassUrl
      });
      setResult(null);
      setCode('');
    } catch (err) {
      setError(errMsg(err, 'Gagal memproses check-in'));
    } finally {
      setActionLoading(false);
    }
  };

  const doCheckOut = async () => {
    setActionLoading(true);
    setError('');
    try {
      const data = await endpoints.checkOut(result.visit.id);
      setSuccess({
        kind: 'CHECK_OUT',
        title: 'Check-Out berhasil',
        lines: [
          `Tamu: ${data.visitorName}`,
          `Durasi kunjungan: ${Math.floor((data.durationMinutes || 0) / 60)} jam ${
            (data.durationMinutes || 0) % 60
          } menit`,
          'Notifikasi keluar telah dikirim ke tamu, PIC, dan management.'
        ]
      });
      setResult(null);
      setCode('');
    } catch (err) {
      setError(errMsg(err, 'Gagal memproses check-out'));
    } finally {
      setActionLoading(false);
    }
  };

  const doReject = async () => {
    if (!window.confirm('Tolak kunjungan tamu ini?')) return;
    setActionLoading(true);
    try {
      await endpoints.reject(result.visit.id, note || 'Ditolak oleh Security');
      setSuccess({ kind: 'REJECT', title: 'Kunjungan ditolak', lines: [`Tamu: ${result.visit.visitorName}`] });
      setResult(null);
      setCode('');
    } catch (err) {
      setError(errMsg(err, 'Gagal menolak kunjungan'));
    } finally {
      setActionLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setSuccess(null);
    setError('');
    setCode('');
    setPicUserId('');
    setBadge('');
    setNote('');
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Scan Barcode</h1>
        <p className="text-sm text-slate-500">
          Pindai barcode tamu untuk validasi masuk atau keluar kawasan.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Panel kamera */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800">Kamera</h2>
            {scanning ? (
              <button onClick={stopCamera} className="btn-ghost text-xs py-1.5">
                <CameraOff size={14} /> Hentikan
              </button>
            ) : (
              <button onClick={startCamera} className="btn-primary text-xs py-1.5">
                <Camera size={14} /> Aktifkan Kamera
              </button>
            )}
          </div>

          <div
            id="qr-reader"
            className={`w-full rounded-md overflow-hidden bg-slate-900 ${
              scanning ? '' : 'h-52 flex items-center justify-center'
            }`}
          >
            {!scanning && (
              <div className="text-center text-slate-500 text-xs px-6">
                <Camera size={26} className="mx-auto mb-2 opacity-50" />
                Kamera belum aktif. Tekan “Aktifkan Kamera”, lalu arahkan ke barcode tamu.
              </div>
            )}
          </div>

          <div className="mt-4">
            <label className="label">Atau ketik kode manual</label>
            <div className="flex gap-2">
              <input
                className="input"
                placeholder="VMS-20261106-1234"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && lookup()}
              />
              <button className="btn-primary shrink-0" onClick={() => lookup()} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                Cari
              </button>
            </div>
          </div>
        </div>

        {/* Panel hasil */}
        <div className="space-y-4">
          {error && (
            <div className="card border-red-200 bg-red-50 p-4 flex gap-3">
              <AlertTriangle className="text-red-600 shrink-0" size={18} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="card border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} />
                <h3 className="font-semibold text-emerald-900">{success.title}</h3>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-emerald-800">
                {success.lines.map((l, i) => (
                  <li key={i}>• {l}</li>
                ))}
              </ul>
              <button onClick={reset} className="btn-ghost mt-4 text-xs">
                <RotateCcw size={14} /> Scan berikutnya
              </button>
            </div>
          )}

          {!result && !success && !error && (
            <div className="card p-8 text-center text-sm text-slate-400">
              Hasil pemindaian akan muncul di sini.
            </div>
          )}

          {result && (
            <>
              <div className="card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Data Kunjungan</span>
                  <StatusBadge status={result.visit.status} />
                </div>

                <div className="p-5 space-y-2.5 text-sm">
                  <Row label="Nama" value={result.visit.visitorName} strong />
                  <Row label="Perusahaan" value={result.visit.company || '-'} />
                  <Row label="No. WhatsApp" value={result.visit.phone || '-'} />
                  <Row label="Departemen" value={result.visit.department?.name || '-'} />
                  <Row label="PIC dituju" value={result.visit.picName} />
                  <Row label="Keperluan" value={result.visit.purpose} />
                  <Row label="Tipe" value={TYPE_LABEL[result.visit.visitType]} />
                  <Row label="Jumlah" value={`${result.visit.numberOfVisitors} orang`} />
                  {result.visit.checkInAt && (
                    <Row label="Masuk" value={fmtDateTime(result.visit.checkInAt)} />
                  )}
                  {result.visit.checkOutAt && (
                    <Row label="Keluar" value={fmtDateTime(result.visit.checkOutAt)} />
                  )}
                </div>

                {result.warnings?.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-800">
                          ⚠ {w}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {result.action === 'CHECK_IN' && (
                <div className="card p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Validasi Masuk</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Konfirmasi ke PIC, lalu pilih nama PIC agar notifikasi WhatsApp terkirim.
                    </p>
                  </div>

                  <div>
                    <label className="label">PIC / User yang dituju *</label>
                    <select
                      className="input"
                      value={picUserId}
                      onChange={(e) => setPicUserId(e.target.value)}
                    >
                      <option value="">— Pilih PIC —</option>
                      {pics.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                          {p.department ? ` · ${p.department.name}` : ''}
                        </option>
                      ))}
                    </select>
                    {pics.length === 0 && (
                      <p className="text-[11px] text-amber-600 mt-1">
                        Tidak ada PIC aktif di departemen ini. Pilih departemen lain atau tambahkan PIC di
                        Master Data.
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">No. Badge</label>
                      <input className="input" value={badge} onChange={(e) => setBadge(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Catatan</label>
                      <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn-success flex-1"
                      onClick={doCheckIn}
                      disabled={actionLoading || !picUserId}
                      title={!picUserId ? 'Pilih PIC terlebih dahulu' : ''}
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserCheck size={16} />
                      )}
                      Validasi & Check-In
                    </button>
                    <button className="btn-danger" onClick={doReject} disabled={actionLoading}>
                      <XCircle size={16} /> Tolak
                    </button>
                  </div>
                </div>
              )}

              {result.action === 'CHECK_OUT' && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-slate-800 mb-1">Konfirmasi Keluar</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Pastikan tamu telah menyerahkan badge dan meninggalkan area.
                  </p>
                  <button className="btn-primary w-full" onClick={doCheckOut} disabled={actionLoading}>
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    Konfirmasi Check-Out
                  </button>
                </div>
              )}

              {['DONE', 'BLOCKED', 'NONE'].includes(result.action) && (
                <div className="card p-5 text-sm text-slate-600">
                  Tidak ada aksi yang dapat dilakukan untuk kunjungan ini.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 shrink-0">{label}</span>
      <span className={`text-right ${strong ? 'font-medium text-slate-900' : 'text-slate-700'}`}>
        {value}
      </span>
    </div>
  );
}
