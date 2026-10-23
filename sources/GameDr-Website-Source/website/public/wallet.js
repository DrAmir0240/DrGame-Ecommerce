// Download quota widgets shared by every page: the usage chip in the
// header and the quota card at the top of the hamburger menu. Loaded after
// i18n.js (needs getLang / t).
(function () {
  const fmt = n => Number(n || 0).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US');
  const formatQuota = gb => {
    const value = Number(gb || 0);
    if (value >= 1024) return (value / 1024).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 }) + ' TB';
    return value.toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 }) + ' GB';
  };
  window.drtFormatQuota = formatQuota;
  const chips = [];
  const accountLinks = [];
  function ensureProfileGlyph(root, name) {
    let icon = root.querySelector('svg');
    if (icon) return icon;
    icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.7');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<circle cx="12" cy="8" r="3.5"></circle><path d="M4.5 21v-2a7.5 7.5 0 0 1 15 0v2"></path>';
    root.insertBefore(icon, name || null);
    return icon;
  }
  function loadAvatarCatalog() {
    if (window.DRT_AVATAR_CATALOG) return Promise.resolve();
    if (window._drtAvatarCatalogLoad) return window._drtAvatarCatalogLoad;
    window._drtAvatarCatalogLoad = new Promise(resolve => {
      const script = document.createElement('script');
      script.src = '/avatar-catalog.js';
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
    return window._drtAvatarCatalogLoad;
  }

  function quotaIcon() {
    const badge = document.createElement('span');
    badge.className = 'quota-icon';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = 'GB';
    return badge;
  }

  function makeChip() {
    const a = document.createElement('a');
    a.className = 'wallet-chip';
    a.href = '/tokens.html';
    a.title = t('wallet_tokens');
    const amt = document.createElement('span');
    amt.className = 'wallet-amt';
    a.append(quotaIcon(), amt);
    return { root: a, amt };
  }

  function makeDrawerCard() {
    const a = document.createElement('a');
    a.className = 'drawer-wallet';
    a.href = '/tokens.html';
    const text = document.createElement('span');
    text.className = 'drawer-wallet-text';
    const label = document.createElement('small');
    label.textContent = t('wallet_tokens');
    const amt = document.createElement('strong');
    text.append(label, amt);
    const more = document.createElement('span');
    more.className = 'drawer-wallet-more';
    more.textContent = t('wallet_buy_more') + ' →';
    a.append(quotaIcon(), text, more);
    return { root: a, amt, more };
  }

  function paint(user) {
    window.DRT_USER = user;
    for (const c of chips) {
      c.amt.textContent = user ? formatQuota(user.downloadQuotaGB) : t('wallet_login');
      c.root.classList.toggle('wallet-guest', !user);
      if (c.more) c.more.textContent = (user ? t('wallet_buy_more') : t('wallet_login')) + ' →';
      c.root.setAttribute('href', user ? '/tokens.html' : '/account.html?next=' + encodeURIComponent(location.pathname + location.search));
    }
    for (const account of accountLinks) {
      const name = user ? String(user.name || user.username || '').trim() : '';
      account.name.textContent = name;
      account.name.hidden = !name;
      account.root.classList.toggle('profile-signed-in', !!name);
      let avatar = account.root.querySelector('.profile-avatar');
      if (user && window.drtAvatarImageUrl) {
        // The avatar is the signed-in profile control. Remove the guest glyph
        // instead of leaving it beside the selected avatar.
        const icon = account.root.querySelector('svg');
        if (icon) icon.remove();
        if (!avatar) {
          avatar = document.createElement('img');
          avatar.className = 'profile-avatar';
          avatar.alt = '';
          avatar.width = 28;
          avatar.height = 28;
          avatar.loading = 'lazy';
          avatar.referrerPolicy = 'no-referrer';
          avatar.onerror = () => { avatar.onerror = null; avatar.src = window.DRT_PLAYSTATION_DEFAULT_AVATAR || '/avatar-fallback.svg'; };
          account.root.insertBefore(avatar, account.name);
        }
        avatar.src = window.drtAvatarImageUrl(user.avatarId);
      } else {
        if (avatar) avatar.remove();
        ensureProfileGlyph(account.root, account.name);
      }
      const label = name ? t('account_heading') + ': ' + name : t('account_heading');
      account.root.setAttribute('aria-label', label);
      account.root.title = label;
    }
  }
  window.refreshWallet = paint;

  function mount() {
    const topbar = document.querySelector('.topbar');
    if (topbar) {
      const profile = topbar.querySelector('.profile-icon');
      if (profile) {
        let name = profile.querySelector('.profile-name');
        if (!name) {
          name = document.createElement('bdi');
          name.className = 'profile-name';
          name.dir = 'auto';
          name.hidden = true;
          profile.append(name);
        }
        accountLinks.push({ root: profile, name });
      }
      const chip = makeChip();
      const actions = topbar.querySelector('.header-actions') || topbar;
      const toggle = actions.querySelector('#theme-toggle') || actions.querySelector('#lang-toggle');
      actions.insertBefore(chip.root, toggle || null);
      chips.push(chip);
    }
    const drawer = document.getElementById('drawer');
    if (drawer) {
      const card = makeDrawerCard();
      const header = drawer.querySelector('.drawer-header');
      drawer.insertBefore(card.root, header ? header.nextSibling : drawer.firstChild);
      chips.push(card);
    }
    paint(null);
    loadAvatarCatalog().then(() => fetch('/api/account/me', { credentials: 'same-origin' }))
      .then(r => r.json())
      .then(d => { window.DRT_MODE = d.mode; paint(d.user); document.dispatchEvent(new CustomEvent('drt:user', { detail: d })); })
      .catch(() => { /* offline: keep the logged-out chip */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();

// ---------------------------------------------------------------------------
// Discount code box, price helpers, invitation link capture and the viewing tracker.
// ---------------------------------------------------------------------------
(function () {
  const FA = '\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9';
  const lang = () => (typeof getLang === 'function' ? getLang() : 'en');
  const num = n => Number(n || 0).toLocaleString(lang() === 'fa' ? 'fa-IR' : 'en-US');
  const fill = (text, vars) => String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));

  // "$10" / "\u06F1\u06F0 \u062F\u0644\u0627\u0631" with N% off - the same maths as the server (promo.js)
  window.drtDiscountLabel = function (label, pct) {
    const m = String(label || '').match(/[\d\u06F0-\u06F9][\d\u06F0-\u06F9,\u066C.\u066B]*/);
    if (!m || !pct) return label;
    const raw = m[0], persian = /[\u06F0-\u06F9]/.test(raw);
    const plain = raw.replace(/[\u06F0-\u06F9]/g, d => FA.indexOf(d)).replace(/[,\u066C]/g, '').replace('\u066B', '.');
    const x = parseFloat(plain);
    if (!isFinite(x)) return label;
    const v = Math.round(x * (100 - pct)) / 100;
    let s = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    if (/[,\u066C]/.test(raw) && v >= 1000) s = Number(s).toLocaleString('en-US');
    if (persian) s = s.replace(/\d/g, d => FA[d]).replace('.', '\u066B');
    return String(label).replace(raw, s);
  };
  // does the customer's active code apply to this kind of purchase? ('files' | 'packs' | 'plans')
  window.drtCodeApplies = kind => !!(window.DRT_CODE && window.DRT_CODE.type === 'percent' && (window.DRT_CODE.appliesTo || []).includes(kind));

  // keep window.DRT_CODE in step with the logged-in user and tell the page when it changes
  function setCode(c) {
    const before = JSON.stringify(window.DRT_CODE || null);
    window.DRT_CODE = c || null;
    if (JSON.stringify(window.DRT_CODE) !== before) document.dispatchEvent(new CustomEvent('drt:code'));
  }
  const baseRefresh = window.refreshWallet;
  window.refreshWallet = function (user) { baseRefresh(user); setCode(user ? user.activeCode : null); };
  document.addEventListener('drt:user', e => setCode(e.detail.user ? e.detail.user.activeCode : null));

  // ---- the box ----
  window.drtCodeBox = function (container) {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
    container.classList.add('code-box');
    container.replaceChildren();
    const title = el('div', 'code-title', '\uD83C\uDFF7 ' + t('code_title'));
    const row = el('div', 'code-row');
    const input = el('input', 'contact-input');
    input.placeholder = t('code_placeholder');
    input.maxLength = 40;
    input.autocomplete = 'off';
    input.setAttribute('dir', 'ltr');
    input.spellcheck = false;
    const btn = el('button', 'code-btn', t('code_apply'));
    btn.type = 'button';
    row.append(input, btn);
    const msg = el('div', 'code-msg');
    const active = el('div', 'code-active');
    container.append(title, row, msg, active);

    function say(text, kind) { msg.textContent = text || ''; msg.className = 'code-msg ' + (kind || ''); }
    function paintActive() {
      active.replaceChildren();
      const c = window.DRT_CODE;
      if (!c) { active.style.display = 'none'; return; }
      const names = (c.appliesTo || []).map(k => t('code_what_' + k));
      const what = names.length > 1 ? names.slice(0, -1).join(lang() === 'fa' ? '، ' : ', ') + t('code_and') + names[names.length - 1] : names.join('');
      active.style.display = '';
      const line = el('span', '', fill(t('code_active'), { code: c.code, percent: num(c.percent), what }) + ' ');
      const small = el('small', '', t('code_used_next'));
      const rm = el('button', 'code-remove', t('code_remove'));
      rm.type = 'button';
      rm.addEventListener('click', async () => {
        const r = await fetch('/api/account/code', { method: 'DELETE', credentials: 'same-origin', headers: { 'X-Requested-With': 'drt' } });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.user) window.refreshWallet(d.user);
      });
      active.append(line, rm, el('br'), small);
    }
    async function apply() {
      say('');
      const code = input.value.trim();
      if (!code) return;
      if (!window.DRT_USER) { say(t('code_login'), 'err'); setTimeout(() => { location.href = '/account.html?next=' + encodeURIComponent(location.pathname + location.search); }, 900); return; }
      btn.disabled = true;
      try {
        const res = await fetch('/api/account/code/apply', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || t('code_error'));
        input.value = '';
        window.refreshWallet(d.user);
      } catch (e) { say(e.message, 'err'); }
      btn.disabled = false;
    }
    btn.addEventListener('click', apply);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    document.addEventListener('drt:code', paintActive);
    document.addEventListener('drt:user', paintActive);
    paintActive();
  };

  // ---- invitation link: remember ?invite=CODE so the sign-up form can use it ----
  try {
    const inv = new URLSearchParams(location.search).get('invite');
    if (inv) localStorage.setItem('gv_invite', inv.trim().toUpperCase().slice(0, 40));
  } catch (e) { /* storage blocked */ }

  // ---- viewing tracker (feeds the "For you" suggestions) ----
  window.DrtTrack = function (slug, type) {
    try {
      const o = JSON.parse(localStorage.getItem('gv_seen') || '{}');
      const e = o[slug] || { v: 0, f: 0, t: 0 };
      if (type === 'file') e.f++; else e.v++;
      e.t = Date.now();
      o[slug] = e;
      const keep = Object.entries(o).sort((a, b) => b[1].t - a[1].t).slice(0, 60);
      localStorage.setItem('gv_seen', JSON.stringify(Object.fromEntries(keep)));
    } catch (err) { /* storage blocked: the server still counts it */ }
    fetch('/api/track', { method: 'POST', credentials: 'same-origin', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, type: type === 'file' ? 'file' : 'view' }) }).catch(() => {});
  };
  // "slug:weight,slug:weight" of the games this browser DOWNLOADED files for (looking at a page does not count), for /api/for-you
  window.DrtSeenParam = function () {
    try {
      const o = JSON.parse(localStorage.getItem('gv_seen') || '{}');
      return Object.entries(o).map(([s, e]) => [s, e.f || 0]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]).slice(0, 15).map(x => x[0] + ':' + x[1]).join(',');
    } catch (e) { return ''; }
  };
})();
