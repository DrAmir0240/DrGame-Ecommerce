// Re-checks every cached cover against RAWG's search results and replaces
// any that look like a mismatch (e.g. an ambiguous title like "Genji" or
// "Control" pulling back an unrelated game). Uses word-overlap scoring
// across the top 5 candidates instead of blindly trusting result #1.
//
// Usage: npm run fix-covers

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pickBestMatch } = require('./lib/match');

const API_KEY = process.env.RAWG_API_KEY;
const GAMES_PATH = path.join(__dirname, '..', 'data', 'games.json');
const COVERS_DIR = path.join(__dirname, '..', 'data', 'covers');
const DELAY_MS = 300;
const LOW_CONFIDENCE = 0.34; // below this, the match is flagged even with nothing better found

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function existingCoverPath(slug) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const p = path.join(COVERS_DIR, slug + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  if (!API_KEY) {
    console.error('Missing RAWG_API_KEY in .env');
    process.exit(1);
  }

  const titles = JSON.parse(fs.readFileSync(GAMES_PATH, 'utf8'));
  let checked = 0, replaced = 0, flaggedNoBetter = 0, skippedNoCover = 0;
  const report = [];

  for (const title of titles) {
    const slug = slugify(title);
    const existing = existingCoverPath(slug);
    if (!existing) {
      skippedNoCover++;
      continue;
    }

    checked++;
    try {
      const res = await fetch(
        `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(title)}&page_size=5`
      );
      const data = await res.json();
      const candidates = data.results || [];
      if (candidates.length === 0) continue;

      const { match, score } = pickBestMatch(title, candidates);
      const firstResultWasUsed = candidates[0].id === match.id;

      if (score < LOW_CONFIDENCE) {
        flaggedNoBetter++;
        report.push({ title, slug, bestMatch: match.name, score: score.toFixed(2), action: 'flagged-low-confidence' });
        console.log(`⚠ ${title} — best guess "${match.name}" (score ${score.toFixed(2)}), kept as-is but low confidence`);
      } else if (!firstResultWasUsed && match.background_image) {
        // The original script took candidate #1; a better-scoring one exists — swap it in.
        const imgRes = await fetch(match.background_image);
        if (imgRes.ok) {
          const ext = path.extname(new URL(match.background_image).pathname) || '.jpg';
          fs.unlinkSync(existing);
          fs.writeFileSync(path.join(COVERS_DIR, slug + ext), Buffer.from(await imgRes.arrayBuffer()));
          replaced++;
          report.push({ title, slug, replacedWith: match.name, score: score.toFixed(2), action: 'replaced' });
          console.log(`↻ ${title} — replaced with better match "${match.name}" (score ${score.toFixed(2)})`);
        }
      }
    } catch (err) {
      console.log(`✗ ${title} — ${err.message}`);
    }

    await sleep(DELAY_MS);
  }

  fs.writeFileSync(path.join(__dirname, '..', 'data', 'cover-audit.json'), JSON.stringify(report, null, 2));
  console.log(
    `\nChecked ${checked} cached covers. Replaced: ${replaced}. ` +
    `Flagged as low-confidence (kept, needs a human look): ${flaggedNoBetter}. ` +
    `Skipped (no cover yet): ${skippedNoCover}.\n` +
    `Full report: data/cover-audit.json`
  );
}

main();
