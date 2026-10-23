// Text can not be selected, copied or dragged out of the pages (typing boxes still work, and so do the site's own
// "Copy" buttons). This only stops casual copying: nothing in a browser can fully prevent it.
(function () {
  var style = document.createElement('style');
  style.textContent = 'html { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; } ' +
    'input, textarea, [contenteditable="true"], .allow-copy { -webkit-user-select: text; user-select: text; } ' +
    'img { -webkit-user-drag: none; }';
  document.head.appendChild(style);
  var typing = function (t) { return t && t.closest && t.closest('input, textarea, [contenteditable="true"], .allow-copy'); };
  ['copy', 'cut', 'dragstart', 'selectstart'].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!typing(e.target)) e.preventDefault(); }, true);
  });
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a' || e.key === 'u' || e.key === 's') && !typing(e.target)) e.preventDefault();
  }, true);
})();

// Light / dark mode. Loaded in <head> so the saved theme is applied before the
// first paint (no flash). Adds the sun/moon button to the header.
(function () {
  var KEY = 'gv_theme';
  function get() {
    try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; }
  }
  function apply(t) {
    document.documentElement.setAttribute('data-theme', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#ffffff' : '#1e1f22');
  }
  apply(get());
  window.getTheme = get;

  var SUN = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7"/></g></svg>';
  var MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a.7.7 0 0 0-.9-.9A9.6 9.6 0 1 0 21.4 15.500a.7.7 0 0 0-.9-.9Z"/></svg>';

  function label(t) {
    var lang = '';
    try { lang = localStorage.getItem('gv_lang'); } catch (e) { /* ignore */ }
    if (lang === 'fa') return t === 'light' ? 'حالت تیره' : 'حالت روشن';
    return t === 'light' ? 'Switch to dark mode' : 'Switch to light mode';
  }
  function paint(btn) {
    var t = get();
    // show the icon of the mode you will switch to
    btn.innerHTML = t === 'light' ? MOON : SUN;
    btn.title = label(t);
    btn.setAttribute('aria-label', label(t));
  }

  function mount() {
    var topbar = document.querySelector('.topbar');
    if (!topbar || document.getElementById('theme-toggle')) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'theme-toggle';
    btn.className = 'theme-toggle';
    paint(btn);
    btn.addEventListener('click', function () {
      var next = get() === 'light' ? 'dark' : 'light';
      try { localStorage.setItem(KEY, next); } catch (e) { /* storage blocked: applies for this page only */ }
      apply(next);
      paint(btn);
      document.dispatchEvent(new CustomEvent('gv:theme', { detail: next }));
    });
    var actions = topbar.querySelector('.header-actions') || topbar;
    actions.insertBefore(btn, actions.querySelector('#lang-toggle') || null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
