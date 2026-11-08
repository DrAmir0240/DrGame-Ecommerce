import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale, IS_INTERNATIONAL } from '@/i18n/locale-codes';
import { translateWithLexicon } from '@/lib/dynamicLexicon';

// Optional proxy dispatcher for Node.js fetch
let proxyDispatcher: any = null;
const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || (process.env.NODE_ENV === 'production' ? 'http://proxy:10809' : '');
if (proxyUrl) {
  try {
    const { ProxyAgent } = require('undici');
    proxyDispatcher = new ProxyAgent(proxyUrl);
  } catch {}
}

// Server-side in-memory cache to prevent redundant external fetches across all users
const SERVER_CACHE = new Map<string, string>();
const MAX_SERVER_CACHE_SIZE = 10000;

function getCacheKey(text: string, targetLang: string, sourceLang: string): string {
  return `${sourceLang}->${targetLang}:${text.trim()}`;
}

async function fetchMyMemory(text: string, sourceLang: string, targetLang: string, signal: AbortSignal): Promise<string | null> {
  try {
    const url = `https://api.mymemory.translated.net/get?${new URLSearchParams({
      q: text,
      langpair: `${sourceLang}|${targetLang}`,
    })}`;
    const opts: RequestInit & { dispatcher?: any } = {
      signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    };
    if (proxyDispatcher) {
      opts.dispatcher = proxyDispatcher;
    }
    const res = await fetch(url, opts);
    if (res.ok) {
      const data = await res.json();
      const trans = data?.responseData?.translatedText;
      if (trans && typeof trans === 'string' && trans.trim()) {
        return trans.trim();
      }
    }
  } catch {}
  return null;
}

async function fetchTranslationWithTimeout(
  text: string,
  targetLang: string,
  sourceLang?: string,
  timeoutMs = 5000
): Promise<string> {
  const isPersian = /[\u0600-\u06FF]/.test(text);
  const effectiveSource = sourceLang || (isPersian ? 'fa' : (IS_INTERNATIONAL ? 'en' : 'fa'));

  if (effectiveSource === targetLang) {
    return text;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchOptions: RequestInit & { dispatcher?: any } = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client: 'gtx',
        sl: effectiveSource,
        tl: targetLang,
        dt: 't',
        q: text,
      }),
      signal: controller.signal,
    };

    if (proxyDispatcher) {
      fetchOptions.dispatcher = proxyDispatcher;
    }

    const res = await fetch('https://translate.googleapis.com/translate_a/single', fetchOptions);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translated = data[0]
          .map((chunk: any) => (Array.isArray(chunk) ? chunk[0] : ''))
          .join('');
        if (translated && translated.trim()) {
          clearTimeout(timer);
          return translated;
        }
      }
    }

    // Google returned 429, 403 or non-OK: resilient fallback to MyMemory API
    const fallbackTrans = await fetchMyMemory(text, effectiveSource, targetLang, controller.signal);
    clearTimeout(timer);
    return fallbackTrans || text;
  } catch (error) {
    // Attempt fallback to MyMemory on connection error/timeout
    try {
      const fallbackTrans = await fetchMyMemory(text, effectiveSource, targetLang, controller.signal);
      clearTimeout(timer);
      return fallbackTrans || text;
    } catch {
      clearTimeout(timer);
      return text;
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const defaultSource = IS_INTERNATIONAL ? 'en' : 'fa';
    const { texts, targetLang, sourceLang = defaultSource } = body || {};

    if (!Array.isArray(texts) || !targetLang) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Only allow supported target languages
    if (!isSupportedLocale(targetLang)) {
      return NextResponse.json({
        translations: Object.fromEntries(texts.map((t) => [t, t])),
      });
    }

    const results: Record<string, string> = {};
    const missingTexts: string[] = [];

    // 1. Check server cache and lexicon first (0ms latency)
    for (const text of texts) {
      if (!text || typeof text !== 'string') continue;
      const isPersian = /[\u0600-\u06FF]/.test(text);
      const effectiveSource = sourceLang || (isPersian ? 'fa' : defaultSource);

      if (effectiveSource === targetLang) {
        results[text] = text;
        continue;
      }

      const key = getCacheKey(text, targetLang, effectiveSource);
      const cached = SERVER_CACHE.get(key);
      if (cached && cached !== text) {
        results[text] = cached;
        continue;
      }

      // Check gaming lexicon for all 15 supported locales
      const lex = translateWithLexicon(text, targetLang as SupportedLocale);
      if (lex.translated && lex.translated.trim() !== text.trim()) {
        results[text] = lex.translated;
        SERVER_CACHE.set(key, lex.translated);
        continue;
      }

      missingTexts.push(text);
    }

    // 2. Translate missing items
    if (missingTexts.length > 0) {
      const longTexts = missingTexts.filter((t) => t.length > 200);
      const shortTexts = missingTexts.filter((t) => t.length <= 200);

      // Translate long texts individually
      if (longTexts.length > 0) {
        await Promise.all(
          longTexts.map(async (item) => {
            const isPersian = /[\u0600-\u06FF]/.test(item);
            const effSource = sourceLang || (isPersian ? 'fa' : defaultSource);
            const trans = await fetchTranslationWithTimeout(item, targetLang, effSource);
            results[item] = trans;
            if (trans && trans !== item) {
              SERVER_CACHE.set(getCacheKey(item, targetLang, effSource), trans);
            }
          })
        );
      }

      // Batch short texts together using a clean delimiter
      if (shortTexts.length > 0) {
        const DELIMITER = '\n<<<999>>>\n';
        const combined = shortTexts.join(DELIMITER);

        const translatedCombined = await fetchTranslationWithTimeout(
          combined,
          targetLang,
          sourceLang
        );
        const pieces = translatedCombined.split(/\n*<<<\s*999\s*>>>\n*/).map((s) => s.trim());

        shortTexts.forEach((orig, idx) => {
          let trans = pieces[idx] || orig;
          if ((!trans || trans === orig) && targetLang !== defaultSource) {
            const fallbackLex = translateWithLexicon(orig, targetLang as SupportedLocale);
            if (fallbackLex.translated && fallbackLex.translated !== orig) {
              trans = fallbackLex.translated;
            }
          }
          results[orig] = trans;

          if (trans && trans !== orig) {
            if (SERVER_CACHE.size >= MAX_SERVER_CACHE_SIZE) {
              const firstKey = SERVER_CACHE.keys().next().value;
              if (firstKey) SERVER_CACHE.delete(firstKey);
            }
            const isPersian = /[\u0600-\u06FF]/.test(orig);
            const effSource = sourceLang || (isPersian ? 'fa' : defaultSource);
            SERVER_CACHE.set(getCacheKey(orig, targetLang, effSource), trans);
          }
        });
      }
    }

    return NextResponse.json(
      { translations: results },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error) {
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 });
  }
}
