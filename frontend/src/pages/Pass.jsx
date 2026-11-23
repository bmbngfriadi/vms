import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  LogOut,
  LogIn,
  Loader2,
  Globe,
  Sun,
  Moon,
  Shield,
  ShieldCheck,
  User,
  Building2,
  Clock,
  IdCard,
  Car,
  FileText,
  BadgeCheck,
  QrCode,
  Sparkles,
  Smartphone,
  Users,
  ShieldAlert
} from 'lucide-react';
import { endpoints, errMsg, fmtTime } from '../lib/api.js';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';
import { useDialog } from '../lib/dialog.jsx';
import PhotoPreviewModal from '../components/PhotoPreviewModal.jsx';
import IdentityPhotoCapture from '../components/IdentityPhotoCapture.jsx';

export default function Pass() {
  const { token } = useParams();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
  const { confirm, alert: customAlert } = useDialog();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk form validasi Security
  const [selectedPicId, setSelectedPicId] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [badgesList, setBadgesList] = useState([]);
  const [note, setNote] = useState('');
  const [securityPhoto, setSecurityPhoto] = useState('');
  const [securityIdentityNumber, setSecurityIdentityNumber] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showQrCard, setShowQrCard] = useState(false);
  const initialLoadedRef = useRef(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    return endpoints
      .publicPass(token)
      .then((d) => {
        setData(d);

        // Hanya inisialisasi state form saat pemuatan awal (initial load),
        // JANGAN menimpa data yang sedang diketik oleh Security saat polling latar belakang (setiap 8 detik)!
        if (!initialLoadedRef.current) {
          initialLoadedRef.current = true;
          if (d.picUserId) setSelectedPicId(d.picUserId);
          if (d.badgeNumber) setBadgeNumber(d.badgeNumber);
          if (d.identityNumber) setSecurityIdentityNumber(d.identityNumber);

          const count = Math.max(
            1,
            parseInt(d.numberOfVisitors, 10) || 1,
            Array.isArray(d.guestNames) ? d.guestNames.length : 0
          );
          const guests = Array.isArray(d.guestNames) ? d.guestNames : [];
          let initBadges = [];
          for (let i = 0; i < count; i++) {
            const g = guests[i];
            let b = '';
            if (typeof g === 'object' && g?.badge) {
              b = g.badge;
            } else if (i === 0 && d.badgeNumber) {
              b = d.badgeNumber;
            }
            initBadges.push(b);
          }
          setBadgesList(initBadges);
        }

        setError('');
      })
      .catch((e) => setError(errMsg(e, 'Pass tidak ditemukan atau barcode tidak valid')))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    initialLoadedRef.current = false;
    load();
    const id = setInterval(() => load(true), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleBadgeChange = (idx, value) => {
    setBadgesList((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const totalVisitors = Math.max(
    1,
    parseInt(data?.numberOfVisitors, 10) || 1,
    Array.isArray(data?.guestNames) ? data.guestNames.length : 0
  );

  const displayGuests = [];
  if (data) {
    const rawGuests = Array.isArray(data.guestNames) ? data.guestNames : [];
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
        name = i === 0 ? (data.visitorName || 'Penanggung Jawab') : `Tamu ${i + 1}`;
      }

      displayGuests.push({
        name,
        badge: badgeVal || (i === 0 ? (data.badgeNumber || '') : ''),
        isLeader
      });
    }
  }

  // Handler Konfirmasi Check-In (Tamu Masuk)
  const handleCheckIn = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      // Validasi identitas tamu: wajib ada jika PIC belum melampirkannya
      if (!data?.identityPhoto && !securityPhoto) {
        setActionErrorMsg('Foto identitas tamu (KTP/SIM/Paspor) wajib diambil oleh Security sebelum konfirmasi masuk.');
        customAlert({
          title: 'Foto Identitas Diperlukan',
          message: 'Foto identitas tamu (KTP/SIM/Paspor) wajib diambil oleh Security sebelum konfirmasi masuk.',
          type: 'warning'
        });
        return;
      }

      const currentPicId = selectedPicId || data?.picUserId;
      if (!currentPicId) {
        setActionErrorMsg('Silakan pilih PIC / staf yang dituju tamu terlebih dahulu.');
        customAlert({
          title: 'Pilih PIC Dituju',
          message: 'Silakan pilih PIC / staf PT Cemindo Gemilang Tbk yang dituju oleh tamu terlebih dahulu.',
          type: 'warning'
        });
        return;
      }

      const badgeSummary = badgesList.filter(Boolean).join(', ') || badgeNumber.trim();
      const picList = Array.isArray(data?.pics) ? data.pics : [];
      const picObj = picList.find((p) => p.id === currentPicId);
      const picName = picObj?.name || data?.picName || 'PIC';
      const visitorName = data?.visitorName || 'Tamu';
      const visitNumber = data?.visitNumber || '-';
      const visitorsCount = totalVisitors || 1;

      // Munculkan popup konfirmasi untuk security
      const ok = await confirm({
        title: 'Konfirmasi Check-In (Tamu Masuk)',
        message: `Konfirmasi kedatangan dan izinkan masuk untuk ${visitorName} (${visitorsCount} orang)?\n\n• No. Kunjungan: ${visitNumber}\n• PIC Dituju: ${picName}\n• No. Badge: ${badgeSummary || '-'}\n\nPastikan nomor badge fisik telah diserahkan sesuai nama masing-masing tamu.`,
        confirmText: 'Ya, Konfirmasi Masuk',
        cancelText: 'Batal',
        variant: 'brand',
        icon: 'check'
      });
      if (!ok) return;

      setActionBusy(true);

      const payloadGuests = displayGuests.map((g, idx) => ({
        name: g.name,
        badge: badgesList[idx] ? String(badgesList[idx]).trim() : '',
        isLeader: g.isLeader
      }));

      const res = await endpoints.publicCheckIn(token, {
        picUserId: currentPicId,
        badgeNumber: badgeSummary,
        badges: badgesList,
        guestNames: payloadGuests,
        note: (note || '').trim(),
        identityPhoto: securityPhoto || undefined,
        identityNumber: (securityIdentityNumber || data?.identityNumber || '').trim() || undefined
      });
      setActionSuccessMsg(res.message || 'Validasi Check-In Berhasil! Tamu resmi diizinkan masuk.');
      setData((prev) => ({
        ...prev,
        status: 'CHECKED_IN',
        action: 'CHECKIN_SUCCESS',
        checkInAt: res.checkInAt || new Date().toISOString(),
        badgeNumber: res.badgeNumber || badgeSummary,
        guestNames: payloadGuests,
        identityPhoto: securityPhoto || prev.identityPhoto,
        identityNumber: securityIdentityNumber || prev.identityNumber
      }));
    } catch (err) {
      console.error('[handleCheckIn error]', err);
      setActionErrorMsg(errMsg(err, 'Gagal memproses validasi check-in'));
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Konfirmasi Check-Out (Tamu Keluar)
  const handleCheckOut = async () => {
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const badgeSummary = badgesList.filter(Boolean).join(', ') || badgeNumber.trim() || data?.badgeNumber || '-';
      const visitorName = data?.visitorName || 'Tamu';
      const visitNumber = data?.visitNumber || '-';
      const visitorsCount = totalVisitors || 1;

      // Munculkan popup konfirmasi untuk security
      const ok = await confirm({
        title: 'Konfirmasi Check-Out (Tamu Keluar)',
        message: `Konfirmasi check-out dan tamu telah meninggalkan kawasan pabrik untuk ${visitorName} (${visitorsCount} orang)?\n\n• No. Kunjungan: ${visitNumber}\n• No. Badge: ${badgeSummary}\n\nPastikan seluruh kartu badge tamu telah dikembalikan ke pos security.`,
        confirmText: 'Ya, Konfirmasi Keluar',
        cancelText: 'Batal',
        variant: 'warning',
        icon: 'logout'
      });
      if (!ok) return;

      setActionBusy(true);

      const res = await endpoints.publicCheckOut(token, { note: (note || '').trim() });
      setActionSuccessMsg(res.message || 'Check-Out Berhasil! Kunjungan tamu telah selesai.');
      setData((prev) => ({
        ...prev,
        status: 'CHECKED_OUT',
        action: 'CHECKOUT_SUCCESS',
        checkOutAt: res.checkOutAt || new Date().toISOString()
      }));
    } catch (err) {
      console.error('[handleCheckOut error]', err);
      setActionErrorMsg(errMsg(err, 'Gagal memproses check-out tamu'));
    } finally {
      setActionBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-sm p-4">
        <Loader2 className="animate-spin mb-3 text-brand-600" size={32} />
        <span className="font-medium">{t('action.loading', 'Memuat data pemindaian kunjungan…')}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="card p-6 max-w-sm w-full text-center rounded-2xl shadow-md border-slate-200 dark:border-slate-800">
          <img src="/logo.png" alt="Logo" className="h-9 mx-auto mb-3 opacity-90" />
          <AlertCircle className="mx-auto text-red-500" size={36} />
          <h1 className="mt-3 font-bold text-slate-900 dark:text-white">Barcode Tidak Ditemukan</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
          <Link to="/register" className="btn-primary mt-5 w-full py-2.5 rounded-xl text-xs font-bold">
            Formulir Registrasi Tamu
          </Link>
        </div>
      </div>
    );
  }

  const isCheckInAction = data.action === 'CHECK_IN';
  const isCheckInSuccess = data.action === 'CHECKIN_SUCCESS' || data.action === 'ALREADY_CHECKED_IN';
  const isCheckOutAction = data.action === 'CHECK_OUT';
  const isDone = data.action === 'CHECKOUT_SUCCESS' || data.action === 'ALREADY_CHECKED_OUT' || data.status === 'CHECKED_OUT';

  // Hitung durasi jika tamu sudah check-in
  const calcDuration = () => {
    if (!data.checkInAt) return '-';
    const end = data.checkOutAt ? new Date(data.checkOutAt) : new Date();
    const mins = Math.max(0, Math.round((end - new Date(data.checkInAt)) / 60000));
    return `${Math.floor(mins / 60)} jam ${mins % 60} menit`;
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-4 sm:py-8 px-3 sm:px-4 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-lg mx-auto space-y-4">
        {/* ================= HEADER BRANDING ================= */}
        <header className="flex items-center justify-between gap-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-white dark:bg-slate-800 p-1 sm:p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="PT Cemindo Gemilang Tbk" className="h-7 sm:h-8 w-auto" />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                PT Cemindo Gemilang Tbk
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                Plant Batam · Validasi Pos Security
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="btn-ghost text-xs px-2 py-1.5 rounded-lg flex items-center gap-1"
              title="Ganti Bahasa (ID / EN)"
            >
              <Globe size={13} />
              <span className="font-bold text-[11px]">{lang.toUpperCase()}</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-ghost text-xs p-1.5 rounded-lg"
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
            </button>
          </div>
        </header>

        {/* ================= ALERT PESAN HASIL AKSI ================= */}
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 shadow-sm animate-in fade-in duration-200">
            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="font-bold">{actionSuccessMsg}</div>
          </div>
        )}

        {actionErrorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-800 dark:text-red-200 shadow-sm animate-in fade-in duration-200">
            <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="font-bold">{actionErrorMsg}</div>
          </div>
        )}

        {/* ================= PANEL UTAMA VALIDASI SECURITY ================= */}
        <div className="card overflow-hidden rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {/* Header Status Barcode */}
          <div
            className={`px-4 py-3.5 border-b flex items-center justify-between ${isDone
              ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800'
              : isCheckOutAction
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
              }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isDone ? (
                <CheckCircle2 className="text-slate-500" size={18} />
              ) : isCheckOutAction ? (
                <LogOut className="text-amber-600 dark:text-amber-400" size={18} />
              ) : (
                <ShieldCheck className="text-emerald-600 dark:text-emerald-400" size={18} />
              )}
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {isDone
                  ? 'Kunjungan Telah Selesai (Check-Out)'
                  : isCheckOutAction
                    ? 'Validasi Keluar Tamu (Check-Out)'
                    : isCheckInSuccess
                      ? 'Tamu Resmi Masuk (Check-In Sukses)'
                      : 'Validasi Masuk Tamu (Check-In)'}
              </span>
            </div>

            <span
              className={`badge text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${isDone
                ? 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                : isCheckOutAction
                  ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/60 dark:text-amber-200 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-800'
                }`}
            >
              {isCheckInSuccess ? 'DI DALAM PABRIK' : data.status}
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            {/* 1. Ringkasan Profil Tamu */}
            <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {data.visitorName}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {data.company || 'Pribadi / Perorangan'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded-lg border border-brand-200/60 dark:border-brand-900/60">
                    {data.visitNumber}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">No. Kunjungan</div>
                </div>
              </div>

              {/* Rincian Tambahan */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Departemen:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{data.department}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">PIC Dituju:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{data.picName || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">WhatsApp Tamu:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{data.phone || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">No. Identitas (NIK):</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{data.identityNumber || '-'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Jumlah Tamu:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{totalVisitors} orang</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Keperluan:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 italic">{data.purpose || '-'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Area Kunjungan:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {data.destinationArea === 'PLANT_WORK' ? 'Area Pabrik / Lapangan (Wajib K3)' : 'Area Kantor (Office)'}
                  </span>
                </div>
                {data.requiresInduction && (
                  data.inductionStatus === 'COMPLETED' ? (
                    <div className="col-span-2 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 flex items-start gap-2.5">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-[11.5px] leading-tight">
                        <div className="font-bold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-100">
                          <span>Sudah Melakukan Safety Induction SHE</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-200/90 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700">
                            Lolos K3
                          </span>
                        </div>
                        <div className="mt-1 text-emerald-800 dark:text-emerald-200 leading-relaxed">
                          Tamu telah diverifikasi dan menyelesaikan Safety Induction K3 bersama Tim SHE.
                        </div>
                        {data.workDescription && (
                          <div className="mt-1.5 pt-1.5 border-t border-emerald-200 dark:border-emerald-800/60 font-medium text-[11px] text-emerald-900 dark:text-emerald-200 italic">
                            Rencana Pekerjaan: {data.workDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                      <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                      <div className="text-[11.5px] leading-tight">
                        <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-100">
                          <span>Perlu Safety Induction Tim SHE</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-amber-200/90 text-amber-900 dark:bg-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                            Belum Induction
                          </span>
                        </div>
                        <div className="mt-1 text-amber-800 dark:text-amber-200 leading-relaxed">
                          Tamu memiliki agenda pekerjaan di area operasional pabrik. Silakan ikuti Safety Induction bersama Tim K3 / SHE sebelum memulai pekerjaan.
                        </div>
                        {data.workDescription && (
                          <div className="mt-1.5 pt-1.5 border-t border-amber-300/40 dark:border-amber-800/40 font-medium text-[11px] text-amber-900 dark:text-amber-200 italic">
                            Rencana Pekerjaan: {data.workDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Daftar Tamu Masuk jika rombongan */}
              {totalVisitors > 1 && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users size={13} className="text-brand-500" />
                    <span>Daftar Seluruh Tamu ({totalVisitors} Orang):</span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/60 rounded-xl p-2.5 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
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
                          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded font-mono font-bold shrink-0">
                            Badge: {g.badge}
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thumbnail Foto Identitas (Bisa di-tap untuk perbesar) */}
              {data.identityPhoto ? (
                <div
                  className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 cursor-pointer group hover:bg-slate-100/60 dark:hover:bg-slate-750/60 p-1.5 rounded-xl transition-colors"
                  onClick={() =>
                    setPreviewPhoto({
                      photoUrl: data.identityPhoto,
                      visitorName: data.visitorName,
                      identityNumber: data.identityNumber
                    })
                  }
                  title="Ketuk untuk melihat foto identitas ukuran penuh"
                >
                  <img
                    src={data.identityPhoto}
                    alt="Foto KTP/SIM"
                    className="w-16 h-11 object-cover rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs group-hover:ring-2 group-hover:ring-brand-500 transition-all shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      Foto Identitas (KTP / SIM)
                    </div>
                    <div className="text-[11px] text-brand-600 dark:text-brand-400 font-medium group-hover:underline">
                      Ketuk untuk melihat foto penuh & periksa
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2 p-1.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertCircle size={15} className="shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="font-medium">
                    Foto identitas belum dilampirkan oleh PIC (Security wajib mengambil foto fisik tamu).
                  </span>
                </div>
              )}
            </div>

            {/* ================= TAMPILAN 1: FORM CHECK-IN LANGSUNG ================= */}
            {isCheckInAction && (
              <form noValidate onSubmit={handleCheckIn} className="space-y-3.5 pt-1">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
                    <BadgeCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Langkah Validasi Masuk Petugas Security:</span>
                  </div>

                  {/* Wajib ambil foto identitas jika PIC belum melampirkan */}
                  {!data.identityPhoto && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-3">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-amber-950 dark:text-amber-100">
                            Identitas Tamu Belum Dilampirkan oleh PIC
                          </div>
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5">
                            Petugas Security wajib mengambil foto identitas (KTP/SIM/Paspor) fisik tamu dan memastikan nomor identitas terisi sebelum mengonfirmasi kedatangan tamu.
                          </div>
                        </div>
                      </div>

                      <IdentityPhotoCapture
                        value={securityPhoto}
                        onChange={(photo) => setSecurityPhoto(photo)}
                        onNikDetected={(detectedNik) => {
                          if (!securityIdentityNumber) setSecurityIdentityNumber(detectedNik);
                        }}
                        label="Ambil Foto KTP/SIM/Paspor Tamu (Wajib) *"
                        required
                      />

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="label text-[11px] font-bold mb-0">
                            Nomor Identitas (KTP/SIM/Paspor) <span className="text-red-500">*</span>
                          </label>
                          {securityIdentityNumber && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                              Terbaca Otomatis
                            </span>
                          )}
                        </div>
                        <input
                          className="input text-xs py-2 px-3 rounded-xl font-mono bg-white dark:bg-slate-900"
                          value={securityIdentityNumber}
                          onChange={(e) => setSecurityIdentityNumber(e.target.value)}
                          placeholder="Masukkan nomor identitas tamu..."
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Pilih PIC jika belum terpilih atau ingin dialihkan */}
                  <div>
                    <label className="label text-[11px] font-bold mb-1">
                      PIC / Staf yang Dituju <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="input text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900"
                      value={selectedPicId}
                      onChange={(e) => setSelectedPicId(e.target.value)}
                      required
                    >
                      <option value="">— Pilih PIC —</option>
                      {data.pics?.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      {!data.pics?.some((p) => p.id === data.picUserId) && data.picUserId && data.picName && (
                        <option value={data.picUserId}>{data.picName}</option>
                      )}
                    </select>
                  </div>

                  {/* Input Nomor Badge Tamu */}
                  {totalVisitors > 1 ? (
                    <div className="space-y-2">
                      <label className="label text-[11px] font-bold mb-0 flex items-center justify-between">
                        <span>Nomor Badge Setiap Tamu ({totalVisitors} Tamu)</span>
                        <span className="text-[10px] text-slate-400 font-normal">Diserahkan per orang</span>
                      </label>
                      <div className="bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-2.5">
                        {displayGuests.map((g, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                            <div className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5 min-w-[140px] truncate">
                              <span className="font-semibold">{idx + 1}. {g.name}</span>
                              {g.isLeader && (
                                <span className="text-[9px] bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 px-1.5 py-0.5 rounded font-semibold shrink-0">
                                  PJ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 flex-1 max-w-xs">
                              <span className="text-[11px] text-slate-400 shrink-0 font-medium">Badge:</span>
                              <input
                                className="input text-xs py-1.5 px-3 font-mono font-bold bg-white dark:bg-slate-900"
                                placeholder={`Contoh: B-${String(idx + 1).padStart(2, '0')}`}
                                value={badgesList[idx] || ''}
                                onChange={(e) => handleBadgeChange(idx, e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="label text-[11px] font-bold mb-1">
                        Nomor Badge Tamu (Diserahkan ke Tamu)
                      </label>
                      <input
                        className="input text-xs py-2 px-3 rounded-xl font-mono bg-white dark:bg-slate-900 font-bold"
                        value={badgesList[0] !== undefined ? badgesList[0] : badgeNumber}
                        onChange={(e) => {
                          setBadgeNumber(e.target.value);
                          handleBadgeChange(0, e.target.value);
                        }}
                        placeholder="Contoh: 012"
                      />
                    </div>
                  )}

                  {/* Catatan Pos Security (Opsional) */}
                  <div>
                    <label className="label text-[11px] font-bold mb-1">
                      Catatan Security (Opsional)
                    </label>
                    <input
                      className="input text-xs py-2 px-3 rounded-xl bg-white dark:bg-slate-900"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Catatan pos security..."
                    />
                  </div>
                </div>

                {/* Tombol Eksekusi Check-In */}
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={actionBusy}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all min-h-[50px] cursor-pointer"
                >
                  {actionBusy ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                  )}
                  <span>{actionBusy ? 'Memproses Validasi…' : 'KONFIRMASI CHECK-IN (TAMU MASUK)'}</span>
                </button>
              </form>
            )}

            {/* ================= TAMPILAN 2: KONFIRMASI CHECK-IN BERHASIL ================= */}
            {isCheckInSuccess && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2.5">
                  <div className="w-13 h-13 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 size={30} />
                  </div>
                  <div>
                    <div className="text-base font-extrabold text-emerald-950 dark:text-emerald-100">
                      Validasi Masuk Berhasil!
                    </div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5">
                      Tamu resmi diizinkan memasuki kawasan pabrik PT Cemindo Gemilang Tbk.
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 grid grid-cols-2 gap-2 text-xs text-left">
                    <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">Waktu Masuk:</span>
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {fmtTime(data.checkInAt)} WIB
                      </span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
                      <span className="text-[10.5px] text-slate-500 dark:text-slate-400 block font-medium">Badge Diberikan:</span>
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs sm:text-sm">
                        {data.badgeNumber ? `Badge #${data.badgeNumber}` : 'Tanpa Badge'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Petunjuk Security & Tamu untuk Keluar Pabrik */}
                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2 text-xs text-blue-950 dark:text-blue-100">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800 dark:text-blue-200">
                    <Smartphone size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Instruksi Kepulangan / Check-Out:</span>
                  </div>
                  <p className="text-[11.5px] leading-relaxed text-blue-900 dark:text-blue-200">
                    Barcode khusus <strong>Check-Out</strong> telah otomatis dikirimkan ke nomor WhatsApp tamu.
                  </p>
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-blue-200/70 dark:border-blue-800 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    🛡️ <strong>Aturan Security:</strong> Saat tamu hendak keluar kawasan pabrik, petugas Security <strong>wajib memindai Barcode Check-Out</strong> yang dikirimkan ke tamu tersebut untuk memunculkan tombol konfirmasi keluar dan memvalidasi kepulangan tamu.
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAMPILAN 3: FORM CHECK-OUT LANGSUNG (DARI BARCODE CHECKOUT) ================= */}
            {isCheckOutAction && (
              <div className="space-y-3.5 pt-1">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2 text-xs">
                  <div className="font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                    <Clock size={15} className="text-amber-600 shrink-0" />
                    <span>Informasi Kunjungan Aktif:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-slate-700 dark:text-slate-300">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Waktu Masuk:</span>
                      <span className="font-bold">{fmtTime(data.checkInAt)} WIB</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Durasi Berada di Area:</span>
                      <span className="font-bold text-amber-700 dark:text-amber-300">{calcDuration()}</span>
                    </div>
                    {totalVisitors > 1 ? (
                      <div className="col-span-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/60 space-y-2">
                        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200 block">
                          Daftar Badge yang Wajib Dikembalikan ({totalVisitors} Tamu):
                        </span>
                        <div className="space-y-1.5">
                          {displayGuests.map((g, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-amber-200/50 dark:border-amber-900/50 text-xs">
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {idx + 1}. {g.name} {g.isLeader && '(PJ)'}
                              </span>
                              <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2.5 py-1 rounded border border-brand-200/60 dark:border-brand-900/60">
                                {g.badge || '-'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      data.badgeNumber && (
                        <div className="col-span-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/60">
                          <span className="text-[11px] text-slate-500 block">Badge yang Harus Dikembalikan:</span>
                          <span className="font-mono font-extrabold text-sm text-brand-600 dark:text-brand-400">
                            Badge #{data.badgeNumber}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Tombol Eksekusi Check-Out */}
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={actionBusy}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all min-h-[50px]"
                >
                  {actionBusy ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <LogOut size={20} strokeWidth={2.5} />
                  )}
                  <span>{actionBusy ? 'Memproses Check-Out…' : 'KONFIRMASI CHECK-OUT (TAMU KELUAR)'}</span>
                </button>
              </div>
            )}

            {/* ================= TAMPILAN 4: KONFIRMASI CHECK-OUT SELESAI ================= */}
            {isDone && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center space-y-2.5 animate-in fade-in duration-200">
                <div className="w-13 h-13 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white">
                    Check-Out Berhasil · Kunjungan Selesai
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Tamu telah resmi meninggalkan kawasan pabrik PT Cemindo Gemilang Tbk.
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 grid grid-cols-2 gap-2 text-xs text-left">
                  <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Waktu Keluar:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {fmtTime(data.checkOutAt)} WIB
                    </span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10.5px] text-slate-400 block font-medium">Total Durasi:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {calcDuration()}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                  ✓ Fisik Badge Tamu telah diserahkan kembali ke Pos Security.
                </div>
              </div>
            )}

            {/* Tombol Lihat/Sembunyikan QR Code Tamu */}
            {data.qrDataUrl && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => setShowQrCard((prev) => !prev)}
                  className="btn-ghost text-xs font-bold py-2 px-3 rounded-xl inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300"
                >
                  <QrCode size={15} />
                  <span>{showQrCard ? 'Sembunyikan Gambar Barcode' : 'Tampilkan Gambar Barcode Tamu'}</span>
                </button>

                {showQrCard && (
                  <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 inline-block animate-in fade-in duration-150">
                    <img src={data.qrDataUrl} alt="Barcode Pass" className="w-48 h-48 mx-auto rounded-xl bg-white p-2 shadow-xs" />
                    <p className="text-[11px] text-slate-500 mt-2">
                      {data.tokenType === 'CHECK_OUT' ? 'Barcode Check-Out Tamu' : 'Barcode Check-In Tamu'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Catatan Kemanan */}
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
          Visitor Management System · PT Cemindo Gemilang Tbk Plant Batam
        </p>
      </div>

      {/* Modal Preview Foto KTP/SIM */}
      {previewPhoto && (
        <PhotoPreviewModal
          photoUrl={previewPhoto.photoUrl}
          visitorName={previewPhoto.visitorName}
          identityNumber={previewPhoto.identityNumber}
          onClose={() => setPreviewPhoto(null)}
        />
      )}
    </div>
  );
}
