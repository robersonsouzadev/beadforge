'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pt } from './dictionaries/pt';
import { en } from './dictionaries/en';
import { es } from './dictionaries/es';

export type Language = 'pt' | 'en' | 'es';
export type Currency = 'BRL' | 'USD';

export const DICTIONARIES = {
  pt,
  en,
  es,
};

interface LanguageContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
  t: typeof pt;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pt',
  currency: 'BRL',
  setLanguage: () => {},
  setCurrency: () => {},
  t: pt,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('pt');
  const [currency, setCurrencyState] = useState<Currency>('BRL');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Check localStorage first
    const savedLang = localStorage.getItem('beadforge_lang') as Language | null;
    const savedCurr = localStorage.getItem('beadforge_curr') as Currency | null;

    if (savedLang && (savedLang === 'pt' || savedLang === 'en' || savedLang === 'es')) {
      setLanguageState(savedLang);
      setCurrencyState(savedCurr || (savedLang === 'pt' ? 'BRL' : 'USD'));
    } else {
      // 2. Detect Browser Language & Locale automatically
      const browserLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();

      if (browserLang.startsWith('es')) {
        setLanguageState('es');
        setCurrencyState('USD');
      } else if (browserLang.startsWith('pt')) {
        setLanguageState('pt');
        setCurrencyState('BRL');
      } else {
        // Default to English and USD for any other international visitor
        setLanguageState('en');
        setCurrencyState('USD');
      }
    }
    setIsInitialized(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('beadforge_lang', lang);

    // Automatically synchronize currency with selected language
    const newCurr: Currency = lang === 'pt' ? 'BRL' : 'USD';
    setCurrencyState(newCurr);
    localStorage.setItem('beadforge_curr', newCurr);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('beadforge_curr', curr);
  };

  const t = DICTIONARIES[language] || pt;

  return (
    <LanguageContext.Provider
      value={{
        language,
        currency,
        setLanguage,
        setCurrency,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function useTranslation() {
  const { t, language, currency, setLanguage, setCurrency } = useContext(LanguageContext);
  return { t, language, currency, setLanguage, setCurrency };
}
