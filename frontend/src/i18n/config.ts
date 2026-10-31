/**
 * DrGame i18n Core Configuration
 * Supports Persian (fa), English (en), and Arabic (ar).
 * Handles bidirectional layout switching (RTL for fa/ar, LTR for en).
 */

import { MESSAGES } from './messages';

export type SupportedLocale = 'fa' | 'en' | 'ar';

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
};

export const DEFAULT_LOCALE: SupportedLocale = 'fa';

export const RESOURCES: Record<SupportedLocale, any> = MESSAGES;

export function isRtlLocale(locale: string): boolean {
  return locale === 'fa' || locale === 'ar';
}

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
