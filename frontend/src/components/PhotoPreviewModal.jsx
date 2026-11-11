import React from 'react';
import { createPortal } from 'react-dom';
import { X, Download, UserCheck, Shield } from 'lucide-react';

export default function PhotoPreviewModal({
  photoUrl,
  photo,
  url,
  visitorName,
  name,
  title,
  identityNumber,
  nik,
  subtitle,
  onClose
}) {
  const currentPhoto = photoUrl || photo || url;
  if (!currentPhoto) return null;

  const currentName = visitorName || name || title || 'Tamu Pabrik';
  const currentNik = identityNumber || nik || subtitle;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = currentPhoto;
    const cleanName = String(currentName).replace(/\s+/g, '_');
    a.download = `Foto_Identitas_${cleanName}.jpg`;
    a.click();
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900/60 flex items-center justify-center shrink-0">
              <Shield size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                Foto Identitas (KTP / SIM / Paspor)
              </h3>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {currentName} {currentNik ? `· ${currentNik}` : ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport Foto Besar */}
        <div className="my-4 relative bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center min-h-[220px] max-h-[60vh] p-2">
          <img
            src={currentPhoto}
            alt="Dokumen Identitas Tamu"
            className="w-auto h-auto max-h-[56vh] max-w-full object-contain rounded-xl select-none"
          />
        </div>

        {/* Footer Aksi */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
            Dokumen resmi arsip kedatangan PT Cemindo Gemilang Tbk
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleDownload}
              className="btn-ghost flex-1 sm:flex-none py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 min-h-[40px]"
            >
              <Download size={15} />
              <span>Unduh Foto</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="btn-primary flex-1 sm:flex-none py-2 px-5 text-xs font-bold rounded-xl min-h-[40px]"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

