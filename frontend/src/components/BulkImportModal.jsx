import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  RefreshCw,
  Info
} from 'lucide-react';
import { errMsg } from '../lib/api.js';

export default function BulkImportModal({
  title,
  subtitle,
  templateFilename,
  onDownloadTemplate,
  onImport,
  onSuccess,
  onClose
}) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDownload = async () => {
    setDownloading(true);
    setError('');
    try {
      const res = await onDownloadTemplate();
      const url = URL.createObjectURL(
        new Blob([res.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = templateFilename || 'Template_Import.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errMsg(err, 'Gagal mengunduh template Excel'));
    } finally {
      setDownloading(false);
    }
  };

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.match(/\.(xlsx|xls)$/i)) {
      setError('Harap pilih file Excel dengan format .xlsx atau .xls');
      return;
    }
    setFile(f);
    setError('');
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    handleFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const handleProcessImport = () => {
    if (!file) {
      setError('Pilih file Excel terlebih dahulu');
      return;
    }

    setUploading(true);
    setError('');

    const reader = new FileReader();
    reader.onerror = () => {
      setError('Gagal membaca file Excel');
      setUploading(false);
    };
    reader.onload = async (e) => {
      try {
        const base64Data = e.target.result;
        const res = await onImport({ fileData: base64Data });
        setResult(res);
        onSuccess?.();
      } catch (err) {
        setError(errMsg(err, 'Gagal memproses import data Excel'));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop Gelap Penuh */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs" onClick={onClose} />

      {/* Kontainer Modal */}
      <div className="relative z-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl my-auto max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {title || 'Bulk Import Data Excel'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle || 'Unggah data massal dengan format Excel'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Isi Modal */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {/* Langkah 1: Unduh Template */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                1. Belum memiliki format template?
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Gunakan template resmi agar susunan kolom sesuai sistem.
              </div>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="btn-ghost py-2 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-brand-600 dark:text-brand-400 shadow-xs"
            >
              {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              <span>{downloading ? 'Mengunduh...' : 'Unduh Template'}</span>
            </button>
          </div>

          {/* Kotak Petunjuk Upsert / Timpa Data */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <RefreshCw size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Ketentuan Timpa Otomatis (Upsert):</span>
            </div>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
              Jika data pada file memiliki <b>Email / Username</b> yang sudah terdaftar di database, data tersebut <b>otomatis ditimpa/diperbarui</b> dengan data terbaru dari Excel. Jika belum ada, otomatis ditambahkan sebagai akun baru.
            </p>
          </div>

          {/* Jika Sudah Berhasil Import, Tampilkan Rangkuman Hasil */}
          {result ? (
            <div className="space-y-3.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                  Import Data Berhasil Diproses!
                </h4>
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                    <div className="text-lg font-extrabold text-slate-800 dark:text-white">
                      {result.total || 0}
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Total Baris</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                    <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                      {result.created || 0}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Data Baru</div>
                  </div>
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900">
                    <div className="text-lg font-extrabold text-blue-600 dark:text-blue-400">
                      {result.updated || 0}
                    </div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">Tertimpa / Update</div>
                  </div>
                </div>
              </div>

              {/* Tampilkan Daftar Catatan / Error Jika Ada */}
              {result.errors && result.errors.length > 0 && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs space-y-1">
                  <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    <span>Perhatian pada baris berikut ({result.errors.length} baris dilewati):</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-red-600 dark:text-red-400 space-y-0.5 max-h-32 overflow-y-auto">
                    {result.errors.map((errItem, idx) => (
                      <li key={idx}>{errItem}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={onClose}
                className="btn-primary w-full py-3 rounded-xl font-bold text-xs"
              >
                Selesai & Tutup
              </button>
            </div>
          ) : (
            /* Langkah 2: Area Drag & Drop / Pilih File */
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30'
                    : file
                    ? 'border-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                {file ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate max-w-xs mx-auto">
                        {file.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Ukuran: {(file.size / 1024).toFixed(1)} KB (Klik untuk ganti file)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                      <Upload size={22} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Klik untuk memilih file Excel, atau seret ke sini
                      </div>
                      <div className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">
                        Mendukung format .xlsx dan .xls (Maks. 10MB)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 p-3 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Tombol Aksi */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={uploading}
                  className="btn-ghost flex-1 py-2.5 rounded-xl font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleProcessImport}
                  disabled={!file || uploading}
                  className="btn-primary flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Memproses Data...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={15} />
                      <span>Unggah & Sinkronkan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

