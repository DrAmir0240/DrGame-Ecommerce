applyLanguage();
initLangToggle();

const ICONS = { video: '▶', archive: '\u{1F5C4}️', subtitle: '\u{1F4AC}', other: '\u{1F4C4}' };

function getSlug() {
  return new URLSearchParams(location.search).get('slug') || '';
}

function formatSize(mb) {
  const n = parseFloat(mb);
  if (n >= 1024) return (n / 1024).toFixed(2) + ' GB';
  return n.toFixed(1) + ' MB';
}

// Same search box as the games page, but jumps to /games.html with the
// query so search always searches the full game list, not just this page.
document.getElementById('search').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    location.href = `/games.html?q=${encodeURIComponent(e.target.value)}`;
  }
});

// Tint the page with the main colour of this game's cover (the server works it out from the picture).
function applyAccent(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex || '')) return;
  const n = parseInt(hex.slice(1), 16), rgb = [n >> 16 & 255, n >> 8 & 255, n & 255];
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  // a darker version of the same colour for text on the light theme
  const dark = '#' + rgb.map(v => Math.round(v * 0.55).toString(16).padStart(2, '0')).join('');
  const wash = document.createElement('div');
  wash.className = 'game-ambient';
  wash.setAttribute('aria-hidden', 'true');
  wash.style.setProperty('--accent-rgb', rgb.join(', '));
  document.body.appendChild(wash);
  const targets = document.querySelectorAll('.game-header, .screenshot-section, .description-section, .files-section, #grid, .related-section');
  targets.forEach(el => {
    el.classList.add('game-themed');
    el.style.setProperty('--accent', hex);
    el.style.setProperty('--accent-bright', hex);
    el.style.setProperty('--accent-rgb', rgb.join(', '));
    el.style.setProperty('--accent-ink', lum > 0.5 ? '#111' : '#fff');   // readable text on top of the colour
    el.style.setProperty('--accent-dark', dark);
  });
}

async function init() {
  if (window.DRT && window.DRT.categoryLabelsReady) await window.DRT.categoryLabelsReady;
  const slug = getSlug();
  if (!slug) {
    document.getElementById('game-title').textContent = t('not_found');
    return;
  }

  const res = await fetch(`/api/games/${encodeURIComponent(slug)}/files`);
  if (!res.ok) {
    document.getElementById('game-title').textContent = t('not_found');
    return;
  }

  const data = await res.json();
  if (window.DrtTrack) DrtTrack(slug, 'view');   // feeds the "For you" suggestions
  document.title = data.title + ' — Dr Game';
  document.getElementById('game-title').textContent = data.title;
  document.getElementById('game-poster').dataset.downloadGameSlug = slug;
  initGameReactions(slug);
  window.DrDownloads?.refreshProgressOverlays?.();
  if (data.coverUrl) {
    const poster = document.getElementById('game-poster');
    const img = document.createElement('img');
    img.src = coverSrc(data.coverUrl, 480);
    img.decoding = 'async';
    img.alt = data.title;
    poster.innerHTML = '';
    poster.appendChild(img);
    poster.style.display = '';
  }

  applyAccent(data.accent);
  renderGameTags(data, data.description || data.storySummary || '');

  const totalEl = document.getElementById('total-size');
  if (data.files.length > 0) {
    const sizeStr = formatSize(data.totalSizeMB);
    const gameQuota = Number.isFinite(Number(data.gameQuotaGB)) ? Number(data.gameQuotaGB) : null;
    totalEl.textContent = getLang() === 'fa'
      ? `${data.files.length} فایل · ${sizeStr} مجموع${gameQuota === null ? '' : ` · مصرف سهمیه کل بازی: ${gameQuota.toLocaleString('fa-IR')} گیگابایت`}`
      : `${data.files.length} file${data.files.length === 1 ? '' : 's'} · ${sizeStr} total${gameQuota === null ? '' : ` · Full game uses ${gameQuota.toLocaleString('en-US')} GB quota`}`;
  } else {
    totalEl.textContent = '';
  }

  window.GAME_DETAILS = data;
  document.dispatchEvent(new CustomEvent("game:loaded", {detail:data}));
  window.__files = data.files;
  render(data.files);
  document.addEventListener('drt:code', () => { if (window.__files) render(window.__files); });
  renderScreenshots(data.screenshots || []);
  renderDescription(data.storySummary || data.description, data.storySummaryFa || data.descriptionFa, data);
  // Ratings are deliberately loaded after the local game payload so the page
  // stays responsive even when an upstream store is slow or unavailable.
  loadGameMetadata(slug, data);
}

async function initGameReactions(slug) {
  const root = document.getElementById('game-reactions');
  if (!root || !slug) return;
  const buttons = [...root.querySelectorAll('.game-reaction-btn')];
  const status = document.getElementById('game-reactions-status');
  const countEls = {
    like: document.getElementById('game-reaction-like-count'),
    dislike: document.getElementById('game-reaction-dislike-count'),
  };
  let choice = '';

  const paint = result => {
    choice = result.choice || '';
    buttons.forEach(button => {
      const active = button.dataset.reaction === choice;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    for (const kind of ['like', 'dislike']) {
      const countKey = kind === 'like' ? 'likes' : 'dislikes';
      if (countEls[kind]) countEls[kind].textContent = new Intl.NumberFormat(getLang() === 'fa' ? 'fa-IR' : 'en-US').format(result[countKey] || 0);
    }
    if (status) {
      status.replaceChildren();
      if (choice) status.textContent = t(choice === 'like' ? 'game_reaction_liked' : 'game_reaction_disliked');
    }
  };

  root.hidden = false;
  try {
    const response = await fetch(`/api/games/${encodeURIComponent(slug)}/reactions`, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) throw new Error('Reaction totals are unavailable.');
    paint(await response.json());
  } catch (error) {
    if (status) status.textContent = error.message;
  }

  buttons.forEach(button => button.addEventListener('click', async () => {
    const next = choice === button.dataset.reaction ? '' : button.dataset.reaction;
    buttons.forEach(item => { item.disabled = true; });
    try {
      const response = await fetch(`/api/games/${encodeURIComponent(slug)}/reactions`, {
        method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice: next }),
      });
      const result = await response.json();
      if (response.status === 401) {
        if (status) {
          status.replaceChildren(document.createTextNode(t('game_reaction_login_required') + ' '));
          const login = document.createElement('a');
          login.href = '/account.html?next=' + encodeURIComponent(location.pathname + location.search);
          login.textContent = t('account_login');
          status.appendChild(login);
        }
        return;
      }
      if (!response.ok) throw new Error(result.error || 'Could not save your reaction.');
      paint(result);
      window.dispatchEvent(new CustomEvent('gamedr:reaction-change', { detail: { slug, choice: result.choice } }));
    } catch (error) {
      if (status) status.textContent = error.message;
    } finally {
      buttons.forEach(item => { item.disabled = false; });
    }
  }));
}

function decodeDescription(value) {
  const box = document.createElement('textarea');
  box.innerHTML = String(value || '');
  return box.value.replace(/\s+/g, ' ').trim();
}

function storySummary(value) {
  let text = decodeDescription(value);
  if (!text) return '';
  if (/^edition includes/i.test(text)) {
    const inA = text.search(/\bIn a\b/i);
    const narrative = text.search(/\b(?:From|Join|Hunt|Take control|Discover|Experience the complete|BLAST)\b/i);
    const start = inA > 0 ? inA : narrative;
    if (start > 0) text = text.slice(start);
    else text = text.replace(/^edition includes\s*:?\s*/i, '');
  }
  text = text.replace(/\s*[-•]\s*(?:playstation|ps5|ps4|feel|take advantage|features|online play|dualSense|experience the power|completely rebuilt|a total overhaul|feel immersed).*$/i, '');
  const sentences = (text.match(/[^.!?]+[.!?]+/g) || []).map(sentence => sentence.trim()).filter(sentence =>
    !/^(?:this product entitles|if you already own|buy (?:the |digitally)|note:|important:|edition includes|includes:|playstation vr will|the .* edition includes|standard edition)/i.test(sentence) &&
    !/^(?:the new .{0,35} rpg|become agent 47|darkness falls|rise up|every pitch\. every hit\.|experience the complete real driving simulator)/i.test(sentence)
  );
  const summary = (sentences.slice(0, 2).join(' ').trim() || text).replace(/\s+/g, ' ');
  return summary.length > 520 ? summary.slice(0, 517).replace(/\s+\S*$/, '') + '…' : summary;
}

function studioInitials(name) {
  const words = String(name || '').replace(/[^\p{L}\p{N} ]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  return (words.length > 1 ? words.slice(0, 2) : words).map(word => word[0]).join('').toUpperCase() || '—';
}

function fillDetailList(id, items, fallback) {
  const list = document.getElementById(id);
  list.replaceChildren();
  const values = items.filter(Boolean);
  if (!values.length) values.push(fallback);
  values.forEach(value => {
    const item = document.createElement('li');
    item.textContent = value;
    list.appendChild(item);
  });
}

function storeAwardHints(description) {
  const text = decodeDescription(description);
  const match = text.match(/winner of over [^.]*?awards?/i) || text.match(/(?:multi-award-winning|award-winning)[^.]{0,80}/i);
  if (!match) return [];
  const label = match[0].trim();
  return [label.charAt(0).toUpperCase() + label.slice(1).replace(/[–-]\s*$/, '') + '.'];
}

function supportState(value, description, patterns) {
  if (typeof value === 'boolean') return value;
  return patterns.some(pattern => pattern.test(description)) ? true : null;
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function localizePlaytime(value) {
  if (!value || getLang() !== 'fa') return value;
  return String(value)
    .replace(/\bmain\s*\+\s*sides?\b/ig, 'داستان اصلی و مراحل فرعی')
    .replace(/\bmain\s*\+\s*extras?\b/ig, 'داستان اصلی و محتوای اضافه')
    .replace(/\bmain\s+story\b/ig, 'داستان اصلی')
    .replace(/\bstory\s+mode\b/ig, 'حالت داستانی')
    .replace(/\bcompletionist\b/ig, 'کامل‌کردن همه محتوا')
    .replace(/\bhours?\b/ig, 'ساعت')
    .replace(/\bminutes?\b/ig, 'دقیقه')
    .replace(/\d/g, digit => PERSIAN_DIGITS[digit]);
}

function detectPlayerMode(data, description = '') {
  const raw = String(data.players || '').trim();
  const evidence = `${raw} ${description} ${Array.isArray(data.compatibility) ? data.compatibility.join(' ') : ''}`;
  // An explicit one-player story/local listing stays single-player even when
  // the same listing also mentions a larger online player limit.
  if (/^1\s+(?:story|local|player)\b/i.test(raw)) return 'single';
  if (/^\d+\s*[-–]\s*\d+/.test(raw) || /^[2-9]\d*\b/.test(raw)) return 'multiplayer';
  if (/\b(?:multiplayer|multi[-\s]?player|co-?op|cooperative|online multiplayer|split[-\s]?screen)\b|\b(?:online|local)\b[^\n]*(?:·|[-–]|\b\d+\b)/i.test(raw)) {
    return 'multiplayer';
  }
  if (/^(?:1|one)(?:\s+(?:story|local|player))?$/i.test(raw) ||
      /\b(?:single[-\s]?player|solo|one[-\s]?player)\b/i.test(evidence)) {
    return 'single';
  }
  if (/\b(?:multiplayer|multi[-\s]?player|co-?op|cooperative|online multiplayer|split[-\s]?screen)\b/i.test(evidence)) {
    return 'multiplayer';
  }
  if (/\b[2-9]\s*(?:[-–]\s*\d+)?\s+players?\b/i.test(evidence)) return 'multiplayer';
  if (data.online === true) return 'multiplayer';
  if (data.online === false) return 'single';
  return '';
}

function playerIcon(mode) {
  const icon = document.createElement('span');
  icon.className = 'cat-icon';
  icon.setAttribute('aria-hidden', 'true');
  const person = '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.7-3.4 2.7-5.2 6.5-5.2s5.8 1.8 6.5 5.2"/>';
  const people = '<circle cx="9" cy="8" r="2.7"/><circle cx="16.5" cy="9" r="2.4"/><path d="M3.8 20c.6-3.2 2.4-4.8 5.2-4.8s4.6 1.6 5.2 4.8M14 15.3c2.5-.1 4.3 1.5 4.8 4.7"/>';
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (mode === 'single' ? person : people) + '</svg>';
  return icon;
}

function downloadIcon() {
  const icon = document.createElement('span');
  icon.className = 'cat-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>';
  return icon;
}

function renderGameTags(data, description = '') {
  const tags = document.getElementById('game-tags');
  const category = document.getElementById('category-tag');
  const player = document.getElementById('player-tag');
  const age = document.getElementById('age-tag');
  const download = document.getElementById('download-tag');
  if (!tags || !category || !player || !age || !download) return;

  category.style.display = 'none';
  if (data.category) {
    category.replaceChildren(categoryIcon(data.category), document.createTextNode(translateCategory(data.category)));
    category.href = `/games.html?category=${encodeURIComponent(data.category)}`;
    category.style.display = 'inline-flex';
  }

  const mode = detectPlayerMode(data, description);
  player.hidden = !mode;
  if (mode) {
    player.replaceChildren(playerIcon(mode), document.createTextNode(mode === 'single' ? t('game_tag_single_player') : t('game_tag_multiplayer')));
  } else {
    player.replaceChildren();
  }

  const rating = String(data.ageRating || '').trim();
  age.hidden = !rating;
  if (rating) age.textContent = t('game_tag_age').replace('{age}', rating);

  download.replaceChildren(downloadIcon(), document.createTextNode(t('download_btn')));
  download.hidden = false;
  tags.hidden = false;
}

function renderSupport(data, description) {
  const compatibility = Array.isArray(data.compatibility) ? data.compatibility.join(' ') : '';
  const evidence = `${description} ${compatibility}`;
  const playersMatch = evidence.match(/\b(\d+\s*(?:[-–]|to)\s*\d+|\d+)\s+players?\b/i);
  const playerFallback = /mortal kombat|tekken|street fighter|injustice/i.test(data.title || '') ? '1–2' : null;
  const players = data.players || (playersMatch && playersMatch[1]) || playerFallback;
  const platformText = (data.platforms || []).map(platform => platform.toUpperCase()).join(' · ');
  const rows = [
    ['support', t('game_details_dualsense'), supportState(data.dualSense, evidence, [/dualsense/i, /haptic feedback/i, /adaptive trigger/i, /vibration function/i])],
    ['support', t('game_details_vr'), supportState(data.vr, evidence, [/playstation.?vr/i, /ps vr/i, /vr2/i])],
    ['support', t('game_details_online'), supportState(data.online, evidence, [/online play/i, /online multiplayer/i, /online players?/i])],
    ['players', t('game_details_players'), players || t('game_details_not_listed')],
    ['value', t('game_details_playtime'), localizePlaytime(data.playtime) || t('game_details_varies')],
    ['value', t('game_details_age'), data.ageRating || t('game_details_not_listed')],
    ['value', t('game_details_platforms'), platformText || t('game_details_not_listed')],
  ];
  const list = document.getElementById('game-support-list');
  list.replaceChildren();
  rows.forEach(([kind, label, value]) => {
    const item = document.createElement('li');
    if (kind === 'players') item.className = 'players-row';
    const name = document.createElement('span');
    name.className = 'support-label';
    name.textContent = label;
    const result = document.createElement('strong');
    result.className = typeof value === 'boolean' ? (value ? 'is-supported' : 'is-not-supported') : `support-value${kind === 'players' ? ' players-value' : ''}`;
    if (kind === 'players' && value) {
      // Keep player counts and their English qualifiers in a left-to-right
      // island, even when the surrounding page is Persian/RTL. Splitting the
      // modes also prevents a long mixed-direction string from reordering.
      result.dir = 'ltr';
      String(value).split(/\s*[·•|]\s*/).filter(Boolean).forEach((part, index) => {
        const mode = document.createElement('span');
        mode.className = 'player-mode';
        mode.textContent = part;
        if (index) mode.dataset.separator = '·';
        result.appendChild(mode);
      });
    } else {
      result.textContent = typeof value === 'boolean' ? (value ? t('game_details_supported') : t('game_details_not_supported')) : (value || t('game_details_not_listed'));
    }
    item.append(name, result);
    list.appendChild(item);
  });
}

function renderRatings(data = {}) {
  const panel = document.getElementById('rating-panel');
  const score = document.getElementById('metacritic-score');
  const source = document.getElementById('rating-source');
  const content = document.getElementById('content-rating');
  const badge = document.getElementById('age-rating-badge');
  const label = document.getElementById('age-rating-label');
  const descriptors = document.getElementById('content-descriptors');
  const numericScore = Number(data.metacritic);
  const hasScore = Number.isFinite(numericScore) && numericScore > 0;
  const age = String(data.ageRating || '');
  const hasAge = Boolean(age);

  score.textContent = hasScore ? String(Math.round(numericScore)) : '—';
  score.classList.toggle('has-score', hasScore);
  source.textContent = hasScore ? t('game_details_critic_score') : '';

  content.hidden = !hasAge;
  if (hasAge) {
    const isMature = /mature|m17|17\+/i.test(age);
    badge.textContent = isMature ? 'M' : (age.match(/\b([A-Z0-9]{1,4})\b/) || ['—', '—'])[1];
    badge.classList.toggle('is-mature', isMature);
    badge.setAttribute('aria-label', age);
    label.textContent = age;
    const values = Array.isArray(data.contentDescriptors) ? data.contentDescriptors.filter(Boolean) : [];
    descriptors.textContent = values.length ? values.join(' · ') : '';
    descriptors.hidden = !values.length;
  }
  panel.hidden = !hasScore && !hasAge;
}

async function loadGameMetadata(slug, data) {
  try {
    const res = await fetch(`/api/games/${encodeURIComponent(slug)}/metadata`);
    if (!res.ok) return;
    const metadata = await res.json();
    Object.assign(data, metadata);
    if (metadata.players) data.players = metadata.players;
    if (typeof metadata.online === 'boolean') data.online = metadata.online;
    renderGameTags(data, decodeDescription(getLang() === 'fa' && data.descriptionFa ? data.descriptionFa : data.description));
    renderRatings(data);
    renderSupport(data, decodeDescription(getLang() === 'fa' && data.descriptionFa ? data.descriptionFa : data.description));
  } catch (error) {
    // The local game page remains fully usable if rating services are offline.
  }
}

function renderDescription(description, descriptionFa, data = {}) {
  const section = document.getElementById('description-section');
  section.style.display = '';
  document.querySelector('.description-source').textContent = data.descriptionSource === 'curated'
    ? t('game_details_source_curated')
    : t('game_details_source');
  const source = getLang() === 'fa' && descriptionFa ? descriptionFa : description;
  const cleanSource = decodeDescription(source);
  document.getElementById('description-text').textContent = storySummary(cleanSource) || t('game_details_not_listed');
  renderGameTags(data, cleanSource);

  const company = data.company || t('game_details_not_listed');
  document.getElementById('studio-name').textContent = company;
  const logo = document.getElementById('studio-logo');
  logo.replaceChildren();
  if (data.companyLogo) {
    const image = document.createElement('img');
    image.src = data.companyLogo;
    image.alt = company;
    image.loading = 'lazy';
    image.onerror = () => {
      logo.replaceChildren();
      logo.textContent = studioInitials(company);
    };
    logo.appendChild(image);
  } else {
    logo.textContent = studioInitials(company);
  }
  const awards = Array.isArray(data.awards) && data.awards.length ? data.awards : storeAwardHints(cleanSource);
  fillDetailList('game-awards', awards, t('game_details_no_awards'));
  fillDetailList('company-awards', data.companyAwards || [], t('game_details_no_awards'));
  const awardsSource = document.getElementById('awards-source');
  awardsSource.hidden = !data.awardsSource;
  awardsSource.href = data.awardsSource || '#';
  const companyAwardsSource = document.getElementById('company-awards-source');
  companyAwardsSource.hidden = !data.companyAwardsSource;
  companyAwardsSource.href = data.companyAwardsSource || '#';
  const playtimeSource = document.getElementById('playtime-source');
  playtimeSource.hidden = !data.playtimeSource;
  playtimeSource.href = data.playtimeSource || '#';
  renderSupport(data, cleanSource);
  renderRatings(data);
}

// --- Gameplay screenshots: horizontal rail + scrollable lightbox ---
let shots = [];
let shotIndex = 0;

function renderScreenshots(screenshots) {
  shots = screenshots;
  const section = document.getElementById('screenshot-section');
  const rail = document.getElementById('screenshot-rail');
  rail.innerHTML = '';

  if (shots.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  shots.forEach((url, i) => {
    const thumb = document.createElement('button');
    thumb.className = 'screenshot-thumb';
    thumb.type = 'button';
    const img = document.createElement('img');
    img.src = url + '?h=240';
    img.loading = 'lazy';
    img.alt = `Screenshot ${i + 1}`;
    thumb.appendChild(img);
    thumb.addEventListener('click', () => openLightbox(i));
    rail.appendChild(thumb);
  });
}

function openLightbox(index) {
  shotIndex = index;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
  renderFilmstrip();
  showShot(index);
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}

function showShot(index) {
  shotIndex = (index + shots.length) % shots.length;
  document.getElementById('lightbox-img').src = shots[shotIndex] + '?h=1080';
  document.getElementById('lightbox-counter').textContent = `${shotIndex + 1} / ${shots.length}`;
  document.querySelectorAll('.filmstrip-thumb').forEach((el, i) => {
    el.classList.toggle('active', i === shotIndex);
  });
  const active = document.querySelector('.filmstrip-thumb.active');
  if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function renderFilmstrip() {
  const strip = document.getElementById('lightbox-filmstrip');
  strip.innerHTML = '';
  shots.forEach((url, i) => {
    const thumb = document.createElement('button');
    thumb.className = 'filmstrip-thumb';
    thumb.type = 'button';
    const img = document.createElement('img');
    img.src = url + '?h=160';
    img.loading = 'lazy';
    img.alt = `Screenshot ${i + 1}`;
    thumb.appendChild(img);
    thumb.addEventListener('click', () => showShot(i));
    strip.appendChild(thumb);
  });
}

document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lightbox-prev').addEventListener('click', () => showShot(shotIndex - 1));
document.getElementById('lightbox-next').addEventListener('click', () => showShot(shotIndex + 1));
document.getElementById('lightbox').addEventListener('click', e => {
  if (e.target.id === 'lightbox') closeLightbox();
});
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox').classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') showShot(shotIndex - 1);
  if (e.key === 'ArrowRight') showShot(shotIndex + 1);
});

function render(files) {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  if (files.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty files-empty';
    const msg = document.createElement('p');
    msg.textContent = t('files_none');
    const btn = document.createElement('span');
    btn.className = 'download-btn disabled-btn';
    btn.setAttribute('aria-disabled', 'true');
    btn.textContent = t('download_btn') + ' · ' + t('files_unavailable');
    const ask = document.createElement('a');
    ask.className = 'files-request';
    ask.href = '/request.html?type=game&game=' + encodeURIComponent(document.getElementById('game-title').textContent) + '&slug=' + encodeURIComponent(getSlug());
    ask.textContent = t('files_request');
    empty.append(msg, btn, ask);
    grid.appendChild(empty);
    return;
  }

  for (const file of files) {
    grid.appendChild(makeCard(file));
  }
}

function makeCard(file) {
  const card = document.createElement('div');
  card.className = 'card';

  const thumbWrap = document.createElement('div');
  thumbWrap.className = 'thumb-wrap';

  if (file.thumbUrl) {
    const img = document.createElement('img');
    img.src = file.thumbUrl;
    img.loading = 'lazy';
    thumbWrap.appendChild(img);
  } else if (file.type === 'image' && !file.locked) {
    const img = document.createElement('img');
    DrDownloads.freshLink(file.downloadUrl).then(u => { img.src = u; }).catch(() => {});
    img.loading = 'lazy';
    thumbWrap.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.className = 'placeholder';
    span.textContent = ICONS[file.type] || ICONS.other;
    thumbWrap.appendChild(span);
  }

  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = formatSize(file.sizeMB);
  thumbWrap.appendChild(badge);

  const priceTag = document.createElement('span');
  priceTag.className = 'price-tag' + (file.locked ? '' : ' owned');
  if (file.locked) {
    priceTag.append(document.createTextNode(shownPrice(file) + ' · ' + t('game_price_short')));
  } else {
    priceTag.textContent = Number(file.gameQuotaGB) === 0 ? t('file_free') : '\u2713 ' + t('file_owned');
  }
  thumbWrap.appendChild(priceTag);

  const body = document.createElement('div');
  body.className = 'card-body';

  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = file.name;

  const meta = document.createElement('div');
  meta.className = 'card-meta';
  meta.textContent = file.ext;

  const link = document.createElement('a');
  link.className = 'download-btn';
  if (file.locked) {
    link.href = '#';
    link.classList.add('unlock-btn');
    link.textContent = t('game_unlock') + ' \u00b7 ' + shownPrice(file) + ' GB';
    link.addEventListener('click', e => { e.preventDefault(); unlockFile(file, link, card); });
  } else {
    link.href = file.downloadUrl;
    link.textContent = t('download_btn');
  }

  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(link);

  card.appendChild(thumbWrap);
  card.appendChild(body);
  return card;
}

let flashTimer;
function flash(text, kind, withLink) {
  let box = document.getElementById('file-flash');
  if (!box) {
    box = document.createElement('div');
    box.id = 'file-flash';
    box.className = 'file-flash';
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.className = 'file-flash ' + (kind || '');
  if (withLink) {
    const a = document.createElement('a');
    a.href = '/subscription.html';
    a.textContent = ' ' + t('file_get_tokens') + ' \u2192';
    box.appendChild(a);
  }
  box.style.display = 'block';
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { box.style.display = 'none'; }, 5000);
}

function shownPrice(file) {
  const quota = Number(file.gameQuotaGB ?? file.quotaGB ?? 0);
  return quota.toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 });
}

async function unlockFile(file, link, card) {
  if (!window.DRT_USER) { location.href = '/account.html?next=' + encodeURIComponent(location.pathname + location.search); return; }
  if (!window.DRT_USER.plan || window.DRT_USER.plan === 'free') {
    flash(t('plan_required'), 'err', true);
    return;
  }
  const priceText = shownPrice(file);
  if (!confirm(t('game_unlock_confirm').replace('{price}', priceText))) return;
  link.style.pointerEvents = 'none';
  try {
    const res = await fetch('/api/store/buy-file', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: getSlug(), file: file.name }),
    });
    const data = await res.json();
    if (res.status === 402) {
      const f = n => Number(n).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US');
      flash(t('file_not_enough').replace('{price}', f(data.requiredGB)).replace('{balance}', f(data.remainingGB)), 'err', true);
      link.style.pointerEvents = '';
      return;
    }
    if (res.status === 403) {
      flash(data.error || t('plan_required'), 'err', true);
      link.style.pointerEvents = '';
      return;
    }
    if (!res.ok) throw new Error(data.error || 'Error');
    refreshWallet(data.user);
    if (window.__files) window.__files.forEach(item => { item.locked = false; item.owned = true; item.gameUnlock = true; });
    render(window.__files || [file]);
    flash(t('game_unlocked'), 'ok');
  } catch (e) {
    flash(e.message, 'err');
    link.style.pointerEvents = '';
  }
}

// ---- Related games: same series, same studio or same genre as this game ----
function relTile(g) {
  const tile = document.createElement('a');
  tile.className = 'game-tile';
  tile.href = '/game.html?slug=' + encodeURIComponent(g.slug);
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
    art.textContent = g.title.slice(0, 2).toUpperCase();
  }
  const title = document.createElement('div');
  title.className = 'tile-title';
  title.textContent = g.title;
  tile.append(art, title);
  if (g.reason) {
    const why = document.createElement('div');
    why.className = 'tile-reason';
    const r = g.reason;
    why.textContent = r.type === 'series' ? t('rel_series') : r.type === 'company' ? t('rel_company').replace('{company}', r.company) : t('rel_genre').replace('{category}', translateCategory(r.category));
    tile.appendChild(why);
  }
  return tile;
}
async function renderRelated() {
  const slug = getSlug();
  if (!slug) return;
  try {
    const res = await fetch('/api/games/' + encodeURIComponent(slug) + '/related');
    if (!res.ok) return;
    const list = await res.json();
    if (!list.length) return;
    document.getElementById('related-row').replaceChildren(...list.map(relTile));
    document.getElementById('related-section').style.display = '';
  } catch (e) { /* the section simply stays hidden */ }
}
renderRelated();

init();

// ---- Report a problem ----
const REPORT_REASONS = ['unrelated', 'age', 'broken', 'wrong', 'other'];
(function setupReport() {
  const bg = document.getElementById('report-bg');
  const opts = document.getElementById('report-options');
  const status = document.getElementById('report-status');
  REPORT_REASONS.forEach((r, i) => {
    const label = document.createElement('label');
    label.className = 'report-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'report-reason';
    input.value = r;
    const text = document.createElement('span');
    text.textContent = t('report_reason_' + r);
    label.append(input, text);
    opts.appendChild(label);
  });
  const open = () => { status.textContent = ''; status.className = 'contact-status'; bg.style.display = 'flex'; };
  const close = () => { bg.style.display = 'none'; };
  document.getElementById('report-btn').addEventListener('click', open);
  document.getElementById('report-cancel').addEventListener('click', close);
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  document.getElementById('report-form').addEventListener('submit', async e => {
    e.preventDefault();
    const picked = document.querySelector('input[name="report-reason"]:checked');
    if (!picked) { status.textContent = t('report_pick'); status.className = 'contact-status err'; return; }
    const submit = document.getElementById('report-submit');
    submit.disabled = true;
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: getSlug(),
          reason: picked.value,
          details: document.getElementById('report-details').value,
          email: document.getElementById('report-email').value,
          website: document.getElementById('report-website').value,
        }),
      });
      if (!res.ok) throw new Error('report failed');
      e.target.reset();
      status.textContent = t('report_thanks');
      status.className = 'contact-status ok';
      setTimeout(close, 1800);
    } catch (err) {
      status.textContent = t('report_error');
      status.className = 'contact-status err';
    } finally {
      submit.disabled = false;
    }
  });
})();
