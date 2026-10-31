'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  SupportedLocale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isRtlLocale,
  translate,
  translatePlural,
} from './config';
import { formatNumber, formatPrice, formatDate, formatSize, formatPercent, PriceCurrency } from './format';
import { setCookie, getCookie } from '@/lib/authTokens';

export interface I18nContextValue {
  locale: SupportedLocale;
  dir: 'rtl' | 'ltr';
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Plural-aware translation: `tp('tickets.count', 3)` */
  tp: (key: string, count: number, params?: Record<string, string | number>) => string;
  /** Locale-aware number formatting */
  n: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) => string;
  /** Locale-aware price formatting (Toman / USD / USDT) */
  price: (value: number | string | null | undefined, currency?: PriceCurrency) => string;
  /** Locale-aware date formatting (Jalali for fa) */
  d: (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) => string;
  /** Locale-aware game size formatting (GB) */
  size: (gigabytes: number | string | null | undefined, unit?: string) => string;
  percent: (value: number | null | undefined) => string;
  changeLanguage: (lang: SupportedLocale) => void;
  i18n: {
    language: SupportedLocale;
    languages: SupportedLocale[];
    dir: (lang?: SupportedLocale) => 'rtl' | 'ltr';
    changeLanguage: (lang: SupportedLocale) => Promise<void>;
  };
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function getInitialLocale(): SupportedLocale {
  if (typeof window === 'undefined') {
    return DEFAULT_LOCALE;
  }

  // 1. Check localStorage
  const stored = localStorage.getItem('drgame_lang') as SupportedLocale;
  if (stored && SUPPORTED_LOCALES[stored]) {
    return stored;
  }

  // 2. Check cookie
  const cookieLocale = getCookie('drgame_lang') as SupportedLocale;
  if (cookieLocale && SUPPORTED_LOCALES[cookieLocale]) {
    return cookieLocale;
  }

  // 3. Check browser language
  if (typeof navigator !== 'undefined' && navigator.language) {
    const nav = navigator.language.slice(0, 2).toLowerCase();
    if (nav === 'ar') return 'ar';
    if (nav === 'en') return 'en';
  }

  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<SupportedLocale>(DEFAULT_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize from client storage
  useEffect(() => {
    const init = getInitialLocale();
    setLocale(init);
    setIsHydrated(true);

    const dir = isRtlLocale(init) ? 'rtl' : 'ltr';
    document.documentElement.lang = init;
    document.documentElement.dir = dir;
  }, []);

  const changeLanguage = useCallback((newLocale: SupportedLocale) => {
    if (!SUPPORTED_LOCALES[newLocale]) return;

    setLocale(newLocale);
    const dir = isRtlLocale(newLocale) ? 'rtl' : 'ltr';

    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_lang', newLocale);
      setCookie('drgame_lang', newLocale, 365);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = dir;
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      return translate(key, locale, params);
    },
    [locale]
  );

  const tp = useCallback(
    (key: string, count: number, params?: Record<string, string | number>) => {
      return translatePlural(key, count, locale, params);
    },
    [locale]
  );

  const n = useCallback(
    (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) =>
      formatNumber(value, locale, options),
    [locale]
  );

  const price = useCallback(
    (value: number | string | null | undefined, currency: PriceCurrency = 'IRT') =>
      formatPrice(value, locale, currency, {
        toman: translate('common.currency.toman', locale),
        usd: translate('common.currency.usd', locale),
      }),
    [locale]
  );

  const d = useCallback(
    (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
      formatDate(value, locale, options),
    [locale]
  );

  const size = useCallback(
    (gigabytes: number | string | null | undefined, unit?: string) =>
      formatSize(gigabytes, locale, unit),
    [locale]
  );

  const percent = useCallback(
    (value: number | null | undefined) => formatPercent(value, locale),
    [locale]
  );

  const i18nObj = useMemo(
    () => ({
      language: locale,
      languages: Object.keys(SUPPORTED_LOCALES) as SupportedLocale[],
      dir: (lang?: SupportedLocale) => (isRtlLocale(lang || locale) ? 'rtl' : 'ltr'),
      changeLanguage: async (lang: SupportedLocale) => {
        changeLanguage(lang);
      },
    }),
    [locale, changeLanguage]
  );

  const contextValue = useMemo<I18nContextValue>(
    () => ({
      locale,
      dir: isRtlLocale(locale) ? 'rtl' : 'ltr',
      t,
      tp,
      n,
      price,
      d,
      size,
      percent,
      changeLanguage,
      i18n: i18nObj,
    }),
    [locale, t, tp, n, price, d, size, percent, changeLanguage, i18nObj]
  );

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    // Fallback if used outside Provider
    return {
      t: (key: string, params?: Record<string, string | number>) => translate(key, DEFAULT_LOCALE, params),
      tp: (key: string, count: number, params?: Record<string, string | number>) =>
        translatePlural(key, count, DEFAULT_LOCALE, params),
      n: (value: number | string | null | undefined, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, DEFAULT_LOCALE, options),
      price: (value: number | string | null | undefined, currency: PriceCurrency = 'IRT') =>
        formatPrice(value, DEFAULT_LOCALE, currency),
      d: (value: string | number | Date | null | undefined, options?: Intl.DateTimeFormatOptions) =>
        formatDate(value, DEFAULT_LOCALE, options),
      size: (gigabytes: number | string | null | undefined, unit?: string) =>
        formatSize(gigabytes, DEFAULT_LOCALE, unit),
      percent: (value: number | null | undefined) => formatPercent(value, DEFAULT_LOCALE),
      i18n: {
        language: DEFAULT_LOCALE,
        languages: ['fa', 'en', 'ar'] as SupportedLocale[],
        dir: () => 'rtl' as const,
        changeLanguage: async () => {},
      },
      locale: DEFAULT_LOCALE,
      dir: 'rtl' as const,
      changeLanguage: () => {},
    };
  }
  return context;
}

