function titleKey(value, cleanName) {
  return String(cleanName ? cleanName(value) : value || '')
    .replace(/[™®©]/g, '')
    .normalize('NFKC')
    .toLocaleLowerCase('en-US')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function createRequestedGameImporter({ lookup, getGames, getCategories, addGame, slugify }) {
  return async function importRequestedGame(requestedTitle) {
    const key = titleKey(requestedTitle, lookup.cleanName);
    if (!key) return { status: 'needs-review', message: 'The requested title could not be matched.' };

    const existing = getGames().find(game => titleKey(game.title, lookup.cleanName) === key);
    if (existing) {
      const slug = slugify(existing.title);
      if (existing.modern === false) {
        return { status: 'needs-review', slug, title: existing.title, message: 'This game is already in the catalog but hidden from the website.' };
      }
      return { status: 'already-present', slug, title: existing.title };
    }

    let search;
    try {
      search = await lookup.search(requestedTitle);
    } catch (error) {
      return { status: 'needs-review', message: 'Automatic search failed. Open Quick Add to search manually.' };
    }

    const candidates = Array.isArray(search && search.results) ? search.results : [];
    const candidate = candidates.find(result => titleKey(result.title || result.name, lookup.cleanName) === key);
    if (!candidate) {
      return {
        status: 'needs-review',
        message: candidates.length ? 'No exact catalog match was found. Choose the correct result in Quick Add.' : 'No catalog match was found. Search manually in Quick Add.',
        suggestions: candidates.slice(0, 4).map(result => String(result.title || result.name || '').slice(0, 120)).filter(Boolean),
      };
    }

    let details;
    try {
      details = await lookup.details(candidate, getCategories());
    } catch (error) {
      return { status: 'needs-review', message: 'Game details could not be imported. Open Quick Add to finish it manually.' };
    }
    if (!details || titleKey(details.title || candidate.title, lookup.cleanName) !== key) {
      return { status: 'needs-review', message: 'Imported details did not match the requested title. Choose the correct result in Quick Add.' };
    }

    return addGame(details);
  };
}

module.exports = { createRequestedGameImporter, titleKey };
