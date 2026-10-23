// Cover-art source: PSPrices' public search-suggestions endpoint, which
// returns official PlayStation Store box art hosted on Sony's own CDN
// (image.api.playstation.com). These are square, on-brand PS Store tiles —
// much smaller and more accurate than mixed-quality third-party screenshots.
//
// This hits an undocumented endpoint PSPrices' own site uses for its search
// box, not a published API — be polite (DELAY_MS) and don't hammer it.
//
// Usage: node scripts/fetch-covers-psprices.js
//   Overwrites every cached cover (unlike the RAWG script, which skips
//   existing ones) since the point is to replace them with the official art.

const fs = require('fs');
const path = require('path');

const GAMES_PATH = path.join(__dirname, '..', 'data', 'games.json');
const COVERS_DIR = path.join(__dirname, '..', 'data', 'covers');
const DELAY_MS = 400;
const REPORT_PATH = path.join(__dirname, 'psprices-fetch-report.json');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[™®©]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and']);

// Picks the best suggestion for a given title: prefer an exact normalized
// name match that's a plain "game" (not an add-on/DLC) available on
// PS4/PS5, falling back to a candidate whose name contains every
// significant word of our title. Never falls back to "just the first
// result" — a wrong-but-present match (e.g. a sequel) is worse than no
// cover at all, since a human can fix a logged failure but won't notice a
// confidently-wrong image.
function pickBest(title, suggestions) {
  // Our titles sometimes carry a disambiguating suffix the store listing
  // won't have, e.g. "God of War (2018)" or "Demon's Souls (Remake)" -
  // strip a trailing parenthetical for matching purposes only.
  const coreTitle = title.replace(/\s*\([^)]*\)\s*$/, '').trim();
  const target = normalize(coreTitle);
  const targetWords = target.split(' ').filter(w => w && !STOPWORDS.has(w));

  const candidates = suggestions.filter(
    s => s.top_category === 'game' && s.platforms.some(p => p === 'PS4' || p === 'PS5')
  );
  if (candidates.length === 0) return null;

  const exact = candidates.find(s => normalize(s.name) === target);
  if (exact) return exact;

  // Starts with our (core) title - catches "Game: Subtitle" where our
  // title is just "Game" - preferring a plain edition over a bundle/DLC.
  // (A plain "startsWith" on a short title like "God of War" would also
  // match "God of War Ragnarök", but the exact-match branch above already
  // catches the plain-title case whenever the store lists it, so this is
  // only reached for titles that aren't themselves a store listing name -
  // e.g. ours is "Game: Subtitle" and the store also lists extra suffix.)
  const starts = candidates.filter(s => normalize(s.name).startsWith(target + ' '));
  const plainStart = starts.find(s => !/edition|bundle|pack|demo|trial|upgrade/i.test(s.name));
  if (plainStart) return plainStart;
  if (starts[0]) return starts[0];

  return null;
}

async function fetchCoverFor(title) {
  // Search using the title with any trailing disambiguating parenthetical
  // stripped - e.g. search "God of War" rather than "God of War (2018)",
  // since the literal "(2018)" derails PSPrices' search ranking entirely.
  const searchTitle = title.replace(/\s*\([^)]*\)\s*$/, '').trim() || title;
  const url = `https://psprices.com/api/search/suggestions/?q=${encodeURIComponent(searchTitle)}&region=us`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (cover-art lookup for a personal fan-gallery site)' },
  });
  if (!res.ok) return { ok: false, reason: `search HTTP ${res.status}` };

  const data = await res.json();
  const best = pickBest(title, data.suggestions || []);
  if (!best) return { ok: false, reason: 'no matching PS4/PS5 game found' };
  if (!best.cover_url) return { ok: false, reason: 'match found but no cover_url' };

  const imgRes = await fetch(best.cover_url);
  if (!imgRes.ok) return { ok: false, reason: `image download HTTP ${imgRes.status}` };

  const ext = path.extname(new URL(best.cover_url).pathname) || '.png';
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  return { ok: true, ext, buffer, matchedName: best.name };
}

function existingCoverPath(slug) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const p = path.join(COVERS_DIR, slug + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  if (!fs.existsSync(COVERS_DIR)) fs.mkdirSync(COVERS_DIR, { recursive: true });

  const games = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf8'));
  const titles = games.map(g => g.title);

  let fetched = 0, failed = 0;
  const failures = [];

  for (const title of titles) {
    const slug = slugify(title);
    try {
      const result = await fetchCoverFor(title);
      if (result.ok) {
        const existing = existingCoverPath(slug);
        if (existing) fs.unlinkSync(existing);
        fs.writeFileSync(path.join(COVERS_DIR, slug + result.ext), result.buffer);
        fetched++;
        console.log(`✓ ${title} -> "${result.matchedName}" (${(result.buffer.length / 1024).toFixed(0)}KB)`);
      } else {
        failed++;
        failures.push({ title, reason: result.reason });
        console.log(`✗ ${title} — ${result.reason}`);
      }
    } catch (err) {
      failed++;
      failures.push({ title, reason: err.message });
      console.log(`✗ ${title} — ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(REPORT_PATH, JSON.stringify(failures, null, 2));
  console.log(`\nDone. Fetched: ${fetched}, failed: ${failed}.`);
  if (failures.length) console.log(`Failures logged to ${REPORT_PATH} for manual follow-up.`);
}

main();
