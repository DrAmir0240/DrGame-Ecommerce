applyLanguage();
initLangToggle();

// ---------------- texts ----------------
const TXT = {
  en: {
    intro: 'Connect your controller, then press its buttons and move its sticks. Every part you test turns green, so you can see what works and what does not.',
    emptyTitle: 'Connect your controller',
    emptyText: 'Plug it in with a USB cable or pair it with Bluetooth, then press any button on it. Your browser only shows a controller after a button is pressed.',
    sub: (n, b, a) => n + ' buttons \u00b7 ' + a + ' axes',
    vibe: 'Test vibration', vibeNo: 'Vibration is not supported by this browser or controller.', vibeOn: 'Vibrating\u2026',
    reset: 'Start over',
    listTitle: 'Parts checklist',
    done: 'All parts work \u2713', progress: (t, n) => t + ' of ' + n + ' parts tested',
    missing: 'Not tested yet: ',
    stick: { l: 'Left stick', r: 'Right stick' }, drift: 'Possible drift', ok: 'centered',
    stickRing: 'move in a full circle',
    advBtn: 'Show advanced tester', advHide: 'Hide advanced tester',
    advHint: 'Advanced mode: detailed DualSense info (battery, firmware, microphone, 3D view). Needs a DualSense or DualSense Edge.',
    labels: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', back: 'Back', start: 'Start', home: 'Home', l3: 'L3', r3: 'R3', up: 'Up', down: 'Down', left: 'Left', right: 'Right' },
    psLabels: { a: '\u2715', b: '\u25cb', x: '\u25a1', y: '\u25b3', lb: 'L1', rb: 'R1', lt: 'L2', rt: 'R2', back: 'Share', start: 'Options', home: 'PS' },
    ctrl: 'Controller',
  },
  fa: {
    intro: 'دسته را وصل کن، بعد دکمه‌ها را بزن و آنالوگ‌ها را حرکت بده. هر بخشی که تست شود سبز می‌شود تا ببینی کدام سالم است و کدام نه.',
    emptyTitle: 'دسته‌ات را وصل کن',
    emptyText: 'با کابل USB وصل کن یا با بلوتوث جفت کن و بعد یک دکمه‌اش را بزن. مرورگر فقط بعد از زدن یک دکمه دسته را نشان می‌دهد.',
    sub: (n, b, a) => n + ' دکمه \u00b7 ' + a + ' محور',
    vibe: 'تست لرزش', vibeNo: 'این مرورگر یا دسته از لرزش پشتیبانی نمی‌کند.', vibeOn: 'در حال لرزش\u2026',
    reset: 'شروع دوباره',
    listTitle: 'فهرست بخش‌ها',
    done: 'همه‌ی بخش‌ها سالم است \u2713', progress: (t, n) => t + ' از ' + n + ' بخش تست شد',
    missing: 'هنوز تست نشده: ',
    stick: { l: 'آنالوگ چپ', r: 'آنالوگ راست' }, drift: 'احتمال دریفت', ok: 'وسط',
    stickRing: 'یک دور کامل بچرخان',
    advBtn: 'نمایش تستر پیشرفته', advHide: 'بستن تستر پیشرفته',
    advHint: 'حالت پیشرفته: اطلاعات کامل DualSense (باتری، فریمور، میکروفون، نمای سه‌بعدی). به DualSense یا DualSense Edge نیاز دارد.',
    labels: { a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB', lt: 'LT', rt: 'RT', back: 'Back', start: 'Start', home: 'Home', l3: 'L3', r3: 'R3', up: 'بالا', down: 'پایین', left: 'چپ', right: 'راست' },
    psLabels: { a: '\u2715', b: '\u25cb', x: '\u25a1', y: '\u25b3', lb: 'L1', rb: 'R1', lt: 'L2', rt: 'R2', back: 'Share', start: 'Options', home: 'PS' },
    ctrl: 'دسته',
  },
};
const L = () => TXT[getLang() === 'fa' ? 'fa' : 'en'];
const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';

// ---------------- state ----------------
// Standard Gamepad API mapping: buttons 0-3 face, 4/5 shoulders, 6/7 triggers, 8 back,
// 9 start, 10/11 stick clicks, 12-15 d-pad, 16 home. Axes 0-1 left stick, 2-3 right stick.
const PARTS = [
  { id: 'a', btn: 0 }, { id: 'b', btn: 1 }, { id: 'x', btn: 2 }, { id: 'y', btn: 3 },
  { id: 'lb', btn: 4 }, { id: 'rb', btn: 5 }, { id: 'lt', btn: 6, trigger: true }, { id: 'rt', btn: 7, trigger: true },
  { id: 'up', btn: 12 }, { id: 'down', btn: 13 }, { id: 'left', btn: 14 }, { id: 'right', btn: 15 },
  { id: 'back', btn: 8 }, { id: 'start', btn: 9 }, { id: 'home', btn: 16 },
  { id: 'l3', btn: 10 }, { id: 'r3', btn: 11 },
  { id: 'lstick', stick: 0 }, { id: 'rstick', stick: 1 },
];
let parts = PARTS;
let tested = new Set();
let sectors = [new Set(), new Set()];
let pickedIndex = null;
let padType = 'xbox';
let idleSince = [0, 0];

function detectType(id) { return /054c|sony|playstation|dualshock|dualsense/i.test(id) && !/xbox|045e/i.test(id) ? 'ps' : 'xbox'; }
function label(id) {
  const t = L();
  if (padType === 'ps' && t.psLabels[id]) return t.psLabels[id];
  return t.labels[id] || id;
}
function partName(p) {
  if (p.stick !== undefined) return L().stick[p.stick === 0 ? 'l' : 'r'] + ' (' + L().stickRing + ')';
  return label(p.id);
}

// ---------------- UI build ----------------
function buildChips() {
  const box = $('sp-chips');
  box.replaceChildren();
  for (const p of parts) {
    const chip = document.createElement('div');
    chip.className = 'sp-chip';
    chip.id = 'chip-' + p.id;
    const dot = document.createElement('span');
    dot.className = 'sp-dot';
    const text = document.createElement('span');
    text.textContent = p.stick !== undefined ? L().stick[p.stick === 0 ? 'l' : 'r'] : label(p.id);
    chip.append(dot, text);
    box.appendChild(chip);
  }
}
function applyLabels() {
  document.querySelectorAll('#sp-svg [data-lbl]').forEach(el => { el.textContent = label(el.getAttribute('data-lbl')); });
  buildChips();
  for (const id of tested) markChip(id);
}
function markChip(id) { const c = $('chip-' + id); if (c) c.classList.add('done'); }
function summary() {
  const total = parts.length;
  const done = parts.filter(p => tested.has(p.id)).length;
  const box = $('sp-result');
  if (done === total) { box.textContent = L().done; box.className = 'sp-result ok'; return; }
  const missing = parts.filter(p => !tested.has(p.id)).map(partName);
  box.textContent = L().progress(done, total);
  const sub = document.createElement('div');
  sub.className = 'sp-missing';
  sub.textContent = L().missing + missing.join(', ');
  box.appendChild(sub);
  box.className = 'sp-result';
}

// ---------------- polling ----------------
function pads() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  return [...list].filter(Boolean);
}
function currentPad() {
  const all = pads();
  if (!all.length) return null;
  return all.find(p => p.index === pickedIndex) || all[0];
}
function refreshPicker(all, current) {
  const sel = $('sp-pick');
  if (all.length < 2) { sel.style.display = 'none'; return; }
  sel.style.display = '';
  if (sel.options.length !== all.length) {
    sel.replaceChildren(...all.map((p, i) => { const o = document.createElement('option'); o.value = p.index; o.textContent = (i + 1) + '. ' + p.id.slice(0, 40); return o; }));
  }
  sel.value = current.index;
}

let lastId = '';
let lastSummaryKey = '';
function frame() {
  const all = pads();
  const pad = currentPad();
  $('sp-empty').style.display = pad ? 'none' : '';
  $('sp-app').style.display = pad ? '' : 'none';
  if (pad) {
    if (pad.id !== lastId) {
      lastId = pad.id;
      padType = detectType(pad.id);
      // only test parts this controller actually reports (some pads have no Home button, etc.)
      parts = PARTS.filter(p => p.btn !== undefined ? p.btn < pad.buttons.length : p.stick * 2 + 1 < pad.axes.length);
      tested = new Set();
      sectors = [new Set(), new Set()];
      $('sp-name').textContent = pad.id.replace(/\s*\(.*?(vendor|STANDARD).*?\)/i, '').slice(0, 80) || L().ctrl;
      $('sp-sub').textContent = L().sub(pad.buttons.length, pad.buttons.length, pad.axes.length);
      applyLabels();
    }
    refreshPicker(all, pad);
    render(pad);
  } else if (lastId) {
    lastId = '';
  }
  requestAnimationFrame(frame);
}

function setActive(el, on) { if (el) el.classList.toggle('on', !!on); }
function render(pad) {
  const now = performance.now();
  // buttons
  for (const p of parts) {
    if (p.btn === undefined) continue;
    const b = pad.buttons[p.btn];
    if (!b) continue;
    const value = typeof b === 'object' ? b.value : b;
    const pressed = typeof b === 'object' ? (b.pressed || value > 0.5) : !!b;
    if (p.trigger) {
      const fill = document.querySelector('#p-' + p.id + ' .sp-trig-fill');
      fill.setAttribute('width', String(Math.round(96 * Math.min(1, value))));
      if (value > 0.9 || pressed && value >= 0.99) markTested(p.id);
      else if (pressed && value > 0.5) { /* needs a full pull */ }
    } else {
      setActive($('b' + p.btn), pressed);
      if (pressed) markTested(p.id);
    }
  }
  // sticks
  const names = ['ls', 'rs'];
  for (let s = 0; s < 2; s++) {
    const x = pad.axes[s * 2] || 0, y = pad.axes[s * 2 + 1] || 0;
    const dot = $('b' + (s === 0 ? 10 : 11));
    const base = s === 0 ? [180, 140] : [390, 236];
    dot.setAttribute('cx', String(base[0] + x * 22));
    dot.setAttribute('cy', String(base[1] + y * 22));
    $('sp-' + names[s] + '-val').textContent = x.toFixed(2) + ', ' + y.toFixed(2);
    $('sp-' + names[s] + '-label').textContent = L().stick[s === 0 ? 'l' : 'r'];
    // stick click (L3/R3) highlights the stick dot
    const click = pad.buttons[s === 0 ? 10 : 11];
    if (click && (typeof click === 'object' ? click.pressed : click)) { dot.classList.add('on'); markTested(s === 0 ? 'l3' : 'r3'); } else dot.classList.remove('on');
    const mag = Math.hypot(x, y);
    if (mag > 0.7) {
      const sector = Math.round(((Math.atan2(y, x) + Math.PI) / (Math.PI / 4))) % 8;
      sectors[s].add(sector);
      if (sectors[s].size >= 8) markTested(s === 0 ? 'lstick' : 'rstick');
    }
    // drift: stick rests away from centre
    const drift = $('sp-' + names[s] + '-drift');
    const moving = Math.abs(x - (render['px' + s] || 0)) + Math.abs(y - (render['py' + s] || 0)) > 0.01;
    render['px' + s] = x; render['py' + s] = y;
    if (moving) idleSince[s] = now;
    if (mag > 0.12 && now - idleSince[s] > 1200) { drift.textContent = '\u26a0 ' + L().drift; drift.className = 'sp-drift warn'; }
    else if (mag <= 0.12) { drift.textContent = '\u2713 ' + L().ok; drift.className = 'sp-drift good'; }
    else { drift.textContent = ''; drift.className = 'sp-drift'; }
  }
  const key = tested.size + ':' + getLang();
  if (key !== lastSummaryKey) { lastSummaryKey = key; summary(); }
}
function markTested(id) {
  if (tested.has(id)) return;
  tested.add(id);
  markChip(id);
}

// ---------------- actions ----------------
$('sp-pick').addEventListener('change', e => { pickedIndex = Number(e.target.value); lastId = ''; });
$('sp-reset').addEventListener('click', () => {
  tested = new Set(); sectors = [new Set(), new Set()];
  document.querySelectorAll('.sp-chip').forEach(c => c.classList.remove('done'));
  lastSummaryKey = '';
});
$('sp-vibe').addEventListener('click', async () => {
  const pad = currentPad();
  const act = pad && (pad.vibrationActuator || (pad.hapticActuators && pad.hapticActuators[0]));
  const msg = $('sp-result');
  if (!act) { msg.textContent = L().vibeNo; msg.className = 'sp-result warn'; lastSummaryKey = ''; return; }
  try {
    if (act.playEffect) await act.playEffect('dual-rumble', { duration: 700, strongMagnitude: 1, weakMagnitude: 0.8 });
    else if (act.pulse) await act.pulse(1, 700);
    msg.textContent = L().vibeOn; msg.className = 'sp-result';
    setTimeout(() => { lastSummaryKey = ''; }, 900);
  } catch (e) { msg.textContent = L().vibeNo; msg.className = 'sp-result warn'; }
});

// advanced (original) tester, loaded only when asked for
let advOpen = false;
function padLang() { return getLang() === 'fa' ? 'fa-IR' : 'en-US'; }
function loadAdvanced(bust) {
  try { localStorage.setItem('lang', padLang()); localStorage.setItem('vueuse-color-scheme', getTheme()); } catch (e) { /* storage blocked */ }
  $('pad-frame').src = '/gamepad/?theme=' + getTheme() + (bust ? '&t=' + Date.now() : '');
}
$('sp-adv-btn').addEventListener('click', () => {
  advOpen = !advOpen;
  $('sp-adv-box').style.display = advOpen ? '' : 'none';
  if (advOpen && !$('pad-frame').src) loadAdvanced(false);
  paintStatic();
});
document.addEventListener('gv:theme', () => { if (advOpen) loadAdvanced(true); });

function paintStatic() {
  const t = L();
  $('gp-intro').textContent = t.intro;
  $('sp-empty-title').textContent = t.emptyTitle;
  $('sp-empty-text').textContent = t.emptyText;
  $('sp-vibe').textContent = t.vibe;
  $('sp-reset').textContent = t.reset;
  $('sp-list-title').textContent = t.listTitle;
  $('sp-adv-btn').textContent = advOpen ? t.advHide : t.advBtn;
  $('sp-adv-hint').textContent = t.advHint;
  document.querySelectorAll('#sp-svg [data-lbl]').forEach(el => { el.textContent = label(el.getAttribute('data-lbl')); });
}
paintStatic();
buildChips();
window.addEventListener('gamepadconnected', () => { pickedIndex = null; });
requestAnimationFrame(frame);
