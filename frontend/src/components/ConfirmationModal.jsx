import React from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  LogOut,
  XCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  type = 'primary', // 'success', 'danger', 'warning', 'info', 'primary', 'dark'
  confirmIcon: CustomIcon,
  isLoading = false,
  confirmDisabled = false,
  children
}) {
  const { t } = useLanguage();

  if (!isOpen) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          headerBg: 'bg-emerald-600',
          iconBg: 'bg-emerald-100 text-emerald-700',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30',
          icon: CustomIcon || LogIn
        };
      case 'dark':
      case 'checkout':
        return {
          headerBg: 'bg-slate-900',
          iconBg: 'bg-slate-800 text-slate-100',
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/30',
          icon: CustomIcon || LogOut
        };
      case 'danger':
        return {
          headerBg: 'bg-rose-600',
          iconBg: 'bg-rose-100 text-rose-700',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30',
          icon: CustomIcon || XCircle
        };
      case 'warning':
        return {
          headerBg: 'bg-amber-600',
          iconBg: 'bg-amber-100 text-amber-700',
          confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30',
          icon: CustomIcon || AlertTriangle
        };
      default:
        return {
          headerBg: 'bg-slate-900',
          iconBg: 'bg-slate-100 text-slate-700',
          confirmBtn: 'bg-cemindo-red hover:bg-red-700 text-white shadow-red-600/30',
          icon: CustomIcon || HelpCircle
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${config.iconBg}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {description && (
            <div className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {description}
            </div>
          )}

          {children}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="py-2.5 px-4 text-xs font-bold rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            {cancelText || t('cancel') || 'Batal'}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || confirmDisabled}
            className={`py-2.5 px-6 text-xs sm:text-sm font-extrabold rounded-xl flex items-center gap-2 shadow-md transition transform active:scale-95 disabled:opacity-50 disabled:pointer-events-none ${config.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <Icon className="w-4 h-4" />
                <span>{confirmText || t('confirm') || 'Ya, Lanjutkan'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

