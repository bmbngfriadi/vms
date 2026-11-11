import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, LogOut, LogIn, Loader2, Globe, Sun, Moon } from 'lucide-react';
import { endpoints, errMsg, fmtTime } from '../lib/api.js';
import { useTheme } from '../lib/theme.jsx';
import { useI18n } from '../lib/i18n.jsx';

export default function Pass() {
  const { token } = useParams();
  const { isDark, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();
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
      <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400 text-sm">
        <Loader2 className="animate-spin mr-2" size={18} />
        <span>{t('action.loading', 'Memuat visitor pass…')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
        <div className="card p-6 max-w-sm w-full text-center rounded-2xl shadow-md border-slate-200 dark:border-slate-800">
          <img src="/logo.png" alt="Logo" className="h-9 mx-auto mb-3 opacity-90" />
          <AlertCircle className="mx-auto text-red-500" size={32} />
          <h1 className="mt-3 font-bold text-slate-900 dark:text-white">Pass Tidak Ditemukan</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
          <Link to="/register" className="btn-primary mt-5 w-full py-2.5 rounded-xl text-xs font-bold">
            Daftar Kunjungan Baru
          </Link>
        </div>
      </div>
    );
  }

  const isCheckout = data.action === 'CHECK_OUT';
  const isDone = data.status === 'CHECKED_OUT';

  const tone = isDone
    ? {
        bg: 'bg-slate-50 dark:bg-slate-800/80',
        border: 'border-slate-200 dark:border-slate-800',
        icon: 'text-slate-500 dark:text-slate-400',
        title: lang === 'en' ? 'Visit Completed' : 'Kunjungan Selesai'
      }
    : isCheckout
    ? {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-900/60',
        icon: 'text-amber-600 dark:text-amber-400',
        title: lang === 'en' ? 'Check-Out Barcode' : 'Barcode Check-Out'
      }
    : {
        bg: 'bg-brand-50 dark:bg-brand-950/40',
        border: 'border-brand-200 dark:border-brand-900/60',
        icon: 'text-brand-600 dark:text-brand-400',
        title: lang === 'en' ? 'Check-In Barcode' : 'Barcode Check-In'
      };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 py-4 sm:py-8 px-3 sm:px-4 text-slate-800 dark:text-slate-100 transition-colors">
      <div className="max-w-md mx-auto space-y-4">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-2 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="PT Cemindo Gemilang" className="h-7 w-auto" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
                PT Cemindo Gemilang
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                Plant Batam · Visitor Pass
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

        {/* Visitor Pass Card */}
        <div className="card overflow-hidden rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className={`px-4 py-3.5 border-b ${tone.bg} ${tone.border}`}>
            <div className="flex items-center gap-2">
              {isDone ? (
                <CheckCircle2 className={tone.icon} size={18} />
              ) : isCheckout ? (
                <LogOut className={tone.icon} size={18} />
              ) : (
                <LogIn className={tone.icon} size={18} />
              )}
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {tone.title}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            {data.qrDataUrl ? (
              <div className="text-center">
                <div className="inline-block p-3.5 bg-white rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <img src={data.qrDataUrl} alt="Barcode Pass" className="w-56 h-56 sm:w-64 sm:h-64 mx-auto" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
                  {isCheckout
                    ? lang === 'en'
                      ? 'Show this barcode to the Security officer when exiting the factory premises.'
                      : 'Tunjukkan barcode ini kepada petugas Security saat keluar dari area pabrik.'
                    : lang === 'en'
                    ? 'Show this barcode to the Security officer at the gate post for validation.'
                    : 'Tunjukkan barcode ini kepada petugas Security di pos gerbang untuk validasi kedatangan.'}
                </p>
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="mx-auto text-emerald-500" size={38} />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-2">
                  {lang === 'en'
                    ? 'No active barcode. Your visit has been successfully completed.'
                    : 'Tidak ada barcode aktif. Kunjungan Anda telah selesai.'}
                </p>
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs sm:text-sm">
              <Row label={lang === 'en' ? 'Visitor Name' : 'Nama Tamu'} value={data.visitorName} />
              <Row label={lang === 'en' ? 'Company' : 'Perusahaan'} value={data.company || '-'} />
              <Row label={lang === 'en' ? 'Department' : 'Departemen'} value={data.department} />
              <Row label={lang === 'en' ? 'Host PIC' : 'PIC Tuan Rumah'} value={data.picName || '-'} />
              <Row label={lang === 'en' ? 'Visit No.' : 'No. Kunjungan'} value={data.visitNumber} mono />
              {data.checkInAt && (
                <Row label={lang === 'en' ? 'Check-In' : 'Masuk'} value={`${fmtTime(data.checkInAt)} WIB`} />
              )}
              {data.checkOutAt && (
                <Row label={lang === 'en' ? 'Check-Out' : 'Keluar'} value={`${fmtTime(data.checkOutAt)} WIB`} />
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500 dark:text-slate-400">
          {lang === 'en'
            ? 'This pass updates automatically in real-time. Keep this tab open during your visit.'
            : 'Halaman ini diperbarui otomatis. Jangan tutup sebelum kunjungan selesai.'}
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className={`text-slate-900 dark:text-slate-100 font-semibold text-right ${mono ? 'font-mono text-xs text-brand-600 dark:text-brand-400' : ''}`}>
        {value}
      </span>
    </div>
  );
}
