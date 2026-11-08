/**
 * DrGame i18n Core Configuration
 * Supports 15 locales: fa, en, ar (hand-maintained) plus de, es, fr, ru, zh, ja,
 * ko, tr, it, pt, hi, nl (generated from the English source — see
 * `scripts/i18n/generate-locales.mjs`).
 * Handles bidirectional layout switching (RTL for fa/ar, LTR for the rest).
 *
 * Codes, the default locale and the RTL set live in `locale-codes.ts` so that
 * server-side callers can validate a locale without importing this module
 * (and therefore without bundling every catalog).
 */

import { MESSAGES } from './messages';
import {
  LOCALE_CODES,
  IS_INTERNATIONAL,
  DEFAULT_LOCALE,
  RTL_LOCALES,
  isRtlLocale,
  isSupportedLocale,
  type SupportedLocale,
} from './locale-codes';

export type { SupportedLocale };
export { IS_INTERNATIONAL, DEFAULT_LOCALE, RTL_LOCALES, isRtlLocale, isSupportedLocale };

export interface LocaleMeta {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const SUPPORTED_LOCALES: Record<SupportedLocale, LocaleMeta> = {
  fa: {
    code: 'fa',
    name: 'Persian',
    nativeName: 'فارسی',
    flag: '🇮🇷',
    dir: 'rtl',
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    dir: 'rtl',
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    dir: 'ltr',
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    dir: 'ltr',
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    dir: 'ltr',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr',
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '简体中文',
    flag: '🇨🇳',
    dir: 'ltr',
  },
  ja: {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    dir: 'ltr',
  },
  ko: {
    code: 'ko',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    dir: 'ltr',
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    dir: 'ltr',
  },
  it: {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    dir: 'ltr',
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    dir: 'ltr',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    dir: 'ltr',
  },
  nl: {
    code: 'nl',
    name: 'Dutch',
    nativeName: 'Nederlands',
    flag: '🇳🇱',
    dir: 'ltr',
  },
};

/** Every locale, in switcher order. */
export const ALL_LOCALES = [...LOCALE_CODES] as SupportedLocale[];

export const RESOURCES: Record<SupportedLocale, any> = MESSAGES;

export function getNestedTranslation(obj: any, path: string): string | null {
  if (!obj || typeof obj !== 'object') return null;
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Translate a dot-notation key (e.g. 'nav.home')
 */
export function translate(
  key: string,
  lang: SupportedLocale = DEFAULT_LOCALE,
  params?: Record<string, string | number>
): string {
  // 1. Try target locale
  const targetResource = RESOURCES[lang] || RESOURCES[DEFAULT_LOCALE];
  let text = getNestedTranslation(targetResource, key);

  // 2. Fallback to Persian (default) if not found in target
  if (!text && lang !== DEFAULT_LOCALE) {
    text = getNestedTranslation(RESOURCES[DEFAULT_LOCALE], key);
  }

  // 3. Fallback to key itself
  if (!text) {
    return key;
  }

  // 4. Interpolate params if provided (e.g. {{count}})
  if (params) {
    Object.entries(params).forEach(([paramKey, val]) => {
      text = text!.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(val));
    });
  }

  return text;
}

/**
 * Plural-aware translation.
 * Looks up `${key}_${pluralCategory}` first (e.g. `tickets.count_one` / `tickets.count_other`)
 * and falls back to `${key}_other`, then to `${key}` itself.
 */
export function translatePlural(
  key: string,
  count: number,
  lang: SupportedLocale = DEFAULT_LOCALE,
  params?: Record<string, string | number>
): string {
  const category = new Intl.PluralRules(lang).select(count);
  const candidates = [`${key}_${category}`, `${key}_other`, key];

  for (const candidate of candidates) {
    const text = translate(candidate, lang, { count, ...params });
    if (text !== candidate) return text;
  }
  return key;
}


export function formatNumber(val: number | string, lang: SupportedLocale = DEFAULT_LOCALE): string {
  if (lang === 'fa') {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(val).replace(/[0-9]/g, (d) => farsiDigits[parseInt(d, 10)]);
  } else if (lang === 'ar') {
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(val).replace(/[0-9]/g, (d) => arabicDigits[parseInt(d, 10)]);
  }
  return String(val);
}

export function formatPrice(amount: number | string, lang: SupportedLocale = DEFAULT_LOCALE): string {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  const formattedWithCommas = num.toLocaleString('en-US');
  const localizedNum = formatNumber(formattedWithCommas, lang);
  if (lang === 'fa') return `${localizedNum} تومان`;
  if (lang === 'ar') return `${localizedNum} تومان`;
  return `${formattedWithCommas} Toman`;
}

export function formatDataSize(gb: number | string, lang: SupportedLocale = DEFAULT_LOCALE): string {
  const num = typeof gb === 'string' ? parseFloat(gb) || 0 : gb;
  const localizedNum = formatNumber(num, lang);
  if (lang === 'fa') return `${localizedNum} گیگابایت`;
  if (lang === 'ar') return `${localizedNum} جيجابايت`;
  return `${num} GB`;
}
