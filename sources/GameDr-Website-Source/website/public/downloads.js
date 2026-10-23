// Download tracker: shows a "Downloads" panel with live progress, speed and
// time left while a file downloads, with Cancel / Retry.
//
// Browsers don't expose their own download progress to a page, so clicks on
// download buttons are handled here with a streaming fetch:
//   * Chrome / Edge (secure context): the file streams straight to the disk
//     location the customer picks, so even multi-GB files use almost no memory.
//   * Other browsers: files up to LIMIT are collected in memory and saved when
//     complete; bigger ones fall back to the browser's own download (no progress).
(function () {
  const LIMIT = 800 * 1024 * 1024; // in-memory fallback limit
  const HISTORY_KEY = 'gv_downloads';
  const PROGRESS_KEY = 'gv_download_progress';
  const PROGRESS_TTL = 30 * 60 * 1000;
  const DEMO_SLUG = 'the-last-of-us-part-ii';
  const items = []; // newest first
  let panel, list, fab, fabCount, drawerShortcut, drawerShortcutTitle, drawerShortcutHint, drawerShortcutBadge, open = false;
  let progressChannel = null;
  let lastProgressWrite = 0;
  let demoTimer = null;
  const coverCache = new Map();
  const coverRequests = new Map();

  const fa = () => (typeof getLang === 'function' && getLang() === 'fa');
  const TXT = {
    en: { title: 'Downloads', empty: 'No downloads yet.', cancel: 'Cancel', retry: 'Retry', close: 'Clear finished',
      starting: 'Starting…', downloading: 'Downloading', done: 'Download complete', failed: 'Download failed', cancelled: 'Cancelled',
      browser: 'Handled by your browser (file too large to track here)', left: 'left', of: 'of', saveAs: 'Choose where to save…', history: 'Earlier downloads',
      hide: 'Hide', open: 'Downloads' },
    fa: { title: 'دانلودها', empty: 'هنوز دانلودی نیست.', cancel: 'لغو', retry: 'تلاش دوباره', close: 'پاک‌کردن تمام‌شده‌ها',
      starting: 'در حال شروع…', downloading: 'در حال دانلود', done: 'دانلود کامل شد', failed: 'دانلود ناموفق بود', cancelled: 'لغو شد',
      browser: 'توسط مرورگر انجام می‌شود (حجم فایل برای نمایش پیشرفت زیاد است)', left: 'مانده', of: 'از', saveAs: 'محل ذخیره را انتخاب کنید…', history: 'دانلودهای قبلی',
      hide: 'بستن', open: 'دانلودها' },
  };
  const t = k => TXT[fa() ? 'fa' : 'en'][k];
  const num = n => Number(n).toLocaleString(fa() ? 'fa-IR' : 'en-US');

  function readProgress() {
    try {
      const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      const now = Date.now();
      for (const key of Object.keys(data)) {
        if (!data[key] || now - Number(data[key].updatedAt || 0) > PROGRESS_TTL) delete data[key];
      }
      return data;
    } catch (e) { return {}; }
  }

  function writeProgress(it, force = false) {
    if (!it || !it.slug) return;
    const now = Date.now();
    if (!force && now - lastProgressWrite < 120) return;
    lastProgressWrite = now;
    const data = readProgress();
    data[it.slug] = {
      slug: it.slug, name: it.name, game: it.game, state: it.state, mode: it.mode || '',
      loaded: Number(it.loaded) || 0, total: Number(it.total) || 0, updatedAt: now,
    };
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(data)); } catch (e) { /* optional cross-page state */ }
    try { progressChannel && progressChannel.postMessage(data[it.slug]); } catch (e) { /* optional */ }
    refreshProgressOverlays();
  }

  function currentPageSlug() {
    return new URLSearchParams(location.search).get('slug') || '';
  }

  function isDedicatedPage() {
    return location.pathname === '/downloads.html';
  }

  function progressFor(slug) {
    const state = readProgress()[slug];
    return state && state.state === 'active' ? state : null;
  }

  // A local-only preview makes it easy to review the poster treatment without
  // starting a real download. It is activated only with demoDownload=1 on the
  // Last of Us Part II page and never runs for normal download links.
  function startDemoDownload() {
    const isDemoSurface = currentPageSlug() === DEMO_SLUG || location.pathname === '/' || location.pathname === '/index.html' || isDedicatedPage();
    if (!isDemoSurface || demoTimer) return;
    const total = 84 * 1024 * 1024 * 1024;
    let it = items.find(item => item.slug === DEMO_SLUG && item.state === 'active');
    if (!it) {
      it = { slug: DEMO_SLUG, name: 'The Last of Us Part II', game: 'The Last of Us Part II', state: 'active', mode: 'demo', loaded: Math.floor(total * 0.42), total, speed: 0, demo: true };
      items.unshift(it);
    } else {
      it.mode = 'demo';
      it.demo = true;
      it.total = total;
      it.name = it.name || 'The Last of Us Part II';
      it.game = it.game || it.name;
    }
    writeProgress(it, true);
    // Keep the game poster unobstructed so its progress bar is visible. The
    // full Downloads page remains available from the menu and the floating
    // download control can still open the compact panel.
    setOpen(!isDedicatedPage() && location.pathname !== '/game.html');
    demoTimer = setInterval(() => {
      if (it.state !== 'active') { clearInterval(demoTimer); demoTimer = null; return; }
      // Stop short of completion so the demo remains available while it is being reviewed.
      it.loaded = Math.min(Math.floor(it.total * 0.88), it.loaded + Math.floor(it.total * 0.008));
      it.speed = Math.floor(it.total * 0.008);
      writeProgress(it, true);
      render();
    }, 1000);
  }

  function refreshProgressOverlays() {
    const targets = document.querySelectorAll('[data-download-game-slug]');
    for (const target of targets) {
      const slug = target.dataset.downloadGameSlug;
      const state = progressFor(slug);
      let overlay = target.querySelector('.download-progress-overlay');
      if (!state) {
        if (overlay) overlay.remove();
        continue;
      }
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'download-progress-overlay';
        overlay.setAttribute('aria-live', 'polite');
        overlay.innerHTML = '<div class="download-progress-copy"><strong class="download-progress-percent"></strong><span class="download-progress-label"></span></div><div class="download-progress-track"><span class="download-progress-fill"></span></div>';
        target.appendChild(overlay);
      }
      const percent = state.total > 0 ? Math.min(100, Math.floor(state.loaded / state.total * 100)) : null;
      const fill = overlay.querySelector('.download-progress-fill');
      const percentLabel = overlay.querySelector('.download-progress-percent');
      const statusLabel = overlay.querySelector('.download-progress-label');
      percentLabel.textContent = percent == null ? '…' : num(percent) + '%';
      statusLabel.textContent = state.name || t('downloading');
      fill.style.width = percent == null ? '38%' : percent + '%';
      fill.classList.toggle('indeterminate', percent == null);
      overlay.classList.toggle('is-indeterminate', percent == null);
    }
  }

  function fmtBytes(b) {
    if (b >= 1024 ** 3) return num((b / 1024 ** 3).toFixed(2)) + ' GB';
    if (b >= 1024 ** 2) return num((b / 1024 ** 2).toFixed(1)) + ' MB';
    if (b >= 1024) return num(Math.round(b / 1024)) + ' KB';
    return num(b) + ' B';
  }
  function fmtTime(sec) {
    if (!isFinite(sec) || sec < 0) return '';
    if (sec < 60) return num(Math.ceil(sec)) + (fa() ? ' ثانیه' : 's');
    const m = Math.floor(sec / 60), s = Math.ceil(sec % 60);
    if (m < 60) return num(m) + (fa() ? ' دقیقه ' : 'm ') + num(s) + (fa() ? ' ثانیه' : 's');
    return num(Math.floor(m / 60)) + (fa() ? ' ساعت ' : 'h ') + num(m % 60) + (fa() ? ' دقیقه' : 'm');
  }

  function readHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (e) { return []; }
  }
  function pushHistory(it) {
    try {
      const h = readHistory();
      h.unshift({ name: it.name, game: it.game, size: it.total || it.loaded, date: Date.now() });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(0, 15)));
    } catch (e) { /* storage blocked: history is optional */ }
  }

  // ---------- UI ----------
  function mountDrawerShortcut() {
    const drawer = document.querySelector('.drawer');
    if (!drawer || drawer.querySelector('.drawer-downloads')) return;
    const shortcut = document.createElement('a');
    shortcut.href = '/downloads.html';
    shortcut.className = 'drawer-link drawer-downloads';
    shortcut.innerHTML = '<span class="drawer-link-icon drawer-downloads-icon" aria-hidden="true">↓</span><span class="drawer-link-text"><strong></strong><small></small></span><span class="drawer-downloads-badge" hidden></span><span class="drawer-link-arrow">&rarr;</span>';
    drawerShortcut = shortcut;
    drawerShortcutTitle = shortcut.querySelector('strong');
    drawerShortcutHint = shortcut.querySelector('small');
    drawerShortcutBadge = shortcut.querySelector('.drawer-downloads-badge');
    const gamepad = drawer.querySelector('.drawer-gamepad');
    const tools = drawer.querySelector('.drawer-tools-group');
    if (gamepad) gamepad.after(shortcut);
    else if (tools) tools.before(shortcut);
    else drawer.appendChild(shortcut);
    updateDrawerShortcut();
  }

  function updateDrawerShortcut() {
    if (!drawerShortcut) return;
    const active = items.find(item => item.state === 'active');
    drawerShortcutTitle.textContent = t('open');
    if (active) {
      const percent = active.total ? Math.min(100, Math.floor(active.loaded / active.total * 100)) : null;
      drawerShortcutHint.textContent = (active.name || active.game || t('downloading')) + (percent == null ? '' : ' · ' + num(percent) + '%');
      drawerShortcutBadge.textContent = percent == null ? '…' : num(percent) + '%';
      drawerShortcutBadge.hidden = false;
      drawerShortcut.classList.add('is-active');
    } else {
      drawerShortcutHint.textContent = fa() ? 'مشاهده دانلودهای فعال و قبلی' : 'View active and completed downloads';
      drawerShortcutBadge.textContent = '';
      drawerShortcutBadge.hidden = true;
      drawerShortcut.classList.remove('is-active');
    }
  }

  function hydrateProgressItems() {
    const data = readProgress();
    for (const state of Object.values(data)) {
      if (!state || state.state !== 'active' || !state.slug || items.some(item => item.slug === state.slug)) continue;
      items.push({
        slug: state.slug,
        name: state.name || state.game || state.slug,
        game: state.game || state.name || state.slug,
        state: 'active',
        mode: state.mode || '',
        loaded: Number(state.loaded) || 0,
        total: Number(state.total) || 0,
        speed: 0,
        demo: state.mode === 'demo',
      });
    }
  }

  function ensureUi() {
    if (panel) return;
    hydrateProgressItems();
    mountDrawerShortcut();
    fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'dl-fab';
    fab.style.display = 'none';
    fab.innerHTML = '<span class="dl-fab-icon">↓</span><span class="dl-fab-text"></span><span class="dl-fab-count"></span>';
    fabCount = fab.querySelector('.dl-fab-count');
    fab.addEventListener('click', () => setOpen(!open));

    panel = document.createElement('div');
    panel.className = 'dl-panel';
    panel.id = 'downloads-panel';
    panel.style.display = 'none';
    panel.setAttribute('role', 'region');
    const head = document.createElement('div');
    head.className = 'dl-head';
    const title = document.createElement('strong');
    title.className = 'dl-title';
    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'dl-link';
    clear.addEventListener('click', () => {
      for (let i = items.length - 1; i >= 0; i--) if (items[i].state !== 'active') items.splice(i, 1);
      render();
    });
    const hide = document.createElement('button');
    hide.type = 'button';
    hide.className = 'dl-x';
    hide.textContent = '×';
    hide.addEventListener('click', () => setOpen(false));
    head.append(title, clear, hide);
    list = document.createElement('div');
    list.className = 'dl-list';
    panel.append(head, list);
    panel._title = title;
    panel._clear = clear;
    document.body.append(panel, fab);
    try {
      if ('BroadcastChannel' in window) {
        progressChannel = new BroadcastChannel(PROGRESS_KEY);
        progressChannel.addEventListener('message', event => {
          if (event.data && event.data.slug) refreshProgressOverlays();
          render();
        });
      }
    } catch (e) { progressChannel = null; }
    window.addEventListener('storage', event => {
      if (event.key === PROGRESS_KEY) { refreshProgressOverlays(); render(); }
    });
    window.addEventListener('resize', refreshProgressOverlays, { passive: true });
    window.addEventListener('online', refreshProgressOverlays, { passive: true });
    // Watch added cards, but do not observe every attribute mutation on the
    // page. The homepage creates hundreds of cards; attribute observation made
    // each card trigger a full-document scan and could lock up the renderer.
    // Card pages call refreshProgressOverlays explicitly after mounting their
    // poster. A document-wide observer is intentionally avoided here because
    // it can repeatedly rescan a large homepage while an overlay is inserted.
    const demoRequested = new URLSearchParams(location.search).get('demoDownload') === '1';
    const savedDemo = items.some(item => item.slug === DEMO_SLUG && item.mode === 'demo' && item.state === 'active');
    if (demoRequested || savedDemo) startDemoDownload();
    mountDrawerShortcut();
    refreshProgressOverlays();
    // closing the tab mid-download would lose it: ask first
    window.addEventListener('beforeunload', e => {
      if (items.some(i => i.state === 'active' && i.mode !== 'native' && i.mode !== 'demo')) { e.preventDefault(); e.returnValue = ''; }
    });
  }
  function setOpen(v) {
    open = v;
    ensureUi();
    panel.style.display = open ? '' : 'none';
    render();
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function coverUrl(url) {
    if (!url) return '';
    // Game pages may transform remote image URLs for their responsive sizes.
    // The downloads page only needs the stored cover path, so keep the URL
    // untouched unless the shared helper is available.
    try { return typeof coverSrc === 'function' ? coverSrc(url, 180) : url; } catch (e) { return url; }
  }

  function requestCover(slug) {
    if (!slug) return Promise.resolve('');
    // The preview download is always the Last of Us Part II, so its local
    // cover can be painted immediately while the API resolves other games.
    if (slug === DEMO_SLUG && !coverCache.has(slug)) coverCache.set(slug, '/covers/the-last-of-us-part-ii.png');
    if (coverCache.has(slug)) return Promise.resolve(coverCache.get(slug));
    if (coverRequests.has(slug)) return coverRequests.get(slug);
    const request = fetch('/api/games/' + encodeURIComponent(slug) + '/files', { credentials: 'same-origin' })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const url = data && data.coverUrl ? data.coverUrl : '';
        if (url) coverCache.set(slug, url);
        return url;
      })
      .catch(() => '')
      .finally(() => coverRequests.delete(slug));
    coverRequests.set(slug, request);
    return request;
  }

  function addPagePoster(row, it) {
    row.classList.add('dl-page-item');
    const poster = el('div', 'dl-page-poster');
    const placeholder = el('span', 'dl-page-poster-placeholder', (it.name || it.game || 'Game').slice(0, 2).toUpperCase());
    const image = document.createElement('img');
    image.alt = it.name || it.game || 'Game poster';
    image.loading = 'lazy';
    image.decoding = 'async';
    image.hidden = true;
    image.addEventListener('load', () => { image.hidden = false; placeholder.hidden = true; });
    image.addEventListener('error', () => { image.hidden = true; placeholder.hidden = false; });
    // Paint the known local preview cover immediately. Other games are
    // resolved from the game API below and keep the initials placeholder
    // until their cover has loaded.
    const immediate = it.slug === DEMO_SLUG ? '/covers/the-last-of-us-part-ii.png' : coverCache.get(it.slug);
    if (immediate) {
      image.src = coverUrl(immediate);
      image.hidden = false;
      placeholder.hidden = true;
    }
    poster.append(image, placeholder);

    const body = el('div', 'dl-page-item-body');
    while (row.firstChild) body.appendChild(row.firstChild);
    row.append(poster, body);
    requestCover(it.slug).then(url => {
      if (url) image.src = coverUrl(url);
    });
    return row;
  }

  function itemRow(it) {
    const row = el('div', 'dl-item ' + it.state);
    const top = el('div', 'dl-top');
    const name = el('div', 'dl-name', it.name);
    name.title = it.name;
    top.appendChild(name);
    const actions = el('div', 'dl-actions');
    if (it.state === 'active' && it.mode !== 'native' && it.abort) {
      const b = el('button', 'dl-link', t('cancel'));
      b.type = 'button';
      b.addEventListener('click', () => it.abort && it.abort());
      actions.appendChild(b);
    } else if (it.state === 'failed' || it.state === 'cancelled') {
      const b = el('button', 'dl-link', t('retry'));
      b.type = 'button';
      b.addEventListener('click', () => start(it.url, it.name, it.game, it));
      actions.appendChild(b);
    }
    top.appendChild(actions);
    row.appendChild(top);
    if (it.game) row.appendChild(el('div', 'dl-game', it.game));

    const bar = el('div', 'dl-bar');
    const fill = el('div', 'dl-fill');
    const pct = it.total ? Math.min(100, (it.loaded / it.total) * 100) : (it.state === 'done' ? 100 : 0);
    fill.style.width = (it.state === 'done' ? 100 : pct) + '%';
    if (it.state === 'active' && !it.total) fill.classList.add('indeterminate');
    bar.appendChild(fill);
    row.appendChild(bar);

    let info;
    if (it.state === 'active') {
      if (it.mode === 'native') info = t('browser');
      else if (!it.loaded) info = it.waiting ? t('saveAs') : t('starting');
      else {
        const parts = [num(Math.floor(pct)) + '%', fmtBytes(it.loaded) + (it.total ? ' ' + t('of') + ' ' + fmtBytes(it.total) : '')];
        if (it.speed) parts.push(fmtBytes(it.speed) + '/s');
        if (it.speed && it.total) parts.push(fmtTime((it.total - it.loaded) / it.speed) + ' ' + t('left'));
        info = parts.join(' · ');
      }
    } else if (it.state === 'done') info = '✓ ' + t('done') + ' · ' + fmtBytes(it.total || it.loaded);
    else if (it.state === 'cancelled') info = t('cancelled');
    else info = t('failed') + (it.error ? ': ' + it.error : '');
    row.appendChild(el('div', 'dl-info', info));
    return row;
  }

  let renderQueued = false;
  function render() {
    if (!panel) return;
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(() => {
      renderQueued = false;
      panel._title.textContent = t('title');
      panel._clear.textContent = t('close');
      const active = items.filter(i => i.state === 'active').length;
      fab.style.display = isDedicatedPage() ? 'none' : (items.length ? '' : 'none');
      fab.querySelector('.dl-fab-text').textContent = t('open');
      fabCount.textContent = active ? num(active) : '';
      fabCount.style.display = active ? '' : 'none';
      fab.classList.toggle('busy', active > 0);
      updateDrawerShortcut();
      const pageList = document.getElementById('downloads-page-list');
      if (pageList) {
        const rows = items.map(it => addPagePoster(itemRow(it), it));
        const hist = readHistory().filter(h => !items.some(i => i.state === 'done' && i.name === h.name && Date.now() - h.date < 5000));
        if (!items.length) rows.push(el('div', 'dl-empty', t('empty')));
        if (hist.length) {
          rows.push(el('div', 'dl-sub', t('history')));
          for (const h of hist.slice(0, 12)) {
            const r = el('div', 'dl-hist');
            r.append(el('span', 'dl-hist-name', '✓ ' + h.name), el('span', 'dl-hist-size', fmtBytes(h.size || 0)));
            rows.push(r);
          }
        }
        pageList.replaceChildren(...rows);
      }
      if (!open) return;
      const rows = items.map(itemRow);
      const hist = readHistory().filter(h => !items.some(i => i.state === 'done' && i.name === h.name && Date.now() - h.date < 5000));
      if (!items.length) rows.push(el('div', 'dl-empty', t('empty')));
      if (hist.length) {
        rows.push(el('div', 'dl-sub', t('history')));
        for (const h of hist.slice(0, 6)) {
          const r = el('div', 'dl-hist');
          r.append(el('span', 'dl-hist-name', '✓ ' + h.name), el('span', 'dl-hist-size', fmtBytes(h.size || 0)));
          rows.push(r);
        }
      }
      list.replaceChildren(...rows);
    });
  }

  // ---------- download engine ----------
  function saveBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  // ask the server for a fresh 5-minute link for a /media/... address
  async function freshLink(url) {
    const r = await fetch('/api/download-link', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: new URL(url, location.href).pathname }) });
    let d = {}; try { d = await r.json(); } catch (e) { /* not json */ }
    if (!r.ok) throw new Error(d.error || 'Could not start the download');
    return d.url;
  }

  async function start(url, name, game, existing, slugOverride) {
    ensureUi();
    const pageSlug = slugOverride || (existing && existing.slug) || currentPageSlug();
    try { if (pageSlug && window.DrtTrack && !existing) DrtTrack(pageSlug, 'file'); } catch (e) { /* tracking is optional */ }
    let it = existing;
    if (it) { Object.assign(it, { state: 'active', loaded: 0, total: 0, speed: 0, error: '', mode: '', slug: pageSlug }); }
    else { it = { url, name, game, slug: pageSlug, state: 'active', loaded: 0, total: 0, speed: 0, error: '', mode: '' }; items.unshift(it); }
    const ctrl = new AbortController();
    it.abort = () => { it.cancelled = true; ctrl.abort(); };
    it.cancelled = false;
    writeProgress(it, true);
    setOpen(true);

    let writable = null;
    try {
      // Chromium: ask where to save first, while the click is still a user gesture
      if (window.showSaveFilePicker && window.isSecureContext) {
        it.waiting = true;
        render();
        try {
          const handle = await window.showSaveFilePicker({ suggestedName: name });
          writable = await handle.createWritable();
        } catch (e) {
          if (e && e.name === 'AbortError') { it.state = 'cancelled'; it.waiting = false; render(); return; }
          writable = null; // picker not allowed here: use the in-memory fallback
        }
        it.waiting = false;
      }
      const signed = new URL(url, location.href).pathname.startsWith('/media/') ? await freshLink(url) : url;
      const res = await fetch(signed, { signal: ctrl.signal, credentials: 'same-origin' });
      if (!res.ok) {
        let msg = res.status + '';
        try { msg = (await res.text()).slice(0, 120) || msg; } catch (e) { /* keep status */ }
        throw new Error(msg);
      }
      it.total = parseInt(res.headers.get('Content-Length'), 10) || 0;

      if (!writable && it.total > LIMIT) {
        // too big to hold in memory and no streaming-to-disk support
        try { ctrl.abort(); } catch (e) { /* ignore */ }
        it.mode = 'native';
        writeProgress(it, true);
        render();
        const a = document.createElement('a');
        a.href = signed;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }

      const reader = res.body.getReader();
      const chunks = [];
      const samples = [[performance.now(), 0]];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (writable) await writable.write(value); else chunks.push(value);
        it.loaded += value.length;
        const now = performance.now();
        samples.push([now, it.loaded]);
        while (samples.length > 2 && now - samples[0][0] > 3000) samples.shift();
        const dt = (now - samples[0][0]) / 1000;
        if (dt > 0.25) it.speed = (it.loaded - samples[0][1]) / dt;
        writeProgress(it);
        render();
      }
      if (writable) { await writable.close(); writable = null; }
      else saveBlob(new Blob(chunks), name);
      if (!it.total) it.total = it.loaded;
      it.state = 'done';
      it.speed = 0;
      pushHistory(it);
      writeProgress(it, true);
    } catch (e) {
      if (writable) { try { await writable.abort(); } catch (err) { /* ignore */ } }
      if (it.cancelled || (e && e.name === 'AbortError')) it.state = 'cancelled';
      else { it.state = 'failed'; it.error = e && e.message ? e.message : ''; }
      writeProgress(it, true);
    }
    render();
  }

  // ---------- hook the download buttons ----------
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.download-btn');
    if (!a || a.classList.contains('unlock-btn')) return;
    if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey) return;
    const href = a.getAttribute('href');
    if (!href || href === '#' || !fetch) return;
    e.preventDefault();
    const card = a.closest('.card');
    const name = (card && card.querySelector('.card-title') ? card.querySelector('.card-title').textContent : decodeURIComponent(href.split('/').pop())).trim();
    const gameEl = document.getElementById('game-title');
    start(a.href, name, gameEl ? gameEl.textContent : '', null);
  });

  window.DrDownloads = { start, freshLink, count: () => items.length, refreshProgressOverlays };
  document.addEventListener('DOMContentLoaded', ensureUi);
})();
