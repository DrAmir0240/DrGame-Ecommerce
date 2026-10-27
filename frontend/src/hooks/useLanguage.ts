'use client';

import { create } from 'zustand';
import { SupportedLang, isRtlLang, SUPPORTED_LANGUAGES } from '@/lib/translationEngine';

export type { SupportedLang };

interface LanguageState {
  lang: SupportedLang;
  dir: 'rtl' | 'ltr';
  setLang: (lang: SupportedLang) => void;
  initGeoIP: () => Promise<void>;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  lang: (typeof window !== 'undefined' && (localStorage.getItem('drgame_lang') as SupportedLang)) || 'fa',
  dir: (typeof window !== 'undefined' && localStorage.getItem('drgame_lang') && !isRtlLang(localStorage.getItem('drgame_lang') as SupportedLang)) ? 'ltr' : 'rtl',
  setLang: (lang: SupportedLang) => {
    const dir = isRtlLang(lang) ? 'rtl' : 'ltr';
    if (typeof window !== 'undefined') {
      localStorage.setItem('drgame_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = dir;
    }
    set({ lang, dir });
  },
  initGeoIP: async () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('drgame_lang');
    if (stored) {
      const dir = isRtlLang(stored as SupportedLang) ? 'rtl' : 'ltr';
      document.documentElement.lang = stored;
      document.documentElement.dir = dir;
      set({ lang: stored as SupportedLang, dir });
      return;
    }

    try {
      const res = await fetch('/api/geoip');
      if (res.ok) {
        const data = await res.json();
        const suggested = data.suggested_lang as SupportedLang;
        if (suggested && SUPPORTED_LANGUAGES[suggested]) {
          get().setLang(suggested);
        }
      }
    } catch {
      // Fallback stays 'fa'
    }
  },
}));
