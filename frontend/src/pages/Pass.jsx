import React, { useEffect, useState } from 'react';
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
  Smartphone
} from 'lucide-react';
import { endpoints, errMsg, fmtTime } from '../lib/api.js';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';
import PhotoPreviewModal from '../components/PhotoPreviewModal.jsx';

export default function Pass() {
  const { token } = useParams();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();

  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // State untuk form validasi Security
  const [selectedPicId, setSelectedPicId] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [note, setNote] = useState('');
  const [actionBusy, setActionBusy] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [actionErrorMsg, setActionErrorMsg] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [showQrCard, setShowQrCard] = useState(false);

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    return endpoints
      .publicPass(token)
      .then((d) => {
        setData(d);
        if (d.picUserId) setSelectedPicId(d.picUserId);
        if (d.badgeNumber) setBadgeNumber(d.badgeNumber);
        setError('');
      })
      .catch((e) => setError(errMsg(e, 'Pass tidak ditemukan atau barcode tidak valid')))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 8000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Handler Konfirmasi Check-In (Tamu Masuk)
  const handleCheckIn = async (e) => {
    e.preventDefault();
    setActionBusy(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await endpoints.publicCheckIn(token, {
        picUserId: selectedPicId || data.picUserId,
        badgeNumber: badgeNumber.trim(),
        note: note.trim()
      });
      setActionSuccessMsg(res.message || 'Validasi Check-In Berhasil! Tamu resmi diizinkan masuk.');
      setData((prev) => ({
        ...prev,
        status: 'CHECKED_IN',
        action: 'CHECKIN_SUCCESS',
        checkInAt: res.checkInAt || new Date().toISOString(),
        badgeNumber: res.badgeNumber || badgeNumber.trim()
      }));
    } catch (err) {
      setActionErrorMsg(errMsg(err, 'Gagal memproses validasi check-in'));
    } finally {
      setActionBusy(false);
    }
  };

  // Handler Konfirmasi Check-Out (Tamu Keluar)
  const handleCheckOut = async () => {
    setActionBusy(true);
    setActionErrorMsg('');
    setActionSuccessMsg('');

    try {
      const res = await endpoints.publicCheckOut(token, { note: note.trim() });
      setActionSuccessMsg(res.message || 'Check-Out Berhasil! Kunjungan tamu telah selesai.');
      setData((prev) => ({
        ...prev,
        status: 'CHECKED_OUT',
        action: 'CHECKOUT_SUCCESS',
        checkOutAt: res.checkOutAt || new Date().toISOString()
      }));
    } catch (err) {
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
            className={`px-4 py-3.5 border-b flex items-center justify-between ${
              isDone
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
              className={`badge text-[10.5px] font-bold px-2.5 py-0.5 rounded-full border ${
                isDone
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
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Keperluan:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200 italic">{data.purpose || '-'}</span>
                </div>
              </div>

              {/* Thumbnail Foto Identitas (Bisa di-tap untuk perbesar) */}
              {data.identityPhoto && (
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
              )}
            </div>

            {/* ================= TAMPILAN 1: FORM CHECK-IN LANGSUNG ================= */}
            {isCheckInAction && (
              <form onSubmit={handleCheckIn} className="space-y-3.5 pt-1">
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                  <div className="text-xs font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-1.5">
                    <BadgeCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Langkah Validasi Masuk Petugas Security:</span>
                  </div>

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
                  <div>
                    <label className="label text-[11px] font-bold mb-1">
                      Nomor Badge Tamu (Diserahkan ke Tamu)
                    </label>
                    <input
                      className="input text-xs py-2 px-3 rounded-xl font-mono bg-white dark:bg-slate-900"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="Contoh: 012"
                    />
                  </div>

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
                  type="submit"
                  disabled={actionBusy}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all min-h-[50px]"
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
                    {data.badgeNumber && (
                      <div className="col-span-2 pt-1 border-t border-amber-200/60 dark:border-amber-900/60">
                        <span className="text-[11px] text-slate-500 block">Badge yang Harus Dikembalikan:</span>
                        <span className="font-mono font-extrabold text-sm text-brand-600 dark:text-brand-400">
                          Badge #{data.badgeNumber}
                        </span>
                      </div>
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
