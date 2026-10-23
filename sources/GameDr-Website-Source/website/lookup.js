// Game lookup for the admin "Add game" form: type a name, get the rest.
//
//   search(q)      -> candidate games (name, platforms, cover, release date, price)
//                     from PSPrices' search suggestions; falls back to the PlayStation
//                     Store's own search if PSPrices does not answer.
//   details(c)     -> everything for one game: description, screenshots, release date,
//                     genres (mapped to this site's categories), platforms, cover url,
//                     read from the game's PlayStation Store page.
//
// Both are read-only requests to psprices.com and store.playstation.com. Nothing here
// is saved; the admin reviews the filled-in form and presses Create.
const UA = 'Mozilla/5.0 (compatible; DrGameAdmin/1.0)';
const TIMEOUT = 15000;

// hosts a cover image may be downloaded from (checked again when saving)
const COVER_HOSTS = ['image.api.playstation.com', 'psprices.com', 'static.psprices.com', 'store.playstation.com'];
const coverUrlOk = u => {
  try { const x = new URL(u); return x.protocol === 'https:' && COVER_HOSTS.some(h => x.hostname === h || x.hostname.endsWith('.' + h)); }
  catch (e) { return false; }
};

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

const norm = n => String(n || '').toLowerCase().replace(/[™®©]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
// "ELDEN RING PS4 & PS5" -> "ELDEN RING"; keeps meaningful words like "Remastered"
function cleanName(name) {
  return String(name || '').replace(/[™®©]/g, '').replace(/\s+(PS4\s*&\s*PS5|PS5\s*&\s*PS4|PS4|PS5)(\s+(Version|Edition))?\s*$/i, '').replace(/\s+/g, ' ').trim();
}

// ---------- search ----------
async function searchPsprices(q) {
  const data = await getJson('https://psprices.com/api/search/suggestions/?q=' + encodeURIComponent(q) + '&region=us');
  return (data.suggestions || [])
    .filter(s => s.top_category === 'game' && (s.platforms || []).some(p => p === 'PS4' || p === 'PS5'))
    .map(s => ({
      source: 'psprices',
      name: s.name,
      title: cleanName(s.name),
      platforms: (s.platforms || []).filter(p => p === 'PS4' || p === 'PS5').map(p => p.toLowerCase()),
      coverUrl: s.cover_url || null,
      releaseDate: s.release_date ? String(s.release_date).slice(0, 10) : null,
      price: s.price || null,
      metacritic: s.metacritic_score || null,
      pspricesUrl: s.url ? 'https://psprices.com' + s.url : null,
    }));
}

async function searchStore(q) {
  const data = await getJson('https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/US/en/999/' + encodeURIComponent(norm(q)) + '?suggested_size=10&mode=game');
  return (data.links || []).filter(l => l.id && l.name && l.game_contentType === 'Full Game').map(l => {
    const img = (l.images || []).find(i => i.url) || {};
    return {
      source: 'store', name: l.name, title: cleanName(l.name), storeId: l.id,
      platforms: ['ps4', 'ps5'].filter(p => (l.playable_platform || []).map(x => String(x).toLowerCase()).some(x => x.includes(p))),
      coverUrl: img.url ? img.url.replace('vulcan.dl.playstation.net/ap/rnd', 'image.api.playstation.com/vulcan/ap/rnd') : null,
      releaseDate: l.release_date ? String(l.release_date).slice(0, 10) : null, price: null, metacritic: null,
    };
  });
}

async function search(q) {
  q = String(q || '').trim().slice(0, 80);
  if (q.length < 2) return { results: [], via: null };
  let results = [], via = 'psprices', note = null;
  try { results = await searchPsprices(q); }
  catch (e) { note = 'PSPrices did not answer (' + e.message + '), used the PlayStation Store instead.'; via = 'store'; results = await searchStore(q); }
  // PSPrices lists editions and bundles separately; keep the first of each cleaned name
  const seen = new Set();
  results = results.filter(r => { const k = norm(r.title); if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 8);
  return { results, via, note };
}

// ---------- details ----------
async function findStoreProduct(title, preferredPlatforms = []) {
  const data = await getJson('https://store.playstation.com/store/api/chihiro/00_09_000/tumbler/US/en/999/' + encodeURIComponent(norm(title.replace(/['’]/g, ''))) + '?suggested_size=10&mode=game');
  const want = norm(title);
  const cands = (data.links || []).filter(l => l.id && l.name && l.game_contentType !== 'Disc Only').filter(l => {
    const n = norm(cleanName(l.name));
    return n === want || (n.startsWith(want + ' ') && !/pack|dlc|pass|soundtrack|bonus|costume|upgrade|add on|season/.test(n.slice(want.length)));
  });
  const platformScore = (item) => {
    const id = String(item.id || '').toUpperCase();
    let score = 0;
    if (preferredPlatforms.includes('ps5') && id.includes('PPSA')) score += 5;
    if (preferredPlatforms.includes('ps4') && id.includes('CUSA')) score += 3;
    // The original PS3 product often has the shortest matching name, but it
    // is not the modern catalog item shown by this site.
    if (id.includes('NPUA') || id.includes('NPUB')) score -= 10;
    return score;
  };
  cands.sort((a, b) => platformScore(b) - platformScore(a) || ((b.game_contentType === 'Full Game') - (a.game_contentType === 'Full Game')) || (a.name.length - b.name.length));
  return cands[0] || null;
}

// walk the page data (it hides JSON inside strings and <script> tags)
function collect(node, out) {
  if (typeof node === 'string') {
    // PlayStation embeds compatibility notices inside an environment script
    // string rather than as normal JSON nodes. Pull those notices out before
    // walking the embedded payload so players/online support is not lost.
    if (node.includes('COMPATIBILITY_NOTICE')) {
      const normalized = node.replace(/\\"/g, '"');
      const re = /"type":"COMPATIBILITY_NOTICE","value":"((?:\\.|[^"\\])*)"/g;
      let match;
      while ((match = re.exec(normalized))) {
        try { out.compatibility.push(cleanHtml(JSON.parse('"' + match[1] + '"'))); } catch (e) { /* malformed upstream text */ }
      }
    }
    if (node.includes('<script')) {
      for (const part of node.split('</script>')) {
        const i = part.indexOf('>');
        if (part.includes('<script') && i >= 0) collect(part.slice(i + 1), out);
      }
    } else if (/^[\[{]/.test(node)) { try { collect(JSON.parse(node), out); } catch (e) { /* plain text */ } }
  } else if (Array.isArray(node)) node.forEach(n => collect(n, out));
  else if (node && typeof node === 'object') {
    if (node.role === 'SCREENSHOT' && node.type === 'IMAGE' && node.url) out.shots.push(node.url);
    if (node.__typename === 'Description' && node.type === 'LONG' && node.value) out.long.push(node.value);
    if (Array.isArray(node.localizedGenres)) for (const g of node.localizedGenres) if (g && g.value) out.genres.push(g.value);
    if (typeof node.releaseDate === 'string' && !out.release) out.release = node.releaseDate;
    if (typeof node.publisherName === 'string' && !out.publisher) out.publisher = node.publisherName;
    if (node.__typename === 'Description' && node.type === 'COMPATIBILITY_NOTICE' && node.value) out.compatibility.push(node.value);
    if (node.contentRating && typeof node.contentRating === 'object' && node.contentRating.authority) {
      const rating = node.contentRating;
      const descriptors = Array.isArray(rating.descriptors)
        ? rating.descriptors.filter(d => d && d.description).map(d => d.description)
        : [];
      if (!out.contentRating) {
        out.contentRating = {
          authority: rating.authority || '',
          name: rating.name || '',
          description: rating.description || '',
          url: rating.url || '',
          descriptors,
        };
      } else if (descriptors.length) {
        out.contentRating.descriptors = [...new Set([...(out.contentRating.descriptors || []), ...descriptors])];
      }
    }
    if (Array.isArray(node.platforms) && node.platforms.every(p => typeof p === 'string') && node.platforms.length) out.platforms.push(...node.platforms);
    if (node.role === 'MASTER' && node.type === 'IMAGE' && node.url && !out.master) out.master = node.url;
    Object.values(node).forEach(n => collect(n, out));
  }
}

function cleanHtml(html) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

// PlayStation Store genre -> one of this site's categories (first match wins)
const GENRE_RULES = [
  [/horror/i, 'Horror'], [/fight/i, 'Fighting'], [/role.?play|rpg/i, 'RPG'], [/shoot/i, 'Shooter'],
  [/racing|driving|sport/i, 'Sports & Racing'], [/strateg|simulat/i, 'Strategy & Simulation'],
  [/puzzle|platform/i, 'Platformer & Puzzle'], [/music|rhythm|party|family|casual/i, 'Party & Rhythm'],
  [/survival|open.?world/i, 'Survival & Open-World'], [/indie|rogue/i, 'Indie & Roguelike'],
  [/action|adventure|arcade|unique/i, 'Action-Adventure'],
];
function mapCategory(genres, known) {
  for (const [re, cat] of GENRE_RULES) if (genres.some(g => re.test(g))) return known.includes(cat) ? cat : cat;
  return known.includes('Action-Adventure') ? 'Action-Adventure' : (known[0] || 'Action-Adventure');
}

async function translateFa(text) {
  const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=' + encodeURIComponent(text), { signal: AbortSignal.timeout(TIMEOUT) });
  if (!r.ok) throw new Error('translate HTTP ' + r.status);
  const j = await r.json();
  return j[0].map(s => s[0]).join('');
}

// c: one search result. known: the site's existing category names.
async function details(c, known) {
  const title = cleanName(c.title || c.name);
  const out = {
    title, category: mapCategory([], known), platforms: c.platforms && c.platforms.length ? c.platforms : ['ps4', 'ps5'],
    released: c.releaseDate || '', description: '', description_fa: '', screenshots: [], coverUrl: coverUrlOk(c.coverUrl) ? c.coverUrl : null,
    genres: [], publisher: '', company: '', storeName: '', warnings: [],
    metacritic: c.metacritic || null, pspricesUrl: c.pspricesUrl || null,
    ageRating: '', ageRatingUrl: '', contentDescriptors: [], compatibility: [],
    players: null, online: null, dualSense: null, vr: null,
  };
  let product = null;
  try { product = c.storeId ? { id: c.storeId, name: c.name } : await findStoreProduct(title); }
  catch (e) { out.warnings.push('Could not search the PlayStation Store: ' + e.message); }
  if (!product) { out.warnings.push('No matching PlayStation Store page was found, so the description and screenshots are empty. You can still fill them in by hand.'); return out; }
  out.storeName = product.name;
  try {
    const res = await fetch('https://store.playstation.com/en-us/product/' + encodeURIComponent(product.id), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const m = (await res.text()).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!m) throw new Error('page layout not recognised');
    const data = { shots: [], long: [], genres: [], platforms: [], release: null, publisher: null, master: null, contentRating: null, compatibility: [] };
    collect(JSON.parse(m[1]), data);
    const long = data.long.sort((a, b) => b.length - a.length)[0];
    if (long) out.description = cleanHtml(long).replace(/^Edition includes[^\n]*\n[^\n]*\n+/i, '');
    out.screenshots = [...new Set(data.shots)].slice(0, 30);
    out.genres = [...new Set(data.genres)];
    out.category = mapCategory(out.genres, known);
    out.publisher = data.publisher || '';
    out.company = require('./company-rules').companyFor(title) || out.publisher;
    if (data.contentRating) {
      out.ageRating = data.contentRating.description || data.contentRating.name || '';
      out.ageRatingUrl = data.contentRating.url || '';
      out.contentDescriptors = [...new Set(data.contentRating.descriptors || [])];
    }
    out.compatibility = [...new Set(data.compatibility || [])];
    const compatibility = out.compatibility.join(' ');
    const onlinePlayers = compatibility.match(/supports up to (\d+) online players?/i);
    const localPlayers = compatibility.match(/(?:^|\s)(\d+(?:\s*[-–]\s*\d+)?) players?(?:\s|$)/i);
    if (onlinePlayers && localPlayers && onlinePlayers[1] !== localPlayers[1]) out.players = `${localPlayers[1]} local · ${onlinePlayers[1]} online`;
    else if (onlinePlayers || localPlayers) out.players = (onlinePlayers || localPlayers)[1];
    if (/online play|online multiplayer|online players?/i.test(compatibility)) out.online = true;
    else if (/offline play only/i.test(compatibility)) out.online = false;
    if (compatibility) {
      out.dualSense = /dualsense|vibration function|trigger effect|haptic feedback/i.test(compatibility);
      out.vr = /playstation.?vr|ps vr|vr2/i.test(compatibility);
    }
    if (!out.released && data.release) out.released = String(data.release).slice(0, 10);
    const plats = [...new Set(data.platforms.map(p => String(p).toLowerCase()).filter(p => p === 'ps4' || p === 'ps5'))];
    if (plats.length) out.platforms = plats;
    if (!out.coverUrl && coverUrlOk(data.master)) out.coverUrl = data.master;
    if (!out.description) out.warnings.push('The store page has no description.');
    if (!out.screenshots.length) out.warnings.push('The store page has no screenshots.');
  } catch (e) {
    out.warnings.push('Could not read the PlayStation Store page (' + e.message + '). Description and screenshots are empty.');
  }
  if (out.description) {
    try { out.description_fa = await translateFa(out.description.slice(0, 4500)); }
    catch (e) { out.warnings.push('The Persian translation could not be made automatically; use the translate button.'); }
  }
  return out;
}

// Lightweight enrichment used by public game pages. It reads the Metacritic
// score from PSPrices and the ESRB/content descriptors from the matching
// PlayStation Store product without running the heavier translation flow above.
async function gameMetadata(title) {
  const clean = cleanName(title);
  const out = {
    metacritic: null,
    pspricesUrl: null,
    ageRating: '',
    ageRatingUrl: '',
    contentDescriptors: [],
    compatibility: [],
    players: null,
    online: null,
    dualSense: null,
    vr: null,
  };
  // Both lookups are independent, so start them together and keep whichever
  // source answers. This keeps the delayed enrichment from feeling sluggish.
  const [productResult, psResult] = await Promise.allSettled([
    findStoreProduct(clean, ['ps5', 'ps4']),
    searchPsprices(clean),
  ]);
  const product = productResult.status === 'fulfilled' ? productResult.value : null;
  const ps = psResult.status === 'fulfilled' ? psResult.value : [];
  if (!product) return out;
  const want = norm(cleanName(product.name || clean));
  // Only use a PSPrices result when it matches the requested game. The old
  // `ps[0]` fallback could attach a different release (for example GTA VI)
  // to GTA V when the search returned a loosely related result.
  const candidate = ps.find(row => norm(row.title) === want)
    || ps.find(row => norm(row.title).startsWith(norm(clean) + ' '));
  if (candidate) {
    out.metacritic = candidate.metacritic || null;
    out.pspricesUrl = candidate.pspricesUrl || null;
  }
  try {
    const res = await fetch('https://store.playstation.com/en-us/product/' + encodeURIComponent(product.id), { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return out;
    const m = (await res.text()).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
    if (!m) return out;
    const data = { contentRating: null, compatibility: [] };
    collect(JSON.parse(m[1]), data);
    if (data.contentRating) {
      out.ageRating = data.contentRating.description || data.contentRating.name || '';
      out.ageRatingUrl = data.contentRating.url || '';
      out.contentDescriptors = [...new Set(data.contentRating.descriptors || [])];
    }
    out.compatibility = [...new Set(data.compatibility || [])];
    const text = out.compatibility.join(' ');
    const onlinePlayers = text.match(/supports up to (\d+) online players?/i);
    const localPlayers = text.match(/(?:^|\s)(\d+(?:\s*[-–]\s*\d+)?) players?(?:\s|$)/i);
    if (onlinePlayers && localPlayers && onlinePlayers[1] !== localPlayers[1]) out.players = `${localPlayers[1]} local · ${onlinePlayers[1]} online`;
    else if (onlinePlayers || localPlayers) out.players = (onlinePlayers || localPlayers)[1];
    if (/online play|online multiplayer|online players?/i.test(text)) out.online = true;
    else if (/offline play only/i.test(text)) out.online = false;
    if (text) {
      out.dualSense = /dualsense|vibration function|trigger effect|haptic feedback/i.test(text);
      out.vr = /playstation.?vr|ps vr|vr2/i.test(text);
    }
  } catch (e) { /* a missing rating must never break the game page */ }
  return out;
}

module.exports = { search, details, gameMetadata, coverUrlOk, cleanName };
