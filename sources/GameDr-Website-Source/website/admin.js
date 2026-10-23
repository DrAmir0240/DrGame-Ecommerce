// Admin area + the small public APIs it feeds (plans, site content, contact).
//
// Auth: a single admin password read from ADMIN_PASSWORD in .env (generated
// and saved there on first start if missing). Login sets an HttpOnly,
// SameSite=Strict session cookie; every non-GET admin request must also send
// the X-Admin: 1 header, which a cross-site form cannot do.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const { createRequestedGameImporter } = require('./requested-game-import');
const { supportsTwoPlayers } = require('./game-features');
const { HOME_SHELVES } = require('./home-shelves');

module.exports = function mountAdmin(app, ctx) {
  const { DATA_DIR, COVERS_DIR, MEDIA_DIR, THUMB_DIR, PUBLIC_DIR, ROOT_DIR, slugify, loadCatalog, findCover } = ctx;
  const BACKUP_DIR = path.join(DATA_DIR, 'backups');
  const SHOTS_DIR = path.join(DATA_DIR, 'uploads', 'shots');
  for (const d of [BACKUP_DIR, SHOTS_DIR]) fs.mkdirSync(d, { recursive: true });

  // ---------- small helpers ----------
  // all data goes through the store: memory first, saved to PostgreSQL (or data/*.json) in the background
  const store = require('./store');
  const J = (file, fallback) => store.get(file, fallback);
  const W = (file, obj) => store.set(file, obj);
  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const lines = (v, maxItems = 40, maxLength = 240) => {
    const values = Array.isArray(v) ? v : String(v || '').split(/\r?\n/);
    return values.map(x => str(x, maxLength)).filter(Boolean).slice(0, maxItems);
  };
  const sourceUrl = v => {
    const value = str(v, 600);
    return value && /^https:\/\//i.test(value) ? value : '';
  };
  const triState = v => (typeof v === 'boolean' ? v : null);
  const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });
  const uid = () => crypto.randomBytes(6).toString('hex');

  // Ensure every game advertised by the free plan has a catalog page. Existing
  // entries are left untouched; newly added entries still need their files uploaded.
  const FREE_PLAN_CATALOG_GAMES = [
    { title: 'Watch Dogs 2', category: 'Action-Adventure', platforms: ['ps4', 'ps5'], famous: false },
    { title: 'Grand Theft Auto V', category: 'Action-Adventure', platforms: ['ps4', 'ps5'], famous: false },
    { title: 'Rocket League', category: 'Sports & Racing', platforms: ['ps4', 'ps5'], famous: false, released: '2015-07-07', company: 'Psyonix', coverUrl: 'https://cdn2.steamgriddb.com/grid/177f0639e76c9d26dbd65846a614a798.png' },
    { title: 'Mortal Kombat 11', category: 'Fighting', platforms: ['ps4', 'ps5'], famous: false },
    { title: 'Brawlhalla', category: 'Fighting', platforms: ['ps4', 'ps5'], released: '2017-10-17', company: 'Ubisoft', famous: false, coverUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202609/1613/0089b4fb7d248ef81e278ff4be9b06becab156e945012a70.png' },
  ];
  const catalogGames = J('games.json', []);
  const catalogSlugs = new Set(catalogGames.map(game => slugify(game.title)));
  const missingFreePlanGames = FREE_PLAN_CATALOG_GAMES.filter(game => !catalogSlugs.has(slugify(game.title)));
  if (missingFreePlanGames.length) {
    catalogGames.push(...missingFreePlanGames);
    W('games.json', catalogGames);
    loadCatalog();
  }

  // behind Cloudflare every visitor arrives from Cloudflare's addresses; set TRUSTED_PROXY=cloudflare in .env to use the real one
  const clientIp = req => (process.env.TRUSTED_PROXY === 'cloudflare' && req.headers['cf-connecting-ip']) || req.socket.remoteAddress || 'unknown';

  // simple fixed-window rate limiter
  function limiter(max, windowMs) {
    const hits = new Map();
    return (req, res, next) => {
      const key = clientIp(req);
      const now = Date.now();
      const rec = hits.get(key) && hits.get(key).reset > now ? hits.get(key) : { n: 0, reset: now + windowMs };
      rec.n++;
      hits.set(key, rec);
      if (rec.n > max) return bad(res, 'Too many attempts, try again later.', 429);
      next();
    };
  }

  // ---------- admin password + sessions ----------
  const ENV_PATH = path.join(ROOT_DIR, '.env');
  if (!process.env.ADMIN_PASSWORD) {
    const generated = crypto.randomBytes(12).toString('base64url');
    const prefix = fs.existsSync(ENV_PATH) && !fs.readFileSync(ENV_PATH, 'utf8').endsWith('\n') ? '\n' : '';
    fs.appendFileSync(ENV_PATH, `${prefix}ADMIN_PASSWORD=${generated}\n`);
    process.env.ADMIN_PASSWORD = generated;
    console.log('Admin password generated and saved to .env (ADMIN_PASSWORD).');
  }
  const sessions = new Map(); // token -> { exp, rootAdmin } or { exp, userId, rootAdmin: false }
  const SESSION_MS = 12 * 60 * 60 * 1000;

  function readCookie(req, name) {
    const raw = req.headers.cookie || '';
    for (const part of raw.split(';')) {
      const i = part.indexOf('=');
      if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
    }
    return null;
  }
  function adminSession(req) {
    const t = readCookie(req, 'admin_session');
    let session = t && sessions.get(t);
    if (!session) return null;
    // Keep sessions created by an older server instance valid until they expire.
    if (typeof session === 'number') session = { exp: session, rootAdmin: true };
    if (session.exp < Date.now()) { sessions.delete(t); return null; }
    if (!session.rootAdmin) {
      const account = store.peek('users.json', []).find(user => user.id === session.userId);
      if (!account || account.admin !== true) { sessions.delete(t); return null; }
    }
    return session;
  }
  function isAdmin(req) {
    return !!adminSession(req);
  }
  function isRootAdmin(req) {
    return !!(adminSession(req) || {}).rootAdmin;
  }
  function startAdminSession(res, user) {
    if (!user || user.admin !== true) return false;
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { exp: Date.now() + SESSION_MS, userId: user.id, rootAdmin: false });
    const cookie = `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`;
    const existing = res.getHeader('Set-Cookie');
    res.setHeader('Set-Cookie', existing ? [...(Array.isArray(existing) ? existing : [existing]), cookie] : cookie);
    return true;
  }
  function startRootAdminSession(res) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { exp: Date.now() + SESSION_MS, rootAdmin: true });
    res.setHeader('Set-Cookie', `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
  }
  function revokeAdminSessions(userId) {
    for (const [token, session] of sessions) {
      if (session && typeof session === 'object' && session.userId === userId) sessions.delete(token);
    }
  }
  function requireAdmin(req, res, next) {
    if (!isAdmin(req)) return bad(res, 'Not logged in', 401);
    if (req.method !== 'GET' && req.headers['x-admin'] !== '1') return bad(res, 'Missing X-Admin header', 403);
    next();
  }
  const sameString = (a, b) => {
    const ha = crypto.createHash('sha256').update(a).digest();
    const hb = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(ha, hb);
  };

  app.use('/api/admin', express.json({ limit: '2mb' }));
  const rawBody = limit => express.raw({ type: () => true, limit });

  app.post('/api/admin/login', limiter(8, 10 * 60 * 1000), (req, res) => {
    const pw = typeof (req.body && req.body.password) === 'string' ? req.body.password : '';
    if (!pw || !sameString(pw, process.env.ADMIN_PASSWORD)) return bad(res, 'Wrong password', 401);
    startRootAdminSession(res);
    res.json({ ok: true });
  });
  app.post('/api/admin/logout', (req, res) => {
    const t = readCookie(req, 'admin_session');
    if (t) sessions.delete(t);
    res.setHeader('Set-Cookie', 'admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.json({ ok: true });
  });
  app.get('/api/admin/me', (req, res) => {
    const session = adminSession(req);
    res.json({ admin: !!session, rootAdmin: !!(session && session.rootAdmin), accountId: session && session.userId || null });
  });

  // Everything below needs a session.
  app.use('/api/admin', (req, res, next) => {
    if (['/login', '/logout', '/me'].includes(req.path)) return next();
    requireAdmin(req, res, next);
  });

  // ---------- lookup (type a name, get the rest) ----------
  const lookup = require('./lookup');
  const coverUrlOk = lookup.coverUrlOk;

  // downloads a cover image from an allowed host and stores it as data/covers/<slug>.<ext>
  async function downloadCover(slug, url) {
    if (!coverUrlOk(url)) throw new Error('cover address is not allowed');
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DrGameAdmin/1.0)' }, signal: AbortSignal.timeout(20000), redirect: 'error' });
    if (!r.ok) throw new Error('cover download failed (HTTP ' + r.status + ')');
    const len = parseInt(r.headers.get('content-length'), 10);
    if (len > 10 * 1024 * 1024) throw new Error('cover is too large');
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 10 * 1024 * 1024) throw new Error('cover is too large');
    const ext = sniffImage(buf);
    if (!ext) throw new Error('cover is not a JPG, PNG or WEBP image');
    for (const e of ['.jpg', '.jpeg', '.png', '.webp']) {
      const p = path.join(COVERS_DIR, slug + e);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    fs.writeFileSync(path.join(COVERS_DIR, slug + ext), buf);
  }

  const knownCategories = () => [...new Set(J('games.json', []).map(g => g.category))].sort();
  const homeShelfCounts = () => {
    const games = J('games.json', []).filter(g => g.modern !== false);
    const details = J('game-details.json', {});
    const famous = games.filter(g => g.famous).length;
    const bestSellerSlugs = new Set(J('purchases.json', []).filter(p => Number(p.price || 0) > 0 && p.slug).map(p => p.slug));
    const counts = {
      'Most Famous': famous,
      'Lately Released': games.length,
      'Your taste': Math.min(5, games.length),
      'Best Sellers': [...bestSellerSlugs].filter(slug => games.some(g => slugify(g.title) === slug)).length,
      '2 Player Games': games.filter(g => supportsTwoPlayers((details[slugify(g.title)] || {}).players)).length,
      'VR Supported Games': games.filter(g => (details[slugify(g.title)] || {}).vr === true).length,
    };
    return counts;
  };
  const lookupLimit = limiter(60, 10 * 60 * 1000);

  app.get('/api/admin/lookup/search', lookupLimit, async (req, res) => {
    try {
      const r = await lookup.search(req.query.q);
      const have = new Set(J('games.json', []).map(g => slugify(g.title)));
      r.results = r.results.map(x => ({ ...x, inCatalog: have.has(slugify(x.title)) }));
      res.json(r);
    } catch (e) { bad(res, 'Search failed: ' + e.message, 502); }
  });

  app.post('/api/admin/lookup/details', lookupLimit, async (req, res) => {
    const c = req.body && req.body.candidate;
    if (!c || typeof c !== 'object' || !str(c.name || c.title, 200)) return bad(res, 'Pick a game from the search results first');
    try {
      res.json(await lookup.details({
        name: str(c.name, 200), title: str(c.title, 200), platforms: Array.isArray(c.platforms) ? c.platforms.filter(p => p === 'ps4' || p === 'ps5') : [],
        coverUrl: typeof c.coverUrl === 'string' ? c.coverUrl : null, releaseDate: /^\d{4}-\d{2}-\d{2}$/.test(c.releaseDate || '') ? c.releaseDate : null,
        storeId: typeof c.storeId === 'string' && /^[A-Za-z0-9_-]{6,60}$/.test(c.storeId) ? c.storeId : null,
      }, knownCategories()));
    } catch (e) { bad(res, 'Could not get the game details: ' + e.message, 502); }
  });

  // ---------- games ----------
  const PLATFORMS = ['ps4', 'ps5'];
  const gameRow = (g, shots, descs) => {
    const slug = slugify(g.title);
    return {
      slug,
      title: g.title,
      category: g.category,
      famous: !!g.famous,
      famousRank: g.famousRank || null,
      released: g.released || null,
      company: g.company || '',
      platforms: g.platforms || PLATFORMS,
      visible: g.modern !== false,
      screenshotCount: ((shots[slug] && shots[slug].screenshots) || []).length,
      hasDescription: !!(descs[slug] && descs[slug].description),
      coverUrl: findCover(slug),
    };
  };

  function cleanGameInput(b, res) {
    const fail = message => { if (res) bad(res, message); return null; };
    const title = str(b.title, 120);
    const category = str(b.category, 60);
    if (!title) return fail('Title is required');
    if (!slugify(title)) return fail('Title needs letters or numbers');
    if (!category) return fail('Category is required');
    const platforms = Array.isArray(b.platforms) ? b.platforms.filter(p => PLATFORMS.includes(p)) : [];
    if (!platforms.length) return fail('Pick at least one platform');
    const released = str(b.released, 10);
    if (released && !/^\d{4}-\d{2}-\d{2}$/.test(released)) return fail('Release date must be YYYY-MM-DD');
    const rank = b.famousRank === '' || b.famousRank == null ? null : parseInt(b.famousRank, 10);
    if (rank !== null && !(rank >= 1 && rank <= 999)) return fail('Famous rank must be 1-999');
    const shots = Array.isArray(b.screenshots) ? b.screenshots.map(u => str(u, 600)).filter(Boolean) : [];
    if (shots.length > 60) return fail('Max 60 screenshots');
    if (shots.some(u => !/^(https:\/\/|\/uploads\/shots\/)/.test(u))) return fail('Screenshot URLs must be https:// or uploaded files');
    const metacritic = b.metacritic === '' || b.metacritic == null ? null : Number(b.metacritic);
    if (metacritic !== null && (!Number.isFinite(metacritic) || metacritic < 0 || metacritic > 100)) return fail('Critic score must be between 0 and 100');
    return {
      title, category, platforms, released, rank,
      famous: !!b.famous || rank !== null,
      visible: b.visible !== false,
      description: str(b.description, 10000),
      description_fa: str(b.description_fa, 12000),
      screenshots: shots,
      coverUrl: coverUrlOk(b.coverUrl) ? str(b.coverUrl, 600) : '',
      company: str(b.company, 80),
      companyLogo: sourceUrl(b.companyLogo),
      awards: lines(b.awards),
      awardsSource: sourceUrl(b.awardsSource),
      companyAwards: lines(b.companyAwards),
      companyAwardsSource: sourceUrl(b.companyAwardsSource),
      playtime: str(b.playtime, 120),
      playtimeSource: sourceUrl(b.playtimeSource),
      metacritic,
      ageRating: str(b.ageRating, 120),
      ageRatingUrl: sourceUrl(b.ageRatingUrl),
      contentDescriptors: lines(b.contentDescriptors, 12, 100),
      players: str(b.players, 80),
      dualSense: triState(b.dualSense),
      vr: triState(b.vr),
      online: triState(b.online),
    };
  }

  function applyToEntry(entry, v) {
    entry.title = v.title;
    entry.category = v.category;
    entry.platforms = v.platforms;
    if (v.released) entry.released = v.released; else delete entry.released;
    if (v.famous) entry.famous = true; else delete entry.famous;
    if (v.rank !== null) entry.famousRank = v.rank; else delete entry.famousRank;
    if (v.visible) delete entry.modern; else entry.modern = false;
    if (v.company) entry.company = v.company; else delete entry.company;
  }
  function saveTexts(slug, v) {
    const shots = J('screenshots.json', {});
    const descs = J('descriptions.json', {});
    if (v.screenshots.length) shots[slug] = { matchedName: (shots[slug] && shots[slug].matchedName) || v.title, screenshots: v.screenshots };
    else delete shots[slug];
    if (v.description || v.description_fa) {
      descs[slug] = { matchedName: (descs[slug] && descs[slug].matchedName) || v.title, description: v.description };
      if (v.description_fa) descs[slug].description_fa = v.description_fa;
    } else delete descs[slug];
    W('screenshots.json', shots);
    W('descriptions.json', descs);
  }

  function saveGameDetails(slug, v) {
    const details = J('game-details.json', {});
    const value = {};
    const optional = [
      ['companyLogo', v.companyLogo], ['awards', v.awards], ['awardsSource', v.awardsSource],
      ['companyAwards', v.companyAwards], ['companyAwardsSource', v.companyAwardsSource],
      ['playtime', v.playtime], ['playtimeSource', v.playtimeSource], ['metacritic', v.metacritic],
      ['ageRating', v.ageRating], ['ageRatingUrl', v.ageRatingUrl], ['contentDescriptors', v.contentDescriptors],
      ['players', v.players],
    ];
    for (const [key, item] of optional) {
      if (Array.isArray(item) ? item.length : item !== '' && item !== null && item !== undefined) value[key] = item;
    }
    for (const [key, item] of [['dualSense', v.dualSense], ['vr', v.vr], ['online', v.online]]) {
      if (typeof item === 'boolean') value[key] = item;
    }
    if (Object.keys(value).length) details[slug] = value;
    else delete details[slug];
    W('game-details.json', details);

    // Company awards are shared by future games from the same studio. Saving
    // them here means the next game only needs its own title and store data.
    if (v.company && v.companyAwards.length) {
      const companies = J('company-awards.json', {});
      companies[v.company] = { awards: v.companyAwards, source: v.companyAwardsSource || '' };
      W('company-awards.json', companies);
    }
  }

  async function addImportedGame(details) {
    const categories = knownCategories();
    const input = {
      ...details,
      title: str(details.title, 120),
      category: categories.includes(details.category) ? details.category : (categories[0] || 'Action-Adventure'),
      platforms: Array.isArray(details.platforms) ? details.platforms : ['ps4', 'ps5'],
      released: /^\d{4}-\d{2}-\d{2}$/.test(details.released || '') ? details.released : '',
      famous: false, famousRank: '', visible: true,
    };
    const value = cleanGameInput(input, null);
    if (!value) return { status: 'needs-review', message: 'Imported data did not pass the catalog checks. Open Quick Add to review it.' };

    const games = J('games.json', []);
    const slug = slugify(value.title);
    const existing = games.find(game => slugify(game.title) === slug);
    if (existing) return { status: existing.modern === false ? 'needs-review' : 'already-present', slug, title: existing.title };

    const entry = {};
    applyToEntry(entry, value);
    games.push(entry);
    W('games.json', games);
    saveTexts(slug, value);
    saveGameDetails(slug, value);
    let coverError = '';
    if (value.coverUrl) {
      try { await downloadCover(slug, value.coverUrl); }
      catch (error) { coverError = String(error.message || error).slice(0, 180); }
    }
    loadCatalog();
    app.emit('game-added', slug, value.title);
    return { status: 'added', slug, title: value.title, warnings: details.warnings || [], coverError };
  }

  const autoAddRequestedGame = createRequestedGameImporter({
    lookup,
    getGames: () => J('games.json', []),
    getCategories: knownCategories,
    addGame: addImportedGame,
    slugify,
  });

  app.get('/api/admin/stats', (req, res) => {
    const games = J('games.json', []);
    const shots = J('screenshots.json', {});
    const descs = J('descriptions.json', {});
    const customers = J('customers.json', []);
    const messages = J('messages.json', []);
    res.json({
      games: games.length,
      missingDescription: games.filter(g => g.modern !== false && !(descs[slugify(g.title)] || {}).description).length,
      missingScreenshots: games.filter(g => g.modern !== false && !((shots[slugify(g.title)] || {}).screenshots || []).length).length,
      customers: customers.length,
      activeCustomers: customers.filter(c => c.status === 'active').length,
      unreadMessages: messages.filter(m => !m.read).length,
      openReports: J('reports.json', []).filter(r => r.status === 'open').length,
      openRequests: J('requests.json', []).filter(r => r.status === 'new').length,
      accounts: J('users.json', []).length,
      pendingOrders: J('orders.json', []).filter(o => o.status === 'pending').length,
    });
  });

  app.get('/api/admin/games', (req, res) => {
    const shots = J('screenshots.json', {});
    const descs = J('descriptions.json', {});
    res.json(J('games.json', []).map(g => gameRow(g, shots, descs)));
  });

  app.get('/api/admin/categories', (req, res) => {
    res.json([...new Set(J('games.json', []).map(g => g.category))].sort());
  });

  // Category keys stay stable so existing game records, filters and links keep
  // working. Admins edit the public labels for each language here instead of
  // renaming every game's internal category value one by one.
  app.get('/api/admin/category-labels', (req, res) => {
    const counts = {};
    for (const game of J('games.json', [])) counts[game.category] = (counts[game.category] || 0) + 1;
    const saved = J('category-labels.json', {});
    const homeCounts = homeShelfCounts();
    const catalogRows = knownCategories().map(key => ({
      key,
      en: saved[key] && typeof saved[key].en === 'string' && saved[key].en.trim() ? saved[key].en.trim() : key,
      fa: saved[key] && typeof saved[key].fa === 'string' && saved[key].fa.trim() ? saved[key].fa.trim() : key,
      count: counts[key] || 0,
      kind: 'catalog',
    }));
    const homeRows = HOME_SHELVES.map(item => ({
      key: item.key,
      en: saved[item.key] && typeof saved[item.key].en === 'string' && saved[item.key].en.trim() ? saved[item.key].en.trim() : item.en,
      fa: saved[item.key] && typeof saved[item.key].fa === 'string' && saved[item.key].fa.trim() ? saved[item.key].fa.trim() : item.fa,
      count: homeCounts[item.key] || 0,
      kind: item.kind,
    }));
    res.json([...catalogRows, ...homeRows]);
  });

  app.put('/api/admin/category-labels', (req, res) => {
    const catalogKeys = knownCategories();
    const homeKeys = HOME_SHELVES.map(item => item.key);
    const keys = [...new Set([...catalogKeys, ...homeKeys])];
    const rows = Array.isArray(req.body && req.body.labels) ? req.body.labels : [];
    const supplied = new Set(rows.map(row => row && typeof row.key === 'string' ? row.key : ''));
    if (catalogKeys.some(key => !supplied.has(key))) return bad(res, 'Send one label row for every current category');
    const saved = J('category-labels.json', {});
    const next = {};
    for (const key of keys) {
      const row = rows.find(item => item && item.key === key) || {};
      const fallback = HOME_SHELVES.find(item => item.key === key) || {};
      const previous = saved[key] || {};
      const en = str(row.en, 80) || str(previous.en, 80) || fallback.en || key;
      const fa = str(row.fa, 80) || str(previous.fa, 80) || fallback.fa || key;
      if (en.length > 80 || fa.length > 80) return bad(res, 'Category labels must be 80 characters or fewer');
      next[key] = { en, fa };
    }
    W('category-labels.json', next);
    loadCatalog();
    app.emit('categories-changed');
    res.json({ ok: true });
  });

  app.get('/api/admin/games/:slug', (req, res) => {
    const games = J('games.json', []);
    const g = games.find(x => slugify(x.title) === req.params.slug);
    if (!g) return bad(res, 'Unknown game', 404);
    const shots = J('screenshots.json', {});
    const descs = J('descriptions.json', {});
    const details = J('game-details.json', {})[req.params.slug] || {};
    const gameAwards = J('game-awards.json', {})[req.params.slug] || {};
    const gamePlaytime = J('game-playtimes.json', {})[req.params.slug] || {};
    const companyAwards = J('company-awards.json', {})[g.company] || {};
    const row = gameRow(g, shots, descs);
    const d = descs[row.slug] || {};
    res.json({
      ...row,
      description: d.description || '',
      description_fa: d.description_fa || '',
      screenshots: (shots[row.slug] && shots[row.slug].screenshots) || [],
      companyLogo: details.companyLogo || '',
      awards: details.awards || gameAwards.awards || [],
      awardsSource: details.awardsSource || gameAwards.source || '',
      companyAwards: details.companyAwards || companyAwards.awards || [],
      companyAwardsSource: details.companyAwardsSource || companyAwards.source || '',
      playtime: details.playtime || gamePlaytime.playtime || '',
      playtimeSource: details.playtimeSource || gamePlaytime.source || '',
      metacritic: details.metacritic ?? '',
      ageRating: details.ageRating || '',
      ageRatingUrl: details.ageRatingUrl || '',
      contentDescriptors: details.contentDescriptors || [],
      players: details.players || '',
      dualSense: typeof details.dualSense === 'boolean' ? details.dualSense : null,
      vr: typeof details.vr === 'boolean' ? details.vr : null,
      online: typeof details.online === 'boolean' ? details.online : null,
    });
  });

  app.post('/api/admin/games', async (req, res) => {
    const v = cleanGameInput(req.body || {}, res);
    if (!v) return;
    const games = J('games.json', []);
    const slug = slugify(v.title);
    if (games.some(g => slugify(g.title) === slug)) return bad(res, 'A game with this title already exists', 409);
    const entry = {};
    applyToEntry(entry, v);
    games.push(entry);
    W('games.json', games);
    saveTexts(slug, v);
    saveGameDetails(slug, v);
    let coverError = null;
    if (v.coverUrl) { try { await downloadCover(slug, v.coverUrl); } catch (e) { coverError = e.message; } }
    loadCatalog();
    app.emit('game-added', slug, v.title);
    res.json({ ok: true, slug, coverError });
  });

  app.put('/api/admin/games/:slug', async (req, res) => {
    const v = cleanGameInput(req.body || {}, res);
    if (!v) return;
    const games = J('games.json', []);
    const i = games.findIndex(g => slugify(g.title) === req.params.slug);
    if (i < 0) return bad(res, 'Unknown game', 404);
    const oldSlug = req.params.slug;
    const newSlug = slugify(v.title);
    if (newSlug !== oldSlug && games.some(g => slugify(g.title) === newSlug)) return bad(res, 'Another game already has this title', 409);

    if (newSlug !== oldSlug) {
      // Title changed -> the slug changed, so move everything keyed by it.
      for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
        const from = path.join(COVERS_DIR, oldSlug + ext);
        if (fs.existsSync(from)) fs.renameSync(from, path.join(COVERS_DIR, newSlug + ext));
      }
      for (const base of [MEDIA_DIR, THUMB_DIR, SHOTS_DIR]) {
        const from = path.join(base, oldSlug), to = path.join(base, newSlug);
        if (fs.existsSync(from) && !fs.existsSync(to)) fs.renameSync(from, to);
      }
      v.screenshots = v.screenshots.map(u => u.replace(`/uploads/shots/${oldSlug}/`, `/uploads/shots/${newSlug}/`));
      const shots = J('screenshots.json', {});
      const descs = J('descriptions.json', {});
      delete shots[oldSlug];
      delete descs[oldSlug];
      W('screenshots.json', shots);
      W('descriptions.json', descs);
      const details = J('game-details.json', {});
      if (details[oldSlug]) { details[newSlug] = details[oldSlug]; delete details[oldSlug]; W('game-details.json', details); }
    }
    applyToEntry(games[i], v);
    W('games.json', games);
    saveTexts(newSlug, v);
    saveGameDetails(newSlug, v);
    let coverError = null;
    if (v.coverUrl) { try { await downloadCover(newSlug, v.coverUrl); } catch (e) { coverError = e.message; } }
    loadCatalog();
    res.json({ ok: true, slug: newSlug, coverError });
  });

  // Removes the game from the catalog (and its cover/screenshots/description).
  // Files uploaded under media/<slug>/ are deliberately left on disk.
  app.delete('/api/admin/games/:slug', (req, res) => {
    const games = J('games.json', []);
    const i = games.findIndex(g => slugify(g.title) === req.params.slug);
    if (i < 0) return bad(res, 'Unknown game', 404);
    const slug = req.params.slug;
    games.splice(i, 1);
    W('games.json', games);
    const shots = J('screenshots.json', {});
    const descs = J('descriptions.json', {});
    delete shots[slug];
    delete descs[slug];
    W('screenshots.json', shots);
    W('descriptions.json', descs);
    const details = J('game-details.json', {});
    delete details[slug];
    W('game-details.json', details);
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
      const p = path.join(COVERS_DIR, slug + ext);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    fs.rmSync(path.join(SHOTS_DIR, slug), { recursive: true, force: true });
    loadCatalog();
    res.json({ ok: true });
  });

  // ----- image uploads (raw body; no extra dependency) -----
  function sniffImage(buf) {
    if (buf.length < 12) return null;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
    if (buf.slice(0, 4).toString('hex') === '89504e47') return '.png';
    if (buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return '.webp';
    return null;
  }
  const gameExists = slug => J('games.json', []).some(g => slugify(g.title) === slug);

  app.post('/api/admin/games/:slug/cover', rawBody('10mb'), (req, res) => {
    const slug = req.params.slug;
    if (!gameExists(slug)) return bad(res, 'Unknown game', 404);
    const ext = Buffer.isBuffer(req.body) && sniffImage(req.body);
    if (!ext) return bad(res, 'Cover must be a JPG, PNG or WEBP image');
    for (const e of ['.jpg', '.jpeg', '.png', '.webp']) {
      const p = path.join(COVERS_DIR, slug + e);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    fs.writeFileSync(path.join(COVERS_DIR, slug + ext), req.body);
    res.json({ ok: true, coverUrl: findCover(slug) });
  });

  app.post('/api/admin/games/:slug/screenshots', rawBody('15mb'), (req, res) => {
    const slug = req.params.slug;
    if (!gameExists(slug)) return bad(res, 'Unknown game', 404);
    const ext = Buffer.isBuffer(req.body) && sniffImage(req.body);
    if (!ext) return bad(res, 'Screenshot must be a JPG, PNG or WEBP image');
    const dir = path.join(SHOTS_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}-${uid()}${ext}`;
    fs.writeFileSync(path.join(dir, name), req.body);
    const url = `/uploads/shots/${slug}/${name}`;
    const shots = J('screenshots.json', {});
    const entry = shots[slug] || { matchedName: 'Uploaded', screenshots: [] };
    entry.screenshots.push(url);
    shots[slug] = entry;
    W('screenshots.json', shots);
    loadCatalog();
    res.json({ ok: true, url });
  });
  app.use('/uploads/shots', express.static(SHOTS_DIR));

  // Persian translation helper (same unofficial Google endpoint the
  // translate-descriptions script uses).
  app.post('/api/admin/translate', async (req, res) => {
    const text = str(req.body && req.body.text, 10000);
    if (!text) return bad(res, 'Nothing to translate');
    try {
      const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=fa&dt=t&q=' + encodeURIComponent(text));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      res.json({ text: j[0].map(s => s[0]).join('') });
    } catch (e) {
      bad(res, 'Translation failed: ' + e.message, 502);
    }
  });

  // ---------- subscription plans ----------
  const DEFAULT_PLANS = [
    {
      id: 'free', color: 'free', quotaGB: 0, featured: false,
      name_en: 'Free', name_fa: 'رایگان',
      price_en: 'Free', price_fa: 'رایگان',
      period_en: 'One-time · no expiry', period_fa: 'یک‌بار برای همیشه',
      features_en: ['Access to Watch Dogs 2, GTA V, Rocket League, Mortal Kombat 11 & Brawlhalla', 'Unlimited download size for these five games', 'Other games are not included in the free plan'],
      features_fa: ['دسترسی به Watch Dogs 2، GTA V، Rocket League، Mortal Kombat 11 و Brawlhalla', 'حجم دانلود این پنج بازی نامحدود است', 'بازی‌های دیگر در پلن رایگان قرار ندارند'],
      button_en: 'Get the free games', button_fa: 'دریافت بازی‌های رایگان', link: '#'
    },
    {
      id: 'bronze', color: 'bronze', quotaGB: 500, featured: false,
      name_en: 'Bronze', name_fa: 'برنز',
      price_en: '698,000 toman', price_fa: '۶۹۸٬۰۰۰ تومان',
      period_en: '/ 30 days', period_fa: '/ ۳۰ روز',
      features_en: ['Maximum download speed: 20 Mbps', 'Game download quota: 500 GB', 'PS4 and PS5 games', 'PS1, PS2, PS3, Xbox and Nintendo games are not available', 'Subtitle purchases are not available', 'DLC purchases are not available'],
      features_fa: ['حداکثر سرعت دانلود: ۲۰ مگابیت‌برثانیه', 'سهمیه دانلود بازی: ۵۰۰ گیگابایت', 'بازی‌های PS4 و PS5', 'بازی‌های PS1، PS2، PS3، Xbox و Nintendo در دسترس نیستند', 'خرید زیرنویس در این پلن در دسترس نیست', 'خرید DLC در این پلن در دسترس نیست'],
      button_en: 'Choose Bronze', button_fa: 'انتخاب برنز', link: '#'
    },
    {
      id: 'silver', color: 'silver', quotaGB: 1024, featured: false,
      name_en: 'Silver', name_fa: 'نقره‌ای',
      price_en: '1,198,000 toman', price_fa: '۱٬۱۹۸٬۰۰۰ تومان',
      period_en: '/ 30 days', period_fa: '/ ۳۰ روز',
      features_en: ['Maximum download speed: 20 Mbps', 'Game download quota: 1 TB', 'PS2, PS3, PS4 and PS5 games', 'Buy subtitles and DLC', 'Themes are not included', 'PS1, Xbox and Nintendo games are not included'],
      features_fa: ['حداکثر سرعت دانلود: ۲۰ مگابیت‌برثانیه', 'سهمیه دانلود بازی: ۱ ترابایت', 'بازی‌های PS2، PS3، PS4 و PS5', 'امکان خرید زیرنویس و DLC', 'تم‌ها شامل پلن نقره‌ای نیستند', 'بازی‌های PS1، Xbox و Nintendo شامل پلن نیستند'],
      button_en: 'Choose Silver', button_fa: 'انتخاب نقره‌ای', link: '#'
    },
    {
      id: 'gold', color: 'gold', quotaGB: 2252.8, featured: true,
      name_en: 'Gold', name_fa: 'طلایی',
      price_en: '2,098,000 toman', price_fa: '۲٬۰۹۸٬۰۰۰ تومان',
      period_en: '/ 30 days', period_fa: '/ ۳۰ روز',
      features_en: ['Maximum download speed: 40 Mbps', 'Game download quota: 2.2 TB', 'Xbox 360, PS1, PS2, PS3, PS4, PS5 and Nintendo games', 'Access to every game category', 'Buy subtitles and DLC', 'Themes included'],
      features_fa: ['حداکثر سرعت دانلود: ۴۰ مگابیت‌برثانیه', 'سهمیه دانلود بازی: ۲٫۲ ترابایت', 'بازی‌های Xbox 360، PS1، PS2، PS3، PS4، PS5 و Nintendo', 'دسترسی به همه دسته‌بندی‌های بازی', 'امکان خرید زیرنویس و DLC', 'تم‌ها همراه پلن طلایی'],
      button_en: 'Choose Gold', button_fa: 'انتخاب طلایی', link: '#'
    },
  ];
  const FREE_PLAN_FEATURES_EN = [
    'Access to Watch Dogs 2, GTA V, Rocket League, Mortal Kombat 11 & Brawlhalla',
    'Unlimited download size for these five games',
    'Other games are not included in the free plan',
  ];
  const FREE_PLAN_FEATURES_FA = [
    'دسترسی به Watch Dogs 2، GTA V، Rocket League، Mortal Kombat 11 و Brawlhalla',
    'حجم دانلود این پنج بازی نامحدود است',
    'بازی‌های دیگر در پلن رایگان قرار ندارند',
  ];
  const getPlans = () => {
    const stored = J('plans.json', null);
    const plans = Array.isArray(stored) && stored.length ? stored : DEFAULT_PLANS;
    const free = plans.find(plan => plan.id === 'free');
    if (!free) return plans;
    const featuresEn = FREE_PLAN_FEATURES_EN;
    const featuresFa = FREE_PLAN_FEATURES_FA;
    if (JSON.stringify(featuresEn) !== JSON.stringify(free.features_en) || JSON.stringify(featuresFa) !== JSON.stringify(free.features_fa)) {
      free.features_en = featuresEn;
      free.features_fa = featuresFa;
      W('plans.json', plans);
    }
    return plans;
  };
  app.get('/api/plans', (req, res) => res.json(getPlans()));

  app.put('/api/admin/plans', (req, res) => {
    const list = req.body && req.body.plans;
    if (!Array.isArray(list) || list.length < 1 || list.length > 8) return bad(res, 'Provide 1-8 plans');
    const seen = new Set();
    const out = [];
    for (const p of list) {
      const id = slugify(str(p.id || p.name_en, 40)) || uid();
      if (seen.has(id)) return bad(res, `Duplicate plan id "${id}"`);
      seen.add(id);
      const color = /^(bronze|silver|gold|free)$/.test(p.color) || /^#[0-9a-fA-F]{6}$/.test(p.color) ? p.color : 'bronze';
      const feats = a => (Array.isArray(a) ? a.map(x => str(x, 160)).filter(Boolean).slice(0, 12) : []);
      const link = str(p.link, 300);
      if (link && !/^(#|\/|https?:\/\/)/.test(link)) return bad(res, 'Plan link must start with /, # or http(s)://');
      out.push({
        id, color, featured: !!p.featured,
        quotaGB: id === 'free' ? 0 : Math.max(0, Math.min(10000000, Number(p.quotaGB) || 0)),
        name_en: str(p.name_en, 40), name_fa: str(p.name_fa, 40),
        price_en: id === 'free' ? 'Free' : str(p.price_en, 30), price_fa: id === 'free' ? 'رایگان' : str(p.price_fa, 30),
        period_en: id === 'free' ? 'One-time · no expiry' : str(p.period_en, 30), period_fa: id === 'free' ? 'یک‌بار برای همیشه' : str(p.period_fa, 30),
        features_en: feats(p.features_en), features_fa: feats(p.features_fa),
        button_en: str(p.button_en, 40), button_fa: str(p.button_fa, 40),
        link: link || '#',
      });
    }
    W('plans.json', out);
    res.json({ ok: true });
  });

  // ---------- customers ----------
  const STATUSES = ['active', 'paused', 'expired', 'cancelled'];
  function cleanCustomer(b, res) {
    const name = str(b.name, 80);
    if (!name) return bad(res, 'Name is required') && null;
    const email = str(b.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Email looks invalid') && null;
    const status = STATUSES.includes(b.status) ? b.status : 'active';
    const date = v => (/^\d{4}-\d{2}-\d{2}$/.test(str(v, 10)) ? str(v, 10) : '');
    return { name, email, phone: str(b.phone, 40), plan: str(b.plan, 40), status, start: date(b.start), end: date(b.end), notes: str(b.notes, 2000) };
  }
  app.get('/api/admin/customers', (req, res) => res.json(J('customers.json', [])));
  app.post('/api/admin/customers', (req, res) => {
    const c = cleanCustomer(req.body || {}, res);
    if (!c) return;
    const list = J('customers.json', []);
    const row = { id: uid(), created: new Date().toISOString(), ...c };
    list.push(row);
    W('customers.json', list);
    res.json(row);
  });
  app.put('/api/admin/customers/:id', (req, res) => {
    const c = cleanCustomer(req.body || {}, res);
    if (!c) return;
    const list = J('customers.json', []);
    const i = list.findIndex(x => x.id === req.params.id);
    if (i < 0) return bad(res, 'Unknown customer', 404);
    list[i] = { ...list[i], ...c };
    W('customers.json', list);
    res.json(list[i]);
  });
  app.delete('/api/admin/customers/:id', (req, res) => {
    const list = J('customers.json', []);
    const next = list.filter(x => x.id !== req.params.id);
    if (next.length === list.length) return bad(res, 'Unknown customer', 404);
    W('customers.json', next);
    res.json({ ok: true });
  });

  // ---------- site content (Learn / Copy / Payload / Footer / Contact info) ----------
  const CONTENT_KEYS = {
    home: ['heading_en','heading_fa','blurb_en','blurb_fa','body_en','body_fa'],
    learn: ['heading_en', 'heading_fa', 'blurb_en', 'blurb_fa', 'body_en', 'body_fa'],
    copy: ['heading_en', 'heading_fa', 'blurb_en', 'blurb_fa', 'body_en', 'body_fa'],
    payload: ['heading_en', 'heading_fa', 'blurb_en', 'blurb_fa', 'body_en', 'body_fa'],
    // shown on the Contact Us page AND in the footer
    contact: ['email', 'phone1', 'phone2', 'address_en', 'address_fa', 'hours_en', 'hours_fa'],
    // the footer's own texts and social accounts
    footer: ['tagline_en', 'tagline_fa', 'copyright_en', 'copyright_fa', 'instagram', 'whatsapp', 'telegram'],
  };
  // Only handles / numbers are stored (never free-form links), so a link in the footer
  // can only ever point at instagram.com, wa.me or t.me.
  const SOCIAL_CLEAN = {
    instagram: v => { v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/[/?#].*$/, '').replace(/^@/, ''); return v === '' || /^[A-Za-z0-9_.]{1,30}$/.test(v) ? v : null; },
    telegram: v => { v = v.replace(/^https?:\/\/(t|telegram)\.me\//i, '').replace(/[/?#].*$/, '').replace(/^@/, ''); return v === '' || /^[A-Za-z0-9_]{3,32}$/.test(v) ? v : null; },
    whatsapp: v => { v = v.replace(/^https?:\/\/(wa\.me|api\.whatsapp\.com\/send\?phone=)\//i, '').replace(/[^\d]/g, ''); return v === '' || /^\d{7,15}$/.test(v) ? v : null; },
  };
  const SOCIAL_LABEL = { instagram: 'Instagram username', telegram: 'Telegram username', whatsapp: 'WhatsApp number' };
  const hasLearnVideo = () => fs.existsSync(path.join(PUBLIC_DIR, 'learn-video.mp4'));

  app.get('/api/admin/storefront-health', (req, res) => {
    const games = J('games.json', []), purchases = J('purchases.json', []);
    const counts = new Map();
    const paidBuys = purchases.filter(p => Number(p.quotaBytesCharged) > 0 || p.price > 0);
    for (const p of paidBuys) counts.set(p.slug, (counts.get(p.slug) || 0) + 1);
    const issues = [];
    for (const g of games) {
      const slug = slugify(g.title), missing = [];
      if (!findCover(slug)) missing.push('Cover');
      const d = J('descriptions.json', {})[slug] || {};
      if (!d.description) missing.push('English description');
      if (!d.description_fa) missing.push('Persian description');
      if (!g.released) missing.push('Release date');
      const folder = path.join(MEDIA_DIR, slug);
      if (!fs.existsSync(folder) || fs.readdirSync(folder).length === 0) missing.push('Download files');
      if (missing.length) issues.push({ title: g.title, slug, missing });
    }
    res.json({ games: games.length, paidPurchases: paidBuys.length,
      quotaUsedGB: purchases.reduce((n,p) => n + (Number(p.quotaBytesCharged) || 0) / (1024 ** 3), 0),
      pendingRequests: J('requests.json', []).filter(r => ['new','working'].includes(r.status)).length,
      wishlistSaves: J('users.json', []).reduce((n,u) => n + (u.wishlist || []).length, 0),
      bestSellers: [...counts].sort((a,b) => b[1]-a[1]).slice(0,10).map(([slug,count]) => ({ title: games.find(g => slugify(g.title) === slug)?.title || slug, count })), issues });
  });
  app.get('/api/site-content', (req, res) => {
    const c = J('site-content.json', {});
    // the long legal texts are served by /api/legal/:doc, only the trust badge is needed everywhere
    if (c.legal) c.legal = { enamad: c.legal.enamad || null };
    res.json({ ...c, hasLearnVideo: hasLearnVideo() });
  });
  // Merges: only the sections present in the request are replaced, so the Learn & Content
  // tab and the Footer tab can be saved independently.
  app.put('/api/admin/site-content', (req, res) => {
    const body = req.body || {};
    const out = J('site-content.json', {});
    if (body.resetFooter) { delete out.footer; delete out.contact; W('site-content.json', out); return res.json({ ok: true, reset: true }); }
    for (const [section, keys] of Object.entries(CONTENT_KEYS)) {
      if (!body[section] || typeof body[section] !== 'object') continue;
      // keys that are not in the request keep their saved value (so one field can be changed alone)
      const next = { ...(out[section] || {}) };
      for (const k of keys) {
        if (!(k in body[section])) continue;
        let v = str(body[section][k], 5000);
        if (section === 'footer' && SOCIAL_CLEAN[k]) {
          v = SOCIAL_CLEAN[k](v);
          if (v === null) return bad(res, SOCIAL_LABEL[k] + ' looks invalid');
        }
        if (section === 'contact' && k === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return bad(res, 'Email looks invalid');
        if (section === 'contact' && /^phone[12]$/.test(k) && v && (v.replace(/\D/g, '').length < 5 || v.length > 30)) return bad(res, 'Phone number looks invalid');
        next[k] = v;
      }
      out[section] = next;
    }
    W('site-content.json', out);
    res.json({ ok: true });
  });
  app.post('/api/admin/learn-video', rawBody('500mb'), (req, res) => {
    const b = req.body;
    if (!Buffer.isBuffer(b) || b.length < 12 || b.slice(4, 8).toString() !== 'ftyp') return bad(res, 'Please upload an MP4 video');
    fs.writeFileSync(path.join(PUBLIC_DIR, 'learn-video.mp4'), b);
    res.json({ ok: true });
  });
  app.delete('/api/admin/learn-video', (req, res) => {
    const p = path.join(PUBLIC_DIR, 'learn-video.mp4');
    if (fs.existsSync(p)) fs.unlinkSync(p);
    res.json({ ok: true });
  });

  // ---------- problem reports (from the Report button on game pages) ----------
  const REPORT_REASONS = ['unrelated', 'age', 'broken', 'wrong', 'other'];
  app.post('/api/report', limiter(8, 60 * 60 * 1000), express.json({ limit: '20kb' }), (req, res) => {
    const b = req.body || {};
    if (b.website) return res.json({ ok: true }); // honeypot
    const slug = str(b.slug, 160);
    const game = J('games.json', []).find(g => slugify(g.title) === slug);
    if (!game) return bad(res, 'Unknown game');
    if (!REPORT_REASONS.includes(b.reason)) return bad(res, 'Pick a reason');
    const email = str(b.email, 120);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Email looks invalid');
    const list = J('reports.json', []);
    list.unshift({
      id: uid(), slug, game: game.title, reason: b.reason, details: str(b.details, 2000), email,
      date: new Date().toISOString(), status: 'open',
    });
    W('reports.json', list.slice(0, 1000));
    res.json({ ok: true });
  });
  app.get('/api/admin/reports', (req, res) => res.json(J('reports.json', [])));
  app.put('/api/admin/reports/:id', (req, res) => {
    const list = J('reports.json', []);
    const r = list.find(x => x.id === req.params.id);
    if (!r) return bad(res, 'Unknown report', 404);
    r.status = req.body && req.body.status === 'resolved' ? 'resolved' : 'open';
    W('reports.json', list);
    res.json(r);
  });
  app.delete('/api/admin/reports/:id', (req, res) => {
    W('reports.json', J('reports.json', []).filter(x => x.id !== req.params.id));
    res.json({ ok: true });
  });

  // ---------- contact messages ----------
  app.post('/api/contact', limiter(5, 60 * 60 * 1000), express.json({ limit: '20kb' }), (req, res) => {
    const b = req.body || {};
    if (b.website) return res.json({ ok: true }); // honeypot field: bots fill it
    const name = str(b.name, 80), email = str(b.email, 120), message = str(b.message, 3000);
    if (!name || !message) return bad(res, 'Name and message are required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Email looks invalid');
    const list = J('messages.json', []);
    list.unshift({ id: uid(), name, email, message, date: new Date().toISOString(), read: false });
    W('messages.json', list.slice(0, 500));
    res.json({ ok: true });
  });
  app.get('/api/admin/messages', (req, res) => res.json(J('messages.json', [])));
  app.put('/api/admin/messages/:id', (req, res) => {
    const list = J('messages.json', []);
    const m = list.find(x => x.id === req.params.id);
    if (!m) return bad(res, 'Unknown message', 404);
    m.read = !!(req.body && req.body.read);
    W('messages.json', list);
    res.json(m);
  });
  app.delete('/api/admin/messages/:id', (req, res) => {
    const list = J('messages.json', []);
    W('messages.json', list.filter(x => x.id !== req.params.id));
    res.json({ ok: true });
  });

  app.get('/api/admin/feedback', (req, res) => res.json(J('feedback.json', [])));
  app.put('/api/admin/feedback/:id', (req, res) => {
    const list = J('feedback.json', []);
    const row = list.find(item => item.id === req.params.id);
    if (!row) return bad(res, 'Unknown feedback', 404);
    row.status = ['new', 'reviewing', 'planned', 'closed'].includes(req.body && req.body.status) ? req.body.status : row.status || 'new';
    row.updated = new Date().toISOString();
    W('feedback.json', list);
    res.json(row);
  });

  return { J, Jro: (f, d) => store.peek(f, d), Upd: (f, id, fn) => store.update(f, id, fn), ById: (f, id) => store.byId(f, id), W, str, bad, uid, limiter, getPlans, readCookie, isAdmin, isRootAdmin, startAdminSession, revokeAdminSessions, autoAddRequestedGame };
};
