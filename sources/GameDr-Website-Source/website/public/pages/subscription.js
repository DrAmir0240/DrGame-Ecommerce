applyLanguage();
initLangToggle();

const planFeatureIcons = {
  speed: '<path d="M13 2 3 14h7l-1 8 12-14h-8l1-6Z"/>',
  storage: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M7 15h.01M11 15h.01"/>',
  platform: '<path d="M6 11h4m-2-2v4m7-2h.01M18 10h.01M7 6h10a4 4 0 0 1 3.9 3.1l1 4.4a2 2 0 0 1-3.4 1.8l-2.3-2.3H7.8l-2.3 2.3a2 2 0 0 1-3.4-1.8l1-4.4A4 4 0 0 1 7 6Z"/>',
  media: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/>',
  extras: '<path d="M12 3 14.5 8.5 20 11l-5.5 2.5L12 19l-2.5-5.5L4 11l5.5-2.5L12 3Z"/><path d="m19 15 1.3 2.7L23 19l-2.7 1.3L19 23l-1.3-2.7L15 19l2.7-1.3L19 15Z"/>',
  categories: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  general: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>',
};

const FREE_PLAN_GAMES = [
  { title: 'Watch Dogs 2', slug: 'watch-dogs-2', fallback: 'WD' },
  { title: 'GTA V', slug: 'grand-theft-auto-v', fallback: 'GTA' },
  { title: 'Rocket League', slug: 'rocket-league', fallback: 'RL', coverUrl: 'https://cdn2.steamgriddb.com/grid/177f0639e76c9d26dbd65846a614a798.png' },
  { title: 'Mortal Kombat 11', slug: 'mortal-kombat-11', fallback: 'MK11' },
  { title: 'Brawlhalla', slug: 'brawlhalla', fallback: 'B', coverUrl: 'https://image.api.playstation.com/vulcan/ap/rnd/202604/1018/c1edd2c2ada287c72633efe4cd2609150313ca5f63079099.jpg?thumb=true&w=320' },
];

function featureIconFor(text) {
  const f = String(text).toLowerCase();
  if (f.includes('speed') || f.includes('سرعت')) return 'speed';
  if (f.includes('quota') || f.includes('سهمیه')) return 'storage';
  if (f.includes('subtitle') || f.includes('زیرنویس')) return 'media';
  if (f.includes('dlc') || f.includes('theme') || f.includes('تم')) return 'extras';
  if (f.includes('categor') || f.includes('دسته‌بند')) return 'categories';
  if (f.includes('ps') || f.includes('xbox') || f.includes('nintendo') || f.includes('نینتندو') || f.includes('بازی')) return 'platform';
  return 'general';
}

async function renderPlans() {
  const grid = document.getElementById('plan-grid');
  let plans = [];
  try { plans = await (await fetch('/api/plans')).json(); } catch (e) { return; }
  let games = [];
  try {
    const response = await fetch('/api/games');
    if (response.ok) games = await response.json();
  } catch (e) { /* Keep the subscription plans visible if the catalog is unavailable. */ }
  const coverBySlug = new Map(games.filter(game => game.slug && game.coverUrl).map(game => [game.slug, game.coverUrl]));
  const tierOrder = { gold: 0, silver: 1, bronze: 2, free: 3 };
  plans = plans.map((plan, index) => ({ plan, index })).sort((a, b) =>
    (tierOrder[a.plan.id] ?? 3) - (tierOrder[b.plan.id] ?? 3) || a.index - b.index
  ).map(item => item.plan);
  const lang = getLang();
  grid.innerHTML = '';
  for (const p of plans) {
    const isFreePlan = p.id === 'free';
    const card = document.createElement('div');
    card.className = 'plan-card plan-' + (/^#/.test(p.color) ? 'custom' : p.color) + (p.featured ? ' plan-featured' : '');
    if (['gold', 'silver', 'bronze', 'free'].includes(p.id)) card.id = 'plan-' + p.id;
    if (/^#/.test(p.color)) card.style.setProperty('--plan', p.color);

    const head = document.createElement('div');
    head.className = 'plan-head';
    const badge = document.createElement('div');
    badge.className = 'plan-badge';
    badge.textContent = p['name_' + lang] || p.name_en;
    const tagline = document.createElement('p');
    tagline.className = 'plan-tagline';
    tagline.textContent = isFreePlan ? t('plan_free_summary') : t('plan_' + p.id + '_summary');
    head.append(badge, tagline);
    const price = document.createElement('div');
    price.className = 'plan-price';
    const baseLabel = p['price_' + lang] || p.price_en;
    if (p.id !== 'free' && window.drtCodeApplies && drtCodeApplies('plans')) {
      const was = document.createElement('span'); was.className = 'price-was'; was.textContent = baseLabel;
      const now = document.createElement('span'); now.className = 'price-now'; now.textContent = drtDiscountLabel(baseLabel, window.DRT_CODE.percent);
      price.append(was, now);
    } else {
      const amount = document.createElement('span');
      amount.className = 'plan-price-amount';
      amount.textContent = baseLabel;
      price.appendChild(amount);
    }
    const per = document.createElement('small');
    per.textContent = p['period_' + lang] || p.period_en || '';
    price.appendChild(per);

    const dataAllowance = document.createElement('div');
    dataAllowance.className = 'plan-data-allowance';
    const quotaGB = Number(p.quotaGB) || 0;
    if (quotaGB > 0) {
      const icon = document.createElement('span');
      icon.className = 'plan-feature-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + planFeatureIcons.storage + '</svg>';
      const quota = quotaGB >= 1024
        ? (quotaGB / 1024).toFixed(1).replace(/\.0$/, '') + ' TB'
        : Number(quotaGB.toFixed(2)).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US') + ' GB';
      const label = document.createElement('span');
      label.textContent = t('plan_data_quota').replace('{quota}', quota);
      dataAllowance.append(icon, label);
    } else dataAllowance.hidden = true;

    const ul = document.createElement('ul');
    ul.className = 'plan-features';
    const feats = p['features_' + lang] && p['features_' + lang].length ? p['features_' + lang] : p.features_en;
    for (const f of (isFreePlan ? [] : feats || []).filter(text => !/quota|سهمیه/i.test(String(text)))) {
      const li = document.createElement('li');
      const limited = /\b(no|not included|not available|not supported|unavailable)\b/i.test(String(f)) || /بدون\b|در دسترس نیست|شامل پلن(?: نیست| نمی‌شود)|امکان .+ ندارد/i.test(String(f));
      li.className = limited ? 'plan-feature is-limited' : 'plan-feature';
      const icon = document.createElement('span');
      icon.className = 'plan-feature-icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + planFeatureIcons[featureIconFor(f)] + '</svg>';
      li.appendChild(icon);
      const label = document.createElement('span');
      label.className = 'plan-feature-label';
      label.textContent = f;
      li.appendChild(label);
      const mark = document.createElement('span');
      mark.className = 'plan-feature-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.textContent = limited ? '×' : '✓';
      li.appendChild(mark);
      ul.appendChild(li);
    }

    let includedGames = null;
    if (p.id === 'free') {
      includedGames = document.createElement('section');
      includedGames.className = 'plan-included-games';
      const list = document.createElement('div');
      list.className = 'plan-included-list';
      for (const game of FREE_PLAN_GAMES) {
        const link = document.createElement('a');
        link.className = 'plan-included-game';
        link.href = '/game.html?slug=' + encodeURIComponent(game.slug);
        const poster = document.createElement('span');
        poster.className = 'plan-included-poster';
        poster.setAttribute('aria-hidden', 'true');
        const coverUrl = coverBySlug.get(game.slug) || game.coverUrl;
        if (coverUrl) {
          const image = document.createElement('img');
          image.src = coverSrc(coverUrl, 160);
          image.alt = '';
          image.width = 40;
          image.height = 58;
          image.loading = 'lazy';
          image.decoding = 'async';
          image.addEventListener('error', () => {
            poster.classList.add('is-placeholder');
            poster.textContent = game.fallback;
          }, { once: true });
          poster.appendChild(image);
        } else {
          poster.classList.add('is-placeholder');
          poster.textContent = game.fallback;
        }
        const title = document.createElement('span');
        title.textContent = game.title;
        link.append(poster, title);
        list.appendChild(link);
      }
      includedGames.append(list);
    }

    let warning = null;
    if (!isFreePlan) {
      warning = document.createElement('aside');
      warning.className = 'plan-warning';
      warning.setAttribute('role', 'note');
      const warningIcon = document.createElement('span');
      warningIcon.className = 'plan-warning-icon';
      warningIcon.setAttribute('aria-hidden', 'true');
      warningIcon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 2.5 17.4A1.8 1.8 0 0 0 4 20h16a1.8 1.8 0 0 0 1.5-2.6L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4m0 3h.01"/></svg>';
      const warningText = document.createElement('span');
      warningText.className = 'plan-warning-text';
      warningText.textContent = t('plan_usage_warning');
      warning.append(warningIcon, warningText);
    }

    const btn = document.createElement('a');
    btn.className = 'plan-btn plan-cta';
    btn.href = p.link || '#';
    const freeActive = p.id === 'free' && window.DRT_USER && window.DRT_USER.freeGamePlanActive;
    btn.textContent = freeActive ? t('free_plan_active') : (p['button_' + lang] || p.button_en || t('sub_subscribe'));
    if (freeActive) btn.classList.add('is-current');
    if (!p.link || p.link === '#') btn.addEventListener('click', e => { e.preventDefault(); subscribe(p, btn); });

    card.append(head, price);
    if (quotaGB > 0) card.appendChild(dataAllowance);
    if (!isFreePlan) card.appendChild(ul);
    if (includedGames) card.appendChild(includedGames);
    if (warning) card.appendChild(warning);
    card.appendChild(btn);
    grid.appendChild(card);
  }
  const targetId = location.hash.slice(1);
  if (/^plan-(gold|silver|bronze)$/.test(targetId)) {
    requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  }
}
async function subscribe(plan, btn) {
  const box = document.getElementById('sub-msg');
  box.textContent = '';
  box.className = 'tk-msg';
  if (!window.DRT_USER) { location.href = '/account.html?next=/subscription.html'; return; }
  btn.style.pointerEvents = 'none';
  try {
    const res = await fetch('/api/account/subscribe', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: plan.id }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('account_error'));
    refreshWallet(data.user);
    box.textContent = plan.id === 'free'
      ? (data.order.alreadyActivated ? t('free_plan_already_active') : t('free_plan_activated'))
      : (data.order.status === 'paid' ? t('sub_done') : t('sub_pending'));
    box.className = 'tk-msg ok';
  } catch (e) {
    box.textContent = e.message;
    box.className = 'tk-msg err';
  }
  btn.style.pointerEvents = '';
}
renderPlans();
drtCodeBox(document.getElementById('sub-code'));
document.addEventListener('drt:code', renderPlans);
