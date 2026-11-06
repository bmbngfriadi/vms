import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('vms_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('vms_language', language);
    document.documentElement.lang = language;
  }, [language]);

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'id' : 'en'));
  };

  const setLanguage = (lang) => {
    if (lang === 'en' || lang === 'id') {
      setLanguageState(lang);
    }
  };

  const t = (key) => {
    const dict = translations[language] || translations.en;
    if (dict[key] !== undefined) {
      return dict[key];
    }
    // Fallback to English
    if (translations.en[key] !== undefined) {
      return translations.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

