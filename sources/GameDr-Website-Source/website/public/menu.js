// Makes the hamburger menu available on every page and adds the Home button.
//
// index.html and games.html ship their own menu (with their own open/close
// code); on every other page this script builds the same menu. On all pages it
// adds a "Home" row at the top. Loaded after i18n.js and before wallet.js so the
// wallet card can be added to the menu this script creates.
(function () {
  const GP_ICON = '<svg class="drawer-link-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7.5 6h9A5.5 5.5 0 0 1 22 11.5v1.6c0 2.7-1.3 4.9-3.1 4.9-1.2 0-2.1-.8-2.9-2l-.9-1.3a1.6 1.6 0 0 0-1.3-.7h-3.6a1.6 1.6 0 0 0-1.3.7L8 16c-.8 1.2-1.7 2-2.9 2C3.3 18 2 15.8 2 13.1v-1.6A5.5 5.5 0 0 1 7.5 6Zm.25 3.25v1.25H6.5v1.5h1.25v1.25h1.5V12h1.25v-1.5H9.25V9.25h-1.5ZM16 9.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm2.5 1.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"/></svg>';
  const HOME_ICON = '<svg class="drawer-link-svg" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 3 2.5 11.2a.8.8 0 0 0 .5 1.4H5V20a1 1 0 0 0 1 1h4.2v-5.4h3.6V21H18a1 1 0 0 0 1-1v-7.4h2a.8.8 0 0 0 .5-1.4L12 3Z"/></svg>';

  const s = (key, fallback) => (typeof t === 'function' ? t(key) : fallback);

  function buildDrawer() {
    const topbar = document.querySelector('.topbar');
    if (!topbar) return false;

    // Keep the hamburger at the physical left edge of the utility controls.
    const burger = document.createElement('button');
    burger.className = 'hamburger';
    burger.id = 'hamburger';
    burger.setAttribute('aria-label', typeof getLang === 'function' && getLang() === 'fa' ? 'باز کردن منو' : 'Open menu');
    burger.innerHTML = '<span></span><span></span><span></span>';
    const brandGroup = topbar.querySelector('.header-brand-group');
    const actions = topbar.querySelector('.header-actions');
    if (actions) actions.insertBefore(burger, actions.firstChild || null);
    else if (brandGroup) brandGroup.appendChild(burger);
    else topbar.insertBefore(burger, topbar.firstChild);

    const overlay = document.createElement('div');
    overlay.className = 'drawer-overlay';
    overlay.id = 'drawer-overlay';

    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    drawer.id = 'drawer';
    // static markup only (no user data); text comes from t()
    drawer.innerHTML =
      '<div class="drawer-header">' +
        '<a class="brand" href="/"><img src="/logo.png" alt="Dr Game" class="brand-logo"></a>' +
        '<button class="drawer-close" id="drawer-close" aria-label="Close">&times;</button>' +
      '</div>' +
      '<a class="drawer-link" href="/subscription.html">' +
        '<img class="drawer-link-logo" src="/logo.png" alt="">' +
        '<span class="drawer-link-text"><strong></strong><small></small></span>' +
        '<span class="drawer-link-arrow">&rarr;</span>' +
      '</a>' +
      '<a class="drawer-link drawer-gamepad" href="/gamepad-tester.html">' +
        '<span class="drawer-link-icon">' + GP_ICON + '</span>' +
        '<span class="drawer-link-text"><strong></strong><small></small></span>' +
        '<span class="drawer-link-arrow">&rarr;</span>' +
      '</a>' +
      '<details class="drawer-tools-group">' +
        '<summary class="drawer-section-label drawer-tools-toggle" data-i18n="drawer_tools"></summary>' +
        '<a class="drawer-link drawer-tool-link" href="/payload.html">' +
          '<span class="drawer-link-icon" aria-hidden="true"><svg class="drawer-link-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 4.5 5 5M13 6l5 5M4 20l6.5-6.5M3 21l4.5-1.5L19 8a2.8 2.8 0 0 0-4-4L3.5 15.5 2 20Z"/><path d="m12 12 2 2"/></svg></span>' +
          '<span class="drawer-link-text"><strong data-i18n="payload_heading"></strong><small data-i18n="drawer_payload_hint"></small></span>' +
          '<span class="drawer-link-arrow">&rarr;</span>' +
        '</a>' +
      '</details>' +
      '<ul class="drawer-list" id="category-list"></ul>' +
      '<div class="drawer-divider"></div>' +
      '<div class="drawer-section-label drawer-platform-label"></div>' +
      '<ul class="drawer-list" id="platform-list"></ul>' +
      '<div class="drawer-divider"></div>' +
      '<a class="drawer-contact" href="/contact.html"><span class="drawer-contact-icon">&#9993;</span><span></span><span class="drawer-link-arrow">&rarr;</span></a>';

    document.body.append(overlay, drawer);

    // texts
    const links = drawer.querySelectorAll('.drawer-link');
    links[0].querySelector('strong').textContent = s('nav_subscription', 'Subscription');
    links[0].querySelector('small').textContent = s('sub_tagline', 'Bronze, Silver & Gold plans');
    links[1].querySelector('strong').textContent = s('nav_gamepad', 'Gamepad Tester');
    links[1].querySelector('small').textContent = s('gp_sub_tagline', 'Check every button & stick');
    drawer.querySelector('.drawer-tools-toggle').textContent = s('drawer_tools', 'Tools');
    drawer.querySelector('.drawer-tool-link strong').textContent = s('payload_heading', 'Payload');
    drawer.querySelector('.drawer-tool-link small').textContent = s('drawer_payload_hint', 'PlayStation digital tools');
    drawer.querySelector('.drawer-platform-label').textContent = s('drawer_platform_label', 'Platform');
    drawer.querySelector('.drawer-contact span:nth-child(2)').textContent = s('nav_contact', 'Contact Us');

    fillLists();
    return true;
  }

  // categories + platforms: plain links into the games page
  async function fillLists() {
    const cats = document.getElementById('category-list');
    const plats = document.getElementById('platform-list');
    function row(text, count, href, cat, imagePath) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.addEventListener('click', () => { location.href = href; });
      if (imagePath) {
        const icon = document.createElement('img');
        icon.className = 'drawer-platform-icon';
        icon.src = imagePath;
        icon.alt = '';
        icon.width = 34;
        icon.height = 34;
        icon.loading = 'lazy';
        icon.decoding = 'async';
        btn.appendChild(icon);
      }
      const label = cat !== undefined ? categoryLabel(cat, text) : document.createElement('span');
      if (cat === undefined) label.textContent = text;
      btn.appendChild(label);
      if (count !== undefined) {
        const c = document.createElement('span');
        c.className = 'cat-count';
        c.textContent = count;
        btn.appendChild(c);
      }
      li.appendChild(btn);
      return li;
    }
    cats.appendChild(row(s('drawer_all_categories', 'All Categories'), undefined, '/games.html', '__all'));
    try {
      const list = await (await DRT.fetchPublic('/api/categories')).json();
      DRT.setCategoryLabels?.(list);
      for (const c of list) cats.appendChild(row(translateCategory(c.name), c.count, '/games.html?category=' + encodeURIComponent(c.name), c.name));
      const platformCounts = new Map();
      try {
        const p = await (await DRT.fetchPublic('/api/platforms')).json();
        for (const x of p) platformCounts.set(x.id, x.count);
      } catch (e) { /* Platform shortcuts remain available when counts cannot load. */ }
      const shortcuts = [
        ['nav_ps5', 'PS5', 'ps5', 'ps5'],
        ['nav_ps4', 'PS4', 'ps4', 'ps4'],
        ['nav_psvr2', 'PS VR2', 'psvr2', 'psvr2'],
        ['nav_xbox360', 'Xbox 360', 'xbox-360', 'xbox360'],
        ['nav_nintendo_switch', 'Nintendo Switch', 'nintendo-switch', 'switch'],
      ];
      for (const [key, fallback, platform, asset] of shortcuts) {
        plats.appendChild(row(s(key, fallback), platformCounts.get(platform), '/games.html?platform=' + encodeURIComponent(platform), undefined, '/assets/platforms/' + asset + '.svg'));
      }
    } catch (e) { /* offline: the shortcuts above still work */ }
  }

  // "Home" row at the very top of every menu
  function addHome() {
    const drawer = document.getElementById('drawer');
    if (!drawer || drawer.querySelector('.drawer-home')) return;
    const a = document.createElement('a');
    a.className = 'drawer-link drawer-home';
    a.href = '/';
    a.innerHTML = '<span class="drawer-link-icon">' + HOME_ICON + '</span><span class="drawer-link-text"><strong></strong></span><span class="drawer-link-arrow">&rarr;</span>';
    a.querySelector('strong').textContent = s('nav_home', 'Home');
    const header = drawer.querySelector('.drawer-header');
    drawer.insertBefore(a, header ? header.nextSibling : drawer.firstChild);
  }

  // "Profile" row: your name and username when logged in, a log-in link otherwise
  function addProfile() {
    const drawer = document.getElementById('drawer');
    if (!drawer || drawer.querySelector('.drawer-profile')) return;
    const a = document.createElement('a');
    a.className = 'drawer-link drawer-profile';
    a.href = '/account.html';
    a.innerHTML = '<span class="avatar-dot"></span><span class="drawer-link-text"><strong></strong><small></small></span><span class="drawer-link-arrow">&rarr;</span>';
    const home = drawer.querySelector('.drawer-home');
    if (home) home.after(a); else drawer.insertBefore(a, drawer.firstChild);
    const dot = a.querySelector('.avatar-dot'), strong = a.querySelector('strong'), small = a.querySelector('small');
    const paint = user => {
      if (!user) {
        dot.querySelector('img')?.remove();
        dot.classList.remove('has-avatar-image');
        dot.textContent = '\uD83D\uDC64';
        strong.textContent = s('prof_login', 'Log in or sign up');
        small.textContent = s('prof_invite_hint', 'Share your marketer code for attributed sales');
        a.href = '/account.html?next=' + encodeURIComponent(location.pathname + location.search);
      } else {
        dot.textContent = '';
        dot.classList.add('has-avatar-image');
        let image = dot.querySelector('img');
        if (!image) { image = document.createElement('img'); image.alt = ''; image.width = 42; image.height = 42; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer'; image.onerror = () => { image.onerror = null; image.src = window.DRT_PLAYSTATION_DEFAULT_AVATAR || '/avatar-fallback.svg'; }; dot.appendChild(image); }
        image.src = window.drtAvatarImageUrl ? window.drtAvatarImageUrl(user.avatarId) : (window.DRT_PLAYSTATION_DEFAULT_AVATAR || '/avatar-fallback.svg');
        strong.textContent = user.name;
        small.textContent = (user.username ? '@' + user.username + '  \u00b7  ' : '') + s('prof_view', 'Your profile');
        a.href = '/account.html';
      }
    };
    paint(window.DRT_USER || null);
    document.addEventListener('drt:user', e => paint(e.detail.user));
  }

  // "Request a game / subtitle" sits just above Contact Us at the bottom of the menu
  function addRequest() {
    const drawer = document.getElementById('drawer');
    if (!drawer || drawer.querySelector('.drawer-request')) return;
    const a = document.createElement('a');
    a.className = 'drawer-contact drawer-request';
    a.href = '/request.html';
    a.innerHTML = '<span class="drawer-contact-icon">\uD83D\uDCA1</span><span></span><span class="drawer-link-arrow">&rarr;</span>';
    a.querySelector('span:nth-child(2)').textContent = s('req_nav', 'Request a game / subtitle');
    const contact = drawer.querySelector('.drawer-contact:not(.drawer-request)');
    if (contact) contact.before(a); else drawer.appendChild(a);
  }

  function addIdeasShortcut() {
    const drawer = document.getElementById('drawer');
    if (!drawer || drawer.querySelector('.drawer-ideas')) return;
    const a = document.createElement('a');
    a.className = 'drawer-contact drawer-ideas';
    a.href = '/profile.html?tab=support#ideas';
    a.innerHTML = '<span class="drawer-contact-icon">\u2728</span><span></span><span class="drawer-link-arrow">&rarr;</span>';
    a.querySelector('span:nth-child(2)').textContent = s('nav_ideas', 'Ideas and proposals');
    const contact = drawer.querySelector('.drawer-contact:not(.drawer-request):not(.drawer-ideas)');
    if (contact) contact.before(a); else drawer.appendChild(a);
  }


  function connectDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawer-overlay');
    const burger = document.getElementById('hamburger');
    if (!drawer || !overlay || !burger) return;
    drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', s('drawer_all_categories', 'Navigation'));
    burger.setAttribute('aria-controls', 'drawer'); burger.setAttribute('aria-expanded', 'false');
    const setInert = value => { drawer.inert = value; drawer.setAttribute('aria-hidden', String(value)); };
    setInert(true);
    function open() {
      drawer.classList.add('open'); overlay.classList.add('open'); document.body.classList.add('drawer-visible');
      setInert(false); burger.setAttribute('aria-expanded', 'true');
      drawer.querySelector('#drawer-close').focus({ preventScroll: true });
    }
    function close() {
      drawer.classList.remove('open'); overlay.classList.remove('open'); document.body.classList.remove('drawer-visible');
      setInert(true); burger.setAttribute('aria-expanded', 'false'); burger.focus({ preventScroll: true });
    }
    window.SiteMenu = { open, close };
    burger.addEventListener('click', open);
    drawer.querySelector('#drawer-close').addEventListener('click', close);
    overlay.addEventListener('click', close);
    document.addEventListener('keydown', e => {
      if (!drawer.classList.contains('open')) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      const items = [...drawer.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')].filter(n => n.getClientRects().length);
      const first=items[0], last=items[items.length-1];
      if (!items.length) return;
      if (e.shiftKey && document.activeElement===first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement===last) { e.preventDefault(); first.focus(); }
    });
  }
  function mount() {
    if (!document.getElementById('drawer')) buildDrawer();
    connectDrawer();
    // runs after wallet.js has added its card, so Home ends up above it
    setTimeout(() => { addHome(); addProfile(); addIdeasShortcut(); addRequest(); }, 0);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
