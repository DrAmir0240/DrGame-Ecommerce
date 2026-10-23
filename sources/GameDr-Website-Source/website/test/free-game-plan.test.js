'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { INCLUDED_FREE_GAME_SLUGS, isIncludedFreeGame, canUseFreeGame, claimFreeGame } = require('../free-game-plan');

test('the free plan contains exactly the five selected games', () => {
  assert.deepEqual(INCLUDED_FREE_GAME_SLUGS, [
    'watch-dogs-2',
    'grand-theft-auto-v',
    'rocket-league',
    'mortal-kombat-11',
    'brawlhalla',
  ]);
});

test('an activated free plan can access each selected game without a size limit', () => {
  const user = { freeGamePlanActivatedAt: '2026-10-13T00:00:00.000Z' };
  for (const slug of INCLUDED_FREE_GAME_SLUGS) {
    assert.equal(isIncludedFreeGame(slug), true);
    assert.equal(canUseFreeGame(user, slug), true);
    assert.equal(claimFreeGame(user, slug), true);
  }
});

test('other games are excluded even when an old account has a legacy game claim', () => {
  const user = {
    freeGamePlanActivatedAt: '2026-10-13T00:00:00.000Z',
    freeGameSlug: 'some-old-claimed-game',
  };
  assert.equal(canUseFreeGame(user, 'some-old-claimed-game'), false);
  assert.equal(claimFreeGame(user, 'some-old-claimed-game'), false);
  assert.equal(canUseFreeGame(user, 'another-game'), false);
});

test('included games require an activated free plan', () => {
  for (const slug of INCLUDED_FREE_GAME_SLUGS) {
    assert.equal(canUseFreeGame({}, slug), false);
    assert.equal(claimFreeGame({}, slug), false);
  }
});
