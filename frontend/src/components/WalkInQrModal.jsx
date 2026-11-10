import React, { useEffect, useState } from 'react';
import {
  Printer,
  Download,
  ExternalLink,
  X,
  Loader2,
  Sparkles,
  QrCode,
  CheckCircle2
} from 'lucide-react';
import { endpoints } from '../lib/api.js';

export default function WalkInQrModal({ onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const registerUrl = `${window.location.origin}/register`;

  useEffect(() => {
    endpoints
      .publicWalkInQr(registerUrl)
      .then(setData)
      .catch(() => {
        // Fallback jika API gagal
        setData({
          url: registerUrl,
          qrDataUrl: ''
        });
      })
      .finally(() => setLoading(false));
  }, [registerUrl]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!data?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = data.qrDataUrl;
    a.download = `QR-Registrasi-Tamu-Cemindo-Gemilang.png`;
    a.click();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(registerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 print:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs print:hidden"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 overflow-hidden print:border-none print:shadow-none print:w-full print:max-w-none print:p-8">
        {/* Tombol Tutup (Sembunyikan saat print) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors print:hidden"
        >
          <X size={20} />
        </button>

        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs shrink-0">
              <img src="/logo.png" alt="Cemindo Logo" className="h-9 w-auto" />
            </div>
            <div className="text-left">
              <div className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                PT CEMINDO GEMILANG Tbk
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Plant Batam · Visitor Management System
              </div>
            </div>
          </div>

          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/60">
              <Sparkles size={12} /> Barcode Walk-In Registration
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-1.5 leading-snug">
              Pendaftaran Tamu Masuk Pabrik
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Arahkan kamera smartphone ke QR Code di bawah untuk mengisi formulir kedatangan tamu sebelum masuk.
            </p>
          </div>
        </div>

        {/* Tampilan QR Code */}
        <div className="my-5 text-center">
          {loading ? (
            <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <Loader2 size={32} className="animate-spin text-brand-600" />
              <span className="text-xs text-slate-500 mt-2 font-medium">Membuat barcode resolusi tinggi…</span>
            </div>
          ) : (
            <div className="inline-block p-4 sm:p-5 bg-white rounded-3xl border border-slate-200 shadow-md">
              <img
                src={data?.qrDataUrl}
                alt="QR Code Pendaftaran Tamu"
                className="w-56 h-56 sm:w-64 sm:h-64 mx-auto object-contain"
              />
            </div>
          )}

          <div className="mt-3 font-mono text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <span className="truncate max-w-[280px] sm:max-w-xs">{registerUrl}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="text-brand-600 dark:text-brand-400 hover:underline font-bold print:hidden"
            >
              {copied ? 'Tersalin!' : 'Salin'}
            </button>
          </div>
        </div>

        {/* Petunjuk Pos Security */}
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3.5 text-left text-[11px] sm:text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 mb-0.5">
            <CheckCircle2 size={14} className="text-amber-600 shrink-0" />
            Petunjuk Standee Pos Security:
          </p>
          Cetak barcode ini lalu tempelkan di loket atau meja pemeriksaan Security. Tamu walk-in cukup melakukan scan menggunakan kamera smartphone tanpa perlu menginstal aplikasi.
        </div>

        {/* Tombol Aksi (Print, Download, Buka) - Disembunyikan saat print */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2.5 print:hidden">
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <Printer size={16} />
            <span>Cetak Standee</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!data?.qrDataUrl}
            className="btn-ghost py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <Download size={16} />
            <span>Unduh QR</span>
          </button>

          <a
            href="/register"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost col-span-2 sm:col-span-1 py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 min-h-[42px] text-brand-600 dark:text-brand-400"
          >
            <ExternalLink size={15} />
            <span>Buka Formulir</span>
          </a>
        </div>
      </div>
    </div>
  );
}

