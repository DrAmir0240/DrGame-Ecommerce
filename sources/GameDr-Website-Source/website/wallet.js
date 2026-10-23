// Customer accounts and subscription download quota.
//
// - Accounts: email + password (scrypt-hashed), HttpOnly SameSite=Strict
//   session cookie (separate from the admin session).
// - New subscription quota is tracked in bytes and an append-only ledger.
// - Historical wallet records remain stored for audit, but never fund access or purchases.
//   In "test" payment mode an order is simulated as paid; in "manual" mode it
//   stays pending until an admin approves it after receiving payment.
const crypto = require('crypto');
const weeklyEarnings = require('./weekly-earnings');
const freeGamePlan = require('./free-game-plan');
const { BYTES_PER_GB, quotaBytesForGB, gameQuotaGB } = require('./game-quota');
const avatarCatalog = require('./avatar-catalog');
const gameReactions = require('./game-reactions');
const DEFAULT_AVATAR_ID = avatarCatalog.DEFAULT_AVATAR_ID;
const normalizeAvatarId = avatarCatalog.normalizeAvatarId;

module.exports = function mountWallet(app, helpers) {
  const { J, W, str, bad, uid, limiter, getPlans, readCookie, isAdmin, MEDIA_DIR, listCategoryFiles, generateThumbnails, slugify } = helpers;
  const fs = require('fs');
  const path = require('path');
  const express = require('express');

  const SESSION_MS = 30 * 24 * 60 * 60 * 1000;
  const sessions = new Map(); // token -> { id, exp, sessionId, createdAt, lastSeen, device }

  let promo = null;   // discount codes + invitations (promo.js), connected at the end of this file

  const DEFAULT_EARNINGS_CONFIG = {
    version: 1, effectiveAt: '2000-01-01T00:00:00.000Z', testMode: true,
    budgetToman: weeklyEarnings.BUDGET_TOMAN, directToman: 40000,
    uplineToman: [...weeklyEarnings.UPLINE_SHARES], reserveToman: weeklyEarnings.RESERVE_TOMAN,
    holdDays: weeklyEarnings.HOLD_DAYS, ranks: weeklyEarnings.RANKS.map(r => ({ ...r })),
  };
  const earningsConfigs = () => J('weekly-earnings-configs.json', [DEFAULT_EARNINGS_CONFIG]);
  const commissionSales = () => J('weekly-commission-sales.json', []);
  const rankSnapshots = () => J('weekly-rank-snapshots.json', []);
  const commissionDebts = () => J('weekly-commission-debts.json', []);
  const debtForMarketer = id => commissionDebts().filter(row => row.marketerId === id).reduce((sum, row) => sum + Math.max(0, row.outstandingToman || 0), 0);
  function configFor(at) {
    const time = new Date(at).getTime();
    return earningsConfigs().filter(c => new Date(c.effectiveAt).getTime() <= time).sort((a, b) => a.version - b.version).at(-1) || DEFAULT_EARNINGS_CONFIG;
  }
  function rankSnapshotFor(period) {
    let all = rankSnapshots();
    let snapshot = all.find(s => s.periodStart === period.start);
    if (snapshot) return snapshot;
    const previous = weeklyEarnings.weeklyPeriod(period.startMs - 1);
    const counts = weeklyEarnings.teamSalesByMarketer(previous, commissionSales(), usersRO());
    const ranks = {};
    for (const user of usersRO().filter(weeklyEarnings.isApprovedMarketer)) ranks[user.id] = weeklyEarnings.rankForSales(counts[user.id] || 0);
    snapshot = { periodStart: period.start, periodEnd: period.end, basedOnPeriodStart: previous.start, basedOnPeriodEnd: previous.end, sales: counts, ranks, createdAt: new Date().toISOString() };
    all.push(snapshot);
    W('weekly-rank-snapshots.json', all.slice(-260));
    return snapshot;
  }
  function recordCommissionSale(order) {
    if (!order || order.type !== 'subscription' || !order.attributedMarketerId) return null;
    const all = commissionSales();
    const existing = all.find(row => row.orderId === order.id);
    if (existing) return existing;
    const period = weeklyEarnings.weeklyPeriod(order.deliveredAt);
    const snapshot = rankSnapshotFor(period);
    const config = configFor(order.deliveredAt);
    const sale = weeklyEarnings.allocateOrder(order, usersRO(), snapshot.ranks, config);
    if (!sale) return null;
    sale.orderMode = order.mode;
    all.push(sale);
    W('weekly-commission-sales.json', all.slice(-20000));
    return sale;
  }
  function simulateDueSettlement(now = Date.now(), scheduledAt = null) {
    const list = users();
    const allSales = commissionSales();
    const marketersById = new Map(list.map(u => [u.id, u]));
    const payouts = new Map();
    for (const sale of allSales) {
      if (sale.reversedAt || new Date(sale.releaseAt).getTime() > now) continue;
      for (const line of sale.lines || []) {
        const recipient = marketersById.get(line.recipientId);
        if (line.status !== 'pending' || !recipient || !weeklyEarnings.isApprovedMarketer(recipient) || !recipient.identityVerified || !recipient.bankVerified) continue;
        line.status = 'paid';
        line.settledAt = new Date(now).toISOString();
        const payout = payouts.get(recipient.id) || { marketerId: recipient.id, name: recipient.name, amountToman: 0, lines: [] };
        payout.amountToman += line.amount;
        payout.lines.push({ orderId: sale.orderId, saleId: sale.id, level: line.level, amountToman: line.amount });
        payouts.set(recipient.id, payout);
      }
    }
    if (!payouts.size) return null;
    const debts = commissionDebts();
    for (const payout of payouts.values()) {
      const gross = payout.amountToman;
      let offset = Math.min(gross, debts.filter(row => row.marketerId === payout.marketerId).reduce((sum, row) => sum + Math.max(0, row.outstandingToman || 0), 0));
      payout.grossAmountToman = gross;
      payout.debtOffsetToman = offset;
      payout.amountToman = gross - offset;
      for (const row of debts.filter(row => row.marketerId === payout.marketerId && row.outstandingToman > 0)) {
        const applied = Math.min(offset, row.outstandingToman);
        row.outstandingToman -= applied;
        offset -= applied;
        if (!offset) break;
      }
    }
    W('weekly-commission-sales.json', allSales);
    W('weekly-commission-debts.json', debts);
    const run = { id: uid(), date: new Date(now).toISOString(), scheduledAt, testMode: true, simulated: true, payouts: [...payouts.values()] };
    const runs = J('weekly-commission-settlements.json', []);
    runs.push(run);
    W('weekly-commission-settlements.json', runs.slice(-2000));
    return run;
  }
  function closeCurrentEarningsWeek(now = Date.now()) {
    const current = weeklyEarnings.weeklyPeriod(now);
    const reports = J('weekly-close-reports.json', []);
    if (reports.some(report => report.nextPeriodStart === current.start)) return null;
    const closed = weeklyEarnings.weeklyPeriod(current.startMs - 1);
    const snapshot = rankSnapshotFor(current);
    const closedSales = commissionSales().filter(sale => sale.period && sale.period.start === closed.start && !sale.reversedAt);
    const settlement = simulateDueSettlement(now, current.start);
    const report = {
      id: uid(), closedPeriodStart: closed.start, closedPeriodEnd: closed.end,
      nextPeriodStart: current.start, closedAt: new Date(now).toISOString(),
      sales: closedSales.length, budgetToman: closedSales.reduce((sum, sale) => sum + sale.amount, 0),
      rankSnapshotId: current.start, settlementId: settlement && settlement.id || null,
      testMode: true,
    };
    reports.push(report);
    W('weekly-close-reports.json', reports.slice(-260));
    return report;
  }

  // ---------- settings ----------
  const DEFAULT_SETTINGS = { mode: 'test' };
  const settings = () => {
    const s = J('token-settings.json', null);
    // Keep the old settings file readable so local checkout mode survives migration.
    return { mode: s && ['test', 'manual'].includes(s.mode) ? s.mode : DEFAULT_SETTINGS.mode };
  };

  // ---------- users / ledger ----------
  const users = () => J('users.json', []);                       // a private copy: use it when you change accounts and save them
  const usersRO = () => helpers.Jro('users.json', []);           // the live list, NOT copied: read only, never change what you get
  const saveUsers = list => W('users.json', list);
  const notifications = () => J('notifications.json', []);
  const saveNotifications = list => W('notifications.json', list.slice(0, 50000));
  const publicNotification = row => ({
    id: row.id, type: row.type || 'system', title_en: row.title_en || '', title_fa: row.title_fa || row.title_en || '',
    body_en: row.body_en || '', body_fa: row.body_fa || row.body_en || '', date: row.date, read: !!row.read,
  });
  function notify(userId, data) {
    if (!userId || !data || !data.title_en) return null;
    const list = notifications();
    if (data.dedupeKey && list.some(row => row.userId === userId && row.dedupeKey === data.dedupeKey)) return null;
    const row = {
      id: uid(), userId, type: data.type || 'system', title_en: str(data.title_en, 180), title_fa: str(data.title_fa || data.title_en, 180),
      body_en: str(data.body_en || '', 600), body_fa: str(data.body_fa || data.body_en || '', 600),
      date: new Date().toISOString(), read: false, dedupeKey: data.dedupeKey || null,
    };
    list.unshift(row);
    saveNotifications(list);
    const account = usersRO().find(user => user.id === userId);
    if (account && account.phone && account.phoneVerified) {
      const language = account.lang === 'en' ? 'en' : 'fa';
      const smsText = (language === 'en' ? row.title_en + ': ' + row.body_en : row.title_fa + ': ' + row.body_fa);
      sms.sendNotification({ to: account.phone, text: smsText }).catch(error => console.error('[sms] notification could not be sent:', error.message));
    }
    return row;
  }
  function ensureAccountAlerts(user) {
    if (!user) return;
    if (user.verified === false) notify(user.id, {
      type: 'verification', dedupeKey: 'email-verification', title_en: 'Verify your email address', title_fa: 'ایمیل خود را تأیید کنید',
      body_en: 'Verify your email address from your profile to protect the account and receive service updates.', body_fa: 'برای محافظت از حساب و دریافت اطلاع‌رسانی‌ها، ایمیل خود را از پروفایل تأیید کنید.',
    });
    if (user.phone && !user.phoneVerified) notify(user.id, {
      type: 'verification', dedupeKey: 'phone-verification', title_en: 'Verify your phone number', title_fa: 'شماره موبایل خود را تأیید کنید',
      body_en: 'Verify your phone number from your profile to keep your account details up to date.', body_fa: 'برای کامل‌بودن اطلاعات حساب، شماره موبایل خود را از پروفایل تأیید کنید.',
    });
    if (user.planEnd) {
      const remaining = new Date(user.planEnd).getTime() - Date.now();
      if (remaining > 0 && remaining <= 7 * 24 * 60 * 60 * 1000) notify(user.id, {
        type: 'subscription', dedupeKey: 'subscription-ending:' + user.planEnd, title_en: 'Your subscription is ending soon', title_fa: 'اشتراک شما به‌زودی تمام می‌شود',
        body_en: 'Renew before the end date to keep using your download allowance.', body_fa: 'برای حفظ سهمیه دانلود، پیش از تاریخ پایان اشتراک آن را تمدید کنید.',
      });
      if (remaining <= 0) notify(user.id, {
        type: 'subscription', dedupeKey: 'subscription-expired:' + user.planEnd, title_en: 'Your subscription has ended', title_fa: 'اشتراک شما پایان یافته است',
        body_en: 'Choose a new plan to unlock downloads again.', body_fa: 'برای فعال‌کردن دوباره دانلود، یک پلن جدید انتخاب کنید.',
      });
    }
    if (promo && user.activeCode) {
      const active = promo.describeActive(user);
      if (active) notify(user.id, {
        type: 'discount', dedupeKey: 'discount:' + active.code, title_en: 'Discount code ready', title_fa: 'کد تخفیف آماده استفاده است',
        body_en: active.percent + '% off your next matching subscription purchase.', body_fa: active.percent + '٪ تخفیف برای خرید بعدی اشتراک مرتبط.',
      });
    }
  }
  function nearestApprovedMarketer(customer) {
    const all = usersRO();
    const byId = new Map(all.map(user => [user.id, user]));
    let parentId = customer && (customer.marketerParentId || customer.invitedBy);
    const seen = new Set();
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) return null;
      if (weeklyEarnings.isApprovedMarketer(parent)) return parent;
      parentId = parent.marketerParentId || parent.invitedBy;
    }
    return null;
  }
  const normEmail = e => str(e, 120).toLowerCase();
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_.]{2,19}$/;
  const RESERVED_NAMES = new Set(['admin', 'administrator', 'root', 'support', 'system', 'drgame', 'moderator', 'staff', 'owner']);
  // International format: +989121234567. 00... is turned into +..., spaces and dashes are removed.
  function normPhone(raw) {
    let p = str(raw, 30).replace(/[\s\-().]/g, '');
    if (p.startsWith('00')) p = '+' + p.slice(2);
    return /^\+?\d{7,15}$/.test(p) ? p : null;
  }
  const nameTaken = (username, exceptEmail) => {
    const low = username.toLowerCase();
    return usersRO().some(u => u.username && u.username.toLowerCase() === low)
      || pendings().some(p => p.email !== exceptEmail && p.username && p.username.toLowerCase() === low && p.expires > Date.now());
  };

  // scrypt runs on the thread pool (not on the main thread), at most a few at a time, so a burst of
  // log-ins can not freeze the whole site
  const MAX_HASH = Math.max(2, require('os').cpus().length - 1);
  let hashing = 0; const hashQueue = [];
  const hashSlot = () => new Promise(res => { const go = () => { hashing++; res(); }; if (hashing < MAX_HASH) go(); else hashQueue.push(go); });
  const hashDone = () => { hashing--; const n = hashQueue.shift(); if (n) n(); };
  async function hashPassword(pw, saltHex) {
    const salt = saltHex ? Buffer.from(saltHex, 'hex') : crypto.randomBytes(16);
    await hashSlot();
    try {
      const hash = await new Promise((ok, no) => crypto.scrypt(pw, salt, 64, (e, k) => (e ? no(e) : ok(k))));
      return { salt: salt.toString('hex'), hash: hash.toString('hex') };
    } finally { hashDone(); }
  }
  async function checkPassword(pw, rec) {
    const { hash } = await hashPassword(pw, rec.salt);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(rec.hash, 'hex'));
  }

  function touchLogin(userId) {
    helpers.Upd('users.json', userId, u => {
      u.lastLogin = new Date().toISOString();
      u.logins = (u.logins || 0) + 1;
    });
  }
  const planById = id => getPlans().find(p => p.id === id);
  function quotaBytesForUser(user) {
    const active = user && user.plan && user.plan !== 'free' && user.planEnd && new Date(user.planEnd) > new Date();
    if (!active) return 0;
    if (Number.isFinite(Number(user.downloadQuotaBytes))) return Math.max(0, Math.floor(Number(user.downloadQuotaBytes)));
    // Active plans from before quota tracking receive their configured allowance once.
    return quotaBytesForGB(planById(user.plan)?.quotaGB);
  }
  const quotaLedger = () => J('download-quota-ledger.json', []);
  function applyQuotaCharge(list, user, bytes, reason, ref) {
    const current = quotaBytesForUser(user);
    const charge = Math.floor(Number(bytes));
    if (!(charge > 0) || current < charge) return null;
    user.downloadQuotaBytes = current - charge;
    const ledger = quotaLedger();
    ledger.push({ id: uid(), userId: user.id, deltaBytes: -charge, balanceAfterBytes: user.downloadQuotaBytes, reason, ref: ref || '', date: new Date().toISOString() });
    W('download-quota-ledger.json', ledger.slice(-20000));
    saveUsers(list);
    return user.downloadQuotaBytes;
  }
  const publicUser = u => {
    const paidActive = u.plan && u.plan !== 'free' && u.planEnd && new Date(u.planEnd) > new Date();
    const activePlanId = paidActive ? u.plan : (u.freeGamePlanActivatedAt ? 'free' : null);
    const plan = activePlanId && planById(activePlanId);
    return {
      id: u.id, name: u.name, email: u.email, downloadQuotaBytes: quotaBytesForUser(u), downloadQuotaGB: quotaBytesForUser(u) / BYTES_PER_GB, created: u.created || null, lastLogin: u.lastLogin || null, verified: u.verified !== false,
      isAdmin: u.admin === true,
      inviteCode: u.inviteCode || null, activeCode: promo ? promo.describeActive(u) : null,
      username: u.username || null, firstName: u.firstName || null, lastName: u.lastName || null,
      phone: u.phone || null, phoneVerified: !!u.phoneVerified,
      avatarId: normalizeAvatarId(u.avatarId),
      plan: activePlanId, planName_en: plan ? plan.name_en : null,
      planName_fa: plan ? plan.name_fa : null, planEnd: paidActive ? u.planEnd : null,
      freeGamePlanActive: !!u.freeGamePlanActivatedAt,
    };
  };

  // ---------- sessions ----------
  function userAgentStats(userAgent) {
    const ua = String(userAgent || '');
    const browserMatch = /Edg\/([\d.]+)/.exec(ua) || /OPR\/([\d.]+)/.exec(ua) || /Chrome\/([\d.]+)/.exec(ua) || /Firefox\/([\d.]+)/.exec(ua) || /Version\/([\d.]+).*Safari\//.exec(ua);
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Device';
    const deviceType = /iPad|Tablet/.test(ua) ? 'Tablet' : /Mobile|Android|iPhone|iPod/.test(ua) ? 'Mobile' : 'Desktop';
    const consoleMatch = /PlayStation\s*;\s*PlayStation\s*(5|4)[\/ ]([\d.-]+)/i.exec(ua) || /PlayStation\s*(5|4)[\/ ]([\d.-]+)/i.exec(ua);
    return {
      browser,
      browserVersion: browserMatch ? browserMatch[1] : '',
      os,
      deviceType,
      console: consoleMatch ? 'PlayStation ' + consoleMatch[1] : '',
      firmware: consoleMatch ? consoleMatch[2] : '',
      userAgent: ua.slice(0, 512),
    };
  }
  function deviceLabel(userAgent) {
    const stats = userAgentStats(userAgent);
    return stats.browser + ' · ' + stats.os;
  }
  function sessionUser(req) {
    const t = readCookie(req, 'user_session');
    const s = t && sessions.get(t);
    if (!s) return null;
    if (s.exp < Date.now()) { sessions.delete(t); return null; }
    s.lastSeen = Date.now();
    const u = helpers.ById('users.json', s.id);   // look up in memory, copy only the one account
    return u ? structuredClone(u) : null;
  }
  function startSession(res, user, req) {
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    const stats = userAgentStats(req && req.get && req.get('user-agent'));
    const session = { id: user.id, exp: now + SESSION_MS, sessionId: uid(), createdAt: now, lastSeen: now, device: deviceLabel(stats.userAgent), ...stats };
    sessions.set(token, session);
    res.setHeader('Set-Cookie', `user_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}`);
    return session;
  }
  const requireUser = (req, res, next) => {
    const u = sessionUser(req);
    if (!u) return bad(res, 'Please log in first', 401);
    req.user = u;
    next();
  };
  const json = express.json({ limit: '10kb' });

  // ---------- account endpoints ----------
  // ---------- sign-up with an emailed verification code ----------
  // Registering stores a *pending* sign-up and emails a 6-digit code. The account is
  // only created (and the user logged in) once the right code is entered, so nobody
  // can claim an email address they don't own.
  const mailer = require('./mailer');
  const CODE_TTL_MS = 10 * 60 * 1000;
  const RESEND_WAIT_MS = 60 * 1000;
  const MAX_TRIES = 5;
  const pendings = () => J('pending-signups.json', []);
  const savePendings = list => W('pending-signups.json', list.filter(p => p.expires > Date.now() - 3600 * 1000));
  const codeHash = (email, code, salt) => crypto.createHmac('sha256', salt).update(email + ':' + code).digest('hex');

  function newCode(pending) {
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    pending.salt = crypto.randomBytes(16).toString('hex');
    pending.codeHash = codeHash(pending.email, code, pending.salt);
    pending.expires = Date.now() + CODE_TTL_MS;
    pending.tries = 0;
    pending.sentAt = Date.now();
    return code;
  }
  async function emailCode(pending, code, lang) {
    const fa = lang === 'fa';
    const subject = fa ? 'کد تأیید دکتر گیم' : 'Your Dr Game verification code';
    const text = fa
      ? 'سلام ' + pending.name + '،\n\nکد تأیید شما: ' + code + '\n\nاین کد ' + (CODE_TTL_MS / 60000) + ' دقیقه اعتبار دارد. اگر شما حساب نساخته‌اید، این ایمیل را نادیده بگیرید.'
      : 'Hi ' + pending.name + ',\n\nYour verification code is: ' + code + '\n\nIt is valid for ' + (CODE_TTL_MS / 60000) + ' minutes. If you did not create an account, you can ignore this email.';
    const html = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e3dbee;border-radius:14px"' + (fa ? ' dir="rtl"' : '') + '>'
      + '<h2 style="margin:0 0 12px;color:#7c3aed">Dr Game</h2>'
      + '<p>' + (fa ? 'سلام' : 'Hi') + ' ' + escapeHtml(pending.name) + (fa ? '،' : ',') + '</p>'
      + '<p>' + (fa ? 'کد تأیید شما:' : 'Your verification code is:') + '</p>'
      + '<p style="font-size:34px;letter-spacing:8px;font-weight:bold;margin:12px 0;color:#1b1426">' + code + '</p>'
      + '<p style="color:#6b5f7a;font-size:14px">' + (fa ? 'این کد ' + (CODE_TTL_MS / 60000) + ' دقیقه اعتبار دارد. اگر شما حساب نساخته‌اید، این ایمیل را نادیده بگیرید.' : 'It is valid for ' + (CODE_TTL_MS / 60000) + ' minutes. If you did not create an account, you can ignore this email.') + '</p></div>';
    return mailer.sendMail({ to: pending.email, subject, text, html });
  }
  const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const langOf = b => (b && b.lang === 'fa' ? 'fa' : 'en');
  function canShowLocalVerificationCode(req, deliveryConfigured) {
    if (deliveryConfigured || process.env.NODE_ENV === 'production') return false;
    const host = String(req.hostname || '').toLowerCase();
    const address = String(req.socket && req.socket.remoteAddress || '').toLowerCase();
    const localHost = ['localhost', '127.0.0.1', '::1'].includes(host);
    const localAddress = address === '::1' || address === '127.0.0.1' || address.startsWith('::ffff:127.');
    return localHost && localAddress;
  }

  // Only sign-ups that get as far as sending a code count toward the limit (typos don't).
  const registerLimit = limiter(10, 60 * 60 * 1000);
  app.post('/api/account/register', json, async (req, res) => {
    const b = req.body || {};
    const firstName = str(b.firstName, 50), lastName = str(b.lastName, 50);
    const username = str(b.username, 20);
    const email = normEmail(b.email), pw = typeof b.password === 'string' ? b.password : '';
    const phone = normPhone(b.phone);
    if (!firstName) return bad(res, 'First name is required');
    if (!lastName) return bad(res, 'Last name is required');
    if (!USERNAME_RE.test(username)) return bad(res, 'Username must be 3-20 characters: start with a letter, then letters, numbers, "_" or "."');
    if (RESERVED_NAMES.has(username.toLowerCase())) return bad(res, 'This username is not available');
    if (!EMAIL_RE.test(email)) return bad(res, 'Enter a valid email');
    if (!phone) return bad(res, 'Enter a valid phone number with country code, e.g. +989121234567');
    if (pw.length < 8 || pw.length > 100) return bad(res, 'Password must be 8-100 characters');
    if (usersRO().some(u => u.email === email)) return bad(res, 'An account with this email already exists', 409);
    if (nameTaken(username, email)) return bad(res, 'This username is already taken', 409);
    let allowed = false;
    registerLimit(req, res, () => { allowed = true; });
    if (!allowed) return;
    if (J('site-content.json', {}).legal?.requireConsent !== false && b.acceptTerms !== true) return bad(res, 'Please accept the Terms of Service and the Privacy Policy to create an account.');
    const inviteCode = str(b.inviteCode, 40).toUpperCase().replace(/\s+/g, '');
    if (inviteCode && promo.inviteSettings().enabled && !promo.findInviter(inviteCode, usersRO())) return bad(res, 'Invitation code not found. Check it or leave the box empty.');
    const list = pendings().filter(p => p.email !== email);
    const pending = { email, username, firstName, lastName, name: firstName + ' ' + lastName, phone, avatarId: normalizeAvatarId(b.avatarId), pass: await hashPassword(pw), inviteCode: inviteCode || undefined, termsAcceptedAt: new Date().toISOString() };
    const code = newCode(pending);
    list.push(pending);
    savePendings(list);
    try {
      const r = await emailCode(pending, code, langOf(b));
      res.json({ needsVerification: true, email, expiresInSeconds: CODE_TTL_MS / 1000, resendInSeconds: RESEND_WAIT_MS / 1000, emailSent: r.sent,
        ...(canShowLocalVerificationCode(req, mailer.configured()) ? { devVerificationCode: code } : {}) });
    } catch (e) {
      console.error('[mail] could not send verification email:', e.message);
      savePendings(pendings().filter(p => p.email !== email));
      bad(res, 'We could not send the verification email. Check the address or try again later.', 502);
    }
  });

  // ---------- phone verification by SMS (sms.ir) ----------
  const sms = require('./sms');
  const PHONE_TTL_MS = 10 * 60 * 1000;
  const PHONE_RESEND_MS = 60 * 1000;
  const PHONE_MAX_TRIES = 5;
  const phoneSendLimit = limiter(10, 60 * 60 * 1000);

  app.post('/api/account/phone/send', requireUser, json, async (req, res) => {
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    const lang = req.body && req.body.lang === 'fa' ? 'fa' : 'en';
    // optionally fix a typo in the number before sending
    if (req.body && req.body.phone && normPhone(req.body.phone) !== user.phone) {
      const p = normPhone(req.body.phone);
      if (!p) return bad(res, 'Enter a valid phone number with country code, e.g. +989121234567');
      user.phone = p;
      user.phoneVerified = false;
      user.phoneCode = null;
    }
    if (user.phoneVerified) return res.json({ ok: true, alreadyVerified: true, user: publicUser(user) });
    if (!user.phone) return bad(res, 'Add a phone number first');
    const c = user.phoneCode;
    if (c && c.phone === user.phone) {
      const wait = c.sentAt + PHONE_RESEND_MS - Date.now();
      if (wait > 0) return res.status(429).json({ error: 'Please wait before asking for another code.', retryAfter: Math.ceil(wait / 1000) });
    }
    let allowed = false;
    phoneSendLimit(req, res, () => { allowed = true; });
    if (!allowed) return;
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const salt = crypto.randomBytes(16).toString('hex');
    user.phoneCode = { phone: user.phone, salt, codeHash: codeHash(user.phone, code, salt), expires: Date.now() + PHONE_TTL_MS, tries: 0, sentAt: Date.now() };
    saveUsers(list);
    const text = lang === 'fa'
      ? 'کد تأیید دکتر گیم: ' + code + '\n(' + (PHONE_TTL_MS / 60000) + ' دقیقه اعتبار دارد)'
      : 'Dr Game verification code: ' + code + '\n(valid for ' + (PHONE_TTL_MS / 60000) + ' minutes)';
    try {
      const r = await sms.sendCode({ to: user.phone, code, text });
      res.json({ ok: true, sent: r.sent, phone: user.phone, expiresInSeconds: PHONE_TTL_MS / 1000, resendInSeconds: PHONE_RESEND_MS / 1000,
        ...(canShowLocalVerificationCode(req, sms.configured()) ? { devVerificationCode: code } : {}) });
    } catch (e) {
      user.phoneCode = null;
      saveUsers(list);
      console.error('[sms] could not send verification SMS:', e.message);
      if (e.code === 'unsupported_number') return bad(res, e.message, 422);
      bad(res, 'We could not send the SMS right now. Please try again later.', 502);
    }
  });

  app.post('/api/account/phone/verify', requireUser, limiter(30, 10 * 60 * 1000), json, (req, res) => {
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    const code = str(req.body && req.body.code, 12).replace(/\s+/g, '');
    const c = user.phoneCode;
    if (user.phoneVerified) return res.json({ user: publicUser(user) });
    if (!c || c.phone !== user.phone) return bad(res, 'Ask for a code first.', 404);
    if (c.expires < Date.now()) return bad(res, 'This code has expired. Ask for a new one.', 410);
    if (c.tries >= PHONE_MAX_TRIES) return bad(res, 'Too many wrong attempts. Ask for a new code.', 429);
    const given = Buffer.from(codeHash(user.phone, code, c.salt), 'hex');
    if (!/^\d{6}$/.test(code) || !crypto.timingSafeEqual(given, Buffer.from(c.codeHash, 'hex'))) {
      c.tries += 1;
      saveUsers(list);
      return bad(res, 'Wrong code. ' + Math.max(0, PHONE_MAX_TRIES - c.tries) + ' attempts left.', 400);
    }
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date().toISOString();
    user.phoneCode = null;
    saveUsers(list);
    notify(user.id, {
      type: 'verification', dedupeKey: 'phone-verified:' + user.phoneVerifiedAt, title_en: 'Phone number verified', title_fa: 'شماره موبایل تأیید شد',
      body_en: 'Your phone number is now verified on this account.', body_fa: 'شماره موبایل شما اکنون برای این حساب تأیید شده است.',
    });
    res.json({ user: publicUser(user) });
  });

  // live check used by the sign-up form while typing a username
  app.get('/api/account/username-available', limiter(60, 10 * 60 * 1000), (req, res) => {
    const u = str(req.query.u, 20);
    res.json({ available: USERNAME_RE.test(u) && !RESERVED_NAMES.has(u.toLowerCase()) && !nameTaken(u, '') });
  });

  app.post('/api/account/resend', limiter(10, 60 * 60 * 1000), json, async (req, res) => {
    const email = normEmail(req.body && req.body.email);
    const list = pendings();
    const pending = list.find(p => p.email === email);
    if (!pending) return bad(res, 'No sign-up is waiting for this email. Please register again.', 404);
    const wait = pending.sentAt + RESEND_WAIT_MS - Date.now();
    if (wait > 0) return res.status(429).json({ error: 'Please wait before asking for another code.', retryAfter: Math.ceil(wait / 1000) });
    const code = newCode(pending);
    savePendings(list);
    try {
      const r = await emailCode(pending, code, langOf(req.body));
      res.json({ ok: true, sent: r.sent, retryAfter: RESEND_WAIT_MS / 1000, expiresInSeconds: CODE_TTL_MS / 1000,
        ...(canShowLocalVerificationCode(req, mailer.configured()) ? { devVerificationCode: code } : {}) });
    } catch (e) {
      console.error('[mail] could not resend verification email:', e.message);
      bad(res, 'We could not send the verification email. Try again later.', 502);
    }
  });

  app.post('/api/account/verify', limiter(30, 10 * 60 * 1000), json, (req, res) => {
    const email = normEmail(req.body && req.body.email);
    const code = str(req.body && req.body.code, 12).replace(/\s+/g, '');
    const list = pendings();
    const pending = list.find(p => p.email === email);
    if (!pending) return bad(res, 'No sign-up is waiting for this email. Please register again.', 404);
    if (pending.expires < Date.now()) return bad(res, 'This code has expired. Ask for a new one.', 410);
    if (pending.tries >= MAX_TRIES) return bad(res, 'Too many wrong attempts. Ask for a new code.', 429);
    const given = Buffer.from(codeHash(email, code, pending.salt), 'hex');
    const real = Buffer.from(pending.codeHash, 'hex');
    if (!/^\d{6}$/.test(code) || !crypto.timingSafeEqual(given, real)) {
      pending.tries += 1;
      savePendings(list);
      return bad(res, 'Wrong code. ' + Math.max(0, MAX_TRIES - pending.tries) + ' attempts left.', 400);
    }
    const accounts = users();
    if (accounts.some(u => u.email === email)) {
      savePendings(list.filter(p => p.email !== email));
      return bad(res, 'An account with this email already exists', 409);
    }
    if (pending.username && users().some(u => u.username && u.username.toLowerCase() === pending.username.toLowerCase())) {
      savePendings(list.filter(p => p.email !== email));
      return bad(res, 'This username was taken while you were verifying. Please register again with another one.', 409);
    }
    const user = { id: uid(), name: pending.name, firstName: pending.firstName, lastName: pending.lastName, username: pending.username, phone: pending.phone, phoneVerified: false, avatarId: normalizeAvatarId(pending.avatarId), email, pass: pending.pass, created: new Date().toISOString(), lastLogin: new Date().toISOString(), logins: 1, plan: null, planEnd: null, verified: true, termsAcceptedAt: pending.termsAcceptedAt || null };
    accounts.push(user);
    promo.ensureInviteCode(user, accounts);
    saveUsers(accounts);
    savePendings(list.filter(p => p.email !== email));
    const invited = promo.awardInvite(accounts, user, pending.inviteCode);
    startSession(res, user, req);
    notify(user.id, {
      type: 'account', dedupeKey: 'welcome:' + user.id, title_en: 'Welcome to Dr Game', title_fa: 'به Dr Game خوش آمدید',
      body_en: 'Your account is ready. You can manage downloads, subscriptions and invitations from your profile.', body_fa: 'حساب شما آماده است. مدیریت دانلودها، اشتراک‌ها و دعوت‌ها از پروفایل انجام می‌شود.',
    });
    if (user.admin === true && helpers.startAdminSession) helpers.startAdminSession(res, user);
    res.json({ user: publicUser(user), invited });
  });

  app.post('/api/account/login', limiter(12, 10 * 60 * 1000), json, async (req, res) => {
    const b = req.body || {};
    const ident = str(b.identifier || b.email, 120).toLowerCase(), pw = typeof b.password === 'string' ? b.password : '';
    const user = usersRO().find(u => (ident.includes('@') ? u.email === ident : (u.username || '').toLowerCase() === ident));
    // Always hash, so a wrong email and a wrong password take the same time.
    const ok = user ? await checkPassword(pw, user.pass) : (await hashPassword(pw), false);
    if (!ok) return bad(res, 'Wrong email/username or password', 401);
    touchLogin(user.id);
    const session = startSession(res, user, req);
    notify(user.id, {
      type: 'login', title_en: 'New account login', title_fa: 'ورود جدید به حساب',
      body_en: 'Your account was opened from ' + session.device + '.', body_fa: 'حساب شما از طریق «' + session.device + '» باز شد.',
    });
    if (user.admin === true && helpers.startAdminSession) helpers.startAdminSession(res, user);
    res.json({ user: publicUser(user) });
  });

  app.post('/api/account/logout', (req, res) => {
    const t = readCookie(req, 'user_session');
    if (t) sessions.delete(t);
    res.setHeader('Set-Cookie', 'user_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    res.json({ ok: true });
  });

  app.get('/api/account/me', (req, res) => {
    let u = sessionUser(req);
    if (u && !u.inviteCode) {
      const list = users();
      u = list.find(x => x.id === u.id);
      promo.ensureInviteCode(u, list);
      saveUsers(list);
    }
    if (u) ensureAccountAlerts(u);
    res.json({ user: u ? publicUser(u) : null, mode: settings().mode });
  });

  app.get('/api/account/history', requireUser, (req, res) => {
    const orders = J('orders.json', []).filter(o => o.userId === req.user.id).slice(0, 50);
    const purchases = J('purchases.json', []).filter(x => x.userId === req.user.id).map(x => ({
      id: x.id, slug: x.slug, file: x.file, gameUnlock: x.gameUnlock === true, quotaBased: !!x.quotaBased, quotaGB: Number(x.quotaGB) || 0, date: x.date,
      title: J('games.json', []).find(g => slugify(g.title) === x.slug)?.title || x.slug,
    })).reverse();
    res.set('Cache-Control', 'no-store');
    res.json({ orders: orders.map(o => ({
      id: o.id, type: o.type, planId: o.planId || null, label: o.label || o.type, status: o.status,
      price: o.price || null, originalPrice: o.originalPrice || null, discountPercent: o.discountPercent || 0,
      date: o.date || o.created || null, decidedAt: o.decidedAt || null, deliveredAt: o.deliveredAt || null, how: o.how || null,
    })), purchases });
  });

  app.get('/api/account/notifications', requireUser, (req, res) => {
    ensureAccountAlerts(req.user);
    const rows = notifications().filter(row => row.userId === req.user.id).slice(0, 100);
    res.set('Cache-Control', 'no-store').json({ notifications: rows.map(publicNotification), unread: rows.filter(row => !row.read).length });
  });
  app.put('/api/account/notifications/:id/read', requireUser, (req, res) => {
    const list = notifications();
    const row = list.find(item => item.id === req.params.id && item.userId === req.user.id);
    if (!row) return bad(res, 'Notification not found', 404);
    row.read = true;
    saveNotifications(list);
    res.json({ ok: true });
  });
  app.post('/api/account/notifications/read-all', requireUser, (req, res) => {
    const list = notifications();
    for (const row of list) if (row.userId === req.user.id) row.read = true;
    saveNotifications(list);
    res.json({ ok: true });
  });

  app.get('/api/account/devices', requireUser, (req, res) => {
    const currentToken = readCookie(req, 'user_session');
    const now = Date.now();
    const devices = [];
    for (const [token, session] of sessions) {
      if (session.exp < now) { sessions.delete(token); continue; }
      if (session.id !== req.user.id) continue;
      devices.push({
        id: session.sessionId,
        device: session.device,
        browser: session.browser || null,
        browserVersion: session.browserVersion || null,
        os: session.os || null,
        deviceType: session.deviceType || null,
        console: session.console || null,
        firmware: session.firmware || null,
        userAgent: session.userAgent || null,
        createdAt: new Date(session.createdAt).toISOString(),
        lastSeen: new Date(session.lastSeen || session.createdAt).toISOString(),
        current: token === currentToken,
      });
    }
    devices.sort((a, b) => Number(b.current) - Number(a.current) || b.lastSeen.localeCompare(a.lastSeen));
    res.set('Cache-Control', 'no-store').json({ devices });
  });
  app.delete('/api/account/devices/:id', requireUser, (req, res) => {
    const currentToken = readCookie(req, 'user_session');
    const currentSession = currentToken && sessions.get(currentToken);
    // The device making this request is the protected main device. It can
    // remove other sessions, but it cannot remove its own active session.
    if (!currentSession || currentSession.id !== req.user.id) return bad(res, 'Main device session required', 403);
    if (currentSession.sessionId === req.params.id) return bad(res, 'The main device cannot be removed', 400);
    let removed = false;
    for (const [token, session] of sessions) {
      if (session.id === req.user.id && session.sessionId === req.params.id) { sessions.delete(token); removed = true; }
    }
    if (!removed) return bad(res, 'Device session not found', 404);
    res.json({ ok: true });
  });

  const profileMessageLimit = limiter(12, 60 * 60 * 1000);
  app.post('/api/account/support', requireUser, profileMessageLimit, json, (req, res) => {
    const subject = str(req.body && req.body.subject, 160), message = str(req.body && req.body.message, 3000);
    if (!subject || !message) return bad(res, 'Subject and message are required');
    const list = J('messages.json', []);
    list.unshift({ id: uid(), userId: req.user.id, name: req.user.name, email: req.user.email, subject, message, source: 'profile-support', date: new Date().toISOString(), read: false });
    W('messages.json', list.slice(0, 1000));
    notify(req.user.id, { type: 'support', title_en: 'Support request received', title_fa: 'درخواست پشتیبانی دریافت شد', body_en: 'Our support team has received your message.', body_fa: 'پیام شما به تیم پشتیبانی رسید.' });
    res.json({ ok: true });
  });
  app.post('/api/account/feedback', requireUser, profileMessageLimit, json, (req, res) => {
    const category = str(req.body && req.body.category, 80) || 'idea', message = str(req.body && req.body.message, 3000);
    if (!message) return bad(res, 'Please write your idea or proposal');
    const list = J('feedback.json', []);
    list.unshift({ id: uid(), userId: req.user.id, name: req.user.name, email: req.user.email, category, message, date: new Date().toISOString(), status: 'new' });
    W('feedback.json', list.slice(0, 2000));
    notify(req.user.id, { type: 'feedback', title_en: 'Idea sent to Dr Game', title_fa: 'ایده شما ارسال شد', body_en: 'Thank you. We will review your idea or proposal.', body_fa: 'ممنون. ایده یا پیشنهاد شما بررسی می‌شود.' });
    res.json({ ok: true });
  });

  app.get('/api/account/quota-history', requireUser, (req, res) => {
    const rows = quotaLedger().filter(row => row.userId === req.user.id).slice(-100).reverse();
    res.set('Cache-Control', 'no-store').json(rows.map(row => ({
      id: row.id, reason: row.reason, ref: row.ref || null, date: row.date,
      deltaGB: row.deltaBytes / BYTES_PER_GB,
      usedGB: row.deltaBytes < 0 ? Math.abs(row.deltaBytes) / BYTES_PER_GB : 0,
      balanceAfterGB: row.balanceAfterBytes / BYTES_PER_GB,
    })));
  });

  app.get('/api/account/earnings', requireUser, (req, res) => {
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    if (!weeklyEarnings.isApprovedMarketer(user)) return bad(res, 'Weekly payment access has not been enabled for this account.', 403);
    if (!user.inviteCode) { promo.ensureInviteCode(user, list); saveUsers(list); }
    let sponsor = null, parentId = user.invitedBy, seen = new Set();
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      const parent = usersRO().find(u => u.id === parentId);
      if (!parent) break;
      if (weeklyEarnings.isApprovedMarketer(parent)) { sponsor = parent; break; }
      parentId = parent.invitedBy || parent.marketerParentId;
    }
    const now = Date.now();
    const period = weeklyEarnings.weeklyPeriod(now);
    const snapshot = rankSnapshotFor(period);
    const sales = commissionSales();
    const usersList = usersRO();
    const teamCounts = weeklyEarnings.teamSalesByMarketer(period, sales, usersList);
    const teamSales = teamCounts[user.id] || 0;
    const activeRank = snapshot.ranks[user.id] || { name: null, sales: 0, depth: 0 };
    const nextRank = weeklyEarnings.RANKS.find(r => r.sales > teamSales) || null;
    const balance = weeklyEarnings.commissionBalance(sales, user.id, now, user);
    const recent = sales.slice().reverse().flatMap(sale => (sale.lines || []).filter(line => line.recipientId === user.id).map(line => ({
      orderId: sale.orderId, date: sale.deliveredAt, level: line.level, amount: line.amount, status: sale.reversedAt ? 'reversed' : line.status,
      releaseAt: sale.releaseAt, periodStart: sale.period.start,
    }))).slice(0, 25);
    res.set('Cache-Control', 'no-store').json({
      eligible: weeklyEarnings.isApprovedMarketer(user), approvalStatus: user.marketerApproved ? 'approved' : 'not-approved',
      identityVerified: !!user.identityVerified, bankVerified: !!user.bankVerified,
      sponsor: sponsor ? { id: sponsor.id, name: sponsor.name } : null,
      code: user.inviteCode, referralLink: '/account.html?invite=' + encodeURIComponent(user.inviteCode),
      period, rankThisWeek: activeRank, teamSalesThisWeek: teamSales,
      rankForNextWeek: weeklyEarnings.rankForSales(teamSales), nextRank, layersOpen: activeRank.depth || 0,
      pending: balance.pending, payable: balance.payable, paid: balance.paid, reversed: balance.reversed,
      debt: debtForMarketer(user.id),
      recent,
    });
  });


  app.get('/api/account/wishlist', requireUser, (req, res) => {
    res.set('Cache-Control', 'no-store').json({ slugs: req.user.wishlist || [] });
  });
  app.put('/api/account/wishlist', requireUser, json, (req, res) => {
    const slugs = req.body && req.body.slugs;
    if (!Array.isArray(slugs) || slugs.length > 500 || slugs.some(s => typeof s !== 'string' || !/^[a-z0-9-]{1,160}$/.test(s))) return bad(res, 'Invalid wishlist');
    const valid = new Set(J('games.json', []).map(g => slugify(g.title)));
    const clean = [...new Set(slugs)].filter(s => valid.has(s));
    helpers.Upd('users.json', req.user.id, u => { u.wishlist = clean; });
    res.json({ slugs: clean });
  });
  app.get('/api/games/:slug/wishlist-count', (req, res) => {
    const slug = String(req.params.slug || '');
    const exists = J('games.json', []).some(g => slugify(g.title) === slug);
    if (!exists) return res.status(404).json({ error: 'Game not found' });
    const count = usersRO().reduce((total, user) => total + (Array.isArray(user.wishlist) && user.wishlist.includes(slug) ? 1 : 0), 0);
    res.set('Cache-Control', 'no-store').json({ slug, count });
  });
  app.get('/api/games/:slug/reactions', (req, res) => {
    const slug = String(req.params.slug || '');
    const exists = J('games.json', []).some(game => slugify(game.title) === slug);
    if (!exists) return res.status(404).json({ error: 'Game not found' });
    const user = sessionUser(req);
    const counts = gameReactions.countReactions(usersRO(), slug);
    res.set('Cache-Control', 'no-store').json({
      slug, ...counts, choice: user && user.gameReactions && user.gameReactions[slug] || '', authenticated: !!user,
    });
  });
  app.put('/api/games/:slug/reactions', requireUser, limiter(60, 60 * 60 * 1000), json, (req, res) => {
    const slug = String(req.params.slug || '');
    const exists = J('games.json', []).some(game => slugify(game.title) === slug);
    if (!exists) return res.status(404).json({ error: 'Game not found' });
    const choice = gameReactions.normalizeChoice(req.body && req.body.choice);
    if (choice === null) return bad(res, 'Choose like or dislike, or clear your reaction.');
    helpers.Upd('users.json', req.user.id, user => {
      if (!user || typeof user !== 'object') return;
      if (!user.gameReactions || typeof user.gameReactions !== 'object' || Array.isArray(user.gameReactions)) user.gameReactions = {};
      if (choice) user.gameReactions[slug] = choice;
      else delete user.gameReactions[slug];
    });
    const user = usersRO().find(account => account.id === req.user.id);
    const counts = gameReactions.countReactions(usersRO(), slug);
    res.set('Cache-Control', 'no-store').json({ slug, ...counts, choice: user && user.gameReactions && user.gameReactions[slug] || '', authenticated: true });
  });
  // ---------- store ----------
  app.get('/api/store', (req, res) => {
    const s = settings();
    // This value is used only to show whether subscription requests are simulated.
    res.json({ mode: s.mode });
  });

  // Marks an order paid and applies it. Used by test mode and admin approval.
  function fulfil(order, how) {
    const list = users();
    const user = list.find(u => u.id === order.userId);
    if (!user) return false;
    if (order.type === 'subscription') {
      const plan = planById(order.planId);
      const samePlanStillActive = user.plan === order.planId && user.planEnd && new Date(user.planEnd) > new Date();
      const existingQuota = samePlanStillActive ? quotaBytesForUser(user) : 0;
      const start = samePlanStillActive ? new Date(user.planEnd) : new Date();
      user.plan = order.planId;
      user.planEnd = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const allowance = quotaBytesForGB(plan && plan.quotaGB);
      user.downloadQuotaBytes = existingQuota + allowance;
      user.downloadQuotaUpdatedAt = new Date().toISOString();
      saveUsers(list);
    } else return false;
    order.deliveredAt = new Date().toISOString();
    order.status = 'paid';
    order.how = how;
    order.decidedAt = new Date().toISOString();
    notify(order.userId, {
      type: 'payment', title_en: 'Subscription payment confirmed', title_fa: 'پرداخت اشتراک تأیید شد',
      body_en: (order.label || 'Subscription') + ' is active. Paid amount: ' + (order.price || '—') + '.', body_fa: 'اشتراک «' + (order.label || 'اشتراک') + '» فعال شد. مبلغ پرداختی: ' + (order.price || '—') + '.',
    });
    if (order.type === 'subscription') recordCommissionSale(order);
    return true;
  }

  function createOrder(user, fields) {
    const orders = J('orders.json', []);
    if (orders.filter(o => o.userId === user.id && o.status === 'pending').length >= 5) return { error: 'You already have 5 orders waiting for confirmation.' };
    const mode = settings().mode;
    const order = {
      id: uid(), userId: user.id, userName: user.name, userEmail: user.email,
      ...fields, status: 'pending', mode, date: new Date().toISOString(),
    };
    orders.unshift(order);
    notify(user.id, {
      type: 'payment', title_en: 'Subscription order received', title_fa: 'سفارش اشتراک ثبت شد',
      body_en: (order.label || 'Subscription') + ' · ' + (order.price || '—') + '. Status: waiting for payment confirmation.', body_fa: 'اشتراک «' + (order.label || 'اشتراک') + '» · ' + (order.price || '—') + '؛ وضعیت: در انتظار تأیید پرداخت.',
    });
    if (mode === 'test') fulfil(order, 'test-mode (simulated payment)');
    W('orders.json', orders.slice(0, 5000));
    return { order };
  }

  // An activated subscription discount lowers the order price.
  function buyWithCode(req, res, kind, fields) {
    const probe = usersRO().find(x => x.id === req.user.id);
    const disc = promo.peek(probe, kind);
    const orderId = uid();
    const r = createOrder(req.user, {
      id: orderId, ...fields,
      price: disc ? promo.discountLabel(fields.price, disc.percent) : fields.price,
      originalPrice: disc ? fields.price : undefined, discountCode: disc ? disc.code : undefined, discountPercent: disc ? disc.percent : undefined,
    });
    if (r.error) return bad(res, r.error, 429);
    if (disc) {
      const list = users();
      promo.consume(list, list.find(x => x.id === req.user.id), kind, orderId);
    }
    res.json({ order: r.order, user: publicUser(usersRO().find(u => u.id === req.user.id)) });
  }

  app.post('/api/store/buy', requireUser, limiter(30, 60 * 60 * 1000), json, (req, res) => {
    return bad(res, 'Token packs are retired. Choose a subscription plan for download quota.', 410);
  });

  app.post('/api/account/subscribe', requireUser, limiter(30, 60 * 60 * 1000), json, (req, res) => {
    const plan = planById(req.body && req.body.planId);
    if (!plan) return bad(res, 'Unknown plan');
    if (plan.id === 'free') {
      const list = users();
      const user = list.find(u => u.id === req.user.id);
      if (!user) return bad(res, 'Customer account not found', 404);
      if (user.freeGamePlanActivatedAt) {
        return res.json({
          order: { status: 'active', planId: 'free', alreadyActivated: true },
          user: publicUser(user),
        });
      }
      const now = new Date().toISOString();
      user.freeGamePlanActivatedAt = now;
      const paidActive = user.plan && user.plan !== 'free' && user.planEnd && new Date(user.planEnd) > new Date(now);
      if (!paidActive) {
        user.plan = 'free';
        user.planEnd = null;
      }
      saveUsers(list);
      notify(user.id, { type: 'subscription', title_en: 'Free plan activated', title_fa: 'پلن رایگان فعال شد', body_en: 'Your free games access is ready.', body_fa: 'دسترسی شما به بازی‌های پلن رایگان آماده است.' });
      return res.json({ order: { status: 'active', planId: 'free' }, user: publicUser(user) });
    }
    const customer = usersRO().find(user => user.id === req.user.id);
    const marketer = nearestApprovedMarketer(customer);
    buyWithCode(req, res, 'plans', {
      type: 'subscription', planId: plan.id, label: plan.name_en,
      quotaGB: Number(plan.quotaGB) || 0, price: plan.price_en,
      attributedMarketerId: marketer && marketer.id || null,
    });
  });

  // ---------- admin ----------
  // (Everything under /api/admin is already behind the admin login guard.)
  app.get('/api/admin/token-settings', (req, res) => bad(res, 'Token packs have been retired. Manage download allowances in Subscriptions.', 410));
  app.put('/api/admin/token-settings', (req, res) => bad(res, 'Token packs have been retired. Manage download allowances in Subscriptions.', 410));

  // Emails that were not really sent because SMTP is not configured (developer view).
  app.get('/api/admin/outbox', (req, res) => {
    // The outbox contains live verification codes. Keep it restricted to the root admin.
    if (!helpers.isRootAdmin || !helpers.isRootAdmin(req)) return bad(res, 'Only the root admin can view verification outbox messages', 403);
    const email = mailer.status();
    res.json({
      // smtpConfigured is kept as a backwards-compatible alias for the admin UI.
      ...email, smtpConfigured: email.configured, messages: mailer.readOutbox().slice(0, 15),
      sms: { ...sms.status(), messages: sms.readOutbox().slice(0, 10) },
    });
  });
  // Checks the sms.ir key with a read-only call (no SMS is sent, no cost).
  app.get('/api/admin/sms/check', async (req, res) => {
    const s = require('./sms');
    try { res.json({ ok: true, credit: await s.credit(), ...s.status() }); }
    catch (e) { res.json({ ok: false, error: e.message, ...s.status() }); }
  });
  app.get('/api/admin/email/check', async (req, res) => {
    if (!helpers.isRootAdmin || !helpers.isRootAdmin(req)) return bad(res, 'Only the root admin can test email delivery settings', 403);
    try { await mailer.verify(); res.json({ ok: true, provider: mailer.provider() }); }
    catch (e) { res.json({ ok: false, error: e.message }); }
  });
  app.get('/api/admin/orders', (req, res) => res.json(J('orders.json', [])));
  app.post('/api/admin/orders/:id/:action', (req, res) => {
    const orders = J('orders.json', []);
    const order = orders.find(o => o.id === req.params.id);
    if (!order) return bad(res, 'Unknown order', 404);
    if (order.type !== 'subscription') return bad(res, 'Only subscription orders can be fulfilled.', 410);
    if (order.status !== 'pending') return bad(res, 'This order was already ' + order.status, 409);
    if (req.params.action === 'approve') {
      if (!fulfil(order, 'admin-approved')) return bad(res, 'The customer account no longer exists', 409);
    } else if (req.params.action === 'reject') {
      order.status = 'rejected';
      order.decidedAt = new Date().toISOString();
      promo.release(order.id);
      notify(order.userId, { type: 'payment', title_en: 'Subscription order declined', title_fa: 'سفارش اشتراک رد شد', body_en: 'Your subscription order was declined. Please contact support if you need help.', body_fa: 'سفارش اشتراک شما رد شد. اگر به کمک نیاز دارید با پشتیبانی تماس بگیرید.' });
    } else return bad(res, 'Unknown action', 404);
    W('orders.json', orders);
    res.json(order);
  });

  // Everything the admin needs to know about one customer account.
  function userSummary(u, orders, buys, ledger) {
    const mineOrders = orders.filter(o => o.userId === u.id);
    const paid = mineOrders.filter(o => o.status === 'paid');
    const myBuys = buys.filter(p => p.userId === u.id);
    return {
      ...publicUser(u),
      created: u.created,
      phoneVerified: !!u.phoneVerified,
      phoneVerifiedAt: u.phoneVerifiedAt || null,
      lastLogin: u.lastLogin || null,
      logins: u.logins || 0,
      verified: u.verified !== false, // accounts made before verification existed count as verified
      orders: mineOrders.length,
      ordersPaid: paid.length,
      ordersPending: mineOrders.filter(o => o.status === 'pending').length,
      gamesUnlocked: myBuys.filter(p => p.gameUnlock === true).length,
      filesUnlocked: myBuys.filter(p => p.gameUnlock !== true).length,
      quotaUsedGB: myBuys.reduce((s, p) => s + (Number(p.quotaBytesCharged) || 0) / BYTES_PER_GB, 0),
      ...promo.inviteInfo(u, usersRO()),
      marketerApproved: !!u.marketerApproved,
      identityVerified: !!u.identityVerified,
      bankVerified: !!u.bankVerified,
      marketerParentId: u.marketerParentId || null,
    };
  }

  function nearestApprovedAncestor(user, allUsers) {
    let id = user.invitedBy;
    const seen = new Set([user.id]);
    while (id && !seen.has(id)) {
      seen.add(id);
      const parent = allUsers.find(u => u.id === id);
      if (!parent) return null;
      if (weeklyEarnings.isApprovedMarketer(parent)) return parent.id;
      id = parent.invitedBy || parent.marketerParentId;
    }
    return null;
  }

  app.get('/api/admin/earnings', (req, res) => {
    const now = Date.now();
    const period = weeklyEarnings.weeklyPeriod(now);
    const snapshot = rankSnapshotFor(period);
    const allUsers = usersRO();
    const sales = commissionSales().slice().reverse();
    const config = configFor(now);
    const counts = weeklyEarnings.teamSalesByMarketer(period, sales, allUsers);
    const usersById = new Map(allUsers.map(user => [user.id, user]));
    const directInviteCounts = new Map();
    for (const user of allUsers) {
      if (user.invitedBy) directInviteCounts.set(user.invitedBy, (directInviteCounts.get(user.invitedBy) || 0) + 1);
    }
    const weekIncomeByMarketer = new Map();
    const incomeByMarketer = new Map(allUsers.map(user => [user.id, { pending: 0, payable: 0, paid: 0, reversed: 0, debt: debtForMarketer(user.id) }]));
    const directSalesByMarketer = new Map();
    const weekSales = sales.filter(sale => sale.period && sale.period.start === period.start);
    const activeWeekSales = weekSales.filter(sale => !sale.reversedAt);
    for (const sale of activeWeekSales) {
      const sellerId = sale.attributedMarketerId;
      if (sellerId) directSalesByMarketer.set(sellerId, (directSalesByMarketer.get(sellerId) || 0) + 1);
    }
    for (const sale of sales) {
      for (const line of sale.lines || []) {
        if (!line.recipientId) continue;
        const recipient = usersById.get(line.recipientId);
        const lifetime = incomeByMarketer.get(line.recipientId);
        if (lifetime) {
          const amount = Number(line.amount) || 0;
          if (sale.reversedAt || line.status === 'reversed') {
            lifetime.reversed += Math.abs(amount);
          } else if (line.status === 'paid') lifetime.paid += amount;
          else if (new Date(sale.releaseAt).getTime() <= now && weeklyEarnings.isApprovedMarketer(recipient) && recipient.identityVerified && recipient.bankVerified) lifetime.payable += amount;
          else lifetime.pending += amount;
        }
      }
    }
    for (const sale of activeWeekSales) {
      for (const line of sale.lines || []) {
        if (!line.recipientId) continue;
        const recipient = usersById.get(line.recipientId);
        const income = weekIncomeByMarketer.get(line.recipientId) || { pending: 0, payable: 0, paid: 0, reversed: 0 };
        if (line.status === 'reversed') income.reversed += Math.abs(Number(line.amount) || 0);
        else if (line.status === 'paid') income.paid += Number(line.amount) || 0;
        else {
          const released = new Date(sale.releaseAt).getTime() <= now;
          if (released && weeklyEarnings.isApprovedMarketer(recipient) && recipient.identityVerified && recipient.bankVerified) income.payable += Number(line.amount) || 0;
          else income.pending += Number(line.amount) || 0;
        }
        weekIncomeByMarketer.set(line.recipientId, income);
      }
    }
    const marketers = allUsers.map(user => {
      const income = incomeByMarketer.get(user.id) || { pending: 0, payable: 0, paid: 0, reversed: 0, debt: 0 };
      const weekIncome = weekIncomeByMarketer.get(user.id) || { pending: 0, payable: 0, paid: 0, reversed: 0 };
      return {
        id: user.id, name: user.name, email: user.email, inviteCode: user.inviteCode || null,
        invitedBy: user.invitedBy || null, marketerParentId: user.marketerParentId || null,
        approved: !!user.marketerApproved, siteAdmin: user.admin === true,
        identityVerified: !!user.identityVerified, bankVerified: !!user.bankVerified,
        directInvites: directInviteCounts.get(user.id) || 0,
        directSalesThisWeek: directSalesByMarketer.get(user.id) || 0,
        teamSalesThisWeek: counts[user.id] || 0,
        rankThisWeek: snapshot.ranks[user.id] || { name: null, depth: 0 },
        income: { ...income },
        weekIncome: { ...weekIncome, total: weekIncome.pending + weekIncome.payable + weekIncome.paid },
      };
    });
    const weekTotals = activeWeekSales.reduce((sum, sale) => {
      sum.sales += 1;
      sum.budget += sale.amount || 0;
      sum.reserve += sale.reserve && sale.reserve.amount || 0;
      sum.unallocated += (sale.unallocated || []).reduce((n, line) => n + line.amount, 0);
      for (const line of sale.lines || []) {
        if (line.status === 'paid') sum.paid += line.amount || 0;
        else if (line.status === 'pending') sum.pending += line.amount || 0;
      }
      return sum;
    }, { sales: 0, budget: 0, reserve: 0, unallocated: 0, pending: 0, paid: 0, reversed: weekSales.length - activeWeekSales.length });
    const totals = sales.reduce((sum, sale) => {
      if (sale.reversedAt) { sum.reversed += 1; return sum; }
      sum.sales += 1; sum.budget += sale.amount || 0;
      sum.reserve += sale.reserve && sale.reserve.amount || 0;
      sum.unallocated += (sale.unallocated || []).reduce((n, line) => n + line.amount, 0);
      sum.pending += (sale.lines || []).filter(line => line.status === 'pending').reduce((n, line) => n + line.amount, 0);
      sum.paid += (sale.lines || []).filter(line => line.status === 'paid').reduce((n, line) => n + line.amount, 0);
      return sum;
    }, { sales: 0, budget: 0, reserve: 0, unallocated: 0, pending: 0, paid: 0, reversed: 0 });
    res.set('Cache-Control', 'no-store').json({ testMode: true, period, config, configs: earningsConfigs(), snapshot, marketers, sales: sales.slice(0, 500), weekTotals, totals, settlements: J('weekly-commission-settlements.json', []).slice(-30).reverse(), reports: J('weekly-close-reports.json', []).slice(-20).reverse() });
  });

  app.put('/api/admin/earnings/marketers/:id', (req, res) => {
    const list = users();
    const user = list.find(u => u.id === req.params.id);
    if (!user) return bad(res, 'Unknown user', 404);
    const b = req.body || {};
    if (typeof b.approved !== 'boolean' || typeof b.identityVerified !== 'boolean' || typeof b.bankVerified !== 'boolean') return bad(res, 'Choose marketer approval, identity verification, and bank verification states.');
    user.marketerApproved = b.approved;
    user.identityVerified = b.identityVerified;
    user.bankVerified = b.bankVerified;
    if (b.approved) user.marketerParentId = nearestApprovedAncestor(user, list);
    user.marketerReviewedAt = new Date().toISOString();
    saveUsers(list);
    res.json({ ok: true, id: user.id, approved: user.marketerApproved, identityVerified: user.identityVerified, bankVerified: user.bankVerified, marketerParentId: user.marketerParentId || null });
  });

  app.post('/api/admin/earnings/settings', (req, res) => {
    const b = req.body || {};
    const integer = v => Number.isInteger(Number(v)) ? Number(v) : null;
    const budgetToman = integer(b.budgetToman), directToman = integer(b.directToman), reserveToman = integer(b.reserveToman), holdDays = integer(b.holdDays);
    const uplineToman = Array.isArray(b.uplineToman) ? b.uplineToman.map(integer) : [];
    if (budgetToman !== 100000 || directToman === null || reserveToman === null || holdDays === null || holdDays < 0 || holdDays > 30 || uplineToman.length !== 7 || uplineToman.some(n => n === null || n < 0)) return bad(res, 'Use a 100,000 toman budget, seven non-negative layer amounts, and a 0-30 day hold.');
    if (directToman < 0 || reserveToman < 0 || directToman + reserveToman + uplineToman.reduce((a, b) => a + b, 0) !== budgetToman) return bad(res, 'Direct, seven layer shares, and reserve must add up to exactly 100,000 toman.');
    const configs = earningsConfigs();
    const version = Math.max(0, ...configs.map(c => c.version || 0)) + 1;
    const currentPeriod = weeklyEarnings.weeklyPeriod(Date.now());
    const next = { version, effectiveAt: currentPeriod.end, testMode: true, budgetToman, directToman, uplineToman, reserveToman, holdDays, ranks: weeklyEarnings.RANKS.map(r => ({ ...r })) };
    configs.push(next);
    W('weekly-earnings-configs.json', configs.slice(-100));
    res.json({ ok: true, config: next });
  });

  app.post('/api/admin/earnings/settle', (req, res) => {
    const run = simulateDueSettlement(Date.now(), 'manual-test-run');
    res.json(run ? { ok: true, simulated: true, settlement: run } : { ok: true, simulated: true, payouts: [], message: 'No finalized, verified commissions are payable yet.' });
  });

  app.post('/api/admin/earnings/orders/:id/refund', (req, res) => {
    const orders = J('orders.json', []);
    const order = orders.find(row => row.id === req.params.id);
    if (!order) return bad(res, 'Unknown order', 404);
    if (order.mode !== 'test' || order.type !== 'subscription') return bad(res, 'Refund reversal simulation is only available for test-mode subscription orders.', 409);
    if (order.status !== 'paid') return bad(res, 'Only a paid test order can be reversed.', 409);
    const sales = commissionSales();
    const sale = sales.find(row => row.orderId === order.id);
    if (!sale) return bad(res, 'This order did not create an attributed commission sale.', 409);
    if (sale.reversedAt) return bad(res, 'This sale already has a refund reversal.', 409);
    const reversal = weeklyEarnings.reverseOrder(sale);
    sale.reversedAt = new Date().toISOString();
    sale.reversalId = reversal.id;
    const reversals = J('weekly-commission-reversals.json', []);
    reversals.push(reversal);
    W('weekly-commission-reversals.json', reversals.slice(-20000));
    const debts = commissionDebts();
    for (const line of sale.lines || []) if (line.status === 'paid') debts.push({ id: uid(), marketerId: line.recipientId, orderId: sale.orderId, amountToman: line.amount, outstandingToman: line.amount, createdAt: sale.reversedAt, reason: 'settled commission reversed by test refund' });
    W('weekly-commission-debts.json', debts.slice(-20000));
    W('weekly-commission-sales.json', sales);
    order.status = 'refund-simulated';
    order.refundedAt = sale.reversedAt;
    W('orders.json', orders);
    res.json({ ok: true, simulated: true, orderId: order.id, reversal });
  });

  app.get('/api/admin/users', (req, res) => {
    const orders = J('orders.json', []);
    const buys = J('purchases.json', []);
    res.json(users().map(u => userSummary(u, orders, buys)));
  });
  // Keep registrations that are waiting for email verification visible to the
  // admin too. They are not active accounts yet, so never expose password or
  // verification-code fields in this management view.
  app.get('/api/admin/pending-signups', (req, res) => {
    const now = Date.now();
    const list = pendings().filter(p => p && p.email && Number(p.expires) > now - 3600 * 1000);
    savePendings(list);
    res.json(list.map(p => ({
      email: p.email,
      username: p.username || '',
      name: p.name || [p.firstName, p.lastName].filter(Boolean).join(' '),
      phone: p.phone || '',
      created: p.sentAt ? new Date(p.sentAt).toISOString() : null,
      expires: p.expires ? new Date(p.expires).toISOString() : null,
      tries: Number(p.tries) || 0,
      status: Number(p.expires) > now ? 'awaiting-verification' : 'expired',
    })).sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0)));
  });
  app.delete('/api/admin/pending-signups/:email', (req, res) => {
    const email = String(req.params.email || '').toLowerCase();
    const list = pendings();
    const next = list.filter(p => String(p.email || '').toLowerCase() !== email);
    if (next.length === list.length) return bad(res, 'Pending signup not found', 404);
    savePendings(next);
    res.json({ ok: true, email });
  });
  app.get('/api/admin/users/:id', (req, res) => {
    const u = users().find(x => x.id === req.params.id);
    if (!u) return bad(res, 'Unknown user', 404);
    const orders = J('orders.json', []);
    const buys = J('purchases.json', []);
    res.json({
      ...userSummary(u, orders, buys),
      orderList: orders.filter(o => o.userId === u.id).slice(0, 100),
      files: buys.filter(p => p.userId === u.id).slice(-100).reverse(),
      ledger: J('wallet-ledger.json', []).filter(x => x.userId === u.id).slice(-100).reverse(),
    });
  });
  app.post('/api/admin/users/:id/admin', (req, res) => {
    if (!helpers.isRootAdmin || !helpers.isRootAdmin(req)) return bad(res, 'Only the root admin can grant or remove administrator access', 403);
    const enabled = req.body && req.body.enabled;
    if (typeof enabled !== 'boolean') return bad(res, 'Choose whether administrator access should be enabled.');
    const list = users();
    const user = list.find(x => x.id === req.params.id);
    if (!user) return bad(res, 'Unknown user', 404);
    if (user.verified === false) return bad(res, 'Verify this account before granting administrator access.');
    user.admin = enabled;
    saveUsers(list);
    if (helpers.revokeAdminSessions) helpers.revokeAdminSessions(user.id);
    res.json({ ok: true, id: user.id, isAdmin: user.admin });
  });
  app.post('/api/admin/users/:id/adjust', (req, res) => {
    return bad(res, 'Customer access is managed through subscription download quota.', 410);
  });
  app.delete('/api/admin/users/:id', (req, res) => {
    const list = users();
    const next = list.filter(u => u.id !== req.params.id);
    if (next.length === list.length) return bad(res, 'Unknown user', 404);
    saveUsers(next);
    for (const [t, s] of sessions) if (s.id === req.params.id) sessions.delete(t);
    res.json({ ok: true });
  });
  app.get('/api/admin/users/:id/ledger', (req, res) => {
    res.json(J('wallet-ledger.json', []).filter(x => x.userId === req.params.id).slice(-200).reverse());
  });

  // ---------- full-game access against subscription download quota ----------
  const SLUG_RE = /^[a-z0-9-]{1,160}$/;
  const gameQuota = slug => gameQuotaGB(gameFolderSizeBytes(slug));
  const purchases = () => J('purchases.json', []);
  const ownsFile = (userId, slug, name, list) => (list || purchases()).some(p => p.userId === userId && p.slug === slug && p.file === name);
  const ownsGame = (userId, slug, list) => (list || purchases()).some(p => p.userId === userId && p.slug === slug && p.gameUnlock === true);

  function annotate(req, slug, files) {
    const user = sessionUser(req);
    const admin = isAdmin(req);
    const mine = user ? purchases().filter(p => p.userId === user.id && p.slug === slug) : [];
    const freeGameAccess = freeGamePlan.canUseFreeGame(user, slug);
    const quotaGB = gameQuota(slug) || 0;
    const activePaidPlan = !!(user && user.plan && user.plan !== 'free' && user.planEnd && new Date(user.planEnd) > new Date());
    const gamePurchase = mine.find(p => p.gameUnlock === true);
    const gameUnlock = !!gamePurchase && (!gamePurchase.quotaBased || activePaidPlan);
    const hasLegacyFilePurchase = mine.some(p => !p.gameUnlock && !p.quotaBased && p.file !== '*');
    const planHasEnoughQuota = activePaidPlan && quotaBytesForUser(user) >= gameFolderSizeBytes(slug);
    return files.map(f => {
      const owned = admin || quotaGB === 0 || gameUnlock || hasLegacyFilePurchase || (quotaGB > 0 && freeGameAccess);
      // Locked images must not leak: the page would otherwise use the file as its own preview.
      return { ...f, quotaGB, gameQuotaGB: quotaGB, gameUnlock, owned, locked: !owned, activePaidPlan, planHasEnoughQuota };
    });
  }

  function canDownload(req, category, filename) {
    if (isAdmin(req)) return { ok: true };
    const quotaGB = gameQuota(category) || 0;
    if (quotaGB === 0) return { ok: true };
    const user = sessionUser(req);
    if (!user) return { ok: false, status: 401, message: 'Log in and use an active subscription to unlock this game.' };
    const gamePurchase = purchases().find(p => p.userId === user.id && p.slug === category && p.gameUnlock === true);
    const legacyOwned = gamePurchase && !gamePurchase.quotaBased;
    const activePaidPlan = user.plan && user.plan !== 'free' && user.planEnd && new Date(user.planEnd) > new Date();
    if (gamePurchase && gamePurchase.quotaBased && !activePaidPlan) return { ok: false, status: 403, message: 'Your subscription has expired. Renew a plan to access this game.' };
    if (!legacyOwned && !ownsGame(user.id, category) && !ownsFile(user.id, category, filename)) {
      const list = users();
      const savedUser = list.find(u => u.id === user.id);
      if (savedUser && savedUser.freeGamePlanActivatedAt) {
        if (freeGamePlan.claimFreeGame(savedUser, category)) {
          return { ok: true };
        }
      }
      return { ok: false, status: 402, message: 'Unlock this game with your subscription download quota first.' };
    }
    return { ok: true };
  }

  function gameFolderSizeBytes(slug) {
    if (!SLUG_RE.test(String(slug || ''))) return Infinity;
    const root = path.resolve(MEDIA_DIR);
    const dir = path.resolve(root, slug);
    if (!dir.startsWith(root + path.sep) || !fs.existsSync(dir)) return Infinity;
    try {
      return fs.readdirSync(dir, { withFileTypes: true })
        .filter(entry => entry.isFile())
        .reduce((sum, entry) => sum + fs.statSync(path.join(dir, entry.name)).size, 0);
    } catch (error) {
      return Infinity;
    }
  }

  const safeName = n => {
    const base = path.basename(String(n || '')).replace(/[^\w .()\[\]+&'-]/g, '_').replace(/\s+/g, ' ').trim().replace(/^\.+/, '');
    return base.slice(0, 150);
  };
  const ALLOWED_EXT = new Set(['.mp4', '.mov', '.mkv', '.webm', '.avi', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip', '.rar', '.7z', '.tar', '.gz', '.srt', '.vtt', '.ass', '.sub', '.pdf', '.txt']);
  const gameExists = slug => SLUG_RE.test(slug) && J('games.json', []).some(g => slugify(g.title) === slug);

  app.post('/api/store/buy-file', requireUser, limiter(120, 60 * 60 * 1000), json, (req, res) => {
    const slug = str(req.body && req.body.slug, 160);
    const name = safeName(req.body && req.body.file);
    if (!SLUG_RE.test(slug) || !name || !fs.existsSync(path.join(MEDIA_DIR, slug, name))) return bad(res, 'File not found', 404);
    const gameBytes = gameFolderSizeBytes(slug);
    const quotaGB = gameQuotaGB(gameBytes);
    if (!Number.isFinite(gameBytes) || gameBytes <= 0 || quotaGB === null) return bad(res, 'Game size is not available for quota calculation yet.', 409);
    const list = users();
    const user = list.find(u => u.id === req.user.id);
    const existingPurchase = purchases().find(p => p.userId === user.id && p.slug === slug && p.gameUnlock === true);
    const activePaidPlan = user.plan && user.plan !== 'free' && user.planEnd && new Date(user.planEnd) > new Date();
    if (existingPurchase) {
      if (existingPurchase.quotaBased && !activePaidPlan) return bad(res, 'Your subscription has expired. Renew a plan to access this game.', 403);
      return res.json({ ok: true, already: true, gameUnlock: true, user: publicUser(user) });
    }
    if (freeGamePlan.canUseFreeGame(user, slug)) return res.json({ ok: true, already: true, free: true, user: publicUser(user) });
    if (!activePaidPlan) return bad(res, 'An active paid subscription is required to unlock this game.', 403);
    const currentQuotaBytes = quotaBytesForUser(user);
    if (currentQuotaBytes < gameBytes) return res.status(402).json({ error: 'Not enough download quota', requiredGB: quotaGB, remainingGB: currentQuotaBytes / BYTES_PER_GB });
    if (applyQuotaCharge(list, user, gameBytes, 'Unlocked game: ' + slug, slug) === null) return bad(res, 'Not enough download quota', 402);
    const all = purchases();
    all.push({ id: uid(), userId: user.id, userName: user.name, slug, file: '*', gameUnlock: true, quotaBased: true, gameSizeBytes: gameBytes, quotaBytesCharged: gameBytes, quotaGB, date: new Date().toISOString() });
    W('purchases.json', all.slice(-50000));
    const gameTitle = J('games.json', []).find(game => slugify(game.title) === slug)?.title || slug;
    notify(user.id, {
      type: 'purchase', title_en: 'Game unlocked', title_fa: 'بازی باز شد',
      body_en: gameTitle + ' · ' + quotaGB + ' GB of download allowance used.', body_fa: gameTitle + ' · ' + quotaGB + ' گیگابایت از سهمیه دانلود مصرف شد.',
    });
    res.json({ ok: true, quotaGB, gameUnlock: true, user: publicUser(user) });
  });

  // ----- admin: manage a game's files; price is calculated from total size -----
  app.get('/api/admin/games/:slug/files', (req, res) => {
    const slug = req.params.slug;
    if (!gameExists(slug)) return bad(res, 'Unknown game', 404);
    const sizeBytes = gameFolderSizeBytes(slug);
    res.json({
      gameSizeBytes: Number.isFinite(sizeBytes) ? sizeBytes : 0,
      gameSizeGB: Number.isFinite(sizeBytes) ? Number((sizeBytes / (1024 ** 3)).toFixed(2)) : 0,
      gameQuotaGB: gameQuota(slug),
      files: listCategoryFiles(slug).map(f => ({ name: f.name, type: f.type, sizeMB: f.sizeMB })),
    });
  });
  app.put('/api/admin/games/:slug/default-price', (req, res) => {
    return bad(res, 'Game quota use is calculated automatically from the total game size.', 409);
  });
  app.put('/api/admin/games/:slug/file-price', (req, res) => {
    return bad(res, 'Game quota use is calculated automatically from the total game size.', 409);
  });
  app.delete('/api/admin/games/:slug/files', (req, res) => {
    const slug = req.params.slug;
    const name = safeName(req.query.name);
    if (!gameExists(slug) || !name) return bad(res, 'Unknown file', 404);
    const target = path.join(MEDIA_DIR, slug, name);
    if (!fs.existsSync(target)) return bad(res, 'Unknown file', 404);
    fs.unlinkSync(target);
    app.emit('files-changed');
    const thumb = path.join(path.dirname(MEDIA_DIR), 'thumbs', slug, path.parse(name).name + '.jpg');
    if (fs.existsSync(thumb)) fs.unlinkSync(thumb);
    res.json({ ok: true });
  });

  // Streaming upload (no size held in memory): body is the raw file.
  const MAX_UPLOAD = 6 * 1024 * 1024 * 1024; // 6 GB
  app.post('/api/admin/games/:slug/files', (req, res) => {
    const slug = req.params.slug;
    if (!gameExists(slug)) return bad(res, 'Unknown game', 404);
    const name = safeName(req.query.name);
    const ext = path.extname(name).toLowerCase();
    if (!name || !ALLOWED_EXT.has(ext)) return bad(res, 'File type not allowed (' + (ext || 'no extension') + ')');
    const declared = parseInt(req.headers['content-length'], 10);
    if (declared > MAX_UPLOAD) return bad(res, 'File is too large (max 6 GB)', 413);
    const dir = path.join(MEDIA_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    const target = path.join(dir, name);
    if (fs.existsSync(target) && req.query.overwrite !== '1') return bad(res, 'A file with this name already exists', 409);
    const part = target + '.part';
    const out = fs.createWriteStream(part);
    let bytes = 0, failed = false;
    const fail = (code, msg) => {
      if (failed) return;
      failed = true;
      out.destroy();
      fs.rm(part, { force: true }, () => {});
      if (!res.headersSent) bad(res, msg, code);
    };
    req.on('data', chunk => { bytes += chunk.length; if (bytes > MAX_UPLOAD) { req.unpipe(out); fail(413, 'File is too large (max 6 GB)'); } });
    req.on('aborted', () => fail(400, 'Upload cancelled'));
    req.on('error', () => fail(400, 'Upload failed'));
    out.on('error', () => fail(500, 'Could not save the file'));
    out.on('finish', () => {
      if (failed) return;
      fs.renameSync(part, target);
      try { generateThumbnails(); } catch (e) { /* thumbnails are optional */ }
      app.emit('file-added', slug, name);
      res.json({ ok: true, name, bytes });
    });
    req.pipe(out);
  });

  app.get('/api/admin/purchases', (req, res) => res.json(purchases().slice(-200).reverse()));

    promo = require('./promo')(app, helpers, { users, usersRO, saveUsers, publicUser, requireUser, notify });
  // Catch up a missed boundary after a restart, then check for Thursday 20:00
  // Tehran closes every 30 seconds. The resulting payout rows remain simulated.
  closeCurrentEarningsWeek();
  const weeklyCloseTimer = setInterval(() => {
    try { closeCurrentEarningsWeek(); }
    catch (error) { console.error('[weekly earnings] close failed:', error.message); }
  }, 30 * 1000);
  if (weeklyCloseTimer.unref) weeklyCloseTimer.unref();

  function minimumPrice(slug, files) {
    if (!files.length) return null;
    return gameQuota(slug);
  }
  return { canDownload, annotate, minimumPrice, gameQuota, core: { users, usersRO, saveUsers, sessionUser, notify } };
};
