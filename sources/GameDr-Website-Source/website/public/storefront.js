(function () {
  const fa = () => getLang() === 'fa';
  const tr = (en, per) => fa() ? per : en;
  const el = (tag, text, cls) => { const n = document.createElement(tag); if (text != null) n.textContent = text; if (cls) n.className = cls; return n; };
  const date = s => s ? new Date(s).toLocaleDateString(fa() ? 'fa-IR' : 'en-US') : '—';
  const num = n => Number(n || 0).toLocaleString(fa() ? 'fa-IR' : 'en-US');
  let saved = new Set(), userId = null;
  try { saved = new Set(JSON.parse(localStorage.getItem('drt-wishlist') || '[]')); } catch(e) {}
  const getCatalog = () => DRT.json('/api/games');
  let saveQueue = Promise.resolve();
  function persist() {
    if (!userId) { try { localStorage.setItem('drt-wishlist', JSON.stringify([...saved])); } catch(e) {} return Promise.resolve(); }
    const snapshot = [...saved];
    saveQueue = saveQueue.catch(() => {}).then(async () => {
      const res = await fetch('/api/account/wishlist', {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({slugs:snapshot})});
      if (!res.ok) { alert(tr('Could not save your wishlist. Please try again.','ذخیره علاقه‌مندی‌ها انجام نشد. دوباره تلاش کنید.')); }
    });
    return saveQueue;
  }
  function paintSaved() {
    document.querySelectorAll('[data-save-game]').forEach(b => {
      const yes = saved.has(b.dataset.saveGame);
      const label = b.querySelector('.save-game-label');
      if (label) label.textContent = yes ? tr('In wishlist', 'در علاقه مندی‌ها') : tr('Add to wishlist', 'افزودن به علاقه مندی');
      b.classList.toggle('is-saved', yes);
      b.setAttribute('aria-pressed', String(yes));
      b.setAttribute('aria-label', yes ? tr('Remove from wishlist', 'حذف از علاقه مندی‌ها') : tr('Add to wishlist', 'افزودن به علاقه مندی'));
    });
  }
  function setWishlistCount(node, count) {
    if (!node) return;
    node.textContent = fa() ? `${num(count)} نفر در علاقه‌مندی‌ها` : `${num(count)} people wishlisted`;
  }
  async function refreshWishlistCount(slug, node) {
    setWishlistCount(node, 0);
    try {
      const res = await fetch('/api/games/' + encodeURIComponent(slug) + '/wishlist-count', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setWishlistCount(node, Number(data.count) || 0);
    } catch (e) { /* the count is supplemental; keep the zero state */ }
  }
  function saveButton(slug, countNode) {
    const b = el('button', null, 'save-game'); b.type='button'; b.dataset.saveGame=slug;
    const icon = el('span', null, 'save-game-icon');
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 24 24" focusable="false"><path d="M20.8 8.7c0 5.3-8.8 10.4-8.8 10.4S3.2 14 3.2 8.7A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 8.8 2.6Z"></path></svg>';
    b.append(icon, el('span', tr('Add to wishlist', 'افزودن به علاقه مندی'), 'save-game-label'));
    b.setAttribute('aria-label',tr('Add to wishlist','افزودن به علاقه مندی'));
    b.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      if(saved.has(slug)) saved.delete(slug); else saved.add(slug);
      paintSaved();
      persist().finally(() => refreshWishlistCount(slug, countNode));
      renderWishlist();
    };
    return b;
  }

  function wishlistPoster(game) {
    const poster = el('span', null, 'wishlist-game-poster');
    poster.setAttribute('aria-hidden', 'true');
    const fallback = String(game.title || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?';
    if (!game.coverUrl) {
      poster.classList.add('is-placeholder');
      poster.textContent = fallback;
      return poster;
    }
    const image = document.createElement('img');
    image.src = coverSrc(game.coverUrl, 240);
    image.alt = '';
    image.width = 82;
    image.height = 116;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => {
      poster.replaceChildren();
      poster.classList.add('is-placeholder');
      poster.textContent = fallback;
    }, { once: true });
    poster.appendChild(image);
    return poster;
  }

  async function renderWishlist() {
    const box = document.getElementById('customer-wishlist'); if (!box) return;
    try {
      const games = await getCatalog(); box.replaceChildren();
      for (const g of games.filter(g => saved.has(g.slug))) {
        const row = el('article', null, 'wishlist-game-card');
        const a = el('a', null, 'wishlist-game-link');
        a.href = '/game.html?slug=' + encodeURIComponent(g.slug);
        a.setAttribute('aria-label', g.title);
        const copy = el('span', null, 'wishlist-game-copy');
        copy.append(el('strong', g.title), el('small', g.category || tr('Game', 'بازی')));
        a.append(wishlistPoster(g), copy);
        const remove = el('button', tr('Remove', 'حذف'), 'profile-small-btn wishlist-remove');
        remove.type = 'button';
        remove.onclick = () => { saved.delete(g.slug); paintSaved(); persist(); renderWishlist(); };
        row.append(a, remove);
        box.append(row);
      }
      if (!box.childElementCount) box.textContent=tr('Save games using the heart button.','با دکمه قلب بازی‌ها را ذخیره کنید.');
    } catch(e) { box.textContent=tr('Could not load saved games. Refresh to retry.','بارگذاری انجام نشد. صفحه را تازه کنید.'); }
  }
  async function profileExtras(user) {
    const card=document.getElementById('acct-card'); if(!card || !user) return;
    if (!document.getElementById('customer-wishlist')) {
      for(const [id,en,per] of [['customer-wishlist','Wishlist','علاقه‌مندی‌ها'],['customer-requests','My requests','درخواست‌های من']]) {
        const panel=el('section',null,'profile-panel'); panel.append(el('h3',tr(en,per)),Object.assign(el('div'),{id}));card.append(panel);
      }
    }
    renderWishlist(); const box=document.getElementById('customer-requests');box.textContent=tr('Loading…','در حال بارگذاری…');
    try {const res=await fetch('/api/account/requests',{cache:'no-store'});if(!res.ok)throw Error();const rows=await res.json();box.replaceChildren();
      const statuses={new:tr('Pending','در انتظار'),working:tr('Being prepared','در حال آماده‌سازی'),done:tr('Completed','انجام شده'),rejected:tr('Declined','رد شده')};
      const autoStatuses={
        queued:tr('Checking game catalog','در حال بررسی فهرست بازی‌ها'),
        processing:tr('Checking game catalog','در حال بررسی فهرست بازی‌ها'),
        added:tr('Game page added; download files will appear when ready','صفحه بازی اضافه شد؛ فایل‌های دانلود پس از آماده‌شدن نمایش داده می‌شوند'),
        'already-present':tr('This game is already on the website','این بازی از قبل در سایت موجود است'),
        'needs-review':tr('Our team is reviewing this game request','تیم ما در حال بررسی درخواست این بازی است'),
      };
      const automaticUpdates={
        added:'The game page is live. Download files will appear when they are ready.',
        'already-present':'This game is already listed on the website.',
      };
      for(const r of rows){const row=el('div',null,'profile-list-item');row.append(el('strong',r.game || tr('Other request','درخواست دیگر')),el('span',statuses[r.status]),el('small',date(r.updated || r.created)));if(r.autoAddStatus && autoStatuses[r.autoAddStatus])row.append(el('p',autoStatuses[r.autoAddStatus]));if(r.customerUpdate && r.customerUpdate!==automaticUpdates[r.autoAddStatus])row.append(el('p',r.customerUpdate));if(r.type==='game' && r.slug){const a=el('a',tr('Open game','مشاهده بازی'));a.href='/game.html?slug='+encodeURIComponent(r.slug);row.append(a);}box.append(row);}
      if(!rows.length)box.textContent=tr('No requests yet. Use Request a game to get started.','هنوز درخواستی ثبت نشده است. از گزینه درخواست بازی استفاده کنید.');
    }catch(e){box.textContent=tr('Could not load requests. Refresh to retry.','بارگذاری درخواست‌ها انجام نشد. صفحه را تازه کنید.');}
  }
  async function userChanged(user) {
    userId=user ? user.id : null;
    if(user){try{const res=await fetch('/api/account/wishlist',{cache:'no-store'});if(!res.ok)throw Error();const d=await res.json();saved=new Set(d.slugs);paintSaved();}catch(e){} }
    profileExtras(user);
  }
  document.addEventListener('drt:user',e=>userChanged(e.detail.user)); if(window.DRT_USER)userChanged(window.DRT_USER);

  if(document.body.classList.contains('home-page')) {
    DRT.fetchPublic('/api/site-content').then(r=>r.json()).then(c=>{
      const suffix=fa()?'fa':'en';const home=c.home||{};
      for(const [selector,key] of [['.home-title','heading'],['.site-intro p','body'],['.footer-brand p','blurb']]) {
        const node=document.querySelector(selector);if(node && home[key+'_'+suffix])node.textContent=home[key+'_'+suffix];
      }
    }).catch(()=>{});
  }
  const search=document.getElementById('search');
  if(search && location.pathname !== '/games.html'){
    const options=el('datalist');options.id='game-search-options';search.setAttribute('list',options.id);search.after(options);
    getCatalog().then(games=>{search.addEventListener('input',()=>{const q=search.value.trim().toLowerCase();options.replaceChildren(...(q?games.filter(g=>g.title.toLowerCase().includes(q)).slice(0,8):[]).map(g=>{const o=el('option');o.value=g.title;return o;}));});}).catch(()=>{});
  }
  if(location.pathname==='/games.html'){
    const controls=el('section',null,'catalog-controls');controls.setAttribute('aria-label',tr('Catalog filters','فیلترهای کاتالوگ'));const filters={};
    const heading=el('div',null,'catalog-controls-heading');
    const headingCopy=el('div',null,'catalog-controls-copy');headingCopy.append(el('span',tr('Library controls','کنترل‌های کتابخانه'),'catalog-eyebrow'),el('h2',tr('Refine your search','جست‌وجوی خود را دقیق‌تر کنید'),'catalog-title'),el('p',tr('Find the right clips faster with focused filters.','با فیلترهای دقیق، کلیپ مناسب را سریع‌تر پیدا کنید.')));
    const summary=el('div',null,'catalog-controls-summary');summary.append(el('strong','0','catalog-count'),el('span',tr('games found','بازی یافت شد'),'catalog-count-label'),el('span',tr('All games','همه بازی‌ها'),'catalog-context'));heading.append(headingCopy,summary);controls.append(heading);
    const filterGrid=el('div',null,'catalog-filter-grid');controls.append(filterGrid);
    const create=(id,label,opts)=>{const l=el('label',null,'filter-control');l.append(el('span',label,'filter-label'));const shell=el('span',null,'filter-select-shell');const select=el('select');for(const [value,text]of opts){const o=el('option',text);o.value=value;select.append(o);}shell.append(select);l.append(shell);filterGrid.append(l);filters[id]=select;select.onchange=()=>{if(id==='platform')activePlatform=null;applyFilter(search.value);};return select;};
    const platform=create('platform',tr('Platform','پلتفرم'),[['',tr('All platforms','همه پلتفرم‌ها')],['ps4','PS4'],['ps5','PS5']]);
    platform.value=new URLSearchParams(location.search).get('platform') || '';
    create('price',tr('Game download size','حجم دانلود بازی'),[['',tr('Any size','همه حجم‌ها')],['small',tr('Under 100 GB','کمتر از ۱۰۰ گیگابایت')],['medium',tr('100–500 GB','۱۰۰ تا ۵۰۰ گیگابایت')],['large',tr('Over 500 GB','بیشتر از ۵۰۰ گیگابایت')]]);
    create('sort',tr('Sort by','مرتب‌سازی'),[['',tr('Default','پیش‌فرض')],['latest',tr('Latest release','جدیدترین انتشار')],['title',tr('Title','عنوان')],['price',tr('Smallest download size','کمترین حجم دانلود')]]);
    getCatalog().then(games=>{const genres=[...new Set(games.map(g=>g.category))].sort();create('genre',tr('Genre','سبک'),[['',tr('All genres','همه سبک‌ها')],...genres.map(c=>[c,translateCategory(c)])]);}).catch(()=>{});
    const actions=el('div',null,'catalog-controls-actions');const reset=el('button',tr('Reset filters','پاک کردن فیلترها'),'filter-reset');reset.id='filter-reset';reset.type='button';reset.hidden=true;actions.append(reset);controls.append(actions);
    const countNode=summary.querySelector('.catalog-count');const contextNode=summary.querySelector('.catalog-context');
    const updateControls=(count)=>{countNode.textContent=count.toLocaleString(fa()?'fa-IR':'en-US');const active=[];if(search?.value.trim())active.push(tr('Search','جست‌وجو'));if(pillFilter==='with-subtitle')active.push(tr('With subtitle','با زیرنویس'));if(activeCategory)active.push(translateCategory(activeCategory));if(filters.platform?.value)active.push(filters.platform.options[filters.platform.selectedIndex].text);if(filters.genre?.value)active.push(filters.genre.options[filters.genre.selectedIndex].text);if(filters.price?.value)active.push(filters.price.options[filters.price.selectedIndex].text);contextNode.textContent=active.length?active.join(' · '):tr('All games','همه بازی‌ها');reset.hidden=!active.length;};
    reset.addEventListener('click',()=>{if(search)search.value='';pillFilter='all';activeCategory=null;activePlatform=null;document.querySelectorAll('#pills button').forEach((button,index)=>{button.classList.toggle('active',index===0);button.setAttribute('aria-pressed',index===0?'true':'false');});document.querySelectorAll('#category-list button').forEach(button=>button.classList.toggle('active',button.dataset.category===''));updateHeroTitle();Object.values(filters).forEach(select=>{select.value='';});applyFilter('');});
    const grid=document.getElementById('grid');grid.before(controls);
    window.filterCatalog=games=>{let rows=games.filter(g=>{const size=Number(g.gameQuotaGB??g.minQuotaGB);return (!filters.platform.value || (g.platforms||[]).includes(filters.platform.value))&&(!filters.genre?.value || g.category===filters.genre.value)&&(!filters.price.value || (filters.price.value==='small'?size<100:filters.price.value==='medium'?size>=100&&size<=500:size>500));});
      const order=filters.sort.value;if(order==='latest')rows.sort((a,b)=>(b.released||'').localeCompare(a.released||''));if(order==='title')rows.sort((a,b)=>a.title.localeCompare(b.title));if(order==='price')rows.sort((a,b)=>((a.gameQuotaGB??a.minQuotaGB)??Infinity)-((b.gameQuotaGB??b.minQuotaGB)??Infinity));updateControls(rows.length);return rows;};
  }
  function purchaseSummary(data){
    if(document.getElementById('purchase-summary'))return;
    const slug=new URLSearchParams(location.search).get('slug');
    if(!slug)return;
    const section=el('section',null,'purchase-summary wishlist-only');section.id='purchase-summary';
    const count = el('span', null, 'wishlist-count');
    count.setAttribute('aria-live', 'polite');
    section.append(saveButton(slug, count), count);
    refreshWishlistCount(slug, count);
    document.getElementById('description-section').before(section);paintSaved();
  }
  document.addEventListener('game:loaded',e=>purchaseSummary(e.detail));if(window.GAME_DETAILS)purchaseSummary(window.GAME_DETAILS);
})();
