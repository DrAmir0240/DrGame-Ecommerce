// Telegram announcements: tells your channel when a new game or new file is uploaded.
//
// Setup (see SETUP.txt): create a bot with @BotFather, add it as an ADMIN of your channel, then put
//   TELEGRAM_BOT_TOKEN=...   and   TELEGRAM_CHAT_ID=@yourchannel   in .env.
// Without a token nothing is sent: messages are written to data/telegram-outbox.json instead.
//
// admin.js / wallet.js announce through app.emit('game-added', slug) and app.emit('file-added', slug, name).
const fs = require('fs');
const path = require('path');

module.exports = function mountTelegram(app, h, { COVERS_DIR, getGames, slugify }) {
  const { J, W, str, bad } = h;
  const BASE = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
  const DEBOUNCE_MS = parseInt(process.env.TELEGRAM_DELAY_MS, 10) || 15000;

  const DEFAULT_TPL = {
    en: '🎮 New on Dr Game: {game}\n{files}\n\n{link}',
    fa: '🎮 جدید در دکتر گیم: {game}\n{files}\n\n{link}',
  };
  const settings = () => Object.assign({ enabled: true, onGame: true, onFile: true, lang: 'both', siteUrl: '', templateEn: '', templateFa: '' }, J('telegram.json', {}));
  const token = () => process.env.TELEGRAM_BOT_TOKEN || '';
  const chat = () => process.env.TELEGRAM_CHAT_ID || '';
  const live = () => !!(token() && chat());

  const outbox = () => J('telegram-outbox.json', []);
  function log(entry) {
    const list = outbox();
    list.unshift(Object.assign({ at: new Date().toISOString() }, entry));
    W('telegram-outbox.json', list.slice(0, 100));
  }

  function coverPath(slug) {
    for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) { const p = path.join(COVERS_DIR, slug + ext); if (fs.existsSync(p)) return p; }
    return null;
  }

  async function tg(method, form) {
    const r = await fetch(`${BASE}/bot${token()}/${method}`, { method: 'POST', body: form });
    let d = {}; try { d = await r.json(); } catch (e) { /* not json */ }
    if (!r.ok || d.ok === false) throw new Error(d.description || ('Telegram error ' + r.status));
    return d;
  }

  async function deliver(text, cover) {
    if (!live()) { log({ sent: false, reason: 'no token / chat id yet', text }); return { sent: false }; }
    try {
      const f = new FormData();
      f.set('chat_id', chat());
      if (cover) {
        f.set('caption', text.slice(0, 1000));
        f.set('photo', new Blob([fs.readFileSync(cover)]), path.basename(cover));
        await tg('sendPhoto', f);
      } else {
        f.set('text', text);
        await tg('sendMessage', f);
      }
      log({ sent: true, text });
      return { sent: true };
    } catch (e) { log({ sent: false, error: e.message, text }); return { sent: false, error: e.message }; }
  }

  function render(slug, files) {
    const s = settings();
    const game = getGames().find(g => slugify(g.title) === slug);
    if (!game) return null;
    const base = (s.siteUrl || '').replace(/\/$/, '');
    const link = base ? `${base}/game.html?slug=${encodeURIComponent(slug)}` : '';
    const fill = tpl => tpl.replace('{game}', game.title)
      .replace('{files}', files.length ? files.map(n => '• ' + n).join('\n') : '')
      .replace('{link}', link).replace(/\n{3,}/g, '\n\n').trim();
    const parts = [];
    if (s.lang !== 'fa') parts.push(fill(s.templateEn || DEFAULT_TPL.en));
    if (s.lang !== 'en') parts.push(fill(s.templateFa || DEFAULT_TPL.fa));
    return { text: parts.join('\n\n——\n\n'), cover: coverPath(slug) };
  }

  // Several files uploaded for one game in a row become ONE message.
  const pending = new Map();
  function queue(slug, file) {
    let p = pending.get(slug);
    if (!p) { p = { files: new Set(), timer: null }; pending.set(slug, p); }
    if (file) p.files.add(file);
    clearTimeout(p.timer);
    p.timer = setTimeout(async () => {
      pending.delete(slug);
      const m = render(slug, [...p.files]);
      if (m) await deliver(m.text, m.cover);
    }, DEBOUNCE_MS);
  }
  app.on('game-added', slug => { const s = settings(); if (s.enabled && s.onGame) queue(slug, null); });
  app.on('file-added', (slug, name) => { const s = settings(); if (s.enabled && s.onFile) queue(slug, name); });

  // ---------- admin ----------
  app.get('/api/admin/telegram', (req, res) => {
    res.json({ settings: settings(), defaults: DEFAULT_TPL, live: live(), hasToken: !!token(), hasChat: !!chat(), outbox: outbox().slice(0, 15) });
  });
  app.put('/api/admin/telegram', (req, res) => {
    const b = req.body || {}, s = settings();
    for (const k of ['enabled', 'onGame', 'onFile']) if (typeof b[k] === 'boolean') s[k] = b[k];
    if (['en', 'fa', 'both'].includes(b.lang)) s.lang = b.lang;
    if (b.siteUrl !== undefined) {
      const u = str(b.siteUrl, 200);
      if (u && !/^https?:\/\/[^\s]+$/i.test(u)) return bad(res, 'Site address must start with http:// or https://');
      s.siteUrl = u;
    }
    if (b.templateEn !== undefined) s.templateEn = str(b.templateEn, 800) === DEFAULT_TPL.en ? '' : str(b.templateEn, 800);
    if (b.templateFa !== undefined) s.templateFa = str(b.templateFa, 800) === DEFAULT_TPL.fa ? '' : str(b.templateFa, 800);
    W('telegram.json', s);
    res.json({ ok: true, settings: s });
  });
  app.post('/api/admin/telegram/test', async (req, res) => {
    const r = await deliver('✅ Dr Game test message. Telegram announcements work!', null);
    res.json(r);
  });
  // manual "Announce" for a game that already exists (sends right away, with all its files listed)
  app.post('/api/admin/telegram/announce/:slug', async (req, res) => {
    const slug = req.params.slug;
    let files = [];
    try { files = fs.readdirSync(path.join(__dirname, 'media', slug)).filter(n => !n.endsWith('.part')).slice(0, 12); } catch (e) { /* no files yet */ }
    const m = render(slug, files);
    if (!m) return bad(res, 'Unknown game', 404);
    res.json(await deliver(m.text, m.cover));
  });
  app.delete('/api/admin/telegram/outbox', (req, res) => { W('telegram-outbox.json', []); res.json({ ok: true }); });

  return { settings, pendingCount: () => pending.size };
};
