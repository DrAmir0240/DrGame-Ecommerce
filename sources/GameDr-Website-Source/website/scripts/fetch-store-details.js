// Fills in missing screenshots + descriptions (data/screenshots.json,
// data/descriptions.json) for games that have none, by reading each game's
// official PlayStation Store page (the same Sony CDN data PSPrices mirrors).
// Concept IDs are found via a DuckDuckGo site: search, since the store's own
// search is client-rendered. Safe to re-run: only games with a missing entry
// are looked up.  Usage: node scripts/fetch-store-details.js [--dry]
const fs = require('fs');
const path = require('path');

const D = path.join(__dirname, '..', 'data');
const UA = { 'User-Agent': 'Mozilla/5.0' };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const norm = n => n.toLowerCase().replace(/[™®©]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

const games = JSON.parse(fs.readFileSync(path.join(D, 'games.json'), 'utf8'));
const shots = JSON.parse(fs.readFileSync(path.join(D, 'screenshots.json'), 'utf8'));
const descs = JSON.parse(fs.readFileSync(path.join(D, 'descriptions.json'), 'utf8'));

async function nextData(url) {
  const res = await fetch(url, { headers: UA, redirect: 'follow' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const m = (await res.text()).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!m) throw new Error('no page data');
  return JSON.parse(m[1]);
}

// Legacy store search ("tumbler") endpoint: returns product ids + names directly.
async function productCandidates(title) {
  const core = title.replace(/\s*\([^)]*\)\s*$/, '');
  const url = 'https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/US/en/999/' +
    encodeURIComponent(norm(core.replace(/['’]/g, ''))) + '?suggested_size=10&mode=game';
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error('search HTTP ' + res.status);
  const data = await res.json();
  return (data.links || []).filter(l => l.id && l.name && l.game_contentType !== 'Disc Only')
    .map(l => ({ id: l.id, name: l.name, full: l.game_contentType === 'Full Game' }));
}

function clean(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

// Walks the page data (parsing any JSON-in-a-string along the way) collecting
// SCREENSHOT media urls and LONG descriptions.
function collect(node, out) {
  if (typeof node === 'string') {
    if (node.includes('<script')) {
      for (const part of node.split('</script>')) {
        const i = part.indexOf('>');
        if (part.includes('<script') && i >= 0) collect(part.slice(i + 1), out);
      }
    } else if (/^[[{]/.test(node)) { try { collect(JSON.parse(node), out); } catch (e) { /* plain text */ } }
  } else if (Array.isArray(node)) {
    node.forEach(n => collect(n, out));
  } else if (node && typeof node === 'object') {
    if (node.role === 'SCREENSHOT' && node.type === 'IMAGE' && node.url) out.shots.push(node.url);
    if (node.__typename === 'Description' && node.type === 'LONG' && node.value) out.long.push(node.value);
    Object.values(node).forEach(n => collect(n, out));
  }
}

async function details(productId) {
  const pd = await nextData('https://store.playstation.com/en-us/product/' + productId);
  const out = { shots: [], long: [] };
  collect(pd, out);
  let desc = out.long.sort((a, b) => b.length - a.length)[0];
  desc = desc && clean(desc).replace(/^Edition includes[^\n]*\n[^\n]*\n+/i, '');
  return { screenshots: [...new Set(out.shots)], description: desc };
}

// Manual product-id overrides for titles the legacy search can't find.
const OVERRIDES = {
  'resident-evil-requiem': ['Resident Evil Requiem', 'UP0102-PPSA30803_00-REREQUIEM0000000'],
  'assassin-s-creed-shadows': ["Assassin's Creed Shadows", 'UP0001-PPSA20396_00-GAME000000000000'],
};

(async () => {
  const todo = games.filter(g => g.modern !== false && (!shots[slugify(g.title)] || !descs[slugify(g.title)]));
  console.log(todo.length, 'games to fill');
  const failed = [];
  for (const g of todo) {
    const slug = slugify(g.title);
    try {
      if (OVERRIDES[slug]) {
        const [name, id] = OVERRIDES[slug];
        const got = { name, ...(await details(id)) };
        if (!shots[slug] && got.screenshots.length) shots[slug] = { matchedName: got.name, screenshots: got.screenshots };
        if (!descs[slug] && got.description) descs[slug] = { matchedName: got.name, description: got.description };
        console.log(`✓ ${g.title} (override) shots:${got.screenshots.length} desc:${(got.description || '').length}`);
      } else {
      const core = norm(g.title.replace(/\s*\([^)]*\)\s*$/, ''));
      const cands = (await productCandidates(g.title)).filter(c => {
        const n = norm(c.name);
        return n === core || (n.startsWith(core + ' ') && !/pack|dlc|pass|soundtrack|bonus|costume|upgrade|add on|season/.test(n.slice(core.length)));
      }).sort((a, b) => (b.full - a.full) || (a.name.length - b.name.length));
      if (!cands.length) throw new Error('no matching store listing');
      const got = { name: cands[0].name, ...(await details(cands[0].id)) };
      if (!shots[slug] && got.screenshots.length) shots[slug] = { matchedName: got.name, screenshots: got.screenshots };
      if (!descs[slug] && got.description) descs[slug] = { matchedName: got.name, description: got.description };
      console.log(`✓ ${g.title} -> "${got.name}" shots:${got.screenshots.length} desc:${(got.description || '').length}`);
      }
    } catch (e) {
      failed.push(g.title);
      console.log(`✗ ${g.title} — ${e.message}`);
    }
    if (!process.argv.includes('--dry')) {
      fs.writeFileSync(path.join(D, 'screenshots.json'), JSON.stringify(shots, null, 2));
      fs.writeFileSync(path.join(D, 'descriptions.json'), JSON.stringify(descs, null, 2));
    }
    await sleep(1500);
  }
  console.log('\nFailed:', failed);
})();
