// Subscription discount codes and referral codes. Referral signup only links accounts;
// sales commissions are calculated separately from paid, delivered subscriptions.
//
//   Codes (data/discount-codes.json), created by the admin:
//     type "percent": takes N% off a subscription plan.
//                     The customer "activates" it once; the next matching purchase uses it.
//     type "gift":    legacy type, rejected and retained only for old records.
//     A code can be limited to one customer (assignedTo), to a number of total uses,
//     a number of uses per customer, and an expiry date.
//
//   Referrals: signup alone never awards a commission. An invitation code records the sponsor chain.
const crypto = require('crypto');

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

// "$10" / "10 USD" / "۱۰ دلار" / "1,200,000 تومان" -> same label with N% taken off
function discountLabel(label, pct) {
  const m = String(label || '').match(/[\d۰-۹][\d۰-۹,٬.٫]*/);
  if (!m || !pct) return label;
  const raw = m[0];
  const persian = /[۰-۹]/.test(raw);
  const plain = raw.replace(/[۰-۹]/g, d => FA_DIGITS.indexOf(d)).replace(/[,٬]/g, '').replace('٫', '.');
  const n = parseFloat(plain);
  if (!isFinite(n)) return label;
  const v = Math.round(n * (100 - pct)) / 100;
  let s = Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  if (/[,٬]/.test(raw) && v >= 1000) s = Number(s).toLocaleString('en-US');
  if (persian) s = s.replace(/\d/g, d => FA_DIGITS[d]).replace('.', '٫');
  return String(label).replace(raw, s);
}
const discountDrt = (price, pct) => (pct >= 100 ? 0 : Math.max(0, Math.ceil(price * (100 - pct) / 100)));

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';  // no 0/O/1/I to avoid typos
const KINDS = ['plans'];

module.exports = function mountPromo(app, h, core) {
  const { J, W, str, bad, uid, limiter } = h;
  const express = require('express');
  const json = express.json({ limit: '10kb' });
  const { users, usersRO, saveUsers, publicUser, requireUser, notify } = core;

  // ---------- storage ----------
  const codes = () => J('discount-codes.json', []);
  const saveCodes = list => W('discount-codes.json', list);
  const inviteSettings = () => ({ enabled: true, inviterReward: 0, inviteeReward: 0, maxPerInviter: 0 });
  const invitesLog = () => J('invites.json', []);

  const normCode = c => str(c, 40).toUpperCase().replace(/\s+/g, '');
  const findCode = c => codes().find(x => x.code === normCode(c));

  // ---------- code rules ----------
  // Returns an error message, or null when `user` may use `code` right now.
  function whyNot(code, user) {
    if (!code) return 'This code does not exist.';
    if (code.type === 'gift') return 'Gift codes are no longer supported. Choose a subscription discount instead.';
    if (!code.active) return 'This code is not active.';
    if (code.expires && new Date(code.expires + 'T23:59:59') < new Date()) return 'This code has expired.';
    if (code.assignedTo && code.assignedTo !== user.id) return 'This code belongs to another account.';
    const uses = code.uses || [];
    if (code.maxUses && uses.length >= code.maxUses) return 'This code has been fully used.';
    const mine = uses.filter(u => u.userId === user.id).length;
    if (code.perUser && mine >= code.perUser) return 'You have already used this code.';
    return null;
  }
  const publicCode = c => c && ({ code: c.code, type: c.type, percent: c.percent || 0, appliesTo: c.appliesTo || KINDS, expires: c.expires || null });

  // the percent code a customer has activated, if still valid for this kind of purchase
  function peek(user, kind) {
    if (!user.activeCode) return null;
    const code = findCode(user.activeCode);
    if (!code || code.type !== 'percent') return null;
    if (whyNot(code, user)) return null;
    if (!(code.appliesTo || KINDS).includes(kind)) return null;
    return { code: code.code, percent: code.percent };
  }
  // records the use and clears the activation (caller saves `list`)
  function consume(list, user, kind, ref) {
    const info = peek(user, kind);
    if (!info) return null;
    const all = codes();
    const code = all.find(x => x.code === info.code);
    code.uses = code.uses || [];
    code.uses.push({ userId: user.id, date: new Date().toISOString(), ref, kind });
    saveCodes(all);
    user.activeCode = null;
    saveUsers(list);
    return info;
  }
  // an order was rejected: give the use back
  function release(ref) {
    const all = codes();
    let changed = false;
    for (const c of all) {
      const before = (c.uses || []).length;
      c.uses = (c.uses || []).filter(u => u.ref !== ref);
      if (c.uses.length !== before) changed = true;
    }
    if (changed) saveCodes(all);
  }
  const describeActive = user => {
    if (!user.activeCode) return null;
    const c = findCode(user.activeCode);
    return c && c.type === 'percent' && !whyNot(c, user) ? publicCode(c) : null;
  };

  // ---------- customer: redeem / activate a code ----------
  app.post('/api/account/code/apply', requireUser, limiter(30, 10 * 60 * 1000), json, (req, res) => {
    const code = findCode(req.body && req.body.code);
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    const why = whyNot(code, user);
    if (why) return bad(res, why, why.includes('not exist') ? 404 : 400);
    user.activeCode = code.code;
    saveUsers(list);
    if (notify) notify(user.id, {
      type: 'discount', dedupeKey: 'discount:' + code.code, title_en: 'Discount code activated', title_fa: 'کد تخفیف فعال شد',
      body_en: code.percent + '% off your next matching subscription purchase.', body_fa: code.percent + '٪ تخفیف برای خرید بعدی اشتراک مرتبط.',
    });
    res.json({ kind: 'percent', code: publicCode(code), user: publicUser(user) });
  });
  app.delete('/api/account/code', requireUser, (req, res) => {
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    user.activeCode = null;
    saveUsers(list);
    res.json({ ok: true, user: publicUser(user) });
  });

  // ---------- invitations ----------
  function ensureInviteCode(user, list) {
    if (user.inviteCode) return user.inviteCode;
    let code;
    do {
      code = 'DR-' + Array.from({ length: 6 }, () => INVITE_ALPHABET[crypto.randomInt(INVITE_ALPHABET.length)]).join('');
    } while (list.some(u => u.inviteCode === code));
    user.inviteCode = code;
    return code;
  }
  const findInviter = (code, list) => list.find(u => u.inviteCode === normCode(code));

  function inviteTreeLevels(rootId, allUsers) {
    const children = new Map();
    for (const user of allUsers) {
      if (!user.invitedBy) continue;
      const group = children.get(user.invitedBy) || [];
      group.push(user.id);
      children.set(user.invitedBy, group);
    }
    const seen = new Set([rootId]);
    let frontier = [rootId];
    const levels = [];
    while (frontier.length) {
      const next = [];
      for (const id of frontier) {
        for (const childId of children.get(id) || []) {
          if (seen.has(childId)) continue;
          seen.add(childId);
          next.push(childId);
        }
      }
      if (!next.length) break;
      levels.push({ level: levels.length + 1, customers: next.length });
      frontier = next;
    }
    return levels;
  }

  // called when a new account has just been created (it is already in `list`)
  function awardInvite(list, newUser, rawCode) {
    if (!rawCode) return null;
    const inviter = findInviter(rawCode, list);
    const log = invitesLog();
    if (!inviter || inviter.id === newUser.id || newUser.invitedBy || log.some(x => x.inviteeId === newUser.id)) return null;
    newUser.invitedBy = inviter.id;
    saveUsers(list);
    log.push({ id: uid(), inviterId: inviter.id, inviterName: inviter.name, inviteeId: newUser.id, inviteeName: newUser.name, inviterReward: 0, inviteeReward: 0, date: new Date().toISOString() });
    W('invites.json', log.slice(-20000));
    return { linked: true, inviter: inviter.name };
  }

  app.get('/api/account/invites', requireUser, (req, res) => {
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    if (!user.inviteCode) { ensureInviteCode(user, list); saveUsers(list); }
    const mine = invitesLog().filter(x => x.inviterId === user.id);
    res.json({
      enabled: true, code: user.inviteCode,
      rewards: { inviter: 0, invitee: 0 }, nextReward: 0, remaining: null,
      tree: inviteTreeLevels(user.id, list),
      count: mine.length, earned: 0,
      friends: mine.slice(-30).reverse().map(x => ({ name: x.inviteeName.split(' ')[0] + ' ' + (x.inviteeName.split(' ')[1] || '').slice(0, 1), date: x.date, reward: 0 })),
    });
  });
  // used by the sign-up form to give instant feedback
  app.get('/api/account/invite-check', limiter(60, 10 * 60 * 1000), (req, res) => {
    const inviter = findInviter(req.query.code, usersRO());
    res.json({ valid: !!inviter, inviteeReward: 0, inviter: inviter ? inviter.name.split(' ')[0] : null });
  });

  // ---------- admin: discount codes ----------
  const adminCode = c => ({
    ...c, uses: undefined, usedCount: (c.uses || []).length,
    assignedName: c.assignedTo ? ((usersRO().find(u => u.id === c.assignedTo) || {}).name || '(deleted account)') : null,
    status: !c.active ? 'off' : (c.expires && new Date(c.expires + 'T23:59:59') < new Date()) ? 'expired' : (c.maxUses && (c.uses || []).length >= c.maxUses) ? 'used up' : 'active',
  });
  function cleanCode(b, res, existing) {
    let code = normCode(b.code);
    if (!code) code = Array.from({ length: 8 }, () => INVITE_ALPHABET[crypto.randomInt(INVITE_ALPHABET.length)]).join('');
    if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return bad(res, 'Code must be 3-24 letters, numbers, - or _') && null;
    if (codes().some(c => c.code === code && (!existing || c.id !== existing.id))) return bad(res, 'This code already exists', 409) && null;
    if (b.type === 'gift') return bad(res, 'Gift codes are no longer supported. Create a subscription discount instead.', 410) && null;
    const type = 'percent';
    const percent = parseInt(b.percent, 10);
    if (type === 'percent' && !(percent >= 1 && percent <= 100)) return bad(res, 'Percent must be between 1 and 100') && null;
    const appliesTo = Array.isArray(b.appliesTo) ? b.appliesTo.filter(k => KINDS.includes(k)) : KINDS;
    if (type === 'percent' && !appliesTo.length) return bad(res, 'Choose what the discount applies to') && null;
    const expires = str(b.expires, 10);
    if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) return bad(res, 'Expiry date must be YYYY-MM-DD') && null;
    let assignedTo = null;
    const who = str(b.assignedTo, 120).toLowerCase();
    if (who) {
      const u = users().find(x => x.id === who || x.email === who || (x.username || '').toLowerCase() === who.replace(/^@/, ''));
      if (!u) return bad(res, 'No customer matches "' + who + '" (use their email or username)') && null;
      assignedTo = u.id;
    }
    return {
      code, type, percent: type === 'percent' ? percent : 0, gift: type === 'gift' ? gift : 0,
      appliesTo: type === 'percent' ? appliesTo : [], assignedTo, expires: expires || null,
      maxUses: Math.max(0, parseInt(b.maxUses, 10) || 0), perUser: b.perUser === '' || b.perUser == null ? 1 : Math.max(0, parseInt(b.perUser, 10) || 0),
      active: b.active !== false, note: str(b.note, 200),
    };
  }
  app.get('/api/admin/discount-codes', (req, res) => res.json(codes().map(adminCode).reverse()));
  app.post('/api/admin/discount-codes', (req, res) => {
    const v = cleanCode(req.body || {}, res, null);
    if (!v) return;
    const all = codes();
    const row = { id: uid(), created: new Date().toISOString(), uses: [], ...v };
    all.push(row);
    saveCodes(all);
    res.json(adminCode(row));
  });
  app.put('/api/admin/discount-codes/:id', (req, res) => {
    const all = codes();
    const row = all.find(c => c.id === req.params.id);
    if (!row) return bad(res, 'Unknown code', 404);
    const v = cleanCode(req.body || {}, res, row);
    if (!v) return;
    Object.assign(row, v);
    saveCodes(all);
    res.json(adminCode(row));
  });
  app.delete('/api/admin/discount-codes/:id', (req, res) => {
    const all = codes();
    if (!all.some(c => c.id === req.params.id)) return bad(res, 'Unknown code', 404);
    saveCodes(all.filter(c => c.id !== req.params.id));
    res.json({ ok: true });
  });
  app.get('/api/admin/discount-codes/:id/uses', (req, res) => {
    const row = codes().find(c => c.id === req.params.id);
    if (!row) return bad(res, 'Unknown code', 404);
    const all = users();
    res.json((row.uses || []).slice().reverse().map(u => ({ ...u, name: (all.find(x => x.id === u.userId) || {}).name || '(deleted)' })));
  });

  // ---------- admin: invitation settings ----------
  app.get('/api/admin/invite-settings', (req, res) => {
    const log = invitesLog();
    const by = new Map();
    for (const x of log) { const r = by.get(x.inviterId) || { userId: x.inviterId, name: x.inviterName, count: 0, earned: 0 }; r.count++; r.earned += x.inviterReward; by.set(x.inviterId, r); }
    res.json({ settings: inviteSettings(), total: log.length, top: [...by.values()].sort((a, b) => b.count - a.count).slice(0, 10), recent: log.slice(-15).reverse() });
  });
  app.put('/api/admin/invite-settings', (req, res) => {
    res.status(410).json({ error: 'Signup rewards were retired. Configure weekly sales commissions in the Earnings admin tab.' });
  });
  // per-account reward (null = use the default)
  app.put('/api/admin/users/:id/invite-reward', (req, res) => {
    return bad(res, 'Per-invite rewards are no longer available.');
  });

  // info shown in the admin customer profile
  function inviteInfo(user, allUsers) {
    const log = invitesLog();
    const inviter = user.invitedBy ? allUsers.find(u => u.id === user.invitedBy) : null;
    const mine = log.filter(x => x.inviterId === user.id);
    return {
      inviteCode: user.inviteCode || null, invitedBy: inviter ? inviter.name : null,
      invitedCount: mine.length, inviteEarned: 0,
      inviteRewardOverride: null, inviteRewardEffective: 0,
    };
  }

  return { peek, consume, release, describeActive, ensureInviteCode, findInviter, awardInvite, inviteSettings, inviteInfo, discountLabel, discountDrt };
};
module.exports.discountLabel = discountLabel;
module.exports.discountDrt = discountDrt;
