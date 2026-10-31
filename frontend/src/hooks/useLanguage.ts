'use client';

import { create } from 'zustand';
import { isRtlLocale, SUPPORTED_LOCALES, SupportedLocale } from '@/i18n/config';
import i18n from '@/i18n';
import { setCookie, getCookie } from '@/lib/authTokens';

export type SupportedLang = 'fa' | 'en' | 'ar' | 'tr' | 'fr' | 'es' | 'de' | 'ru' | 'zh' | 'ja';

interface LanguageState {
  lang: SupportedLocale;
  dir: 'rtl' | 'ltr';
  setLang: (lang: SupportedLocale) => void;
  initGeoIP: () => Promise<void>;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  lang:
    (typeof window !== 'undefined' &&
      ((localStorage.getItem('drgame_lang') || getCookie('drgame_lang')) as SupportedLocale)) ||
    'fa',
  dir:
    typeof window !== 'undefined' &&
    (localStorage.getItem('drgame_lang') || getCookie('drgame_lang')) === 'en'
      ? 'ltr'
      : 'rtl',
  setLang: (lang: SupportedLocale) => {
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
      // Fallback stays 'fa'
    }
  },
}));
