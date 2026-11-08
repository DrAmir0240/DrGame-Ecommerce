/**
 * Locale codes — the dependency-free core of the i18n layer.
 *
 * Kept separate from `config.ts` on purpose: `config.ts` imports every message
 * catalog, so anything that only needs to *validate* a locale (API routes,
 * middleware, the dynamic translator) imports this module instead and stays
 * out of the 15-catalog bundle.
 */

export const LOCALE_CODES = [
  'fa',
  'en',
  'ar',
  'de',
  'es',
  'fr',
  'ru',
  'zh',
  'ja',
  'ko',
  'tr',
  'it',
  'pt',
  'hi',
  'nl',
] as const;

export type SupportedLocale = (typeof LOCALE_CODES)[number];

export const IS_INTERNATIONAL = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'international';

/** Source language: English for international deployment, Persian for domestic. */
export const DEFAULT_LOCALE: SupportedLocale = IS_INTERNATIONAL ? 'en' : 'fa';

/** Right-to-left locales. Add a code here and the layout follows automatically. */
export const RTL_LOCALES: readonly SupportedLocale[] = ['fa', 'ar'];

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (LOCALE_CODES as readonly string[]).includes(value);
}

export function isRtlLocale(locale: string): boolean {
  return (RTL_LOCALES as readonly string[]).includes(locale);
}
