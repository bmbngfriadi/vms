import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageToggle({ className = '' }) {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold tracking-wider transition-all shadow-sm ${
        language === 'en'
          ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
          : 'bg-cemindo-red text-white border-cemindo-red hover:bg-cemindo-darkred'
      } ${className}`}
      title={language === 'en' ? 'Switch to Bahasa Indonesia' : 'Switch to English'}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className={language === 'en' ? 'font-bold' : 'opacity-70'}>EN</span>
      <span className="opacity-40">/</span>
      <span className={language === 'id' ? 'font-bold' : 'opacity-70'}>ID</span>
    </button>
  );
}

