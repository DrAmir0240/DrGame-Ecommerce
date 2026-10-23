'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BYTES_PER_GB, quotaBytesForGB, gameQuotaGB } = require('../game-quota');

test('game download quota uses the actual game size in binary gigabytes', () => {
  assert.equal(gameQuotaGB(80 * BYTES_PER_GB), 80);
  assert.equal(gameQuotaGB(80.125 * BYTES_PER_GB), 80.13);
});

test('plan GB quotas convert to exact byte allowances', () => {
  assert.equal(quotaBytesForGB(500), 500 * BYTES_PER_GB);
  assert.equal(quotaBytesForGB(0), 0);
  assert.equal(quotaBytesForGB(-1), 0);
  assert.equal(quotaBytesForGB(Infinity), 0);
});

test('empty or invalid game sizes have no quota cost', () => {
  assert.equal(gameQuotaGB(0), null);
  assert.equal(gameQuotaGB(-1), null);
  assert.equal(gameQuotaGB(Infinity), null);
});
