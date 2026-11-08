import http from 'http';
import https from 'https';
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale, IS_INTERNATIONAL } from '@/i18n/locale-codes';
import { translateWithLexicon } from './dynamicLexicon';

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
 * or direct https.request if no proxy is configured.
 * Uses client=at & dt=t&dt=rm&dj=1 via POST which is highly reliable and immune to bot captchas.
 */
function requestGoogleTranslate(text: string, sl: string, tl: string, timeoutMs = 6000): Promise<string | null> {
  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      sl,
      tl,
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

    const requestHeaders = {
      Host: 'translate.google.com',
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    };

    const parseResponse = (body: string) => {
      try {
        const data = JSON.parse(body);
        if (Array.isArray(data?.sentences)) {
          const trans = data.sentences.map((s: any) => (s && typeof s.trans === 'string' ? s.trans : '')).join('');
          if (trans && trans.trim()) {
            handleSuccess(trans);
            return;
          }
        }
        handleFailure();
      } catch {
        handleFailure();
      }
    };

    if (proxyHost && proxyPort) {
      const connectReq = http.request({
        host: proxyHost,
        port: proxyPort,
        method: 'CONNECT',
        path: 'translate.google.com:443',
        timeout: timeoutMs,
      });

      connectReq.on('connect', (_res, socket) => {
        const tlsReq = (https.request as any)(
          {
            host: 'translate.google.com',
            socket,
            agent: false,
            path: '/translate_a/single?client=at&dt=t&dt=rm&dj=1',
            method: 'POST',
            headers: requestHeaders,
            timeout: timeoutMs,
          },
          (tlsRes: http.IncomingMessage) => {
            let body = '';
            tlsRes.on('data', (chunk: Buffer | string) => (body += chunk));
            tlsRes.on('end', () => parseResponse(body));
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
      const req = https.request(
        {
          host: 'translate.google.com',
          path: '/translate_a/single?client=at&dt=t&dt=rm&dj=1',
          method: 'POST',
          headers: requestHeaders,
          timeout: timeoutMs,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => parseResponse(body));
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
 * Resilient fallback to MyMemory API via proxy or direct.
 * Rejects rate limit warning messages.
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

    const parseResponse = (body: string) => {
      try {
        const data = JSON.parse(body);
        const trans = data?.responseData?.translatedText;
        if (
          trans &&
          typeof trans === 'string' &&
          !trans.includes('MYMEMORY WARNING') &&
          !trans.includes('YOU USED ALL AVAILABLE FREE TRANSLATIONS') &&
          trans.trim()
        ) {
          handleSuccess(trans.trim());
          return;
        }
        handleFailure();
      } catch {
        handleFailure();
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
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: timeoutMs,
          },
          (tlsRes: http.IncomingMessage) => {
            let body = '';
            tlsRes.on('data', (chunk: Buffer | string) => (body += chunk));
            tlsRes.on('end', () => parseResponse(body));
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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: timeoutMs,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => parseResponse(body));
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

/**
 * Translates a single text string from source to target language.
 */
export async function translateTextServer(
  text: string | null | undefined,
  targetLang: string,
  sourceLang?: string
): Promise<string> {
  if (!text || typeof text !== 'string') return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const isPersian = /[\u0600-\u06FF]/.test(trimmed);
  const effectiveSource = sourceLang || (isPersian ? 'fa' : (IS_INTERNATIONAL ? 'en' : 'fa'));

  if (effectiveSource === targetLang || !isSupportedLocale(targetLang)) {
    return text;
  }

  // 1. Check in-memory cache
  const cacheKey = getCacheKey(trimmed, targetLang, effectiveSource);
  const cached = SERVER_CACHE.get(cacheKey);
  if (cached && cached !== trimmed) {
    return cached;
  }

  // 2. Check gaming & e-commerce lexicon
  const lex = translateWithLexicon(trimmed, targetLang as SupportedLocale);
  if (lex.translated && lex.translated.trim() !== trimmed) {
    SERVER_CACHE.set(cacheKey, lex.translated);
    return lex.translated;
  }

  // 3. Try Google Translate via Proxy
  const googleTrans = await requestGoogleTranslate(trimmed, effectiveSource, targetLang);
  if (googleTrans && googleTrans.trim()) {
    if (SERVER_CACHE.size >= MAX_SERVER_CACHE_SIZE) {
      const firstKey = SERVER_CACHE.keys().next().value;
      if (firstKey) SERVER_CACHE.delete(firstKey);
    }
    SERVER_CACHE.set(cacheKey, googleTrans);
    return googleTrans;
  }

  // 4. Fallback to MyMemory via Proxy
  const myMemoryTrans = await requestMyMemory(trimmed, effectiveSource, targetLang);
  if (myMemoryTrans && myMemoryTrans.trim()) {
    if (SERVER_CACHE.size >= MAX_SERVER_CACHE_SIZE) {
      const firstKey = SERVER_CACHE.keys().next().value;
      if (firstKey) SERVER_CACHE.delete(firstKey);
    }
    SERVER_CACHE.set(cacheKey, myMemoryTrans);
    return myMemoryTrans;
  }

  return text;
}

/**
 * Translates an array of texts in parallel.
 */
export async function translateBatchServer(
  texts: string[],
  targetLang: string,
  sourceLang?: string
): Promise<Record<string, string>> {
  if (!Array.isArray(texts) || !targetLang) {
    return {};
  }

  if (!isSupportedLocale(targetLang)) {
    return Object.fromEntries(texts.map((t) => [t, t]));
  }

  const results: Record<string, string> = {};
  await Promise.all(
    texts.map(async (item) => {
      if (!item || typeof item !== 'string') return;
      results[item] = await translateTextServer(item, targetLang, sourceLang);
    })
  );

  return results;
}
