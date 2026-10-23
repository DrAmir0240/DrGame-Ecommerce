const test = require('node:test');
const assert = require('node:assert/strict');
const { supportsTwoPlayers } = require('../game-features');

test('recognizes games with at least two supported players', () => {
  for (const value of ['2', '1-2', '2 local · 20 online', '2 story', '۲']) {
    assert.equal(supportsTwoPlayers(value), true, `${value} should support two players`);
  }
});

test('does not infer multiplayer support from online-only limits or a single-player story', () => {
  for (const value of [null, '', '1', '1 player', '1 local · 1 online', '1 local · 4 online', '1 story · up to 30 online', 'up to 8 online players', 'one or two modes']) {
    assert.equal(supportsTwoPlayers(value), false, `${value} should not qualify`);
  }
});
