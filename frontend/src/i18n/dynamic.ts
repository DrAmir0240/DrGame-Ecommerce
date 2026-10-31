/**
 * Dynamic content localization (frontend side).
 *
 * Static UI copy lives in `messages/*.json`. Content that comes from the API
 * (game titles, descriptions, genres, banners, plan names, blog posts, …) must
 * NOT be translated by dictionary hacks on the client — the backend is the
 * source of truth. This module only *reads* the localized payloads the API
 * returns and applies the same fallback chain the UI uses.
 *
 * Supported API shapes (all optional, checked in this order):
 *   1. { "title_i18n": { "fa": "…", "en": "…", "ar": "…" } }
 *   2. { "translations": { "fa": { "title": "…" }, "en": { "title": "…" } } }
 *   3. { "title": { "fa": "…", "en": "…" } }
 *   4. { "title": "God of War" }              → single-language fallback
 */

import { SupportedLocale, DEFAULT_LOCALE } from './config';

export type LocalizedDict = Partial<Record<SupportedLocale, string>>;
export type Localizable = string | LocalizedDict | null | undefined;

const LOCALES: SupportedLocale[] = ['fa', 'en', 'ar'];

/** Locale fallback chain: requested → English → Persian (source language). */
export function fallbackChain(locale: SupportedLocale): SupportedLocale[] {
  return Array.from(new Set<SupportedLocale>([locale, 'en', DEFAULT_LOCALE]));
}

function isLocaleDict(value: unknown): value is LocalizedDict {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.keys(value as object).some((key) => LOCALES.includes(key as SupportedLocale));
}

/**
 * Resolve a localized value with fallback.
 * `localize({ fa: 'خدا', en: 'God' }, 'en')` → "God"
 */
export function localize(
  value: Localizable,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (isLocaleDict(value)) {
    for (const candidate of fallbackChain(locale)) {
      const text = value[candidate];
      if (typeof text === 'string' && text.trim() !== '') return text;
    }
  }
  return '';
}

/**
 * Read `field` from an API entity, honouring `<field>_i18n`, `translations`
 * and object-shaped fields.
 */
export function localizedField<T extends Record<string, any>>(
  entity: T | null | undefined,
  field: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (!entity) return '';

  // 1. JSONB style: { title_i18n: { fa, en, ar } }
  const direct = localize(entity[`${field}_i18n`] as Localizable, locale);
  if (direct) return direct;

  // 2. Column-per-language style: { title_fa, title_en, title_ar }
  for (const candidate of fallbackChain(locale)) {
    const column = entity[`${field}_${candidate}`];
    if (typeof column === 'string' && column.trim() !== '') return column;
  }

  // 3. Nested translations map: { translations: { en: { title } } }
  const translations = entity.translations as
    | Partial<Record<SupportedLocale, Record<string, any>>>
    | undefined;
  if (translations) {
    for (const candidate of fallbackChain(locale)) {
      const value = translations[candidate]?.[field];
      if (typeof value === 'string' && value.trim() !== '') return value;
    }
  }

  // 4. Plain value or locale dictionary: { title: 'God of War' | { fa, en } }
  return localize(entity[field] as Localizable, locale);
}

/** True when the API had no translation for the requested locale. */
export function isFallbackTranslation<T extends Record<string, any>>(
  entity: T | null | undefined,
  field: string,
  locale: SupportedLocale = DEFAULT_LOCALE
): boolean {
  if (!entity || locale === DEFAULT_LOCALE) return false;
  const dict = entity[`${field}_i18n`] as LocalizedDict | undefined;
  if (isLocaleDict(dict)) {
    return !dict[locale];
  }
  return false;
}

/**
 * Build a human readable slug/label list from an array of localized entities
 * (e.g. genres of a game).
 */
export function localizeList(
  items: Array<Record<string, any>> | null | undefined,
  field: string,
  locale: SupportedLocale = DEFAULT_LOCALE,
  separator = '، '
): string {
  if (!items?.length) return '';
  return items
    .map((item) => localizedField(item, field, locale))
    .filter(Boolean)
    .join(separator);
}
