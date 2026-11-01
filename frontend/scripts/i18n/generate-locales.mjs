#!/usr/bin/env node
/**
 * Generate message catalogs for the extra UI locales.
 *
 * The project ships three hand-maintained locales (fa / en / ar). Every other
 * locale is derived from the English catalogs, because English is the most
 * complete and unambiguous source for machine translation.
 *
 *   node scripts/i18n/generate-locales.mjs            # all pending locales
 *   node scripts/i18n/generate-locales.mjs de es      # only these
 *   node scripts/i18n/generate-locales.mjs --force de # ignore the cache
 *
 * Guarantees:
 *   - `{{placeholder}}` tokens are verified after translation; a string whose
 *     placeholders were lost keeps the English source instead of shipping a
 *     broken template.
 *   - strings without any letter (numbers, "∞", "—") are copied verbatim.
 *   - results are cached per locale in `.i18n-cache/`, so an interrupted run
 *     resumes instead of paying for the whole catalog again.
 *   - output keeps the source key order and the same nesting, so catalogs stay
 *     diff-friendly and key parity is guaranteed by construction.
 *
 * The translator is the same public Google endpoint `/api/translate` uses at
 * runtime, so generated copy matches what the dynamic-content layer produces.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MESSAGES = path.join(ROOT, 'src/i18n/messages');
const LOCALES_DIR = path.join(ROOT, 'src/i18n/locales');
const CACHE_DIR = path.join(ROOT, '.i18n-cache');

/** Section files that make up a locale bundle. */
const SECTIONS = [
  'store',
  'account',
  'adminA',
  'adminB',
  'adminC',
  'adminD',
  'uiA',
  'uiB',
  'uiC',
];

/** Target locales, in the order they appear in the language switcher. */
const TARGETS = [
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
];

const SOURCE_LOCALE = 'en';
/** How many strings travel in one request. 30 stayed well inside the URL/body budget. */
const BATCH_SIZE = 30;
/** The same separator `/api/translate` uses. */
const SEP = '\n<<<999>>>\n';
const PLACEHOLDER = /\{\{[^{}]+\}\}/g;
const HAS_LETTER = /\p{L}/u;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_ATTEMPTS = 6;
/** Delay between batches — the public endpoint throttles aggressively above ~2 req/s. */
const BATCH_DELAY = 450;

async function requestTranslation(text, target, attempt = 0) {
  const body = new URLSearchParams({
    client: 'gtx',
    sl: SOURCE_LOCALE,
    tl: target,
    dt: 't',
    q: text,
  });

  try {
    const response = await fetch('https://translate.googleapis.com/translate_a/single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      body,
      signal: AbortSignal.timeout(30_000),
    });
    if (response.status === 429) {
      const error = new Error('HTTP 429');
      error.rateLimited = true;
      throw error;
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data?.[0])) throw new Error('unexpected payload');
    return data[0].map((chunk) => (Array.isArray(chunk) ? chunk[0] : '')).join('');
  } catch (error) {
    if (attempt >= MAX_ATTEMPTS) throw error;
    // Throttling needs a much longer cool-off than a transient network blip.
    const wait = error.rateLimited ? 8000 * (attempt + 1) : 700 * (attempt + 1) ** 2;
    await sleep(wait);
    return requestTranslation(text, target, attempt + 1);
  }
}

/** Translate one string, falling back to the source when the result is unusable. */
async function translateOne(source, target) {
  if (!source || !source.trim() || !HAS_LETTER.test(source)) return source;

  const translated = (await requestTranslation(source, target)).trim();
  if (!translated) return source;

  const expected = source.match(PLACEHOLDER)?.sort() ?? [];
  const actual = translated.match(PLACEHOLDER)?.sort() ?? [];
  if (expected.join('|') !== actual.join('|')) return source;

  return translated;
}

/** Translate a batch; on a size mismatch fall back to one-by-one so nothing shifts. */
async function translateBatch(sources, target) {
  if (sources.length === 1) {
    return [await translateOne(sources[0], target)];
  }

  const joined = sources.join(SEP);
  // If the batched request cannot be served, fail loudly — the caller saves the
  // cache and moves on, instead of firing 30 doomed single requests.
  const raw = await requestTranslation(joined, target);

  const pieces = raw ? raw.split(/\n*<<<\s*999\s*>>>\n*/).map((s) => s.trim()) : [];
  if (pieces.length !== sources.length) {
    process.stdout.write(` (split ${pieces.length}/${sources.length}, per-item)`);
    const out = [];
    for (const source of sources) out.push(await translateOne(source, target));
    return out;
  }

  // Even with the right count, re-validate placeholders per item.
  return pieces.map((piece, index) => {
    const source = sources[index];
    const expected = source.match(PLACEHOLDER)?.sort() ?? [];
    const actual = piece.match(PLACEHOLDER)?.sort() ?? [];
    if (expected.join('|') !== actual.join('|')) return source;
    return piece || source;
  });
}

/* ------------------------------------------------------------------ */
/* Catalog helpers                                                     */
/* ------------------------------------------------------------------ */

function collectStrings(node, into = new Set()) {
  if (typeof node === 'string') {
    into.add(node);
  } else if (node && typeof node === 'object') {
    for (const value of Object.values(node)) collectStrings(value, into);
  }
  return into;
}

function applyMap(node, map) {
  if (typeof node === 'string') return map.get(node) ?? node;
  if (Array.isArray(node)) return node.map((item) => applyMap(item, map));
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = applyMap(value, map);
    return out;
  }
  return node;
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

/* ------------------------------------------------------------------ */
/* Per-locale pipeline                                                 */
/* ------------------------------------------------------------------ */

async function loadSource() {
  const sections = {};
  for (const section of SECTIONS) {
    sections[section] = await readJson(path.join(MESSAGES, SOURCE_LOCALE, `${section}.json`));
  }
  const base = await readJson(path.join(LOCALES_DIR, `${SOURCE_LOCALE}.json`));
  return { base, sections };
}

async function loadCache(locale) {
  try {
    const raw = await readJson(path.join(CACHE_DIR, `${locale}.json`));
    return new Map(Object.entries(raw));
  } catch {
    return new Map();
  }
}

async function saveCache(locale, map) {
  await writeJson(path.join(CACHE_DIR, `${locale}.json`), Object.fromEntries(map));
}

async function generateLocale(locale, source, { force }) {
  const cache = force ? new Map() : await loadCache(locale);

  const unique = new Set();
  collectStrings(source.base, unique);
  for (const section of Object.values(source.sections)) collectStrings(section, unique);

  const pending = [...unique].filter((text) => text.trim() && HAS_LETTER.test(text) && !cache.has(text));
  const batches = Math.ceil(pending.length / BATCH_SIZE);
  process.stdout.write(
    `${locale}: ${unique.size} strings, ${pending.length} to translate (${batches} batches)`,
  );

  let done = 0;
  for (let index = 0; index < pending.length; index += BATCH_SIZE) {
    const slice = pending.slice(index, index + BATCH_SIZE);
    const translated = await translateBatch(slice, locale);
    slice.forEach((source_, i) => cache.set(source_, translated[i]));
    done += 1;

    // Persist regularly: a throttled run resumes instead of starting over.
    if (done % 5 === 0) {
      await saveCache(locale, cache);
      process.stdout.write('.');
    }
    await sleep(BATCH_DELAY);
  }

  await saveCache(locale, cache);

  await writeJson(path.join(LOCALES_DIR, `${locale}.json`), applyMap(source.base, cache));
  for (const section of SECTIONS) {
    await writeJson(
      path.join(MESSAGES, locale, `${section}.json`),
      applyMap(source.sections[section], cache),
    );
  }

  console.log(` → ${SECTIONS.length + 1} files written`);
}

/* ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const requested = args.filter((arg) => !arg.startsWith('--'));
  const locales = requested.length ? requested : TARGETS;

  for (const locale of locales) {
    if (!TARGETS.includes(locale)) {
      console.error(`unknown locale: ${locale}`);
      process.exitCode = 1;
      continue;
    }
  }

  const source = await loadSource();
  const failed = [];
  for (const locale of locales) {
    if (!TARGETS.includes(locale)) continue;
    try {
      await generateLocale(locale, source, { force });
    } catch (error) {
      // The per-locale cache is already on disk — re-running resumes from there.
      console.error(`\n${locale}: aborted (${error.message}) — cache saved, re-run to resume`);
      failed.push(locale);
    }
  }

  if (failed.length) {
    console.error(`\nincomplete: ${failed.join(' ')}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
