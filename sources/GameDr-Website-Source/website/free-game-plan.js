'use strict';

const INCLUDED_FREE_GAME_SLUGS = Object.freeze([
  'watch-dogs-2',
  'grand-theft-auto-v',
  'rocket-league',
  'mortal-kombat-11',
  'brawlhalla',
]);
const includedFreeGames = new Set(INCLUDED_FREE_GAME_SLUGS);

function isIncludedFreeGame(slug) {
  return includedFreeGames.has(String(slug || ''));
}

function canUseFreeGame(user, slug) {
  return !!(user && user.freeGamePlanActivatedAt && isIncludedFreeGame(slug));
}

function claimFreeGame(user, slug) {
  // Free-plan access is a fixed five-game catalog, not a claimable game allowance.
  return canUseFreeGame(user, slug);
}

module.exports = { INCLUDED_FREE_GAME_SLUGS, isIncludedFreeGame, canUseFreeGame, claimFreeGame };
