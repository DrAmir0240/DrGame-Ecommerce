// Fetches a cover thumbnail per game from SteamGridDB's API and caches it
// locally at data/covers/<slug>.<ext>. Requires a free API key — see
// .env.example. Safe to re-run: games that already have a cached cover are
// skipped, so this only fetches what's missing.
//
// Usage: npm run fetch-covers

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.STEAMGRIDDB_API_KEY;
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

async function sgdbFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function fetchCoverFor(title, slug) {
  // 1. Find the game's SteamGridDB id
  const searchData = await sgdbFetch(
    `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(title)}`
  );
  const match = searchData.data && searchData.data[0];
  if (!match) return { ok: false, reason: 'no search match' };

  // 2. Get a portrait "grid" image (matches our 3:4 tile shape) for that game
  const gridsData = await sgdbFetch(
    `https://www.steamgriddb.com/api/v2/grids/game/${match.id}?dimensions=600x900`
  );
  const grid = gridsData.data && gridsData.data[0];
  if (!grid) return { ok: false, reason: 'no grid image available' };

  // 3. Download and save it
  const imgRes = await fetch(grid.url);
  if (!imgRes.ok) return { ok: false, reason: `image download HTTP ${imgRes.status}` };
  const ext = path.extname(new URL(grid.url).pathname) || '.jpg';
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  fs.writeFileSync(path.join(COVERS_DIR, slug + ext), buffer);
  return { ok: true };
}

async function main() {
  if (!API_KEY) {
    console.error(
      'Missing STEAMGRIDDB_API_KEY.\n' +
      '1. Get a free key: https://www.steamgriddb.com/profile/preferences/api\n' +
      '2. Copy .env.example to .env and paste it in.\n'
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
