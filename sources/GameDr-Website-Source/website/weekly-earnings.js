'use strict';

// Test-mode weekly sales commission rules. All amounts are integer toman.
const TIME_ZONE = 'Asia/Tehran';
const BUDGET_TOMAN = 100000;
const HOLD_DAYS = 7;
const RESERVE_TOMAN = 8000;
const UPLINE_SHARES = [20000, 13000, 8000, 5000, 3000, 2000, 1000];
const RANKS = [
  { name: 'F1', sales: 1, depth: 1 }, { name: 'F2', sales: 2, depth: 1 },
  { name: 'F3', sales: 3, depth: 1 }, { name: 'F5', sales: 5, depth: 1 },
  { name: 'F8', sales: 8, depth: 2 }, { name: 'F13', sales: 13, depth: 3 },
  { name: 'F21', sales: 21, depth: 4 }, { name: 'F34', sales: 34, depth: 5 },
  { name: 'F55', sales: 55, depth: 6 }, { name: 'F89', sales: 89, depth: 7 },
];
const INTL = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

function partsAt(value) {
  const parts = Object.fromEntries(INTL.formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return { year: +parts.year, month: +parts.month, day: +parts.day, hour: +parts.hour, minute: +parts.minute, second: +parts.second };
}

// Convert a Tehran wall-clock time to epoch milliseconds without a date library.
function tehranWallTimeToEpoch(year, month, day, hour, minute) {
  const wallAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  let guess = wallAsUtc;
  for (let i = 0; i < 3; i++) {
    const p = partsAt(guess);
    const renderedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second, 0);
    const next = wallAsUtc - (renderedAsUtc - guess);
    if (next === guess) break;
    guess = next;
  }
  return guess;
}

function addCalendarDays(year, month, day, days) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function weeklyPeriod(value = Date.now()) {
  const p = partsAt(value);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  let daysSinceThursday = (weekday - 4 + 7) % 7;
  if (daysSinceThursday === 0 && (p.hour < 20)) daysSinceThursday = 7;
  const startDate = addCalendarDays(p.year, p.month, p.day, -daysSinceThursday);
  const endDate = addCalendarDays(startDate.year, startDate.month, startDate.day, 7);
  const start = tehranWallTimeToEpoch(startDate.year, startDate.month, startDate.day, 20, 0);
  const end = tehranWallTimeToEpoch(endDate.year, endDate.month, endDate.day, 20, 0);
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString(), startMs: start, endMs: end };
}

function rankForSales(sales, ranks = RANKS) {
  const count = Math.max(0, Number(sales) || 0);
  let rank = { name: null, sales: 0, depth: 0 };
  for (const row of ranks) if (count >= row.sales) rank = row; else break;
  return { ...rank };
}

function isApprovedMarketer(user) { return !!(user && user.marketerApproved === true); }

function marketerChain(marketerId, users) {
  const byId = new Map(users.map(u => [u.id, u]));
  const chain = [];
  const seen = new Set([marketerId]);
  let current = byId.get(marketerId);
  while (current && (current.marketerParentId || current.invitedBy)) {
    const parentId = current.marketerParentId || current.invitedBy;
    if (seen.has(parentId)) break;
    seen.add(parentId);
    const parent = byId.get(parentId);
    if (!parent) break;
    if (isApprovedMarketer(parent)) chain.push(parent);
    current = parent;
  }
  return chain;
}

function allocateOrder(order, users, rankByMarketer = {}, config = {}) {
  if (!order) return null;
  const directId = order.attributedMarketerId;
  const direct = users.find(u => u.id === directId);
  if (!order || order.type !== 'subscription' || order.status !== 'paid' || !order.deliveredAt || !isApprovedMarketer(direct) || order.userId === direct.id) return null;

  const budget = Number.isInteger(config.budgetToman) ? config.budgetToman : BUDGET_TOMAN;
  const directShare = Number.isInteger(config.directToman) ? config.directToman : 40000;
  const shares = Array.isArray(config.uplineToman) ? config.uplineToman : UPLINE_SHARES;
  const reserveAmount = Number.isInteger(config.reserveToman) ? config.reserveToman : RESERVE_TOMAN;
  const holdDays = Number.isInteger(config.holdDays) ? config.holdDays : HOLD_DAYS;
  const lines = [{ kind: 'direct', level: 0, recipientId: direct.id, amount: directShare, status: 'pending' }];
  const unallocated = [];
  const uplines = marketerChain(direct.id, users);
  for (let level = 1; level <= shares.length; level++) {
    const amount = shares[level - 1];
    const recipient = uplines[level - 1];
    const rank = rankByMarketer[recipient && recipient.id] || { depth: 0 };
    if (recipient && (rank.depth || 0) >= level) {
      lines.push({ kind: 'upline', level, recipientId: recipient.id, amount, status: 'pending' });
    } else {
      unallocated.push({ kind: 'unallocated', level, recipientId: null, amount, reason: recipient ? 'rank-locked' : 'no-recipient' });
    }
  }
  const total = lines.reduce((sum, line) => sum + line.amount, 0) + unallocated.reduce((sum, line) => sum + line.amount, 0) + reserveAmount;
  if (total !== budget) throw new Error(`Commission budget mismatch for order ${order.id}: expected ${budget}, got ${total}`);
  const fulfilledAt = order.deliveredAt;
  const releaseAt = new Date(new Date(fulfilledAt).getTime() + holdDays * 86400000).toISOString();
  return {
    id: `sale:${order.id}`, orderId: order.id, customerId: order.userId,
    attributedMarketerId: direct.id, period: weeklyPeriod(order.deliveredAt),
    amount: budget, currency: 'IRR', unit: 'toman', configVersion: config.version || 1,
    deliveredAt: fulfilledAt, releaseAt, lines, unallocated,
    reserve: { amount: reserveAmount, status: 'held' }, status: 'pending', testMode: true,
  };
}

function teamSalesByMarketer(period, saleRecords, users) {
  const from = new Date(period.start).getTime(), to = new Date(period.end).getTime();
  const counts = new Map(users.filter(isApprovedMarketer).map(u => [u.id, 0]));
  const unique = new Set();
  for (const sale of saleRecords) {
    if (!sale) continue;
    const at = new Date(sale.deliveredAt).getTime();
    if (sale.reversed || sale.reversedAt || !Number.isFinite(at) || at < from || at >= to || unique.has(sale.orderId)) continue;
    unique.add(sale.orderId);
    let marketerId = sale.attributedMarketerId;
    const seen = new Set();
    while (marketerId && !seen.has(marketerId)) {
      seen.add(marketerId);
      if (counts.has(marketerId)) counts.set(marketerId, counts.get(marketerId) + 1);
      const user = users.find(u => u.id === marketerId);
      marketerId = user && (user.marketerParentId || user.invitedBy);
    }
  }
  return Object.fromEntries(counts);
}

function commissionBalance(sales, userId, now = Date.now(), marketer = {}) {
  let pending = 0, payable = 0, paid = 0, reversed = 0, debt = 0;
  for (const sale of sales) for (const line of (sale.lines || [])) {
    if (line.recipientId !== userId) continue;
    const amount = Number(line.amount) || 0;
    if (sale.reversedAt) {
      reversed += amount;
      if (line.status === 'paid') debt += amount;
      continue;
    }
    if (line.status === 'reversed') { reversed += amount; continue; }
    if (line.status === 'paid') { paid += amount; continue; }
    const isUnlocked = new Date(sale.releaseAt).getTime() <= now;
    if (!isUnlocked || !marketer.identityVerified || !marketer.bankVerified || !isApprovedMarketer(marketer)) pending += amount;
    else payable += amount;
  }
  return { pending, payable, paid, reversed, debt };
}

function reverseOrder(sale) {
  if (!sale || sale.reversed) return null;
  return {
    id: `reversal:${sale.orderId}`, orderId: sale.orderId, originalSaleId: sale.id,
    date: new Date().toISOString(), testMode: true,
    lines: (sale.lines || []).map(line => ({ ...line, amount: -line.amount, status: 'reversed' })),
    unallocated: (sale.unallocated || []).map(line => ({ ...line, amount: -line.amount, kind: 'reversal' })),
    reserve: { amount: -(sale.reserve && sale.reserve.amount || 0), status: 'reversed' },
  };
}

module.exports = {
  TIME_ZONE, BUDGET_TOMAN, HOLD_DAYS, RESERVE_TOMAN, UPLINE_SHARES, RANKS,
  partsAt, tehranWallTimeToEpoch, weeklyPeriod, rankForSales, isApprovedMarketer,
  marketerChain, allocateOrder, teamSalesByMarketer, commissionBalance, reverseOrder,
};
