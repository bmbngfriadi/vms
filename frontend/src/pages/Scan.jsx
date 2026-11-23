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
  RotateCcw,
  Users,
  ShieldAlert,
  HardHat
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
  const [badgesList, setBadgesList] = useState([]);
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
        scannerRef.current.stop().catch(() => { });
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
        () => { }
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
      setBadge(data.visit.badgeNumber || '');
      setNote('');

      const count = Math.max(
        1,
        parseInt(data.visit?.numberOfVisitors, 10) || 1,
        Array.isArray(data.visit?.guestNames) ? data.visit.guestNames.length : 0
      );

      const guests = Array.isArray(data.visit?.guestNames) ? data.visit.guestNames : [];
      let initBadges = [];
      for (let i = 0; i < count; i++) {
        const g = guests[i];
        let b = '';
        if (typeof g === 'object' && g?.badge) {
          b = g.badge;
        } else if (i === 0 && data.visit?.badgeNumber) {
          b = data.visit.badgeNumber;
        }
        initBadges.push(b);
      }
      setBadgesList(initBadges);

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

  const handleBadgeChange = (idx, value) => {
    setBadgesList((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const totalVisitors = Math.max(
    1,
    parseInt(result?.visit?.numberOfVisitors, 10) || 1,
    Array.isArray(result?.visit?.guestNames) ? result.visit.guestNames.length : 0
  );

  const displayGuests = [];
  if (result?.visit) {
    const rawGuests = Array.isArray(result.visit.guestNames) ? result.visit.guestNames : [];
    for (let i = 0; i < totalVisitors; i++) {
      const raw = rawGuests[i];
      let name = '';
      let badgeVal = '';
      let isLeader = i === 0;

      if (typeof raw === 'string') {
        name = raw.trim();
      } else if (typeof raw === 'object' && raw) {
        name = (raw.name || '').trim();
        badgeVal = raw.badge || '';
        if (raw.isLeader !== undefined) isLeader = raw.isLeader;
      }

      if (!name) {
        name = i === 0 ? (result.visit.visitorName || 'Penanggung Jawab') : `Tamu ${i + 1}`;
      }

      displayGuests.push({
        name,
        badge: badgeVal || (i === 0 ? (result.visit.badgeNumber || '') : ''),
        isLeader
      });
    }
  }

  const doCheckIn = async () => {
    if (!picUserId) {
      setError('Pilih PIC / user yang dituju terlebih dahulu');
      customAlert({
        title: 'Pilih PIC Dituju Terlebih Dahulu',
        message: 'Silakan pilih PIC atau staf PT Cemindo Gemilang Tbk yang dituju oleh tamu terlebih dahulu sebelum mengonfirmasi Check-In.',
        type: 'warning'
      });
      return;
    }

    const badgeSummary = badgesList.filter(Boolean).join(', ') || badge;
    const picObj = pics.find((p) => p.id === picUserId);
    const picName = picObj?.name || result.visit?.picName || 'PIC';

    const ok = await confirm({
      title: 'Konfirmasi Check-In (Tamu Masuk)',
      message: `Konfirmasi kedatangan dan izinkan masuk untuk ${result.visit.visitorName} (${totalVisitors} orang)?\n\n• No. Kunjungan: ${result.visit.visitNumber}\n• PIC Dituju: ${picName}\n• No. Badge: ${badgeSummary || '-'}\n\nPastikan nomor badge telah diserahkan sesuai nama masing-masing tamu.`,
      confirmText: 'Ya, Konfirmasi Masuk',
      cancelText: 'Batal',
      variant: 'brand',
      icon: 'check'
    });
    if (!ok) return;

    setActionLoading(true);
    setError('');
    try {
      const payloadGuests = displayGuests.map((g, idx) => ({
        name: g.name,
        badge: badgesList[idx] ? String(badgesList[idx]).trim() : '',
        isLeader: g.isLeader
      }));

      const data = await endpoints.checkIn(result.visit.id, {
        picUserId,
        badgeNumber: badgeSummary,
        badges: badgesList,
        guestNames: payloadGuests,
        note
      });
      setSuccess({
        kind: 'CHECK_IN',
        title: 'Check-In berhasil',
        lines: [
          `Tamu: ${data.visitorName}`,
          `Jumlah: ${data.numberOfVisitors || totalVisitors} orang`,
          badgeSummary ? `No. Badge: ${badgeSummary}` : null,
          `PIC dinotifikasi: ${data.picNotified}`,
          'Barcode check-out telah dikirim ke WhatsApp tamu.'
        ].filter(Boolean),
        passUrl: data.guestPassUrl
      });
      setResult(null);
      setCode('');
      setBadgesList([]);
    } catch (err) {
      setError(errMsg(err, 'Gagal memproses check-in'));
    } finally {
      setActionLoading(false);
    }
  };

  const doCheckOut = async () => {
    const badgeSummary = badgesList.filter(Boolean).join(', ') || badge || result.visit.badgeNumber || '-';

    const ok = await confirm({
      title: 'Konfirmasi Check-Out (Tamu Keluar)',
      message: `Konfirmasi check-out dan tamu telah meninggalkan kawasan pabrik untuk ${result.visit.visitorName} (${totalVisitors} orang)?\n\n• No. Kunjungan: ${result.visit.visitNumber}\n• No. Badge: ${badgeSummary}\n\nPastikan seluruh kartu badge tamu telah dikembalikan ke pos security.`,
      confirmText: 'Ya, Konfirmasi Keluar',
      cancelText: 'Batal',
      variant: 'warning',
      icon: 'logout'
    });
    if (!ok) return;

    setActionLoading(true);
    setError('');
    try {
      const data = await endpoints.checkOut(result.visit.id);
      setSuccess({
        kind: 'CHECK_OUT',
        title: 'Check-Out berhasil',
        lines: [
          `Tamu: ${data.visitorName}`,
          `Durasi kunjungan: ${Math.floor((data.durationMinutes || 0) / 60)} jam ${(data.durationMinutes || 0) % 60
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
    setBadgesList([]);
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
            className={`relative w-full rounded-md overflow-hidden bg-black ${scanning ? '' : 'h-52'
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
                  <Row
                    label="Area Kunjungan"
                    value={
                      result.visit.destinationArea === 'PLANT_WORK' ? (
                        <span className="font-bold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                          <HardHat size={14} /> Area Pabrik / Lapangan
                        </span>
                      ) : (
                        'Area Kantor (Office)'
                      )
                    }
                  />

                  {result.visit.requiresInduction && (
                    result.visit.inductionStatus === 'COMPLETED' ? (
                      <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 flex items-start gap-2.5 my-2.5">
                        <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" size={18} />
                        <div className="text-xs">
                          <div className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-100">
                            <span>Sudah Melakukan Safety Induction SHE</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-emerald-200/90 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100">
                              Lolos K3
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-200">
                            Tamu telah diverifikasi dan menyelesaikan Safety Induction K3 bersama Tim SHE.
                          </div>
                          {result.visit.workDescription && (
                            <div className="mt-1 pt-1 border-t border-emerald-200 dark:border-emerald-800/60 font-medium text-[11px] italic text-emerald-900 dark:text-emerald-200">
                              Rencana Kerja: {result.visit.workDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-start gap-2.5 my-2.5">
                        <ShieldAlert className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" size={18} />
                        <div className="text-xs">
                          <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                            <span>Tamu Pekerjaan Lapangan (Belum Induction)</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-amber-200/80 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                              Perlu K3
                            </span>
                          </div>
                          <div className="mt-0.5 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                            Tamu memiliki agenda pekerjaan di area operasional pabrik. Notifikasi otomatis dikirim ke Tim SHE saat check-in. Harap arahkan tamu untuk berkoordinasi dengan Tim SHE terkait Safety Induction.
                          </div>
                          {result.visit.workDescription && (
                            <div className="mt-1 pt-1 border-t border-amber-300/40 dark:border-amber-800/40 font-medium text-[11px] italic text-amber-900 dark:text-amber-200">
                              Rencana Kerja: {result.visit.workDescription}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  )}

                  <Row label="Tipe" value={TYPE_LABEL[result.visit.visitType]} />
                  <Row label="Jumlah" value={`${totalVisitors} orang`} />
                  {displayGuests.length > 0 && (
                    <div className="pt-2 pb-1">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                        <Users size={13} className="text-brand-500" />
                        Daftar Tamu Masuk ({displayGuests.length} Orang):
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 border border-slate-100 dark:border-slate-800 space-y-1.5">
                        {displayGuests.map((g, idx) => (
                          <div key={idx} className="text-xs text-slate-700 dark:text-slate-200 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 truncate">
                              <span>{idx + 1}. {g.name}</span>
                              {g.isLeader && (
                                <span className="text-[9px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  PJ
                                </span>
                              )}
                            </div>
                            {g.badge ? (
                              <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded font-mono font-medium shrink-0">
                                Badge: {g.badge}
                              </span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

                  <div className="space-y-2 pt-1">
                    <label className="label flex items-center justify-between">
                      <span>No. Badge Fisik Tamu</span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {totalVisitors > 1 ? `Input nomor badge untuk setiap tamu (${totalVisitors} orang)` : 'Input nomor badge tamu'}
                      </span>
                    </label>

                    {totalVisitors > 1 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5">
                        {displayGuests.map((g, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5 min-w-[150px] truncate">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{idx + 1}. {g.name}</span>
                              {g.isLeader && (
                                <span className="text-[9px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  PJ
                                </span>
                              )}
                            </div>
                            <div className="flex-1 max-w-xs">
                              <input
                                className="input text-xs py-1.5 px-3 font-mono"
                                placeholder={`No. Badge Tamu ${idx + 1}`}
                                value={badgesList[idx] || ''}
                                onChange={(e) => handleBadgeChange(idx, e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <input
                            className="input font-mono"
                            placeholder="Contoh: B-01"
                            value={badgesList[0] !== undefined ? badgesList[0] : badge}
                            onChange={(e) => {
                              setBadge(e.target.value);
                              handleBadgeChange(0, e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="label">Catatan Kunjungan (Opsional)</label>
                    <input
                      className="input"
                      placeholder="Catatan tambahan security..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      className="btn-success flex-1 py-3 sm:py-2.5 text-sm font-bold min-h-[46px] rounded-xl justify-center shadow-xs"
                      onClick={doCheckIn}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <UserCheck size={18} />
                      )}
                      KONFIRMASI CHECK-IN (TAMU MASUK)
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
                <div className="card p-5 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      Konfirmasi Keluar & Validasi Pengembalian Badge
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Cocokkan kartu badge fisik yang dikembalikan tamu dengan nomor badge terdaftar di bawah ini sebelum memproses Check-Out.
                    </p>
                  </div>

                  {/* Daftar Validasi Badge per Tamu */}
                  <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-brand-500" />
                        Validasi Badge Tamu ({totalVisitors} Tamu):
                      </span>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-semibold px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                        Wajib Dikembalikan
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {displayGuests.length > 0 ? (
                        displayGuests.map((g, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="font-medium text-slate-800 dark:text-slate-200">{idx + 1}. {g.name}</span>
                              {g.isLeader && (
                                <span className="text-[9px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  PJ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">No. Badge:</span>
                              <span className="px-2.5 py-1 font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-slate-200 dark:border-slate-700 rounded-md">
                                {g.badge || '-'}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 text-xs">
                          <span>{result.visit.visitorName}</span>
                          <span className="font-mono font-bold">{result.visit.badgeNumber || '-'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn-primary w-full py-3 sm:py-2.5 text-sm font-bold min-h-[46px] rounded-xl justify-center shadow-xs"
                    onClick={doCheckOut}
                    disabled={actionLoading}
                  >
                    {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={18} />}
                    KONFIRMASI CHECK-OUT (TAMU KELUAR)
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
        className={`text-right ${strong
            ? 'font-medium text-slate-900 dark:text-white'
            : 'text-slate-700 dark:text-slate-200'
          }`}
      >
        {value}
      </span>
    </div>
  );
}
