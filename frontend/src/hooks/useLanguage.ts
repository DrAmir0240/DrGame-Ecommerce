'use client';

import { create } from 'zustand';
import { isRtlLocale, SUPPORTED_LOCALES, SupportedLocale, DEFAULT_LOCALE } from '@/i18n/config';
import i18n from '@/i18n';
import { setCookie, getCookie } from '@/lib/authTokens';

export type SupportedLang = SupportedLocale;

interface LanguageState {
  lang: SupportedLocale;
  dir: 'rtl' | 'ltr';
  setLang: (lang: SupportedLocale) => void;
  initGeoIP: () => Promise<void>;
}

function getInitialState(): { lang: SupportedLocale; dir: 'rtl' | 'ltr' } {
  if (typeof window === 'undefined') {
    return {
      lang: DEFAULT_LOCALE,
      dir: isRtlLocale(DEFAULT_LOCALE) ? 'rtl' : 'ltr',
    };
  }

  const stored = (localStorage.getItem('drgame_lang') || getCookie('drgame_lang')) as SupportedLocale;
  if (stored && SUPPORTED_LOCALES[stored]) {
    return {
      lang: stored,
      dir: isRtlLocale(stored) ? 'rtl' : 'ltr',
    };
  }

  return {
    lang: DEFAULT_LOCALE,
    dir: isRtlLocale(DEFAULT_LOCALE) ? 'rtl' : 'ltr',
  };
}

export const useLanguage = create<LanguageState>((set, get) => ({
  ...getInitialState(),
  setLang: (lang: SupportedLocale) => {
    if (!SUPPORTED_LOCALES[lang]) return;

    const dir = isRtlLocale(lang) ? 'rtl' : 'ltr';
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_lang', lang);
      setCookie('drgame_lang', lang, 365);
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
    i18n.changeLanguage(lang);
    set({ lang, dir });
  },
  initGeoIP: async () => {
    if (typeof window === 'undefined') return;

    // In domestic mode, never override or run GeoIP
    if (process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'domestic') {
      return;
    }

    const stored = (localStorage.getItem('drgame_lang') || getCookie('drgame_lang')) as SupportedLocale;
    if (stored && SUPPORTED_LOCALES[stored]) {
      const dir = isRtlLocale(stored) ? 'rtl' : 'ltr';
      document.documentElement.lang = stored;
      document.documentElement.dir = dir;
      set({ lang: stored, dir });
      return;
    }

    try {
      const res = await fetch('/api/geoip');
      if (res.ok) {
        const data = await res.json();
        const suggested = data.suggested_lang as SupportedLocale;
        if (suggested && SUPPORTED_LOCALES[suggested]) {
          get().setLang(suggested);
        }
      }
    } catch {
      // Fallback stays default
    }
  },
}));
