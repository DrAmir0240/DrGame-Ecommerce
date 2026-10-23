applyLanguage();
initLangToggle();

// Deterministic color per title, so tiles look distinct without needing
// real cover art (none is bundled/downloaded here).
function colorFromString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 32%)`;
}
function formatSize(mb) {
  const n = parseFloat(mb);
  if (n >= 1024) return (n / 1024).toFixed(2) + ' GB';
  return n.toFixed(1) + ' MB';
}
const STOPWORDS = new Set(['of', 'the', 'a', 'an', 'and', 'in', 'to']);
function initials(title) {
  const words = title.replace(/[^a-zA-Z0-9 ]/g, '').split(' ').filter(Boolean);
  const meaningful = words.filter(w => !STOPWORDS.has(w.toLowerCase()));
  const chosen = (meaningful.length > 0 ? meaningful : words).slice(0, 2);
  return chosen.map(w => w[0].toUpperCase()).join('');
}

let previewTimer;
let previewVersion = 0;
let previewRequest;
let activePreviewTile = null;
const previewCache = new Map();
function formatReactionCount(kind, count) {
  const value = new Intl.NumberFormat(getLang() === 'fa' ? 'fa-IR' : 'en-US').format(count);
  return t(kind === 'like' ? 'game_reaction_like_count' : 'game_reaction_dislike_count').replace('{count}', value);
}

function updatePreviewReactions(slug) {
  if (!slug) return;
  const reactions = document.getElementById('preview-reactions');
  if (reactions) reactions.setAttribute('aria-label', getLang() === 'fa' ? 'واکنش‌های این بازی' : 'Reactions for this game');
  const version = previewVersion;
  fetch('/api/games/' + encodeURIComponent(slug) + '/reactions', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('reaction count unavailable')))
    .then(counts => {
      if (version !== previewVersion || !activePreviewTile || activePreviewTile.dataset.gameSlug !== slug) return;
      const like = document.getElementById('preview-like-count');
      const dislike = document.getElementById('preview-dislike-count');
      if (like) like.textContent = formatReactionCount('like', counts.likes || 0);
      if (dislike) dislike.textContent = formatReactionCount('dislike', counts.dislikes || 0);
    })
    .catch(() => {});
}
window.addEventListener('gamedr:reaction-change', event => {
  if (activePreviewTile && event.detail?.slug === activePreviewTile.dataset.gameSlug) updatePreviewReactions(event.detail.slug);
});

function closeGamePreview() {
  clearTimeout(previewTimer);
  previewVersion++;
  if (previewRequest) previewRequest.abort();
  const panel = document.getElementById('game-preview');
  if (activePreviewTile) activePreviewTile.setAttribute('aria-expanded', 'false');
  activePreviewTile = null;
  panel.classList.remove('is-open'); panel.inert = true;
  panel.setAttribute('aria-hidden', 'true');
}
function showGamePreview(g, tile) {
  clearTimeout(previewTimer);
  const version = ++previewVersion;
  if (previewRequest) previewRequest.abort();
  if (activePreviewTile && activePreviewTile !== tile) activePreviewTile.setAttribute('aria-expanded', 'false');
  activePreviewTile = tile;
  tile.setAttribute('aria-expanded', 'true');
  previewTimer = setTimeout(async () => {
    const panel = document.getElementById('game-preview');
    const fa = getLang() === 'fa';
    const cover = document.getElementById('preview-cover');
    cover.hidden = !g.coverUrl;
    if (g.coverUrl) cover.src = coverSrc(g.coverUrl, 600);
    document.getElementById('preview-title').textContent = g.title;
    document.getElementById('preview-category').textContent = translateCategory(g.category);
    document.getElementById('preview-meta').textContent = [g.released, (g.platforms || []).join(' · ').toUpperCase()].filter(Boolean).join(' / ');
    updatePreviewReactions(g.slug);
    const description = document.getElementById('preview-description');
    description.textContent = fa ? 'در حال بارگذاری…' : 'Loading game details…';
    const link = document.getElementById('preview-link');
    link.href = '/game.html?slug=' + encodeURIComponent(g.slug);
    link.textContent = fa ? 'مشاهده بازی ←' : 'View game →';
    panel.inert = false; panel.setAttribute('aria-hidden', 'false'); panel.classList.add('is-open');
    try {
      let data = previewCache.get(g.slug);
      if (!data) {
        previewRequest = new AbortController();
        const res = await fetch('/api/games/' + encodeURIComponent(g.slug) + '/files', { signal: previewRequest.signal });
        if (!res.ok) throw new Error();
        data = await res.json(); previewCache.set(g.slug, data);
      }
      if (version !== previewVersion) return;
      // Use the curated story copy shown on the full game page. The raw store
      // description can contain metadata/boilerplate or the old incorrect text.
      description.textContent = (fa
        ? data.storySummaryFa || data.storySummary || data.descriptionFa || data.description
        : data.storySummary || data.description) || (fa ? 'برای مشاهده فایل‌ها و جزئیات بیشتر، صفحه بازی را باز کنید.' : 'Open the game page to explore available files and more details.');
      document.getElementById('preview-meta').textContent = [g.released, (data.platforms || []).join(' · ').toUpperCase(), data.files.length + (fa ? ' فایل' : ' files')].filter(Boolean).join(' / ');
    } catch (e) {
      if (version === previewVersion) description.textContent = fa ? 'برای جزئیات بیشتر صفحه بازی را باز کنید.' : 'Open the game page for more details.';
    }
  }, 160);
}
function makeGameTile(g) {
  const tile = document.createElement('a');
  tile.className = 'game-tile';
  tile.dataset.gameSlug = g.slug;
  tile.setAttribute('aria-controls', 'game-preview');
  tile.setAttribute('aria-expanded', 'false');
  tile.addEventListener('click', event => {
    event.preventDefault();
    if (activePreviewTile === tile) closeGamePreview();
    else showGamePreview(g, tile);
  });
  tile.href = `/game.html?slug=${encodeURIComponent(g.slug)}`;

  const art = document.createElement('div');
  art.className = 'tile-art';

  if (g.coverUrl) {
    const img = document.createElement('img');
    img.src = coverSrc(g.coverUrl, 320);
    img.srcset = [160, 320, 480].map(w => coverSrc(g.coverUrl, w) + ' ' + w + 'w').join(', ');
    img.sizes = '(max-width: 640px) 45vw, 200px';
    img.width = 320; img.height = 320;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.alt = g.title;
    art.appendChild(img);
  } else {
    art.style.background = colorFromString(g.title);
    art.textContent = initials(g.title) || '?';
  }

  if (g.count > 0) {
    const count = document.createElement('span');
    count.className = 'tile-count';
    count.textContent = `${g.count} ${g.count === 1 ? 'clip' : 'clips'} · ${formatSize(g.totalSizeMB)}`;
    art.appendChild(count);
  }

  const title = document.createElement('div');
  title.className = 'tile-title';
  title.textContent = g.title;

  tile.appendChild(art);
  tile.appendChild(title);
  return tile;
}

// Build large shelves in small batches. The homepage can contain hundreds of
// games; creating every card and image in one task makes low-end browsers look
// frozen while the page is still loading. The first batch is painted right
// away, then the remaining cards are appended during idle frames.
function appendGameTiles(row, games, options = {}) {
  const list = Array.isArray(games) ? games : [];
  const firstBatch = Math.max(1, options.firstBatch || 12);
  const batchSize = Math.max(1, options.batchSize || 12);
  let cursor = 0;
  let cancelled = false;
  const addBatch = (count) => {
    if (cancelled || cursor >= list.length) return;
    const end = Math.min(list.length, cursor + count);
    const fragment = document.createDocumentFragment();
    for (; cursor < end; cursor++) fragment.appendChild(makeGameTile(list[cursor]));
    row.appendChild(fragment);
    if (cursor < list.length) scheduleNext();
  };
  function scheduleNext() {
    const run = () => addBatch(batchSize);
    if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 120 });
    else setTimeout(run, 0);
  }
  addBatch(firstBatch);
  return () => { cancelled = true; };
}

// "For you": the five most popular games, or - once the visitor has looked at some games - games
// from the same series, studio or category as the ones they used.
function reasonText(r) {
  if (!r) return '';
  const fill = (key, vars) => t(key).replace(/\{(\w+)\}/g, (m, k) => vars[k]);
  if (r.type === 'series') return fill('foryou_series', { seed: r.seed });
  if (r.type === 'company') return fill('foryou_company', { seed: r.seed, company: r.company });
  return fill('foryou_genre', { seed: r.seed });
}
async function renderForYou() {
  const row = document.getElementById('foryou-row');
  try {
    const seen = window.DrtSeenParam ? DrtSeenParam() : '';
    const res = await fetch('/api/for-you' + (seen ? '?seen=' + encodeURIComponent(seen) : ''), { credentials: 'same-origin' });
    const data = await res.json();
    document.getElementById('foryou-sub').textContent = t(data.mode === 'personal' ? 'foryou_personal' : 'foryou_popular');
    row.innerHTML = '';
    for (const g of data.games) {
      const tile = makeGameTile(g);
      if (g.reason) {
        const why = document.createElement('div');
        why.className = 'tile-reason';
        why.textContent = reasonText(g.reason);
        tile.appendChild(why);
      }
      row.appendChild(tile);
    }
    return data.games.map(g => g.slug);
  } catch (e) { document.getElementById('foryou-section').style.display = 'none'; return []; }
}

// Show the newest releases even when a game also appears in "For you".
async function renderHomeGames() {
  await (window.DRT && DRT.categoryLabelsReady ? DRT.categoryLabelsReady : Promise.resolve());
  applyDynamicHomeLabels();
  await Promise.all([renderForYou(), renderFeatured(), renderHomeFeatureShelves(), renderCategoryShelves(), renderBestSellers()]);
}

function makeHomeShelf({ id, title, labelKey = '', games, href, isCategory = false }) {
  const section = document.createElement('section');
  section.className = 'featured-section home-scrollbar-section';

  const heading = document.createElement('h2');
  heading.className = 'featured-heading';
  if (isCategory) heading.appendChild(categoryLabel(title));
  else heading.textContent = labelKey ? translateCategory(labelKey) : t(title);

  const row = document.createElement('div');
  row.className = 'featured-row';
  row.tabIndex = 0;
  row.setAttribute('role', 'region');
  row.setAttribute('aria-label', `${isCategory ? translateCategory(title) : (labelKey ? translateCategory(labelKey) : t(title))} games`);
  appendGameTiles(row, games.slice(0, 20), { firstBatch: 8, batchSize: 8 });

  section.append(heading, row);
  if (href) {
    const actions = document.createElement('div');
    actions.className = 'view-all-wrap';
    const link = document.createElement('a');
    link.className = 'view-all-btn';
    link.href = href;
    link.textContent = t('view_all_btn');
    actions.appendChild(link);
    section.appendChild(actions);
  }
  section.dataset.shelf = id;
  return section;
}

async function renderHomeFeatureShelves() {
  const twoPlayerContainer = document.getElementById('two-player-shelf');
  const vrContainer = document.getElementById('home-feature-shelves');
  try {
    const res = await fetch('/api/home-feature-shelves');
    if (!res.ok) throw new Error('Could not load featured game shelves');
    const shelves = await res.json();
    const sections = shelves.filter(shelf => shelf.games && shelf.games.length).map(shelf => {
      const labelKey = shelf.id === 'two-player' ? '2 Player Games' : 'VR Supported Games';
      return makeHomeShelf({
        id: shelf.id,
        title: shelf.id === 'two-player' ? 'two_player_heading' : 'vr_heading',
        labelKey,
        games: shelf.games,
        href: `/games.html?feature=${encodeURIComponent(shelf.id)}`,
      });
    });
    twoPlayerContainer.replaceChildren(...sections.filter(section => section.dataset.shelf === 'two-player'));
    vrContainer.replaceChildren(...sections.filter(section => section.dataset.shelf !== 'two-player'));
  } catch (e) {
    twoPlayerContainer.replaceChildren();
    vrContainer.replaceChildren();
  }
}

async function renderCategoryShelves() {
  const container = document.getElementById('category-shelves');
  try {
    const res = await fetch('/api/category-shelves');
    if (!res.ok) throw new Error('Could not load category shelves');
    const shelves = await res.json();
    const sections = shelves.filter(shelf => shelf.games && shelf.games.length).map(shelf => {
      return makeHomeShelf({
        id: `category-${shelf.category}`,
        title: shelf.category,
        games: shelf.games,
        href: `/games.html?category=${encodeURIComponent(shelf.category)}`,
        isCategory: true,
      });
    });
    container.replaceChildren(...sections);
  } catch (e) {
    container.replaceChildren();
  }
}

async function renderBestSellers() {
  const row = document.getElementById('bestsellers-row');
  try {
    const res = await fetch('/api/best-sellers');
    if (!res.ok) throw new Error('Could not load best sellers');
    const games = await res.json();
    row.replaceChildren();
    appendGameTiles(row, games, { firstBatch: 8, batchSize: 8 });
    document.getElementById('bestsellers-section').hidden = games.length === 0;
  } catch (e) {
    document.getElementById('bestsellers-section').hidden = true;
  }
}

function applyDynamicHomeLabels() {
  const labels = {
    foryou_heading: 'Your taste',
    latest_heading: 'Lately Released',
    bestsellers_heading: 'Best Sellers',
  };
  for (const [attribute, key] of Object.entries(labels)) {
    const heading = document.querySelector(`[data-i18n="${attribute}"]`);
    if (heading) heading.textContent = translateCategory(key);
  }
}

async function renderFeatured() {
  const res = await fetch('/api/latest');
  const featured = await res.json();
  const row = document.getElementById('featured-row');
  row.replaceChildren();
  appendGameTiles(row, featured, { firstBatch: 16, batchSize: 16 });
  DRT.fetchPublic('/api/games').then(r => r.ok ? r.json() : Promise.reject()).then(buildCollage).catch(() => buildCollage(featured));
}

// Two identical groups create a seamless horizontal cover loop.
function buildCollage(list) {
  const box = document.getElementById('hero-collage');
  if (!box || box.childElementCount) return;
  const covers = list.filter(g => g.coverUrl).slice(0, 20);
  if (!covers.length) return;
  const track = document.createElement('div');
  track.className = 'hero-poster-track';
  track.style.setProperty('--poster-duration', Math.max(80, covers.length * 5) + 's');
  for (let copy = 0; copy < 2; copy++) {
    const group = document.createElement('div');
    group.className = 'hero-poster-group';
    covers.forEach((g, i) => {
      const img = document.createElement('img');
      img.src = coverSrc(g.coverUrl, 240);
      img.alt = '';
      img.decoding = 'async';
      img.loading = i < 6 && copy === 0 ? 'eager' : 'lazy';
      img.width = 172; img.height = 172;
      img.draggable = false;
      img.style.setProperty('--i', (i % 5) - 2);
      group.appendChild(img);
    });
    track.appendChild(group);
  }
  box.appendChild(track);
  let visible = true;
  function updateMotion() { track.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused'; }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updateMotion(); });
    observer.observe(box);
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  document.addEventListener('visibilitychange', updateMotion);
}

function openDrawer() { window.SiteMenu.open(); }
function closeDrawer() { window.SiteMenu.close(); }

async function renderCategoryDrawer() {
  // Wait for both genre and homepage-only labels before generating the rail;
  // otherwise the feature links race the label fetch and stay English in Farsi.
  if (window.DRT && DRT.categoryLabelsReady) await DRT.categoryLabelsReady;
  const res = await DRT.fetchPublic('/api/categories');
  const categories = await res.json();
  DRT.setCategoryLabels?.(categories);
  const list = document.getElementById('category-list');
  list.innerHTML = '';

  const allItem = document.createElement('li');
  const allBtn = document.createElement('button');
  allBtn.appendChild(categoryLabel('__all', t('drawer_all_categories')));
  allBtn.addEventListener('click', () => { location.href = '/games.html'; });
  allItem.appendChild(allBtn);
  list.appendChild(allItem);

  const rail = document.getElementById('category-rail');
  rail.replaceChildren();
  for (const cat of categories) {
    const railLink = document.createElement('a');
    railLink.href = `/games.html?category=${encodeURIComponent(cat.name)}`;
    railLink.className = 'category-rail-link';
    railLink.setAttribute('aria-label', translateCategory(cat.name));
    railLink.title = translateCategory(cat.name);
    railLink.appendChild(categoryIcon(cat.name));
    const railName = document.createElement('span');
    railName.className = 'category-rail-name';
    railName.textContent = translateCategory(cat.name);
    railLink.appendChild(railName);
    rail.appendChild(railLink);
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.addEventListener('click', () => {
      location.href = `/games.html?category=${encodeURIComponent(cat.name)}`;
    });

    const label = categoryLabel(cat.name);
    const count = document.createElement('span');
    count.className = 'cat-count';
    count.textContent = cat.count;

    btn.appendChild(label);
    btn.appendChild(count);
    li.appendChild(btn);
    list.appendChild(li);
  }

  // These shelves are generated from game support data instead of a stored
  // genre, but they belong in the same expandable navigation rail.
  const featureItems = [
    { key: '2 Player Games', feature: 'two-player' },
    { key: 'VR Supported Games', feature: 'vr' },
  ];
  for (const item of featureItems) {
    const href = `/games.html?feature=${encodeURIComponent(item.feature)}`;
    const railLink = document.createElement('a');
    railLink.href = href;
    railLink.className = 'category-rail-link category-feature-link';
    railLink.setAttribute('aria-label', translateCategory(item.key));
    railLink.title = translateCategory(item.key);
    railLink.appendChild(categoryIcon(item.key));
    const railName = document.createElement('span');
    railName.className = 'category-rail-name';
    railName.textContent = translateCategory(item.key);
    railLink.appendChild(railName);
    rail.appendChild(railLink);

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.appendChild(categoryLabel(item.key));
    btn.addEventListener('click', () => { location.href = href; });
    li.appendChild(btn);
    list.appendChild(li);
  }
}

async function renderPlatformDrawer() {
  const res = await DRT.fetchPublic('/api/platforms');
  const platforms = await res.json();
  const list = document.getElementById('platform-list');
  list.innerHTML = '';

  for (const p of platforms) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.addEventListener('click', () => {
      location.href = `/games.html?platform=${encodeURIComponent(p.id)}`;
    });

    const label = document.createElement('span');
    label.textContent = p.id.toUpperCase();
    const count = document.createElement('span');
    count.className = 'cat-count';
    count.textContent = p.count;

    btn.appendChild(label);
    btn.appendChild(count);
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function init() {

  const preview = document.getElementById('game-preview');
  document.getElementById('preview-close').addEventListener('click', closeGamePreview);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeGamePreview(); });
  const railShell = document.querySelector('.category-rail-shell');
  if (railShell) railShell.classList.add('is-open');
  renderCategoryDrawer();
  renderPlatformDrawer();
  renderHomeGames();

  const searchInput = document.getElementById('search');
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      location.href = `/games.html?q=${encodeURIComponent(e.target.value)}`;
    }
  });

document.getElementById('drawer-close').addEventListener('click', closeDrawer);
}

init();
