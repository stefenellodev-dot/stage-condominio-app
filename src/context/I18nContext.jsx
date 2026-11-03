import React, { createContext, useContext, useState, useEffect } from 'react';
import { es } from '../locales/es';
import { en } from '../locales/en';

const translations = { es, en };
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('app_lang') || 'es';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[lang];

    for (const k of keys) {
      if (!current || current[k] === undefined) {
        return path;
      }
      current = current[k];
    }
    return current;
  };

  const toggleLang = () => {
    setLang((prev) => (prev === 'es' ? 'en' : 'es'));
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation debe utilizarse dentro de I18nProvider');
  }
  return context;
}
