'use client';

import { translateWithLexicon } from './dynamicLexicon';

const CACHE_PREFIX = 'drgame_tr_v4_';

// Auto-purge any stale or poisoned cache keys from previous iterations
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('drgame_tr_') && !k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// Fast FNV-1a string hash for compact cache keys
function hashString(str: string): string {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

// Layer 1: In-memory Map cache
const MEMORY_CACHE = new Map<string, string>();

function getLocalStorageKey(lang: string, hash: string): string {
  return `${CACHE_PREFIX}${lang}_${hash}`;
}

function readValidCache(lang: string, hash: string, origText: string): string | null {
  try {
    const key = getLocalStorageKey(lang, hash);
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    // Strict validation: if cached string is identical to the Persian text, it's a failed fallback!
    if (cached.trim() === origText.trim()) {
      localStorage.removeItem(key);
      return null;
    }

    return cached;
  } catch {
    return null;
  }
}

// Queue for batching translation requests from multiple components on the same page
interface QueuedItem {
  text: string;
  targetLang: 'en' | 'ar';
  resolve: (res: string) => void;
}

let batchQueue: QueuedItem[] = [];
let batchTimer: NodeJS.Timeout | null = null;

async function flushBatchQueue() {
  const currentBatch = [...batchQueue];
  batchQueue = [];
  batchTimer = null;

  if (currentBatch.length === 0) return;

  // Group by target language
  const groups: Record<'en' | 'ar', QueuedItem[]> = { en: [], ar: [] };
  for (const item of currentBatch) {
    if (groups[item.targetLang]) {
      groups[item.targetLang].push(item);
    }
  }

  for (const lang of ['en', 'ar'] as const) {
    const items = groups[lang];
    if (items.length === 0) continue;

    const uniqueTexts = Array.from(new Set(items.map((i) => i.text)));

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: uniqueTexts, targetLang: lang }),
      });

      if (!res.ok) throw new Error('API route failed');

      const data = await res.json();
      const translations: Record<string, string> = data.translations || {};

      items.forEach((item) => {
        const translated = translations[item.text] || item.text;
        const cacheKey = `${lang}:${item.text}`;
        const hash = hashString(item.text);

        // Only save to cache if translation actually succeeded and is not the Persian fallback
        if (translated && translated.trim() !== item.text.trim()) {
          MEMORY_CACHE.set(cacheKey, translated);
          try {
            localStorage.setItem(getLocalStorageKey(lang, hash), translated);
          } catch {}
        }

        item.resolve(translated);
      });
    } catch {
      // Fallback silently to original text on any error
      items.forEach((item) => item.resolve(item.text));
    }
  }
}

/**
 * Translates dynamic text with multi-tier caching (Memory -> LocalStorage -> Lexicon -> Batch API).
 * Returns translated string asynchronously, or synchronously when cached.
 */
export function translateDynamicText(
  text: string | null | undefined,
  targetLang: string
): Promise<string> {
  if (!text || typeof text !== 'string') {
    return Promise.resolve('');
  }

  // If already Persian or default locale, return immediately
  if (targetLang === 'fa' || !['en', 'ar'].includes(targetLang)) {
    return Promise.resolve(text);
  }

  const lang = targetLang as 'en' | 'ar';
  const trimmed = text.trim();
  const cacheKey = `${lang}:${trimmed}`;

  // 1. Check L1 Memory Cache (0ms)
  const mem = MEMORY_CACHE.get(cacheKey);
  if (mem && mem.trim() !== trimmed) {
    return Promise.resolve(mem);
  }

  // 2. Check L2 LocalStorage Cache (0ms)
  const hash = hashString(trimmed);
  const cached = readValidCache(lang, hash, trimmed);
  if (cached) {
    MEMORY_CACHE.set(cacheKey, cached);
    return Promise.resolve(cached);
  }

  // 3. Check Gaming & E-Commerce Lexicon (0ms)
  const lexiconResult = translateWithLexicon(trimmed, lang);
  if (lexiconResult.isFullyTranslated && lexiconResult.translated.trim() !== trimmed) {
    MEMORY_CACHE.set(cacheKey, lexiconResult.translated);
    try {
      localStorage.setItem(getLocalStorageKey(lang, hash), lexiconResult.translated);
    } catch {}
    return Promise.resolve(lexiconResult.translated);
  }

  // 4. Batch queue for arbitrary long texts (40ms debounce)
  return new Promise<string>((resolve) => {
    batchQueue.push({ text: trimmed, targetLang: lang, resolve });
    if (!batchTimer) {
      batchTimer = setTimeout(flushBatchQueue, 40);
    }
  });
}

/**
 * Synchronous check: returns the translated string immediately if cached or found in lexicon,
 * or null if an async network translation is required.
 */
export function getInstantDynamicTranslation(
  text: string | null | undefined,
  targetLang: string
): string | null {
  if (!text || typeof text !== 'string') return '';
  if (targetLang === 'fa' || !['en', 'ar'].includes(targetLang)) return text;

  const lang = targetLang as 'en' | 'ar';
  const trimmed = text.trim();
  const cacheKey = `${lang}:${trimmed}`;

  const mem = MEMORY_CACHE.get(cacheKey);
  if (mem && mem.trim() !== trimmed) {
    return mem;
  }

  const hash = hashString(trimmed);
  const cached = readValidCache(lang, hash, trimmed);
  if (cached) {
    MEMORY_CACHE.set(cacheKey, cached);
    return cached;
  }

  const lexicon = translateWithLexicon(trimmed, lang);
  if (lexicon.isFullyTranslated && lexicon.translated.trim() !== trimmed) {
    MEMORY_CACHE.set(cacheKey, lexicon.translated);
    return lexicon.translated;
  }

  return null;
}
