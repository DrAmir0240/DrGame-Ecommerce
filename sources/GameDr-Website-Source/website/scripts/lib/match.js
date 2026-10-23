// Shared title-matching helpers, used to pick the right game out of RAWG's
// search results instead of blindly trusting whatever comes back first.

const STOPWORDS = new Set(['the', 'of', 'a', 'an', 'and', 'in', 'to']);

function tokenize(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(w => w && !STOPWORDS.has(w));
}

// Jaccard-ish word overlap score between 0 (no relation) and 1 (same words).
function similarity(a, b) {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const w of setA) if (setB.has(w)) shared++;

  const union = new Set([...setA, ...setB]).size;
  return shared / union;
}

// Given the search query title and RAWG's candidate results, pick the one
// whose name best matches — not just whichever RAWG ranked first.
function pickBestMatch(title, candidates) {
  let best = null;
  let bestScore = -1;
  for (const c of candidates) {
    const score = similarity(title, c.name);
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return { match: best, score: bestScore };
}

module.exports = { similarity, pickBestMatch };
