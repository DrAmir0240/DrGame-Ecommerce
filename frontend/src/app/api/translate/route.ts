import { NextRequest, NextResponse } from 'next/server';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from '@/i18n/locale-codes';
import { translateWithLexicon } from '@/lib/dynamicLexicon';

// Server-side in-memory cache to prevent redundant external fetches across all users
const SERVER_CACHE = new Map<string, string>();
const MAX_SERVER_CACHE_SIZE = 5000;

function getCacheKey(text: string, targetLang: string): string {
  return `${targetLang}:${text.trim()}`;
}

async function fetchTranslationWithTimeout(
  text: string,
  targetLang: string,
  sourceLang = 'fa',
  timeoutMs = 6000
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('https://translate.googleapis.com/translate_a/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',
        q: text,
      }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      return text;
    }

    const data = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = data[0]
        .map((chunk: any) => (Array.isArray(chunk) ? chunk[0] : ''))
        .join('');
      return translated || text;
    }

    return text;
  } catch (error) {
    clearTimeout(timer);
    return text;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { texts, targetLang, sourceLang = DEFAULT_LOCALE } = body || {};

    if (!Array.isArray(texts) || !targetLang) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Only allow supported target languages — unknown or source-language targets
    // are echoed back so the client keeps the original text.
    if (!isSupportedLocale(targetLang) || targetLang === DEFAULT_LOCALE) {
      return NextResponse.json({
        translations: Object.fromEntries(texts.map((t) => [t, t])),
      });
    }

    const results: Record<string, string> = {};
    const missingTexts: string[] = [];

    // 1. Check server cache and lexicon first (0ms latency)
    for (const text of texts) {
      if (!text || typeof text !== 'string') continue;
      const key = getCacheKey(text, targetLang);
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
      // Separate long texts (articles, multi-paragraph) from short UI snippets
      const longTexts = missingTexts.filter((t) => t.length > 250);
      const shortTexts = missingTexts.filter((t) => t.length <= 250);

      // Translate long texts individually
      if (longTexts.length > 0) {
        await Promise.all(
          longTexts.map(async (item) => {
            const trans = await fetchTranslationWithTimeout(item, targetLang, sourceLang);
            results[item] = trans;
            if (trans && trans !== item) {
              SERVER_CACHE.set(getCacheKey(item, targetLang), trans);
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
          if ((!trans || trans === orig) && targetLang !== DEFAULT_LOCALE) {
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
            SERVER_CACHE.set(getCacheKey(orig, targetLang), trans);
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
