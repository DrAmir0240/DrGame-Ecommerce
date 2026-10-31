/**
 * Main i18n entrypoint
 * Complete internationalization module for Persian, English, and Arabic.
 */

import {
  SUPPORTED_LOCALES,
  SupportedLocale,
  isRtlLocale,
  translate,
  translatePlural,
  DEFAULT_LOCALE,
  RESOURCES,
} from './config';
import { I18nProvider, useTranslation, getInitialLocale } from './I18nProvider';

// Non-React singleton for direct translation access
export const i18n = {
  language: DEFAULT_LOCALE as SupportedLocale,
  get t() {
    return (key: string, params?: Record<string, string | number>) =>
      translate(key, this.language, params);
  },
  changeLanguage: async (lang: SupportedLocale) => {
    if (SUPPORTED_LOCALES[lang]) {
      i18n.language = lang;
      if (typeof window !== 'undefined') {
        localStorage.setItem('drgame_lang', lang);
        document.documentElement.lang = lang;
        document.documentElement.dir = isRtlLocale(lang) ? 'rtl' : 'ltr';
      }
    }
  },
  dir: (lang?: SupportedLocale) => isRtlLocale(lang || i18n.language) ? 'rtl' : 'ltr',
};

if (typeof window !== 'undefined') {
  i18n.language = getInitialLocale();
}

export {
  I18nProvider,
  useTranslation,
  SUPPORTED_LOCALES,
  isRtlLocale,
  translate,
  translatePlural,
  DEFAULT_LOCALE,
  RESOURCES,
};

export { MESSAGES } from './messages';
export { formatNumber, formatPrice, formatDate, formatDateTime, formatSize, formatQuota, formatPercent, intlLocale } from './format';
export type { PriceCurrency } from './format';
export { localize, localizedField, isFallbackTranslation, localizeList, fallbackChain } from './dynamic';
export type { Localizable, LocalizedDict } from './dynamic';

export type { SupportedLocale };
export default i18n;

