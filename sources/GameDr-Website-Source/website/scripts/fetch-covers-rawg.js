// Alternative cover-art source: RAWG (rawg.io), a free video game database
// API. Same idea as fetch-covers.js (SteamGridDB) — pick whichever service
// you'd rather get a free key from. Safe to re-run: skips games that
// already have a cached cover.
//
// Usage: npm run fetch-covers:rawg

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.RAWG_API_KEY;
const GAMES_PATH = path.join(__dirname, '..', 'data', 'games.json');
const COVERS_DIR = path.join(__dirname, '..', 'data', 'covers');
const DELAY_MS = 300; // be polite to the free API tier

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCoverFor(title, slug) {
  const searchUrl = `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(title)}&page_size=1`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) return { ok: false, reason: `search HTTP ${searchRes.status}` };

  const searchData = await searchRes.json();
  const match = searchData.results && searchData.results[0];
  if (!match || !match.background_image) return { ok: false, reason: 'no image available' };

  const imgRes = await fetch(match.background_image);
  if (!imgRes.ok) return { ok: false, reason: `image download HTTP ${imgRes.status}` };

  const ext = path.extname(new URL(match.background_image).pathname) || '.jpg';
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(path.join(COVERS_DIR, slug + ext), buffer);
  return { ok: true };
}

async function main() {
  if (!API_KEY) {
    console.error(
      'Missing RAWG_API_KEY.\n' +
      '1. Get a free key: https://rawg.io/apidocs\n' +
      '2. Copy .env.example to .env and paste it in as RAWG_API_KEY=...\n'
    );
    process.exit(1);
  }

  if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

  const titles = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf8'));
  const existingExt = ['.jpg', '.jpeg', '.png', '.webp'];

  let fetched = 0, skipped = 0, failed = 0;

  for (const title of titles) {
    const slug = slugify(title);
    const alreadyCached = existingExt.some(ext => fs.existsSync(path.join(COVERS_DIR, slug + ext)));
    if (alreadyCached) {
      skipped++;
      continue;
    }

    try {
      const result = await fetchCoverFor(title, slug);
      if (result.ok) {
        fetched++;
        console.log(`✓ ${title}`);
      } else {
        failed++;
        console.log(`✗ ${title} — ${result.reason}`);
      }
    } catch (err) {
      failed++;
      console.log(`✗ ${title} — ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone. Fetched: ${fetched}, already cached: ${skipped}, failed: ${failed}.`);
}

main();
