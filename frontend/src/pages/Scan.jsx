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
import { useI18n } from '../lib/i18n.jsx';
import { useDialog } from '../lib/dialog.jsx';
import PhotoPreviewModal from '../components/PhotoPreviewModal.jsx';
import WalkInQrModal from '../components/WalkInQrModal.jsx';
import { QrCode } from 'lucide-react';

export default function Scan() {
  const { t } = useI18n();
  const { confirm, alert: customAlert } = useDialog();
  const scannerRef = useRef(null);
  const startingRef = useRef(false);
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
  const [showWalkInQr, setShowWalkInQr] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const stopCamera = async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    if (!s) return;
    try {
      await s.stop();
    } catch {
      /* scanner belum/tidak berjalan */
    }
    try {
      s.clear();
    } catch {
      /* elemen sudah dibersihkan */
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
    // Cegah start ganda (double click / re-render) yang membuat dua instance scanner
    // berebut container DOM yang sama.
    if (startingRef.current || scannerRef.current) return;
    startingRef.current = true;
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
      const s = scannerRef.current;
      scannerRef.current = null;
      try {
        await s?.stop();
      } catch {
        /* belum berjalan */
      }
      try {
        s?.clear();
      } catch {
        /* tidak ada yang perlu dibersihkan */
      }
      setScanning(false);
      setError(
        'Kamera tidak dapat diakses. Pastikan halaman dibuka via HTTPS dan izin kamera diberikan. ' +
          'Anda tetap dapat mengetik kode secara manual.'
      );
    } finally {
      startingRef.current = false;
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
    const ok = await confirm({
      title: 'Tolak Kunjungan Tamu',
      message: `Tolak kunjungan tamu ${result.visit.visitorName} (${result.visit.visitNumber})?\n\nTamu tidak akan diizinkan masuk ke kawasan pabrik.`,
      confirmText: 'Ya, Tolak Kunjungan',
      cancelText: 'Batal',
      danger: true,
      icon: 'alert'
    });
    if (!ok) return;

    setActionLoading(true);
    try {
      await endpoints.reject(result.visit.id, note || 'Ditolak oleh Security');
      setSuccess({ kind: 'REJECT', title: 'Kunjungan ditolak', lines: [`Tamu: ${result.visit.visitorName}`] });
      setResult(null);
      setCode('');
    } catch (err) {
      customAlert({
        title: 'Gagal Menolak Kunjungan',
        message: errMsg(err, 'Gagal menolak kunjungan'),
        type: 'error'
      });
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('scan.title', 'Scan Barcode Kunjungan')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('scan.subtitle', 'Arahkan kamera ke QR Code tamu untuk Check-in atau Check-out.')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowWalkInQr(true)}
          className="btn-ghost self-start sm:self-auto text-xs py-2 px-3 border border-slate-200 dark:border-slate-800 text-brand-700 dark:text-brand-300 bg-white dark:bg-slate-900 shadow-xs"
        >
          <QrCode size={15} className="text-brand-600 dark:text-brand-400" />
          <span>QR Pendaftaran Walk-In</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 items-start">
        {/* Panel kamera */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Kamera</h2>
            {scanning ? (
              <button onClick={stopCamera} className="btn-ghost text-xs py-1.5">
                <CameraOff size={14} /> {t('scan.btn_stop', 'Hentikan')}
              </button>
            ) : (
              <button onClick={startCamera} className="btn-primary text-xs py-1.5">
                <Camera size={14} /> {t('scan.btn_start', 'Aktifkan Kamera')}
              </button>
            )}
          </div>

          {/* Container ini dimiliki penuh oleh html5-qrcode: library menyuntikkan &
              mengosongkan isinya sendiri. Jangan pernah render anak React di dalam
              #qr-reader — React akan mencoba removeChild pada node yang sudah
              dihapus library dan memicu error "The node to be removed is not a
              child of this node". Placeholder ditaruh sebagai overlay di luar. */}
          <div
            className={`relative w-full rounded-md overflow-hidden bg-black ${
              scanning ? '' : 'h-52'
            }`}
          >
            <div id="qr-reader" className="w-full" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-slate-400 text-xs px-6 pointer-events-none">
                <div>
                  <Camera size={26} className="mx-auto mb-2 opacity-50" />
                  Kamera belum aktif. Tekan “Aktifkan Kamera”, lalu arahkan ke barcode tamu.
                </div>
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
            <div className="card border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/60 p-4 flex gap-3">
              <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0" size={18} />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="card border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/60 p-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">{success.title}</h3>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-emerald-800 dark:text-emerald-300">
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
            <div className="card p-8 text-center text-sm text-slate-400 dark:text-slate-500">
              Hasil pemindaian akan muncul di sini.
            </div>
          )}

          {result && (
            <>
              <div className="card overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Data Kunjungan</span>
                  <StatusBadge status={result.visit.status} />
                </div>

                <div className="p-5 space-y-2.5 text-sm">
                  <Row label="Nama" value={result.visit.visitorName} strong />
                  <Row label="No. Identitas" value={result.visit.identityNumber || '-'} />
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

                  {result.visit.identityPhoto && (
                    <div
                      className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 p-2 -mx-2 rounded-xl transition-colors"
                      onClick={() =>
                        setPreviewPhoto({
                          photo: result.visit.identityPhoto,
                          visitorName: result.visit.visitorName,
                          identityNumber: result.visit.identityNumber,
                          title: `Foto Identitas — ${result.visit.visitorName}`,
                          visitNumber: result.visit.visitNumber
                        })
                      }
                      title="Klik untuk melihat foto ukuran penuh"
                    >
                      <img
                        src={result.visit.identityPhoto}
                        alt="Foto Identitas"
                        className="w-20 h-14 object-cover rounded-md border border-slate-200 dark:border-slate-700 group-hover:opacity-90 group-hover:ring-2 group-hover:ring-brand-500 transition-all shrink-0"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Foto Identitas (KTP/SIM)</div>
                        <span className="text-xs text-brand-600 dark:text-brand-400 font-medium group-hover:underline mt-0.5 inline-block text-left">
                          Klik untuk melihat ukuran penuh
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {result.warnings?.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/50 p-3">
                      {result.warnings.map((w, i) => (
                        <p key={i} className="text-xs text-amber-800 dark:text-amber-300">
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
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Validasi Masuk</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
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

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      className="btn-success flex-1 py-3 sm:py-2.5 text-sm font-bold min-h-[46px] rounded-xl justify-center shadow-xs"
                      onClick={doCheckIn}
                      disabled={actionLoading || !picUserId}
                      title={!picUserId ? 'Pilih PIC terlebih dahulu' : ''}
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserCheck size={18} />
                      )}
                      Validasi & Check-In
                    </button>
                    <button
                      className="btn-danger sm:w-auto py-3 sm:py-2.5 text-sm font-bold min-h-[46px] rounded-xl justify-center shadow-xs"
                      onClick={doReject}
                      disabled={actionLoading}
                    >
                      <XCircle size={18} /> Tolak Kunjungan
                    </button>
                  </div>
                </div>
              )}

              {result.action === 'CHECK_OUT' && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Konfirmasi Keluar</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Pastikan tamu telah menyerahkan badge dan meninggalkan area kawasan pabrik.
                  </p>
                  <button
                    className="btn-primary w-full py-3 sm:py-2.5 text-sm font-bold min-h-[46px] rounded-xl justify-center shadow-xs"
                    onClick={doCheckOut}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={18} />}
                    Konfirmasi Check-Out
                  </button>
                </div>
              )}

              {['DONE', 'BLOCKED', 'NONE'].includes(result.action) && (
                <div className="card p-5 text-sm text-slate-600 dark:text-slate-400">
                  Tidak ada aksi yang dapat dilakukan untuk kunjungan ini.
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {previewPhoto && (
        <PhotoPreviewModal
          photoUrl={previewPhoto.photo}
          photo={previewPhoto.photo}
          visitorName={previewPhoto.visitorName || previewPhoto.title}
          identityNumber={previewPhoto.identityNumber || previewPhoto.visitNumber}
          onClose={() => setPreviewPhoto(null)}
        />
      )}

      {showWalkInQr && <WalkInQrModal onClose={() => setShowWalkInQr(false)} />}
    </div>
  );
}

function Row({ label, value, strong }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span
        className={`text-right ${
          strong
            ? 'font-medium text-slate-900 dark:text-white'
            : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {value}
      </span>
    </div>
  );
}
