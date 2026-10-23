'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const e = require('../weekly-earnings');
const mountPromo = require('../promo');

test('Thursday 20:00 Tehran starts a new weekly period, including the exact boundary', () => {
  const before = e.weeklyPeriod('2026-10-08T16:29:59.999Z');
  const at = e.weeklyPeriod('2026-10-08T16:30:00.000Z');
  assert.equal(before.end, '2026-10-08T16:30:00.000Z');
  assert.equal(at.start, '2026-10-08T16:30:00.000Z');
  assert.equal(new Date(at.endMs - at.startMs).getTime(), 7 * 24 * 60 * 60 * 1000);
});

test('Fibonacci sales thresholds select the greatest reached rank and depth', () => {
  assert.deepEqual(e.rankForSales(0), { name: null, sales: 0, depth: 0 });
  assert.deepEqual(e.rankForSales(4), { name: 'F3', sales: 3, depth: 1 });
  assert.deepEqual(e.rankForSales(8), { name: 'F8', sales: 8, depth: 2 });
  assert.deepEqual(e.rankForSales(13), { name: 'F13', sales: 13, depth: 3 });
  assert.deepEqual(e.rankForSales(200), { name: 'F89', sales: 89, depth: 7 });
});

test('a qualifying paid subscription order always allocates exactly 100,000 toman', () => {
  const users = [{ id: 'm1', marketerApproved: true }];
  const row = e.allocateOrder({ id: 'o1', userId: 'buyer', type: 'subscription', status: 'paid', deliveredAt: '2026-10-09T12:00:00Z', attributedMarketerId: 'm1' }, users);
  assert.ok(row);
  const paid = row.lines.reduce((sum, line) => sum + line.amount, 0);
  const unallocated = row.unallocated.reduce((sum, line) => sum + line.amount, 0);
  assert.equal(paid, 40000);
  assert.equal(unallocated, 52000);
  assert.equal(paid + unallocated + row.reserve.amount, 100000);
  assert.equal(row.testMode, true);
});

test('only rank-open upline levels receive shares; locked shares stay unallocated', () => {
  const users = [
    { id: 'top', marketerApproved: true },
    { id: 'mid', marketerApproved: true, marketerParentId: 'top' },
    { id: 'seller', marketerApproved: true, marketerParentId: 'mid' },
  ];
  const sale = e.allocateOrder({ id: 'o2', userId: 'buyer', type: 'subscription', status: 'paid', deliveredAt: '2026-10-09T12:00:00Z', attributedMarketerId: 'seller' }, users, {
    mid: { name: 'F8', depth: 2 }, top: { name: 'F8', depth: 2 },
  });
  assert.deepEqual(sale.lines.map(x => [x.kind, x.recipientId, x.level, x.amount]), [
    ['direct', 'seller', 0, 40000], ['upline', 'mid', 1, 20000], ['upline', 'top', 2, 13000],
  ]);
  assert.equal(sale.unallocated.reduce((sum, row) => sum + row.amount, 0), 19000);
  assert.equal(sale.lines.reduce((sum, row) => sum + row.amount, 0) + sale.unallocated.reduce((sum, row) => sum + row.amount, 0) + sale.reserve.amount, 100000);
});

test('DRT token-pack orders do not create commission sales', () => {
  const users = [{ id: 'seller', marketerApproved: true }];
  const sale = e.allocateOrder({ id: 'old-pack', userId: 'buyer', type: 'tokens', status: 'paid', deliveredAt: '2026-10-09T12:00:00Z', attributedMarketerId: 'seller' }, users);
  assert.equal(sale, null);
});

test('team sales count each order once for every approved marketer above the attributed seller', () => {
  const users = [
    { id: 'top', marketerApproved: true },
    { id: 'mid', marketerApproved: true, marketerParentId: 'top' },
    { id: 'seller', marketerApproved: true, marketerParentId: 'mid' },
    { id: 'customer' },
  ];
  const period = { start: '2026-10-08T16:30:00.000Z', end: '2026-10-15T16:30:00.000Z' };
  const sales = [
    { orderId: 'a', attributedMarketerId: 'seller', deliveredAt: '2026-10-09T12:00:00Z' },
    { orderId: 'a', attributedMarketerId: 'seller', deliveredAt: '2026-10-09T12:00:00Z' },
    { orderId: 'b', attributedMarketerId: 'mid', deliveredAt: '2026-10-10T12:00:00Z' },
    { orderId: 'c', attributedMarketerId: 'top', deliveredAt: '2026-10-15T16:30:00Z' },
  ];
  assert.deepEqual(e.teamSalesByMarketer(period, sales, users), { top: 2, mid: 2, seller: 1 });
});

test('self purchases and unrelated or unpaid orders cannot make commissions', () => {
  const marketer = { id: 'm', marketerApproved: true };
  const base = { id: 'o3', userId: 'buyer', status: 'paid', deliveredAt: '2026-10-09T12:00:00Z', attributedMarketerId: 'm' };
  assert.equal(e.allocateOrder({ ...base, userId: 'm', type: 'subscription' }, [marketer]), null);
  assert.equal(e.allocateOrder({ ...base, status: 'pending', type: 'subscription' }, [marketer]), null);
  assert.equal(e.allocateOrder({ ...base, type: 'file' }, [marketer]), null);
});

test('refunds create a negative reversal ledger record without rewriting the sale', () => {
  const sale = { id: 'sale:o4', orderId: 'o4', lines: [{ recipientId: 'm', amount: 40000 }], unallocated: [{ amount: 52000 }], reserve: { amount: 8000 } };
  const reversal = e.reverseOrder(sale);
  assert.equal(reversal.lines.reduce((sum, line) => sum + line.amount, 0), -40000);
  assert.equal(reversal.unallocated[0].amount, -52000);
  assert.equal(reversal.reserve.amount, -8000);
  assert.equal(e.reverseOrder({ ...sale, reversed: true }), null);
});

test('commission stays pending through the hold or missing verification, then becomes payable', () => {
  const deliveredAt = '2026-10-01T16:30:00.000Z';
  const sale = { deliveredAt, releaseAt: new Date(Date.parse(deliveredAt) + 7 * 86400000).toISOString(), lines: [{ recipientId: 'm', amount: 40000, status: 'pending' }] };
  const verified = { id: 'm', marketerApproved: true, identityVerified: true, bankVerified: true };
  const duringHold = e.commissionBalance([sale], 'm', Date.parse(deliveredAt) + 6 * 86400000, verified);
  assert.equal(duringHold.pending, 40000);
  assert.equal(duringHold.payable, 0);
  const missingBank = e.commissionBalance([sale], 'm', Date.parse(sale.releaseAt), { ...verified, bankVerified: false });
  assert.equal(missingBank.pending, 40000);
  const cleared = e.commissionBalance([sale], 'm', Date.parse(sale.releaseAt), verified);
  assert.equal(cleared.pending, 0);
  assert.equal(cleared.payable, 40000);
});

test('refund reversal removes unpaid balance and records a debt for an already settled share', () => {
  const sale = { reversedAt: '2026-10-13T12:00:00Z', releaseAt: '2026-10-10T12:00:00Z', lines: [
    { recipientId: 'm', amount: 40000, status: 'paid' },
    { recipientId: 'm', amount: 20000, status: 'pending' },
  ] };
  const balance = e.commissionBalance([sale], 'm');
  assert.equal(balance.pending, 0);
  assert.equal(balance.payable, 0);
  assert.equal(balance.paid, 0);
  assert.equal(balance.reversed, 60000);
  assert.equal(balance.debt, 40000);
});

test('using an invitation code only links the sponsor and gives no signup reward', () => {
  const users = [{ id: 'sponsor', name: 'Sponsor', inviteCode: 'DR-AAAAAA' }, { id: 'new', name: 'New customer' }];
  const files = new Map();
  const app = { get() {}, post() {}, put() {}, delete() {} };
  const helpers = {
    J: (key, fallback) => files.has(key) ? structuredClone(files.get(key)) : structuredClone(fallback),
    W: (key, value) => files.set(key, structuredClone(value)),
    str: (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '',
    bad: () => {}, uid: () => 'invite-log-id', limiter: () => () => {},
  };
  const core = {
    users: () => users, usersRO: () => users, saveUsers: () => {},
    publicUser: user => user, requireUser() {},
  };
  const promo = mountPromo(app, helpers, core);
  const linked = promo.awardInvite(users, users[1], 'DR-AAAAAA');
  assert.equal(linked.linked, true);
  assert.equal(users[1].invitedBy, 'sponsor');
  assert.equal(files.get('invites.json')[0].inviterReward, 0);
  assert.equal(files.get('invites.json')[0].inviteeReward, 0);
});
