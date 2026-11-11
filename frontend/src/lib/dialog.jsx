import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  HelpCircle,
  LogOut,
  Trash2,
  X,
  Loader2
} from 'lucide-react';

const DialogContext = createContext({
  confirm: async () => false,
  alert: async () => {},
  prompt: async () => null
});

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const [promptInput, setPromptInput] = useState('');

  // Fungsi trigger confirm custom
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setDialogState({
        type: 'confirm',
        title: options.title || 'Konfirmasi Tindakan',
        message: options.message || 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
        confirmText: options.confirmText || 'Ya, Lanjutkan',
        cancelText: options.cancelText || 'Batal',
        variant: options.variant || (options.danger ? 'danger' : 'brand'), // 'danger' | 'brand' | 'warning'
        icon: options.icon || (options.danger ? 'danger' : options.iconType || 'help'),
        resolve
      });
    });
  }, []);

  // Fungsi trigger alert custom
  const alertCustom = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    return new Promise((resolve) => {
      setDialogState({
        type: 'alert',
        title: opts.title || (opts.type === 'error' ? 'Terjadi Kesalahan' : opts.type === 'success' ? 'Berhasil' : 'Informasi'),
        message: opts.message || '',
        confirmText: opts.confirmText || 'Mengerti',
        variant: opts.type || 'info', // 'success' | 'error' | 'warning' | 'info'
        resolve
      });
    });
  }, []);

  // Fungsi trigger prompt custom
  const promptCustom = useCallback((options) => {
    const opts = typeof options === 'string' ? { message: options } : options;
    setPromptInput(opts.defaultValue || '');
    return new Promise((resolve) => {
      setDialogState({
        type: 'prompt',
        title: opts.title || 'Masukkan Keterangan',
        message: opts.message || '',
        placeholder: opts.placeholder || '',
        confirmText: opts.confirmText || 'Kirim',
        cancelText: opts.cancelText || 'Batal',
        variant: opts.variant || 'brand',
        resolve
      });
    });
  }, []);

  const handleClose = (result) => {
    if (dialogState?.resolve) {
      dialogState.resolve(result);
    }
    setDialogState(null);
  };

  const renderIcon = () => {
    if (!dialogState) return null;
    const v = dialogState.variant;
    const iconType = dialogState.icon;

    if (iconType === 'logout') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-xs">
          <LogOut size={24} strokeWidth={2.2} />
        </div>
      );
    }
    if (iconType === 'trash' || v === 'danger' || v === 'error') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0 shadow-xs">
          <Trash2 size={24} strokeWidth={2.2} />
        </div>
      );
    }
    if (v === 'success') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
          <CheckCircle2 size={24} strokeWidth={2.2} />
        </div>
      );
    }
    if (v === 'warning') {
      return (
        <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
          <AlertTriangle size={24} strokeWidth={2.2} />
        </div>
      );
    }
    return (
      <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900/60 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 shadow-xs">
        <HelpCircle size={24} strokeWidth={2.2} />
      </div>
    );
  };

  return (
    <DialogContext.Provider value={{ confirm, alert: alertCustom, prompt: promptCustom }}>
      {children}

      {/* ================= MODAL DIALOG CUSTOM POPUP ================= */}
      {dialogState && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Blur Layer Tertinggi */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-150"
            onClick={() => handleClose(dialogState.type === 'confirm' ? false : null)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
            {/* Header dengan Icon & Tombol X */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {renderIcon()}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {dialogState.title}
                  </h3>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    PT Cemindo Gemilang Tbk · Sistem Konfirmasi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleClose(dialogState.type === 'confirm' ? false : null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Tutup"
              >
                <X size={19} />
              </button>
            </div>

            {/* Konten Pesan */}
            <div className="mt-4 text-[13.5px] sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {dialogState.message}
            </div>

            {/* Input untuk Dialog Type = Prompt */}
            {dialogState.type === 'prompt' && (
              <div className="mt-3.5">
                <textarea
                  autoFocus
                  rows={3}
                  className="input text-sm p-3 rounded-xl w-full border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder={dialogState.placeholder}
                />
              </div>
            )}

            {/* Tombol Aksi Bawah Proporsional Native Mobile */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              {/* Tombol Batal untuk Confirm & Prompt */}
              {(dialogState.type === 'confirm' || dialogState.type === 'prompt') && (
                <button
                  type="button"
                  onClick={() => handleClose(dialogState.type === 'confirm' ? false : null)}
                  className="w-full sm:w-auto py-3 sm:py-2.5 px-4 text-xs sm:text-sm font-bold rounded-xl min-h-[46px] btn-ghost text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {dialogState.cancelText}
                </button>
              )}

              {/* Tombol Konfirmasi Utama */}
              <button
                type="button"
                autoFocus={dialogState.type === 'alert'}
                onClick={() => {
                  if (dialogState.type === 'prompt') {
                    handleClose(promptInput);
                  } else if (dialogState.type === 'confirm') {
                    handleClose(true);
                  } else {
                    handleClose(true);
                  }
                }}
                className={`w-full sm:w-auto py-3 sm:py-2.5 px-6 text-xs sm:text-sm font-bold rounded-xl min-h-[46px] transition-all shadow-sm flex items-center justify-center ${
                  dialogState.variant === 'danger' || dialogState.variant === 'error'
                    ? 'btn-danger'
                    : dialogState.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'btn-primary'
                }`}
              >
                {dialogState.confirmText}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog harus digunakan di dalam DialogProvider');
  }
  return context;
}

