'use strict';

function normalizeChoice(value) {
  if (value === '' || value === null || value === undefined) return '';
  return value === 'like' || value === 'dislike' ? value : null;
}

function countReactions(users, slug) {
  return (Array.isArray(users) ? users : []).reduce((counts, user) => {
    const choice = user && user.gameReactions && user.gameReactions[slug];
    if (choice === 'like') counts.likes++;
    else if (choice === 'dislike') counts.dislikes++;
    return counts;
  }, { likes: 0, dislikes: 0 });
}

module.exports = { normalizeChoice, countReactions };
