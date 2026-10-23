const express = require('express');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const lookup = require('./lookup');
const { logoFor } = require('./company-logos');
const { supportsTwoPlayers } = require('./game-features');
const { HOME_SHELVES } = require('./home-shelves');

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
app.disable('x-powered-by');
// text (pages, scripts, styles, JSON) is sent compressed: about 5-8 times smaller. Downloads are left alone so resuming works.
app.use(require('compression')({ filter: (req, res) => !/^\/(dl|media)\//.test(req.path) && require('compression').filter(req, res) }));
const PORT = process.env.PORT || 80;

const MEDIA_DIR = path.join(__dirname, 'media');
const THUMB_DIR = path.join(__dirname, 'thumbs');
const PUBLIC_DIR = path.join(__dirname, 'public');
const COVERS_DIR = path.join(__dirname, 'data', 'covers');
const COVER_EXT = ['.jpg', '.jpeg', '.png', '.webp'];

const VIDEO_EXT = new Set(['.mp4', '.mov', '.mkv', '.webm', '.avi']);
const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);
const ARCHIVE_EXT = new Set(['.zip', '.rar', '.7z', '.tar', '.gz']);
const SUBTITLE_EXT = new Set(['.srt', '.vtt', '.ass', '.sub']);

// --- Ensure base folders exist ---
for (const dir of [MEDIA_DIR, THUMB_DIR, COVERS_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// --- Optional per-game cover art ---
// Drop your own image (something you have rights to use) at
// data/covers/<slug>.jpg|png|webp and it replaces the placeholder tile.
// No cover art is bundled here — see README for why.
// Small time-limited memory cache. The catalog pages are the same for every visitor but used to scan the
// disk for every game on every request; now one scan serves everybody for a few seconds. Anything that changes
// games or files clears it at once (clearMemo), so the admin still sees changes immediately.
const memo = new Map();
const MEMO_MS = parseInt(process.env.CATALOG_CACHE_MS, 10) || 3000;
function clearMemo() { memo.clear(); }
function memoize(key, build, ms = MEMO_MS) {
  const hit = memo.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const value = build();
  memo.set(key, { value, until: Date.now() + ms });
  return value;
}
// answer with a JSON text that was built once and is shared for a few seconds
function sendCached(res, key, build) {
  res.set('Cache-Control', 'public, max-age=5');
  res.type('json').send(memoize('json:' + key, () => JSON.stringify(build())));
}
app.on('file-added', clearMemo);
app.on('game-added', clearMemo);
app.on('files-changed', clearMemo);
app.on('categories-changed', clearMemo);

function findCoverRaw(slug) {
  for (const ext of COVER_EXT) {
    if (fs.existsSync(path.join(COVERS_DIR, slug + ext))) return `/covers/${slug}${ext}`;
  }
  return null;
}
const findCover = slug => memoize('cover:' + slug, () => findCoverRaw(slug), 30000);

// --- Games catalog ---
// Each game's folder in media/<slug>/ holds its gameplay clips/screenshots/etc.
// The folder does not need to exist ahead of time — the game page just shows
// "nothing uploaded yet" until you drop files in.
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DATA_DIR = path.join(__dirname, 'data');
// Catalog state. Reloaded from disk by loadCatalog() on startup and after
// every admin edit, so the public API always reflects data/*.json.
let SCREENSHOTS = {};
let DESCRIPTIONS = {};
let GAME_DETAILS = {};
let GAME_AWARDS = {};
let COMPANY_AWARDS = {};
let GAME_PLAYTIMES = {};
let GAMES = [];
let GAMES_BY_SLUG = new Map();
let CATEGORIES = [];
let CATEGORY_LABELS = {};
const CATEGORY_FA_DEFAULTS = {
  'Action-Adventure': 'اکشن-ماجراجویی',
  'RPG': 'نقش‌آفرینی',
  'Shooter': 'تیراندازی',
  'Fighting': 'مبارزه‌ای',
  'Horror': 'ترسناک',
  'Sports & Racing': 'ورزشی و مسابقه‌ای',
  'Platformer & Puzzle': 'پلتفرمر و پازل',
  'Survival & Open-World': 'بقا و دنیای باز',
  'Strategy & Simulation': 'استراتژی و شبیه‌سازی',
  'Indie & Roguelike': 'ایندی و روگ‌لایک',
  'Party & Rhythm': 'مهمانی و موزیکال',
  'Most Famous': 'معروف‌ترین‌ها',
  'Lately Released': 'تازه منتشر شده‌ها',
  'Your taste': 'سلیقه شما',
  'Best Sellers': 'پرفروش‌ترین‌ها',
  '2 Player Games': 'بازی‌های دو نفره',
  'VR Supported Games': 'بازی‌های پشتیبانی‌کننده از واقعیت مجازی',
};
const gameMetadataCache = new Map();
const GAME_METADATA_TTL = 15 * 60 * 1000;

const store = require('./store');
const readJson = (file, fallback) => store.get(file, fallback);
// for uptime monitors / load balancers: is the site up, which store it uses, are saves keeping up
app.get('/healthz', (req, res) => res.json({ ok: !store.stats.lastError || store.pending < 50, store: store.mode, pendingWrites: store.pending, lastStoreError: store.stats.lastError || null, uptimeSeconds: Math.round(process.uptime()) }));

// Only games with a real PS4/PS5 release (including remasters/collections) are
// served — the `modern` flag in games.json marks PS1/PS2/PS3-only and
// non-PlayStation-only titles, which are filtered out here rather than deleted
// from the data file.
function loadCatalog() {
  const entries = readJson('games.json', []);
  // Gameplay screenshot URLs (PlayStation Store CDN or admin uploads) and
  // store descriptions per game slug. Missing lookups just render nothing.
  SCREENSHOTS = readJson('screenshots.json', {});
  const descriptions = readJson('descriptions.json', {});
  const descriptionFallbacks = readJson('description-fallbacks.json', {});
  const storySummaries = readJson('story-summaries.json', {});
  DESCRIPTIONS = { ...descriptionFallbacks, ...descriptions };
  // Keep admin/store descriptions authoritative, but use a curated summary
  // when an older catalog record exists with an empty English or Persian field.
  for (const [slug, fallback] of Object.entries(descriptionFallbacks)) {
    const current = descriptions[slug] || {};
    DESCRIPTIONS[slug] = {
      ...fallback,
      ...current,
      source: current.source || fallback.source || 'curated',
      description: current.description || fallback.description || '',
      description_fa: current.description_fa || fallback.description_fa || '',
    };
  }
  // A game's story copy is kept separately from the full PlayStation Store
  // description so support and player-count hints can still use the source text.
  for (const [slug, summary] of Object.entries(storySummaries)) {
    const current = DESCRIPTIONS[slug] || {};
    DESCRIPTIONS[slug] = {
      ...current,
      story: summary.description || '',
      story_fa: summary.description_fa || '',
      source: 'curated',
    };
  }
  GAME_DETAILS = readJson('game-details.json', {});
  GAME_AWARDS = readJson('game-awards.json', {});
  COMPANY_AWARDS = readJson('company-awards.json', {});
  GAME_PLAYTIMES = readJson('game-playtimes.json', {});
  CATEGORY_LABELS = readJson('category-labels.json', {});
  GAMES = entries
    .filter(g => g.modern !== false)
    .map(g => ({
      title: g.title,
      category: g.category,
      famous: !!g.famous,
      famousRank: g.famousRank || null,
      released: g.released || null,
      company: g.company || '',
      platforms: g.platforms || ['ps4', 'ps5'],
      coverUrl: g.coverUrl || null,
      slug: slugify(g.title),
    }));
  GAMES_BY_SLUG = new Map(GAMES.map(g => [g.slug, g]));
  CATEGORIES = [...new Set(GAMES.map(g => g.category))].sort();
  gameMetadataCache.clear();
  clearMemo();
}
loadCatalog();

// --- Serve the frontend ---
// Browsers keep what they already downloaded: fonts for a year (their file names change if they change), pictures a day,
// scripts and styles 5 minutes (then they just ask "changed?" and get a tiny "no"), pages always ask.
app.use(express.static(PUBLIC_DIR, {
  setHeaders: (res, file) => {
    if (/\.(woff2?)$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else if (/\.(png|jpe?g|webp|svg|ico|gif)$/i.test(file)) res.setHeader('Cache-Control', 'public, max-age=86400');
    else if (/\.(js|css)$/i.test(file)) res.setHeader('Cache-Control', 'no-cache');   // always asks "changed?" (a tiny reply), so edits show up at once
    else res.setHeader('Cache-Control', 'no-cache');
  },
}));

// --- Serve generated thumbnails ---
app.use('/thumbs', express.static(THUMB_DIR, { maxAge: '1d' }));

// --- Serve user-supplied cover art ---
// /covers/<game>.jpg?w=400 gives a smaller WebP copy (made once, kept in data/cover-cache). The tiles only show ~200px,
// so this is the biggest saving on the home page. Without ?w= the original file is served as before.
const COVER_CACHE = path.join(DATA_DIR, 'cover-cache');
const COVER_WIDTHS = [160, 240, 320, 400, 480, 640, 960];
const coverJobs = new Map();
// Bound image conversion work instead of starting a conversion for every tile at once.
const coverQueue = [];
let activeCoverJobs = 0;
function queueCoverJob(task) {
  return new Promise((resolve, reject) => {
    coverQueue.push({task,resolve,reject});
    drainCoverQueue();
  });
}
function drainCoverQueue() {
  while (activeCoverJobs < 2 && coverQueue.length) {
    const {task,resolve,reject} = coverQueue.shift();
    activeCoverJobs++;
    Promise.resolve().then(task).then(resolve,reject).finally(() => { activeCoverJobs--; drainCoverQueue(); });
  }
}
app.get('/covers/:file', (req, res, next) => {
  const want = parseInt(req.query.w, 10);
  if (!want || !/^[A-Za-z0-9._-]+\.(jpe?g|png|webp)$/i.test(req.params.file)) return next();
  const src = path.join(COVERS_DIR, req.params.file);
  let st; try { st = fs.statSync(src); } catch (e) { return next(); }
  const w = COVER_WIDTHS.find(x => x >= want) || COVER_WIDTHS[COVER_WIDTHS.length - 1];
  const out = path.join(COVER_CACHE, req.params.file.replace(/\.[^.]+$/, '') + '-' + w + '-' + Math.round(st.mtimeMs) + '.webp');
  const send = () => { res.setHeader('Cache-Control', 'public, max-age=86400'); res.type('image/webp'); res.sendFile(out, err => { if (err && !res.headersSent) next(); }); };
  if (fs.existsSync(out)) return send();
  let job = coverJobs.get(out);
  if (!job) {
    fs.mkdirSync(COVER_CACHE, { recursive: true });
    job = queueCoverJob(() => require('sharp')(src).resize({ width: w, withoutEnlargement: true }).webp({ quality: 82 }).toFile(out + '.tmp'))
      .then(() => fs.renameSync(out + '.tmp', out)).finally(() => coverJobs.delete(out));
    coverJobs.set(out, job);
  }
  job.then(send, () => next());   // if resizing fails the original is served
});
app.use('/covers', express.static(COVERS_DIR, { maxAge: '1h' }));

// --- Serve actual files as forced downloads ---
// /media/<category>/<filename> -> triggers browser "Save As" instead of inline play
// Set by wallet.js: decides whether this visitor may download a file (free,
// unlocked with subscription quota, or admin) and adds access information to file lists.
const gate = {
  isAdmin: () => false,
  check: () => ({ ok: true }),
  annotate: (req, slug, files) => files,
};

app.get('/media/:category/:filename', (req, res) => {
  const { category, filename } = req.params;
  const filePath = path.join(MEDIA_DIR, category, filename);

  // Prevent path traversal (e.g. ../../etc/passwd)
  if (!filePath.startsWith(MEDIA_DIR)) {
    return res.status(400).send('Invalid path');
  }
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Not found');
  }
  // direct links are closed: customers get a short-lived /dl/<token> link from the Download button (dlinks.js)
  if (!gate.isAdmin(req)) return res.status(403).send('Direct file links are disabled. Press the Download button on the game page.');
  res.download(filePath);
});

// --- Shared: list files inside one media/<category> folder ---
function listCategoryFiles(category) {
  return memoize('files:' + category, () => listCategoryFilesRaw(category)).map(f => ({ ...f }));
}
function listCategoryFilesRaw(category) {
  const dir = path.join(MEDIA_DIR, category);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(f => f.isFile())
    .map(f => {
      const ext = path.extname(f.name).toLowerCase();
      const type = VIDEO_EXT.has(ext) ? 'video'
        : IMAGE_EXT.has(ext) ? 'image'
        : ARCHIVE_EXT.has(ext) ? 'archive'
        : SUBTITLE_EXT.has(ext) ? 'subtitle'
        : 'other';
      const stat = fs.statSync(path.join(dir, f.name));
      const thumbName = path.parse(f.name).name + '.jpg';
      const hasThumb = fs.existsSync(path.join(THUMB_DIR, category, thumbName));

      return {
        name: f.name,
        type,
        ext: ext.replace('.', '').toUpperCase(),
        sizeBytes: stat.size,
        sizeMB: (stat.size / (1024 * 1024)).toFixed(1),
        downloadUrl: `/media/${encodeURIComponent(category)}/${encodeURIComponent(f.name)}`,
        thumbUrl: hasThumb ? `/thumbs/${encodeURIComponent(category)}/${encodeURIComponent(thumbName)}` : null,
      };
    });
}

// --- List all files, grouped by category, for the plain gallery UI ---
app.get('/api/files', (req, res) => {
  const categories = fs.readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const result = categories.map(category => ({
    category,
    files: listCategoryFiles(category),
  }));

  res.json(result);
});

// --- Games catalog: list (with upload counts + total size, for search/browse) ---
app.get('/api/games', (req, res) => sendCached(res, 'games', () => {
  return GAMES.map(g => {
    const files = fs.existsSync(path.join(MEDIA_DIR, g.slug)) ? listCategoryFiles(g.slug) : [];
    const totalSizeMB = files.reduce((sum, f) => sum + Number(f.sizeBytes || 0) / (1024 * 1024), 0);
    const gameQuotaGB = gate.gameQuota(g.slug);
    return {
      title: g.title,
      slug: g.slug,
      category: g.category,
      famous: g.famous,
      famousRank: g.famousRank,
      released: g.released,
      platforms: g.platforms,
      players: (GAME_DETAILS[g.slug] || {}).players || null,
      twoPlayer: supportsTwoPlayers((GAME_DETAILS[g.slug] || {}).players),
      vr: typeof (GAME_DETAILS[g.slug] || {}).vr === 'boolean' ? GAME_DETAILS[g.slug].vr : null,
      count: files.length,
      totalSizeMB: totalSizeMB.toFixed(1),
      coverUrl: findCover(g.slug) || g.coverUrl || null,
      gameQuotaGB,
      minQuotaGB: files.length ? gameQuotaGB : null,
      hasSubtitle: files.some(f => f.type === 'subtitle'),
    };
  });
}));

// --- Homepage strip: the 10 most famous + the 10 latest games (20 total) ---
function gameCard(g) {
  const files = fs.existsSync(path.join(MEDIA_DIR, g.slug)) ? listCategoryFiles(g.slug) : [];
  const totalSizeMB = files.reduce((sum, f) => sum + Number(f.sizeBytes || 0) / (1024 * 1024), 0);
  return {
    title: g.title,
    slug: g.slug,
    category: g.category,
    released: g.released,
    count: files.length,
    totalSizeMB: totalSizeMB.toFixed(1),
    coverUrl: findCover(g.slug) || g.coverUrl || null,
  };
}
app.get('/api/featured', (req, res) => sendCached(res, 'featured', () => {
  const famous = GAMES
    .filter(g => g.famousRank)
    .sort((a, b) => a.famousRank - b.famousRank)
    .slice(0, 10);
  const taken = new Set(famous.map(g => g.slug));
  const latest = GAMES
    .filter(g => g.released && !taken.has(g.slug))
    .sort((a, b) => b.released.localeCompare(a.released))
    .slice(0, 10);
  return [...famous, ...latest].map(gameCard);
}));

// --- Homepage latest strip: all games, with dated releases newest first ---
app.get('/api/latest', (req, res) => sendCached(res, 'latest', () => {
  return GAMES
    .slice()
    .sort((a, b) => {
      const aRelease = Date.parse(a.released || '');
      const bRelease = Date.parse(b.released || '');
      const aHasDate = Number.isFinite(aRelease);
      const bHasDate = Number.isFinite(bRelease);
      if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
      if (aHasDate && aRelease !== bRelease) return bRelease - aRelease;
      return a.title.localeCompare(b.title);
    })
    .map(gameCard);
}));

// --- Distinct list of categories, with per-category game counts ---
// "Most Famous" is a special, hand-curated cross-cutting tag (see the
// `famous` flag in data/games.json) rather than a genre — pinned first.
function categoryLabel(name) {
  const saved = CATEGORY_LABELS && CATEGORY_LABELS[name] && typeof CATEGORY_LABELS[name] === 'object'
    ? CATEGORY_LABELS[name]
    : {};
  const homeDefault = HOME_SHELVES.find(item => item.key === name);
  return {
    en: typeof saved.en === 'string' && saved.en.trim() ? saved.en.trim() : (homeDefault ? homeDefault.en : name),
    fa: typeof saved.fa === 'string' && saved.fa.trim() ? saved.fa.trim() : (homeDefault ? homeDefault.fa : (CATEGORY_FA_DEFAULTS[name] || name)),
  };
}
app.get('/api/categories', (req, res) => sendCached(res, 'categories', () => {
  const counts = {};
  for (const g of GAMES) counts[g.category] = (counts[g.category] || 0) + 1;
  const famousCount = GAMES.filter(g => g.famous).length;
  const latestCount = GAMES.length;
  const publicCategory = name => {
    const labels = categoryLabel(name);
    return { name, labelEn: labels.en, labelFa: labels.fa };
  };

  return [
    { ...publicCategory('Most Famous'), count: famousCount, special: true },
    { ...publicCategory('Lately Released'), count: latestCount, special: true },
    ...CATEGORIES.map(name => ({ ...publicCategory(name), count: counts[name] })),
  ];
}));

// Labels for homepage-only shelves. They are kept separate from /api/categories
// so feature shelves do not appear as duplicate genre shortcuts in the drawer.
app.get('/api/home-labels', (req, res) => sendCached(res, 'home-labels', () => HOME_SHELVES.map(item => {
  const labels = categoryLabel(item.key);
  return { name: item.key, labelEn: labels.en, labelFa: labels.fa, kind: item.kind };
})));

// --- Platform counts (PS4 / PS5), for the drawer's Platform section ---
app.get('/api/platforms', (req, res) => sendCached(res, 'platforms', () => [
  { id: 'ps4', count: GAMES.filter(g => g.platforms.includes('ps4')).length },
  { id: 'ps5', count: GAMES.filter(g => g.platforms.includes('ps5')).length },
]));

function inferredCompanyAwards(company) {
  const awards = [];
  const sources = [];
  for (const studioGame of GAMES) {
    if (studioGame.company !== company) continue;
    const entry = GAME_AWARDS[studioGame.slug];
    if (!entry || !Array.isArray(entry.awards)) continue;
    if (entry.source) sources.push(entry.source);
    for (const award of entry.awards) {
      const value = `${studioGame.title} — ${award}`;
      if (!awards.includes(value)) awards.push(value);
    }
  }
  return { awards, source: sources[0] || '' };
}

// --- Single game's files, for the game detail page ---
app.get('/api/games/:slug/files', async (req, res) => {
  const game = GAMES_BY_SLUG.get(req.params.slug);
  if (!game) return res.status(404).json({ error: 'Unknown game' });
  const files = listCategoryFiles(game.slug);
  const localCover = findCover(game.slug);
  const coverUrl = localCover || game.coverUrl || null;
  const accent = localCover ? await require('./accent').accentFor(path.join(COVERS_DIR, path.basename(localCover))) : null;
  const totalSizeMB = files.reduce((sum, f) => sum + Number(f.sizeBytes || 0) / (1024 * 1024), 0);
  const shotEntry = SCREENSHOTS[game.slug];
  const descEntry = DESCRIPTIONS[game.slug];
  const detailEntry = GAME_DETAILS[game.slug] || {};
  const awardEntry = GAME_AWARDS[game.slug] || {};
  const playtimeEntry = GAME_PLAYTIMES[game.slug] || {};
  const company = game.company || detailEntry.company || '';
  const companyAwardEntry = COMPANY_AWARDS[company] || {};
  const inferredAwards = inferredCompanyAwards(company);
  const detailCompanyAwards = Array.isArray(detailEntry.companyAwards) && detailEntry.companyAwards.length ? detailEntry.companyAwards : null;
  const curatedCompanyAwards = Array.isArray(companyAwardEntry.awards) && companyAwardEntry.awards.length ? companyAwardEntry.awards : null;
  const gameCompanyAwards = Array.isArray(awardEntry.companyAwards) && awardEntry.companyAwards.length ? awardEntry.companyAwards : null;
  const companyAwards = detailCompanyAwards || curatedCompanyAwards || (inferredAwards.awards.length ? inferredAwards.awards : null) || gameCompanyAwards || awardEntry.awards || [];
  res.json({
    title: game.title,
    slug: game.slug,
    category: game.category,
    company,
    companyLogo: detailEntry.companyLogo || logoFor(company),
    awards: Array.isArray(detailEntry.awards) && detailEntry.awards.length ? detailEntry.awards : (awardEntry.awards || []),
    awardsSource: detailEntry.awardsSource || awardEntry.source || '',
    companyAwards,
    companyAwardsSource: detailEntry.companyAwardsSource || companyAwardEntry.source || inferredAwards.source || awardEntry.companyAwardsSource || awardEntry.source || '',
    metacritic: Number.isFinite(Number(detailEntry.metacritic)) ? Number(detailEntry.metacritic) : null,
    players: detailEntry.players || null,
    playtime: detailEntry.playtime || playtimeEntry.playtime || null,
    playtimeSource: detailEntry.playtimeSource || playtimeEntry.source || '',
    ageRating: detailEntry.ageRating || null,
    ageRatingUrl: detailEntry.ageRatingUrl || '',
    contentDescriptors: Array.isArray(detailEntry.contentDescriptors) ? detailEntry.contentDescriptors : [],
    dualSense: typeof detailEntry.dualSense === 'boolean' ? detailEntry.dualSense : null,
    vr: typeof detailEntry.vr === 'boolean' ? detailEntry.vr : null,
    online: typeof detailEntry.online === 'boolean' ? detailEntry.online : null,
    platforms: game.platforms,
    files: gate.annotate(req, game.slug, files),
    totalSizeMB: totalSizeMB.toFixed(1),
    gameQuotaGB: gate.gameQuota(game.slug),
    coverUrl,
    accent,
    hasSubtitle: files.some(f => f.type === 'subtitle'),
    screenshots: (shotEntry && shotEntry.screenshots) || [],
    description: (descEntry && descEntry.description) || null,
    descriptionFa: (descEntry && descEntry.description_fa) || null,
    storySummary: (descEntry && descEntry.story) || null,
    storySummaryFa: (descEntry && descEntry.story_fa) || null,
    descriptionSource: descEntry && descEntry.source === 'curated' ? 'curated' : 'playstation-store',
  });
});

// Public game-page enrichment. The catalog itself stays local and fast; this
// small, cached request fills in current PSPrices/PlayStation Store ratings
// only when a visitor opens a game's detail page.
app.get('/api/games/:slug/metadata', async (req, res) => {
  const game = GAMES_BY_SLUG.get(req.params.slug);
  if (!game) return res.status(404).json({ error: 'Unknown game' });
  const local = GAME_DETAILS[game.slug] || {};
  const mergeLocal = remote => ({
    ...remote,
    metacritic: remote.metacritic ?? local.metacritic ?? null,
    ageRating: remote.ageRating || local.ageRating || '',
    ageRatingUrl: remote.ageRatingUrl || local.ageRatingUrl || '',
    contentDescriptors: Array.isArray(local.contentDescriptors) && local.contentDescriptors.length ? local.contentDescriptors : (remote.contentDescriptors || []),
    // Keep a curated full player breakdown over a shorter PSPrices count such
    // as "4 local co-op" so the page still shows both local and online modes.
    players: local.players || remote.players || null,
    online: typeof remote.online === 'boolean' ? remote.online : (typeof local.online === 'boolean' ? local.online : null),
    dualSense: typeof remote.dualSense === 'boolean' ? remote.dualSense : (typeof local.dualSense === 'boolean' ? local.dualSense : null),
    // Store compatibility listings can omit VR-mode DLC, so keep curated
    // support data authoritative when we have it.
    vr: typeof local.vr === 'boolean' ? local.vr : (typeof remote.vr === 'boolean' ? remote.vr : null),
  });
  const cached = gameMetadataCache.get(game.slug);
  if (cached && cached.until > Date.now()) {
    res.set('Cache-Control', 'no-store');
    return res.json(cached.value);
  }
  try {
    const value = mergeLocal(await lookup.gameMetadata(game.title, game.slug));
    gameMetadataCache.set(game.slug, { value, until: Date.now() + GAME_METADATA_TTL });
    res.set('Cache-Control', 'no-store');
    return res.json(value);
  } catch (error) {
    // Ratings are useful decoration and must never turn a valid game page into
    // an error if an upstream service is unavailable.
    return res.json(mergeLocal({ metacritic: null, pspricesUrl: null, ageRating: '', ageRatingUrl: '', contentDescriptors: [], compatibility: [], players: null, online: null, dualSense: null, vr: null }));
  }
});

// --- Generate missing video thumbnails on startup ---
function generateThumbnails() {
  const categories = fs.readdirSync(MEDIA_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const category of categories) {
    const mediaCatDir = path.join(MEDIA_DIR, category);
    const thumbCatDir = path.join(THUMB_DIR, category);
    if (!fs.existsSync(thumbCatDir)) fs.mkdirSync(thumbCatDir, { recursive: true });

    const files = fs.readdirSync(mediaCatDir, { withFileTypes: true })
      .filter(f => f.isFile());

    for (const f of files) {
      const ext = path.extname(f.name).toLowerCase();
      if (!VIDEO_EXT.has(ext)) continue;

      const thumbName = path.parse(f.name).name + '.jpg';
      const thumbPath = path.join(thumbCatDir, thumbName);
      if (fs.existsSync(thumbPath)) continue;

      ffmpeg(path.join(mediaCatDir, f.name))
        .on('error', err => console.error(`Thumbnail failed for ${f.name}:`, err.message))
        .screenshots({
          count: 1,
          timemarks: ['10%'],
          filename: thumbName,
          folder: thumbCatDir,
          size: '480x?',
        });
    }
  }
}

generateThumbnails();

async function start() {
  // Load persistent data before admin bootstrap. It seeds any missing free-plan
  // games and must see the complete catalog rather than an empty startup cache.
  await store.init();
  loadCatalog();
  const adminApi = require('./admin')(app, {
    DATA_DIR, COVERS_DIR, MEDIA_DIR, THUMB_DIR, PUBLIC_DIR,
    ROOT_DIR: __dirname, slugify, loadCatalog, findCover,
  });
  const walletApi = require('./wallet')(app, { ...adminApi, MEDIA_DIR, listCategoryFiles, generateThumbnails, slugify });
  gate.isAdmin = adminApi.isAdmin;
  gate.check = walletApi.canDownload;
  require('./dlinks')(app, { ...adminApi, DATA_DIR }, { MEDIA_DIR, canDownload: walletApi.canDownload });
  gate.annotate = walletApi.annotate;
  gate.minimumPrice = walletApi.minimumPrice;
  gate.gameQuota = walletApi.gameQuota;
  require('./legal')(app, adminApi);
  require('./requests')(app, adminApi, walletApi.core);
  require('./telegram')(app, adminApi, { COVERS_DIR, getGames: () => GAMES, slugify });
  require('./recommend')(app, adminApi, walletApi.core, { getGames: () => GAMES, getGameDetails: slug => GAME_DETAILS[slug] || {}, gameCard, slugify });

  app.listen(PORT, () => {
    console.log(`Gallery running at http://localhost:${PORT}`);
  });
}

start().catch(error => {
  console.error('Gallery startup failed:', error);
  process.exitCode = 1;
});
