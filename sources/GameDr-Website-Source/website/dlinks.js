// Short-lived download links.
//
// Files are NOT downloadable from /media any more. A download button asks POST /api/download-link,
// the server checks the customer may have the file (free, bought or admin) and answers with
//   /dl/<token>   -  a signed link that works for 5 minutes (DOWNLOAD_LINK_MINUTES in .env).
// After that the link answers "expired" and the customer has to press Download again.
// Someone watching the traffic only ever sees links that die after a few minutes.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');

module.exports = function mountDownloadLinks(app, h, { MEDIA_DIR, canDownload }) {
  const { limiter, bad, DATA_DIR } = h;
  const TTL_MS = Math.max(1, parseFloat(process.env.DOWNLOAD_LINK_MINUTES) || 5) * 60 * 1000;

  // signing secret: .env DOWNLOAD_SECRET, or a random one created once and kept in data/
  let secret = process.env.DOWNLOAD_SECRET || '';
  if (!secret) {
    const file = path.join(DATA_DIR || path.join(__dirname, 'data'), '.download-secret');
    try { secret = fs.readFileSync(file, 'utf8').trim(); } catch (e) { /* first run */ }
    if (secret.length < 32) { secret = crypto.randomBytes(32).toString('hex'); fs.writeFileSync(file, secret); }
  }
  const b64 = s => Buffer.from(s).toString('base64url');
  const sign = body => crypto.createHmac('sha256', secret).update(body).digest('base64url');

  function makeToken(slug, file) {
    const body = b64(JSON.stringify({ s: slug, f: file, e: Date.now() + TTL_MS, n: crypto.randomBytes(4).toString('hex') }));
    return body + '.' + sign(body);
  }
  function readToken(token) {
    const [body, sig] = String(token || '').split('.');
    if (!body || !sig) return null;
    const want = Buffer.from(sign(body)), got = Buffer.from(sig);
    if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
    try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); } catch (e) { return null; }
  }
  const safePath = (slug, file) => {
    const p = path.join(MEDIA_DIR, String(slug), String(file));
    return p.startsWith(MEDIA_DIR + path.sep) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : null;
  };

  app.post('/api/download-link', limiter(120, 10 * 60 * 1000), express.json({ limit: '4kb' }), (req, res) => {
    const b = req.body || {};
    let slug = String(b.slug || ''), file = String(b.file || '');
    if (b.url) {   // accept the plain /media/<game>/<file> address too
      const m = /^\/media\/([^/]+)\/([^/?#]+)/.exec(String(b.url));
      if (m) { try { slug = decodeURIComponent(m[1]); file = decodeURIComponent(m[2]); } catch (e) { /* bad escape */ } }
    }
    if (!safePath(slug, file)) return bad(res, 'File not found', 404);
    const allowed = canDownload(req, slug, file);
    if (!allowed.ok) return res.status(allowed.status).json({ error: allowed.message });
    res.setHeader('Cache-Control', 'no-store');
    res.json({ url: '/dl/' + makeToken(slug, file), expiresInSeconds: Math.round(TTL_MS / 1000) });
  });

  app.get('/dl/:token', (req, res) => {
    const t = readToken(req.params.token);
    if (!t) return res.status(403).send('Invalid download link.');
    if (Date.now() > t.e) return res.status(410).send('This download link has expired. Go back to the page and press Download again.');
    const p = safePath(t.s, t.f);
    if (!p) return res.status(404).send('Not found');
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.download(p, t.f);
  });
};
