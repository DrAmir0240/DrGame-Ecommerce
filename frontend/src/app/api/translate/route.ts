import { NextRequest, NextResponse } from 'next/server';
import http from 'http';
import https from 'https';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale, IS_INTERNATIONAL } from '@/i18n/locale-codes';
import { translateWithLexicon } from '@/lib/dynamicLexicon';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-side in-memory cache to prevent redundant external fetches across all users
const SERVER_CACHE = new Map<string, string>();
const MAX_SERVER_CACHE_SIZE = 10000;

function getCacheKey(text: string, targetLang: string, sourceLang: string): string {
  return `${sourceLang}->${targetLang}:${text.trim()}`;
}

// Proxy configuration: supports internal docker proxy (proxy:10809) or custom proxy
const rawProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY || (process.env.NODE_ENV === 'production' ? 'http://proxy:10809' : '');
let proxyHost: string | null = null;
let proxyPort: number = 10809;

if (rawProxy) {
  try {
    const u = new URL(rawProxy.startsWith('http') ? rawProxy : `http://${rawProxy}`);
    proxyHost = u.hostname;
    proxyPort = parseInt(u.port || '10809', 10);
  } catch {}
}

/**
 * Perform a Google Translate request using Node.js native http CONNECT tunnel if proxy is configured,
 * or direct https.request if no proxy is configured. Zero external dependencies.
 */
function requestGoogleTranslate(text: string, sl: string, tl: string, timeoutMs = 6000): Promise<string | null> {
  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      client: 'dict-chrome-ex',
      sl,
      tl,
      dt: 't',
      q: text,
    }).toString();

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    const handleSuccess = (translated: string) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(translated);
      }
    };

    const handleFailure = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    if (proxyHost && proxyPort) {
      const connectReq = http.request({
        host: proxyHost,
        port: proxyPort,
        method: 'CONNECT',
        path: 'translate.googleapis.com:443',
        timeout: timeoutMs,
      });

      connectReq.on('connect', (_res, socket) => {
        const tlsReq = (https.request as any)(
          {
            host: 'translate.googleapis.com',
            socket,
            agent: false,
            path: '/translate_a/single',
            method: 'POST',
            headers: {
              Host: 'translate.googleapis.com',
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': Buffer.byteLength(postData),
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            timeout: timeoutMs,
          },
          (tlsRes: http.IncomingMessage) => {
            let body = '';
            tlsRes.on('data', (chunk: Buffer | string) => (body += chunk));
            tlsRes.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (Array.isArray(data) && Array.isArray(data[0])) {
                  const trans = data[0].map((c: any) => (Array.isArray(c) ? c[0] : '')).join('');
                  if (trans && trans.trim()) {
                    handleSuccess(trans);
                    return;
                  }
                }
                handleFailure();
              } catch {
                handleFailure();
              }
            });
          }
        );

        tlsReq.on('error', handleFailure);
        tlsReq.on('timeout', () => {
          tlsReq.destroy();
          handleFailure();
        });
        tlsReq.write(postData);
        tlsReq.end();
      });

      connectReq.on('error', handleFailure);
      connectReq.on('timeout', () => {
        connectReq.destroy();
        handleFailure();
      });
      connectReq.end();
    } else {
      // Direct POST without proxy
      const req = https.request(
        {
          host: 'translate.googleapis.com',
          path: '/translate_a/single',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData),
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (Array.isArray(data) && Array.isArray(data[0])) {
                const trans = data[0].map((c: any) => (Array.isArray(c) ? c[0] : '')).join('');
                if (trans && trans.trim()) {
                  handleSuccess(trans);
                  return;
                }
              }
              handleFailure();
            } catch {
              handleFailure();
            }
          });
        }
      );

      req.on('error', handleFailure);
      req.on('timeout', () => {
        req.destroy();
        handleFailure();
      });
      req.write(postData);
      req.end();
    }
  });
}

/**
 * Resilient fallback to MyMemory API via proxy or direct
 */
function requestMyMemory(text: string, sl: string, tl: string, timeoutMs = 4000): Promise<string | null> {
  return new Promise((resolve) => {
    const query = new URLSearchParams({ q: text, langpair: `${sl}|${tl}` }).toString();
    const apiPath = `/get?${query}`;

    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    const handleSuccess = (trans: string) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(trans);
      }
    };

    const handleFailure = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
    };

    if (proxyHost && proxyPort) {
      const connectReq = http.request({
        host: proxyHost,
        port: proxyPort,
        method: 'CONNECT',
        path: 'api.mymemory.translated.net:443',
        timeout: timeoutMs,
      });

      connectReq.on('connect', (_res, socket) => {
        const tlsReq = (https.request as any)(
          {
            host: 'api.mymemory.translated.net',
            socket,
            agent: false,
            path: apiPath,
            method: 'GET',
            headers: {
              Host: 'api.mymemory.translated.net',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            },
            timeout: timeoutMs,
          },
          (tlsRes: http.IncomingMessage) => {
            let body = '';
            tlsRes.on('data', (chunk: Buffer | string) => (body += chunk));
            tlsRes.on('end', () => {
              try {
                const data = JSON.parse(body);
                const trans = data?.responseData?.translatedText;
                if (trans && typeof trans === 'string' && trans.trim()) {
                  handleSuccess(trans.trim());
                  return;
                }
                handleFailure();
              } catch {
                handleFailure();
              }
            });
          }
        );

        tlsReq.on('error', handleFailure);
        tlsReq.on('timeout', () => {
          tlsReq.destroy();
          handleFailure();
        });
        tlsReq.end();
      });

      connectReq.on('error', handleFailure);
      connectReq.on('timeout', () => {
        connectReq.destroy();
        handleFailure();
      });
      connectReq.end();
    } else {
      const req = https.request(
        {
          host: 'api.mymemory.translated.net',
          path: apiPath,
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            try {
              const data = JSON.parse(body);
              const trans = data?.responseData?.translatedText;
              if (trans && typeof trans === 'string' && trans.trim()) {
                handleSuccess(trans.trim());
                return;
              }
              handleFailure();
            } catch {
              handleFailure();
            }
          });
        }
      );

      req.on('error', handleFailure);
      req.on('timeout', () => {
        req.destroy();
        handleFailure();
      });
      req.end();
    }
  });
}

async function fetchTranslation(text: string, targetLang: string, sourceLang?: string): Promise<string> {
  const isPersian = /[\u0600-\u06FF]/.test(text);
  const effectiveSource = sourceLang || (isPersian ? 'fa' : (IS_INTERNATIONAL ? 'en' : 'fa'));

  if (effectiveSource === targetLang) {
    return text;
  }

  // 1. Try Google Translate via Proxy
  const googleTrans = await requestGoogleTranslate(text, effectiveSource, targetLang);
  if (googleTrans && googleTrans.trim()) {
    return googleTrans;
  }

  // 2. Resilient fallback to MyMemory via Proxy
  const myMemoryTrans = await requestMyMemory(text, effectiveSource, targetLang);
  if (myMemoryTrans && myMemoryTrans.trim()) {
    return myMemoryTrans;
  }

  return text;
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

    // 1. Check server memory cache and gaming lexicon first (0ms)
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

      // Check gaming lexicon
      const lex = translateWithLexicon(text, targetLang as SupportedLocale);
      if (lex.translated && lex.translated.trim() !== text.trim()) {
        results[text] = lex.translated;
        SERVER_CACHE.set(key, lex.translated);
        continue;
      }

      missingTexts.push(text);
    }

    // 2. Translate missing items in parallel
    if (missingTexts.length > 0) {
      await Promise.all(
        missingTexts.map(async (item) => {
          const isPersian = /[\u0600-\u06FF]/.test(item);
          const effSource = sourceLang || (isPersian ? 'fa' : defaultSource);
          const trans = await fetchTranslation(item, targetLang, effSource);
          results[item] = trans;

          if (trans && trans !== item) {
            if (SERVER_CACHE.size >= MAX_SERVER_CACHE_SIZE) {
              const firstKey = SERVER_CACHE.keys().next().value;
              if (firstKey) SERVER_CACHE.delete(firstKey);
            }
            SERVER_CACHE.set(getCacheKey(item, targetLang, effSource), trans);
          }
        })
      );
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
