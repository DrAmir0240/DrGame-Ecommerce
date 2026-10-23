'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { catalog, fallback, byId } = require('../public/avatar-catalog');
const serverAvatarCatalog = require('../avatar-catalog');

test('the signup avatar catalog has 20 unique, Sony-hosted PSN avatars and a safe fallback', () => {
  assert.equal(catalog.length, 20);
  assert.equal(new Set(catalog.map(avatar => avatar.id)).size, catalog.length);
  assert.equal(byId.get(fallback.id), fallback);
  for (const avatar of catalog) {
    assert.match(avatar.id, /^[a-z0-9-]+$/);
    assert.ok(avatar.name_en && avatar.name_fa);
    assert.match(avatar.image, /^https:\/\/(image\.api\.playstation\.com|psn-rsc\.prod\.dl\.playstation\.net|static-resource\.np\.community\.playstation\.net)\//);
  }
  assert.equal(serverAvatarCatalog.normalizeAvatarId('atoi'), 'atoi', 'previously saved avatars remain valid');
});

test('signup avatar IDs are normalized to the same catalog on the server', () => {
  assert.deepEqual(serverAvatarCatalog.AVATAR_IDS, catalog.map(avatar => avatar.id));
  assert.equal(serverAvatarCatalog.normalizeAvatarId('sackboy'), 'sackboy');
  assert.equal(serverAvatarCatalog.normalizeAvatarId('old-invalid-id'), fallback.id);
});
