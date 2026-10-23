// Targeted corrections for specific games where the automated matcher
// picked a companion app / spin-off / different game instead of the real
// thing. Run once as needed — not part of the normal fetch/fix pipeline.

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.RAWG_API_KEY;
const COVERS_DIR = path.join(__dirname, '..', 'data', 'covers');

// Each entry: which cached file to replace, what to search for instead,
// and words that disqualify a candidate (spin-offs/companion apps/etc).
const FIXES = [
  { slug: 'devil-may-cry-3', search: "Devil May Cry 3 Dante's Awakening", exclude: ['dmc'] },
  { slug: 'baldurs-gate-3', search: "Baldur's Gate 3", exclude: ['toolkit'] },
  { slug: 'just-dance-2023', search: 'Just Dance 2023', exclude: ['controller', 'companion'] },
  { slug: 'everybodys-golf', search: "Everybody's Golf", exclude: ['vr'] },
  { slug: 'broken-sword', search: 'Broken Sword: Shadow of the Templars', exclude: [] },
];

function existingCoverPath(slug) {
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const p = path.join(COVERS_DIR, slug + ext);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function main() {
  for (const fix of FIXES) {
    const res = await fetch(
      `https://api.rawg.io/api/games?key=${API_KEY}&search=${encodeURIComponent(fix.search)}&page_size=10`
    );
    const data = await res.json();
    const candidates = (data.results || []).filter(
      c => !fix.exclude.some(bad => c.name.toLowerCase().includes(bad))
    );
    const pick = candidates.find(c => c.background_image);

    if (!pick) {
      console.log(`✗ ${fix.slug} — no clean candidate found`);
      continue;
    }

    const imgRes = await fetch(pick.background_image);
    if (!imgRes.ok) {
      console.log(`✗ ${fix.slug} — image download failed`);
      continue;
    }

    const existing = existingCoverPath(fix.slug);
    if (existing) fs.unlinkSync(existing);

    const ext = path.extname(new URL(pick.background_image).pathname) || '.jpg';
    fs.writeFileSync(path.join(COVERS_DIR, fix.slug + ext), Buffer.from(await imgRes.arrayBuffer()));
    console.log(`✓ ${fix.slug} — now using "${pick.name}"`);

    await new Promise(r => setTimeout(r, 300));
  }
}

main();
