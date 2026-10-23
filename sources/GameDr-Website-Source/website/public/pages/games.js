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

let allGames = [];
let pillFilter = 'all';
let activeCategory = null; // null = all categories
let activePlatform = null; // null = any platform, else 'ps4' / 'ps5'
let activeFeatureFilter = null;

function applyFilter(q) {
  const query = q.trim().toLowerCase();
  let filtered = query ? allGames.filter(g => g.title.toLowerCase().includes(query)) : allGames;
  if (pillFilter === 'with-subtitle') filtered = filtered.filter(g => g.hasSubtitle);
  if (activeFeatureFilter === 'two-player') filtered = filtered.filter(g => g.twoPlayer);
  if (activeFeatureFilter === 'vr') filtered = filtered.filter(g => g.vr === true);
  if (activeCategory === 'Most Famous') {
    filtered = filtered.filter(g => g.famous).sort((a, b) => a.famousRank - b.famousRank);
  } else if (activeCategory === 'Lately Released') {
    filtered = filtered.slice().sort((a, b) => {
      const aRelease = Date.parse(a.released || '');
      const bRelease = Date.parse(b.released || '');
      const aHasDate = Number.isFinite(aRelease);
      const bHasDate = Number.isFinite(bRelease);
      if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
      if (aHasDate && aRelease !== bRelease) return bRelease - aRelease;
      return a.title.localeCompare(b.title);
    });
  } else if (activeCategory) {
    filtered = filtered.filter(g => g.category === activeCategory);
  }
  if (activePlatform) {
    filtered = filtered.filter(g => g.platforms.includes(activePlatform));
  }
  if (window.filterCatalog) filtered = window.filterCatalog(filtered);
  render(filtered);
}

function updateHeroTitle() {
  const heading = document.getElementById('hero-title');
  if (activeFeatureFilter === 'two-player') {
    heading.textContent = translateCategory('2 Player Games');
    return;
  }
  if (activeFeatureFilter === 'vr') {
    heading.textContent = translateCategory('VR Supported Games');
    return;
  }
  if (!activeCategory) {
    heading.textContent = t('hero_title_default');
    return;
  }
  const catLabel = translateCategory(activeCategory);
  heading.textContent = getLang() === 'fa'
    ? `بازی‌های ${catLabel}، آماده تماشا یا دانلود`
    : `${catLabel} games, ready to watch or download`;
}

function openDrawer() { window.SiteMenu.open(); }
function closeDrawer() { window.SiteMenu.close(); }

async function renderCategoryDrawer() {
  const res = await DRT.fetchPublic('/api/categories');
  const categories = await res.json();
  DRT.setCategoryLabels?.(categories);
  const list = document.getElementById('category-list');
  list.innerHTML = '';

  const allItem = document.createElement('li');
  const allBtn = document.createElement('button');
  allBtn.appendChild(categoryLabel('__all', t('drawer_all_categories')));
  allBtn.dataset.category = '';
  allBtn.className = activeCategory === null ? 'active' : '';
  allBtn.addEventListener('click', () => selectCategory(null));
  allItem.appendChild(allBtn);
  list.appendChild(allItem);

  for (const cat of categories) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.dataset.category = cat.name;
    btn.className = activeCategory === cat.name ? 'active' : '';
    btn.addEventListener('click', () => selectCategory(cat.name));

    const label = categoryLabel(cat.name);
    const count = document.createElement('span');
    count.className = 'cat-count';
    count.textContent = cat.count;

    btn.appendChild(label);
    btn.appendChild(count);
    li.appendChild(btn);
    list.appendChild(li);
  }
}

function selectCategory(name) {
  activeCategory = name;
  activeFeatureFilter = null;
  updateHeroTitle();
  document.querySelectorAll('#category-list button').forEach(b => b.classList.remove('active'));
  const match = [...document.querySelectorAll('#category-list button')]
    .find(b => b.dataset.category === (name || ''));
  if (match) match.classList.add('active');
  applyFilter(document.getElementById('search').value);
  closeDrawer();
}

async function renderPlatformDrawer() {
  const res = await DRT.fetchPublic('/api/platforms');
  const platforms = await res.json();
  const list = document.getElementById('platform-list');
  list.innerHTML = '';

  for (const p of platforms) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.dataset.platform = p.id;
    btn.className = activePlatform === p.id ? 'active' : '';
    btn.addEventListener('click', () => selectPlatform(p.id));

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

function selectPlatform(id) {
  activePlatform = activePlatform === id ? null : id; // click again to clear
  document.querySelectorAll('#platform-list button').forEach(b => {
    b.classList.toggle('active', b.dataset.platform === activePlatform);
  });
  applyFilter(document.getElementById('search').value);
  closeDrawer();
}

function makeGameTile(g) {
  const tile = document.createElement('a');
  tile.className = 'game-tile';
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

function render(games) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  if (games.length === 0) {
    grid.innerHTML = `<div class="no-results">${t('no_results')}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const g of games) fragment.appendChild(makeGameTile(g));
  grid.appendChild(fragment);
}

async function init() {
  const res = await DRT.fetchPublic('/api/games');
  allGames = await res.json();
  await (window.DRT && DRT.categoryLabelsReady ? DRT.categoryLabelsReady : Promise.resolve());

  const searchInput = document.getElementById('search');
  const params = new URLSearchParams(location.search);
  const initialQuery = params.get('q') || '';
  const initialCategory = params.get('category');
  const initialFeature = params.get('feature');
  const initialFilter = params.get('filter');
  const initialPlatform = params.get('platform');
  if (initialQuery) searchInput.value = initialQuery;
  if (initialCategory) {
    activeCategory = initialCategory;
    updateHeroTitle();
  }
  if (initialFeature === 'two-player' || initialFeature === 'vr') {
    activeFeatureFilter = initialFeature;
    updateHeroTitle();
  }
  if (initialPlatform === 'ps4' || initialPlatform === 'ps5') {
    activePlatform = initialPlatform;
  }
  if (initialFilter === 'with-subtitle') {
    pillFilter = 'with-subtitle';
    document.querySelectorAll('#pills button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
    const subtitlePill = document.querySelector('#pills button[data-filter="with-subtitle"]');
    subtitlePill.classList.add('active');
    subtitlePill.setAttribute('aria-pressed', 'true');
  }

  await renderCategoryDrawer();
  await renderPlatformDrawer();
  applyFilter(initialQuery);

  let searchFrame;
  searchInput.addEventListener('input', () => {
    cancelAnimationFrame(searchFrame);
    searchFrame = requestAnimationFrame(() => applyFilter(searchInput.value));
  });

  document.querySelectorAll('#pills button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pills button').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      pillFilter = btn.dataset.filter;
      applyFilter(searchInput.value);
    });
  });


document.getElementById('drawer-close').addEventListener('click', closeDrawer);
}

init();
