/**
 * Locale-aware formatting helpers.
 *
 * Never hand-format numbers, prices or dates per page — always go through these
 * so Persian uses Persian digits + Jalali calendar, English uses Gregorian, and
 * Arabic uses Arabic-Indic digits where appropriate.
 */

import { SupportedLocale, DEFAULT_LOCALE } from './config';

const INTL_LOCALE: Record<SupportedLocale, string> = {
  fa: 'fa-IR',
  en: 'en-US',
  ar: 'ar-EG',
};

/** Locale code usable by Intl (also useful for `Intl.PluralRules`). */
export function intlLocale(locale: SupportedLocale = DEFAULT_LOCALE): string {
  return INTL_LOCALE[locale] || INTL_LOCALE[DEFAULT_LOCALE];
}

/** 1,240 / ۱٬۲۴۰ / ١٬٢٤٠ depending on the active locale. */
export function formatNumber(
  value: number | string | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options?: Intl.NumberFormatOptions
): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '—';
  return new Intl.NumberFormat(intlLocale(locale), options).format(num);
}

export type PriceCurrency = 'IRT' | 'USD' | 'USDT';

/**
 * Prices are stored as Toman (IRT) or USD. `IRT` renders "۱٬۲۵۰٬۰۰۰ تومان"
 * with the localized currency name coming from the `common.currency.*` messages.
 */
export function formatPrice(
  value: number | string | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
  currency: PriceCurrency = 'IRT',
  labels?: { toman?: string; usd?: string }
): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '—';

  if (currency === 'IRT') {
    const amount = formatNumber(num, locale);
    return `${amount} ${labels?.toman ?? ''}`.trim();
  }

  const amount = new Intl.NumberFormat(intlLocale(locale), {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(num);
  return `${amount} ${labels?.usd ?? currency}`;
}

/**
 * Dates: Jalali for Persian, Gregorian for English/Arabic.
 * Accepts ISO strings, timestamps and Date objects.
 */
export function formatDate(
  value: string | number | Date | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const defaults: Intl.DateTimeFormatOptions =
    locale === 'fa'
      ? { calendar: 'persian', year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' };

  return new Intl.DateTimeFormat(intlLocale(locale), { ...defaults, ...options }).format(date);
}

export function formatDateTime(
  value: string | number | Date | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  return formatDate(value, locale, {
    ...(locale === 'fa' ? { calendar: 'persian' as const } : {}),
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Game sizes are stored in GB. Renders "۴۵ GB" / "45 GB". */
export function formatSize(
  gigabytes: number | string | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE,
  unit = 'GB'
): string {
  const num = typeof gigabytes === 'string' ? Number(gigabytes) : gigabytes;
  if (num === null || num === undefined || Number.isNaN(num)) return '—';
  return `${formatNumber(num, locale, { maximumFractionDigits: 1 })} ${unit}`;
}

/** Remaining quota (GB) → "۱۲٫۵ GB". */
export function formatQuota(
  gigabytes: number | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (gigabytes === null || gigabytes === undefined) return '—';
  if (!Number.isFinite(gigabytes)) return '∞';
  return formatSize(gigabytes, locale);
}

/** Percentage with locale digits: ۶۵٪ / 65%. */
export function formatPercent(
  value: number | null | undefined,
  locale: SupportedLocale = DEFAULT_LOCALE
): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(intlLocale(locale), {
    style: 'percent',
    maximumFractionDigits: 1,
  }).format(value > 1 ? value / 100 : value);
}
