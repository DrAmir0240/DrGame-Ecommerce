// "Request a game or subtitle": customers tell us what they would like to see.
//
// Every request is stored in data/requests.json. When several people ask for the same game
// (same kind of request, same normalised name) while the first request is still open, they are
// added to that request and its counter goes up, so the admin sees what is most wanted.
const express = require('express');

module.exports = function mountRequests(app, h, core) {
  const { J, W, str, bad, uid, limiter } = h;
  const autoAddRequestedGame = h.autoAddRequestedGame;
  const json = express.json({ limit: '20kb' });
  const { sessionUser, notify } = core;

  const TYPES = ['game', 'subtitle', 'other'];
  const STATUSES = ['new', 'working', 'done', 'rejected'];
  const requests = () => J('requests.json', []);
  const norm = s => String(s || '').toLowerCase().replace(/[™®©’']/g, '').replace(/[^a-z0-9؀-ۿ]+/g, ' ').trim();
  const sendLimit = limiter(8, 60 * 60 * 1000);
  const autoAddQueue = [];
  const queuedIds = new Set();
  let activeImports = 0;

  function notifyGameAvailable(request, slug, title, status) {
    if (!notify || !request || request.type !== 'game' || !slug) return;
    const gameTitle = title || request.game || slug;
    for (const requester of request.requesters || []) {
      if (!requester.userId) continue;
      notify(requester.userId, {
        type: 'request',
        dedupeKey: 'requested-game-available:' + request.id,
        title_en: 'Your requested game is available',
        title_fa: 'بازی درخواستی شما در سایت موجود شد',
        body_en: gameTitle + (status === 'already-present' ? ' is already available on the website.' : ' has been added to the website. Download files will appear as soon as they are ready.') + ' Open it at /game.html?slug=' + slug + '.',
        body_fa: 'بازی «' + gameTitle + '» ' + (status === 'already-present' ? 'از قبل در سایت موجود است.' : 'به سایت اضافه شد. فایل‌های دانلود پس از آماده‌شدن نمایش داده می‌شوند.') + ' از این مسیر باز کنید: /game.html?slug=' + slug,
      });
    }
    request.gameAvailableNotifiedAt = request.gameAvailableNotifiedAt || new Date().toISOString();
  }

  function markGameAvailable(slug, title) {
    const list = requests();
    const normalizedTitle = norm(title || '');
    const normalizedSlug = norm(String(slug || '').replace(/-/g, ' '));
    let changed = false;
    for (const request of list) {
      if (request.type !== 'game') continue;
      const matches = request.slug === slug || norm(request.game) === normalizedTitle || norm(request.game) === normalizedSlug;
      if (!matches) continue;
      request.slug = slug;
      request.autoAddStatus = request.autoAddStatus === 'added' ? 'added' : 'already-present';
      request.customerUpdate = request.autoAddStatus === 'added'
        ? 'The game page is live. Download files will appear when they are ready.'
        : 'This game is already listed on the website.';
      request.updated = new Date().toISOString();
      notifyGameAvailable(request, slug, title || request.game, request.autoAddStatus);
      changed = true;
    }
    if (changed) W('requests.json', list);
  }

  function updateAutoAdd(requestId, result) {
    const list = requests();
    const request = list.find(item => item.id === requestId);
    if (!request) return;
    request.autoAddStatus = result.status || 'needs-review';
    request.autoAddMessage = str(result.message, 240);
    request.autoAddSuggestions = Array.isArray(result.suggestions) ? result.suggestions.map(x => str(x, 120)).filter(Boolean).slice(0, 4) : [];
    request.autoAddWarnings = Array.isArray(result.warnings) ? result.warnings.map(x => str(x, 240)).filter(Boolean).slice(0, 8) : [];
    if (result.slug) request.slug = result.slug;
    if (request.autoAddStatus === 'added') {
      request.status = request.status === 'new' ? 'working' : request.status;
      request.customerUpdate = 'The game page is live. Download files will appear when they are ready.';
      notifyGameAvailable(request, request.slug, result.title || request.game, 'added');
    } else if (request.autoAddStatus === 'already-present') {
      request.customerUpdate = 'This game is already listed on the website.';
      notifyGameAvailable(request, request.slug, result.title || request.game, 'already-present');
    }
    request.updated = new Date().toISOString();
    W('requests.json', list);
  }

  async function processAutoAdd(requestId) {
    const list = requests();
    const request = list.find(item => item.id === requestId);
    if (!request || request.type !== 'game' || request.autoAddStatus === 'added' || request.autoAddStatus === 'already-present') return;
    request.autoAddStatus = 'processing';
    request.updated = new Date().toISOString();
    W('requests.json', list);
    try {
      const result = autoAddRequestedGame
        ? await autoAddRequestedGame(request.game)
        : { status: 'needs-review', message: 'Automatic import is unavailable. Open Quick Add to review this request.' };
      updateAutoAdd(requestId, result || { status: 'needs-review', message: 'Automatic import did not return a result.' });
    } catch (error) {
      updateAutoAdd(requestId, { status: 'needs-review', message: 'Automatic import failed. Open Quick Add to finish this request manually.' });
    }
  }

  function drainAutoAddQueue() {
    while (activeImports < 2 && autoAddQueue.length) {
      const requestId = autoAddQueue.shift();
      queuedIds.delete(requestId);
      activeImports++;
      processAutoAdd(requestId).finally(() => {
        activeImports--;
        drainAutoAddQueue();
      });
    }
  }

  function enqueueAutoAdd(requestId) {
    if (queuedIds.has(requestId)) return;
    queuedIds.add(requestId);
    autoAddQueue.push(requestId);
    drainAutoAddQueue();
  }

  // A server restart may interrupt a lookup after it was marked as processing.
  // Resume only unfinished jobs; the importer checks the catalog again first,
  // so retrying cannot create a duplicate game.
  setImmediate(() => {
    for (const request of requests()) {
      if (request.type === 'game' && ['queued', 'processing'].includes(request.autoAddStatus)) enqueueAutoAdd(request.id);
    }
  });

  app.post('/api/requests', json, (req, res) => {
    const b = req.body || {};
    if (b.website) return res.json({ ok: true });                       // honeypot field: bots fill it
    const type = TYPES.includes(b.type) ? b.type : 'game';
    const game = str(b.game, 120), details = str(b.details, 1500);
    if (!game && type !== 'other') return bad(res, 'Please write the name of the game.');
    if (!game && !details) return bad(res, 'Please tell us what you need.');
    const user = sessionUser(req);
    const contact = str(b.contact, 120) || (user ? user.email : '');
    if (!contact) return bad(res, 'Please leave an email, a Telegram username or a phone number so we can reach you.');
    let allowed = false;
    sendLimit(req, res, () => { allowed = true; });
    if (!allowed) return;

    const list = requests();
    const who = { userId: user ? user.id : null, name: user ? user.name : '', contact, date: new Date().toISOString() };
    const key = type + '|' + norm(game);
    const same = game && list.find(r => r.key === key && (r.status === 'new' || r.status === 'working'));
    if (same) {
      // the same person asking twice does not count twice
      const already = same.requesters.some(q => (who.userId && q.userId === who.userId) || (!who.userId && q.contact.toLowerCase() === contact.toLowerCase()));
      if (!already) { same.requesters.push(who); same.count = same.requesters.length; }
      if (details && !same.details.includes(details)) same.details = (same.details ? same.details + '\n---\n' : '') + details;
      const shouldQueueImport = type === 'game' && !['queued', 'processing', 'added', 'already-present', 'needs-review'].includes(same.autoAddStatus);
      if (shouldQueueImport) same.autoAddStatus = 'queued';
      W('requests.json', list);
      if (shouldQueueImport) enqueueAutoAdd(same.id);
      if (!shouldQueueImport && same.autoAddStatus === 'already-present') notifyGameAvailable(same, same.slug, same.game, 'already-present');
      return res.json({ ok: true, merged: true, count: same.count, autoAddQueued: type === 'game' && (shouldQueueImport || ['queued', 'processing'].includes(same.autoAddStatus)) });
    }
    const record = {
      id: uid(), key, type, game, details, slug: /^[a-z0-9-]{1,160}$/.test(b.slug || '') ? b.slug : '',
      status: 'new', note: '', count: 1, requesters: [who], created: who.date, updated: who.date,
      ...(type === 'game' ? { autoAddStatus: 'queued', autoAddMessage: '', autoAddSuggestions: [], autoAddWarnings: [] } : {}),
    };
    list.unshift(record);
    W('requests.json', list.slice(0, 3000));
    if (type === 'game') enqueueAutoAdd(record.id);
    res.json({ ok: true, merged: false, count: 1, autoAddQueued: type === 'game' });
  });

  app.on('game-added', (slug, title) => {
    markGameAvailable(slug, title);
  });


  app.get('/api/account/requests', (req, res) => {
    const user = sessionUser(req);
    if (!user) return bad(res, 'Not logged in', 401);
    res.set('Cache-Control', 'no-store').json(requests()
      .filter(r => r.requesters.some(q => q.userId === user.id))
      .map(r => ({ id: r.id, game: r.game, type: r.type, status: r.status, autoAddStatus: r.autoAddStatus || '', created: r.created, updated: r.updated, slug: r.slug, customerUpdate: r.customerUpdate || '' })));
  });
  // ---------- admin ----------
  app.get('/api/admin/requests', (req, res) => {
    const order = { new: 0, working: 1, done: 2, rejected: 3 };
    res.json(requests().slice().sort((a, b) => (order[a.status] - order[b.status]) || (b.count - a.count) || (b.created.localeCompare(a.created))));
  });
  app.put('/api/admin/requests/:id', (req, res) => {
    const list = requests();
    const r = list.find(x => x.id === req.params.id);
    if (!r) return bad(res, 'Unknown request', 404);
    const b = req.body || {};
    if (b.status !== undefined) {
      if (!STATUSES.includes(b.status)) return bad(res, 'Unknown status');
      r.status = b.status;
    }
    if (b.note !== undefined) r.note = str(b.note, 500);
    if (b.customerUpdate !== undefined) r.customerUpdate = str(b.customerUpdate, 500);

    if (r.type === 'game' && b.status === 'done' && r.slug) notifyGameAvailable(r, r.slug, r.game, 'added');

    r.updated = new Date().toISOString();
    W('requests.json', list);
    res.json(r);
  });
  app.delete('/api/admin/requests/:id', (req, res) => {
    const list = requests();
    if (!list.some(r => r.id === req.params.id)) return bad(res, 'Unknown request', 404);
    W('requests.json', list.filter(r => r.id !== req.params.id));
    res.json({ ok: true });
  });

  return { openCount: () => requests().filter(r => r.status === 'new').length };
};
