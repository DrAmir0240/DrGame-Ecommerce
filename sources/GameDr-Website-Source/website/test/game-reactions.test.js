const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeChoice, countReactions } = require('../game-reactions');

test('accepts one reaction or an explicit clear, and rejects other input', () => {
  assert.equal(normalizeChoice('like'), 'like');
  assert.equal(normalizeChoice('dislike'), 'dislike');
  assert.equal(normalizeChoice(''), '');
  assert.equal(normalizeChoice(null), '');
  assert.equal(normalizeChoice('love'), null);
});

test('counts one current reaction per account and ignores malformed or unrelated data', () => {
  const users = [
    { gameReactions: { 'sample-game': 'like' } },
    { gameReactions: { 'sample-game': 'dislike' } },
    { gameReactions: { 'sample-game': 'like', other: 'dislike' } },
    { gameReactions: { 'sample-game': 'invalid' } },
    {},
  ];
  assert.deepEqual(countReactions(users, 'sample-game'), { likes: 2, dislikes: 1 });
});
