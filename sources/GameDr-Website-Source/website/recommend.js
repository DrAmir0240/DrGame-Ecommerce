// "For you": game suggestions on the home page, and the small tracker that feeds them.
//
// Tracking: ONLY downloads count. Opening a game page does not change the suggestions; every file download counts
// (page views are still stored for the popularity ranking). A browser keeps its own list (localStorage) and sends it along; for a
// logged-in customer the server also stores the history, so it follows them to other devices.
//
// Scoring: for every game the visitor has looked at (a "seed"), every other game gets points
//   same series (e.g. Uncharted 1..4)  +6
//   same studio / company               +4   (the "company" field of the game, see admin)
//   same category                       +2
//   at least one shared platform        +0.5
// multiplied by how much the visitor used the seed. The five best are shown with the reason.
// With no history (or too little signal) the five most popular games are shown instead.
const express = require('express');
const { supportsTwoPlayers } = require('./game-features');

const FRANCHISE_STOP = new Set(['the', 'a', 'an']);
const norm = s => String(s || '').toLowerCase().replace(/[™®©’']/g, '').replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9ö\- ]+/g, ' ').replace(/\s+/g, ' ').trim();
function tokens(title) {
  const t = norm(title).split(' ').filter(Boolean);
  while (t.length > 1 && FRANCHISE_STOP.has(t[0])) t.shift();
  return t;
}
// two titles are the same series when they share their first two words ("god of", "resident evil"),
// or their first word when it is long and distinctive ("uncharted", "assassins", "borderlands")
function sameSeries(a, b) {
  const ta = tokens(a), tb = tokens(b);
  if (ta.length < 1 || tb.length < 1) return false;
  if (ta.length > 1 && tb.length > 1 && ta[0] === tb[0] && ta[1] === tb[1]) return true;
  return ta[0] === tb[0] && ta[0].length >= 8;
}

module.exports = function mountRecommend(app, h, core, ctx) {
  const { J, W, str, bad, limiter } = h;
  const json = express.json({ limit: '5kb' });
  const { sessionUser, users, saveUsers } = core;
  const { getGames, getGameDetails = () => ({}), gameCard, slugify } = ctx;

  app.get('/api/best-sellers', (req, res) => {
    const counts = new Map();
    for (const purchase of J('purchases.json', [])) {
      if (purchase.price > 0) counts.set(purchase.slug, (counts.get(purchase.slug) || 0) + 1);
    }
    res.json(getGames().filter(g => counts.has(g.slug))
      .sort((a, b) => counts.get(b.slug) - counts.get(a.slug) || a.title.localeCompare(b.title))
      .slice(0, 10).map(gameCard));
  });

  const stats = () => J('game-stats.json', {});
  const popularity = (g, st) => {
    const s = st[g.slug] || {};
    return (g.famousRank ? 100 - g.famousRank * 3 : (g.famous ? 20 : 0)) + (s.views || 0) + 3 * (s.files || 0);
  };

  // Homepage genre shelves follow the same alphabetical category order as the
  // menu, with each shelf ranked by the store's existing popularity score.
  app.get('/api/category-shelves', (req, res) => {
    const games = getGames();
    const st = stats();
    const categories = [...new Set(games.map(g => g.category).filter(Boolean))].sort();
    res.set('Cache-Control', 'public, max-age=30');
    res.json(categories.map(category => ({
      category,
      games: games.filter(g => g.category === category)
        .sort((a, b) => popularity(b, st) - popularity(a, st) || a.title.localeCompare(b.title))
        .slice(0, 20)
        .map(gameCard)
    })));
  });

  app.get('/api/home-feature-shelves', (req, res) => {
    const games = getGames();
    const st = stats();
    const rankedCards = matches => matches
      .sort((a, b) => popularity(b, st) - popularity(a, st) || a.title.localeCompare(b.title))
      .slice(0, 20)
      .map(gameCard);
    const twoPlayerGames = games.filter(game => supportsTwoPlayers((getGameDetails(game.slug) || {}).players));
    const vrGames = games.filter(game => (getGameDetails(game.slug) || {}).vr === true);

    res.set('Cache-Control', 'public, max-age=30');
    res.json([
      { id: 'two-player', games: rankedCards(twoPlayerGames) },
      { id: 'vr', games: rankedCards(vrGames) },
    ]);
  });

  // ---------- tracking ----------
  const trackLimit = limiter(400, 10 * 60 * 1000);
  app.post('/api/track', trackLimit, json, (req, res) => {
    const slug = str(req.body && req.body.slug, 160);
    const type = req.body && req.body.type === 'file' ? 'file' : 'view';
    if (!getGames().some(g => g.slug === slug)) return bad(res, 'Unknown game', 404);
    const st = stats();
    const row = st[slug] || { views: 0, files: 0 };
    if (type === 'file') row.files++; else row.views++;
    st[slug] = row;
    W('game-stats.json', st);
    const user = sessionUser(req);
    if (user) {
      h.Upd('users.json', user.id, u => {
        const hist = u.history || (u.history = []);
        let e = hist.find(x => x.slug === slug);
        if (!e) { e = { slug, v: 0, f: 0, t: 0 }; hist.push(e); }
        if (type === 'file') e.f++; else e.v++;
        e.t = Date.now();
        if (hist.length > 300) hist.sort((a, b) => b.t - a.t).length = 300;
      });
    }
    res.json({ ok: true });
  });

  // ---------- recommendations ----------
  function parseSeen(q) {
    const out = new Map();
    for (const part of String(q || '').split(',').slice(0, 40)) {
      const [slug, w] = part.split(':');
      const weight = Math.min(30, Math.max(0, parseFloat(w) || 1));
      if (/^[a-z0-9-]{1,160}$/.test(slug) && weight > 0) out.set(slug, (out.get(slug) || 0) + weight);
    }
    return out;
  }

  function recommend(seeds) {
    const games = getGames();
    const bySlug = new Map(games.map(g => [g.slug, g]));
    const st = stats();
    const scores = new Map();   // slug -> { score, reason }
    for (const [slug, w] of seeds) {
      const s = bySlug.get(slug);
      if (!s) continue;
      for (const g of games) {
        if (g.slug === slug || seeds.has(g.slug)) continue;
        let pts = 0, reason = null;
        if (sameSeries(s.title, g.title)) { pts += 6; reason = { type: 'series', seed: s.title }; }
        if (s.company && g.company && s.company.toLowerCase() === g.company.toLowerCase()) { pts += 4; reason = reason || { type: 'company', seed: s.title, company: s.company }; }
        if (s.category === g.category) { pts += 2; reason = reason || { type: 'genre', seed: s.title, category: s.category }; }
        if (s.platforms.some(p => g.platforms.includes(p))) pts += 0.5;
        if (pts < 2) continue;   // needs at least a shared category
        const cur = scores.get(g.slug) || { score: 0, reason: null, best: 0 };
        cur.score += pts * Math.min(w, 10);
        if (pts > cur.best) { cur.best = pts; cur.reason = reason; }
        scores.set(g.slug, cur);
      }
    }
    // a little popularity breaks ties, so good games win among equals
    const ranked = [...scores.entries()]
      .map(([slug, v]) => ({ g: bySlug.get(slug), score: v.score + popularity(bySlug.get(slug), st) * 0.02, reason: v.reason }))
      .sort((a, b) => b.score - a.score);
    return ranked.slice(0, 5);
  }

  app.get('/api/for-you', (req, res) => {
    const seeds = parseSeen(req.query.seen);
    // logged-in customers: add the history kept on the server
    const user = sessionUser(req);
    if (user) {
      const me = h.ById('users.json', user.id);
      for (const e of (me && me.history) || []) {
        const w = e.f || 0;   // only downloaded files count, not page views
        if (w > 0) seeds.set(e.slug, Math.min(30, Math.max(seeds.get(e.slug) || 0, w)));
      }
    }
    const games = getGames();
    const st = stats();
    let picks = seeds.size ? recommend(seeds) : [];
    let mode = picks.length ? 'personal' : 'popular';
    if (picks.length < 5) {
      const have = new Set(picks.map(p => p.g.slug));
      const fill = games.filter(g => !have.has(g.slug) && !seeds.has(g.slug))
        .map(g => ({ g, score: popularity(g, st), reason: null }))
        .sort((a, b) => b.score - a.score).slice(0, 5 - picks.length);
      picks = picks.concat(fill);
    }
    res.json({ mode, games: picks.map(p => ({ ...gameCard(p.g), reason: p.reason })) });
  });

  // ---------- related games (bottom of every game page) ----------
  // Same scoring as "For you", but the only seed is the game being looked at: same series, same studio, same genre.
  app.get('/api/games/:slug/related', (req, res) => {
    const games = getGames();
    const me = games.find(g => g.slug === req.params.slug);
    if (!me) return bad(res, 'Unknown game', 404);
    let picks = recommend(new Map([[me.slug, 3]]));
    if (picks.length < 5) {   // too few matches: fill up with the most popular games of the same category, then of all
      const st = stats(), have = new Set(picks.map(p => p.g.slug).concat(me.slug));
      const pool = games.filter(g => !have.has(g.slug)).map(g => ({ g, score: popularity(g, st) + (g.category === me.category ? 1e6 : 0), reason: null }))
        .sort((a, b) => b.score - a.score).slice(0, 5 - picks.length);
      picks = picks.concat(pool);
    }
    res.set('Cache-Control', 'public, max-age=30');
    res.json(picks.map(p => ({ ...gameCard(p.g), reason: p.reason })));
  });

  return { sameSeries };
};
module.exports.sameSeries = sameSeries;
