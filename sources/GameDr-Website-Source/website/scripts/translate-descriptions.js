// Translates every fetched game description into Persian using Google's
// free (unofficial, no API key) translate endpoint, and stores it
// alongside the English text in data/descriptions.json. Safe to re-run:
// skips entries that already have a description_fa.
//
// Usage: node scripts/translate-descriptions.js

const fs = require('fs');
const path = require('path');

const DESCRIPTIONS_PATH = path.join(__dirname, '..', 'data', 'descriptions.json');
const DELAY_MS = 300;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateToFarsi(text) {
  const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=' + encodeURIComponent(text);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`translate HTTP ${res.status}`);
  const json = await res.json();
  return json[0].map(seg => seg[0]).join('');
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DESCRIPTIONS_PATH, 'utf8'));
  const entries = Object.entries(data).filter(([, v]) => v.description && !v.description_fa);

  let done = 0, failed = 0;
  for (const [slug, entry] of entries) {
    try {
      entry.description_fa = await translateToFarsi(entry.description);
      done++;
      console.log(`✓ ${slug}`);
    } catch (err) {
      failed++;
      console.log(`✗ ${slug} — ${err.message}`);
    }
    await sleep(DELAY_MS);
  }

  fs.writeFileSync(DESCRIPTIONS_PATH, JSON.stringify(data, null, 1));
  console.log(`\nDone. Translated: ${done}, failed: ${failed}.`);
}

main();
