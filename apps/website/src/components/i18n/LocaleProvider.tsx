'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DICTIONARIES, type Dict, type Locale } from './dict';

const KEY = 'hijob.locale';

interface LocaleContextValue {
  locale: Locale;
  t: Dict;
  setLocale: (l: Locale) => void;
  isHydrated: boolean;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('uz');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw === 'uz' || raw === 'ru' || raw === 'en') setLocaleState(raw);
    } catch {
      /* ignore */
    }
    setIsHydrated(true);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
    try {
      document.documentElement.lang = l;
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      t: DICTIONARIES[locale],
      setLocale,
      isHydrated,
    }),
    [locale, setLocale, isHydrated],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
