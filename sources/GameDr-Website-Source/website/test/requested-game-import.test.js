const test = require('node:test');
const assert = require('node:assert/strict');
const { createRequestedGameImporter, titleKey } = require('../requested-game-import');

const cleanName = value => String(value || '').replace(/\s+(PS4|PS5)$/i, '').trim();

test('normalizes store platform suffixes when comparing requested titles', () => {
  assert.equal(titleKey('God of War™ PS5', cleanName), titleKey('God of War', cleanName));
});

test('adds an exact store match and returns the catalog result', async () => {
  const calls = [];
  const importer = createRequestedGameImporter({
    lookup: {
      cleanName,
      async search(query) { calls.push(['search', query]); return { results: [{ title: 'Hades PS5' }] }; },
      async details(candidate, categories) { calls.push(['details', candidate.title, categories]); return { title: 'Hades', category: 'Action' }; },
    },
    getGames: () => [],
    getCategories: () => ['Action'],
    async addGame(details) { calls.push(['add', details.title]); return { status: 'added', slug: 'hades', title: details.title }; },
    slugify: title => title.toLowerCase().replace(/\s+/g, '-'),
  });

  assert.deepEqual(await importer('Hades'), { status: 'added', slug: 'hades', title: 'Hades' });
  assert.deepEqual(calls, [['search', 'Hades'], ['details', 'Hades PS5', ['Action']], ['add', 'Hades']]);
});

test('does not auto-publish an approximate match', async () => {
  let added = false;
  const importer = createRequestedGameImporter({
    lookup: { cleanName, async search() { return { results: [{ title: 'Hades II' }] }; }, async details() { throw new Error('must not fetch details'); } },
    getGames: () => [],
    getCategories: () => [],
    async addGame() { added = true; },
    slugify: title => title.toLowerCase().replace(/\s+/g, '-'),
  });

  const result = await importer('Hades');
  assert.equal(result.status, 'needs-review');
  assert.deepEqual(result.suggestions, ['Hades II']);
  assert.equal(added, false);
});

test('reuses an existing visible catalog game without searching externally', async () => {
  let searched = false;
  const importer = createRequestedGameImporter({
    lookup: { cleanName, async search() { searched = true; return { results: [] }; } },
    getGames: () => [{ title: 'Hades', modern: true }],
    getCategories: () => [],
    async addGame() { throw new Error('existing game should not be inserted again'); },
    slugify: title => title.toLowerCase().replace(/\s+/g, '-'),
  });

  assert.deepEqual(await importer('Hades PS5'), { status: 'already-present', slug: 'hades', title: 'Hades' });
  assert.equal(searched, false);
});
