import { NextRequest, NextResponse } from 'next/server';
import { isSupportedLocale, SupportedLocale } from '@/i18n/locale-codes';

// Cache GeoIP lookups in memory (max 10,000 entries)
const GEO_CACHE = new Map<string, { countryCode: string; countryName: string; suggestedLang: SupportedLocale }>();
const MAX_CACHE_SIZE = 10000;

const COUNTRY_TO_LOCALE: Record<string, SupportedLocale> = {
  // Persian
  IR: 'fa',
  // Arabic
  AE: 'ar', SA: 'ar', QA: 'ar', KW: 'ar', EG: 'ar', IQ: 'ar', OM: 'ar', BH: 'ar', JO: 'ar', LB: 'ar', DZ: 'ar', MA: 'ar', TN: 'ar',
  // German
  DE: 'de', AT: 'de', CH: 'de',
  // French
  FR: 'fr', BE: 'fr', MC: 'fr', LU: 'fr',
  // Spanish
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  // Turkish
  TR: 'tr', AZ: 'tr',
  // Russian
  RU: 'ru', BY: 'ru', KZ: 'ru', KG: 'ru',
  // Japanese
  JP: 'ja',
  // Korean
  KR: 'ko',
  // Chinese
  CN: 'zh', TW: 'zh', HK: 'zh',
  // Italian
  IT: 'it',
  // Portuguese
  PT: 'pt', BR: 'pt',
  // Hindi
  IN: 'hi',
  // Dutch
  NL: 'nl',
};

function extractClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

function isPrivateIp(ip: string): boolean {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') || ip.startsWith('172.20.') || ip.startsWith('172.21.') || ip.startsWith('172.22.') || ip.startsWith('172.23.') || ip.startsWith('172.24.') || ip.startsWith('172.25.') || ip.startsWith('172.26.') || ip.startsWith('172.27.') || ip.startsWith('172.28.') || ip.startsWith('172.29.') || ip.startsWith('172.30.') || ip.startsWith('172.31.')) {
    return true;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const ip = extractClientIp(req);

  // If private or localhost, return default English for international or Persian for domestic
  const isDomestic = process.env.NEXT_PUBLIC_DEPLOYMENT_MODE === 'domestic';
  if (isPrivateIp(ip)) {
    return NextResponse.json({
      ip,
      country_code: isDomestic ? 'IR' : 'US',
      country_name: isDomestic ? 'Iran' : 'Global',
      suggested_lang: isDomestic ? 'fa' : 'en',
      is_supported: true,
      cached: false,
    });
  }

  // Check cache
  if (GEO_CACHE.has(ip)) {
    const cached = GEO_CACHE.get(ip)!;
    return NextResponse.json({
      ip,
      country_code: cached.countryCode,
      country_name: cached.countryName,
      suggested_lang: cached.suggestedLang,
      is_supported: isSupportedLocale(cached.suggestedLang),
      cached: true,
    });
  }

  let countryCode = 'US';
  let countryName = 'Global';
  let suggestedLang: SupportedLocale = isDomestic ? 'fa' : 'en';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.status === 'success' && data.countryCode) {
        countryCode = data.countryCode.toUpperCase();
        countryName = data.country || countryCode;
        const mapped = COUNTRY_TO_LOCALE[countryCode];
        if (mapped && isSupportedLocale(mapped)) {
          suggestedLang = mapped;
        } else {
          suggestedLang = 'en';
        }
      }
    }
  } catch {
    // Fallback to default
  }

  // Cache result
  if (GEO_CACHE.size >= MAX_CACHE_SIZE) {
    const firstKey = GEO_CACHE.keys().next().value;
    if (firstKey) GEO_CACHE.delete(firstKey);
  }
  GEO_CACHE.set(ip, { countryCode, countryName, suggestedLang });

  return NextResponse.json({
    ip,
    country_code: countryCode,
    country_name: countryName,
    suggested_lang: suggestedLang,
    is_supported: isSupportedLocale(suggestedLang),
    cached: false,
  });
}
