'use strict';

const avatarCatalog = require('./public/avatar-catalog');
const AVATAR_IDS = Object.freeze(avatarCatalog.catalog.map(avatar => avatar.id));
const DEFAULT_AVATAR_ID = avatarCatalog.fallback.id;

function normalizeAvatarId(value) {
  const id = String(value || '');
  return avatarCatalog.byId.has(id) ? id : DEFAULT_AVATAR_ID;
}

module.exports = { AVATAR_IDS, DEFAULT_AVATAR_ID, normalizeAvatarId, catalog: avatarCatalog.catalog };
