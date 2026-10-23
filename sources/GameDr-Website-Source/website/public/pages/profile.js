applyLanguage();
initLangToggle();

let registerMode = false;
const form = document.getElementById('acct-form');
const status = document.getElementById('a-status');
const avatarGrid = document.getElementById('a-avatar-options');
const avatarPicker = document.getElementById('avatar-picker');
const avatarToggle = document.getElementById('a-avatar-toggle');
const avatarOptions = document.getElementById('avatar-picker-options');
const avatarPreview = document.getElementById('a-avatar-preview');
const avatarSelectedName = document.getElementById('a-avatar-selected-name');
const avatarImages = [];
let avatarImagesLoaded = false;
function setAvatarPickerOpen(open) {
  avatarToggle.setAttribute('aria-expanded', String(open));
  avatarOptions.setAttribute('aria-hidden', String(!open));
  avatarOptions.inert = !open;
  avatarOptions.classList.toggle('is-open', open);
  if (open && !avatarImagesLoaded) {
    if (window.drtLoadAvatarImagesSequentially) window.drtLoadAvatarImagesSequentially(avatarImages);
    avatarImagesLoaded = true;
  }
}
function selectAvatar(avatar) {
  avatarSelectedName.textContent = getLang() === 'fa' ? avatar.name_fa : avatar.name_en;
  avatarPreview.dataset.avatarSrc = avatar.image;
  if (window.drtLoadAvatarImagesSequentially) window.drtLoadAvatarImagesSequentially([avatarPreview]);
  else avatarPreview.src = avatar.image;
}
if (avatarGrid && Array.isArray(window.DRT_AVATAR_CATALOG)) {
  avatarGrid.setAttribute('aria-label', t('avatar_picker_title'));
  for (const [index, avatar] of window.DRT_AVATAR_CATALOG.entries()) {
    const label = document.createElement('label');
    label.className = 'account-avatar-choice' + (index === 0 ? ' selected' : '');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'avatarId';
    input.value = avatar.id;
    input.checked = index === 0;
    input.setAttribute('aria-label', getLang() === 'fa' ? avatar.name_fa : avatar.name_en);
    const image = document.createElement('img');
    image.dataset.avatarSrc = avatar.image;
    image.alt = '';
    avatarImages.push(image);
    const name = document.createElement('span');
    name.textContent = getLang() === 'fa' ? avatar.name_fa : avatar.name_en;
    label.append(input, image, name);
    input.addEventListener('change', () => {
      avatarGrid.querySelectorAll('.account-avatar-choice').forEach(choice => choice.classList.remove('selected'));
      label.classList.add('selected');
      selectAvatar(avatar);
      setAvatarPickerOpen(false);
      avatarToggle.focus();
    });
    avatarGrid.appendChild(label);
  }
  if (window.DRT_AVATAR_CATALOG[0]) selectAvatar(window.DRT_AVATAR_CATALOG[0]);
}
avatarToggle.addEventListener('click', () => setAvatarPickerOpen(avatarToggle.getAttribute('aria-expanded') !== 'true'));
document.addEventListener('pointerdown', event => {
  if (avatarToggle.getAttribute('aria-expanded') === 'true' && !avatarPicker.contains(event.target)) setAvatarPickerOpen(false);
});
avatarPicker.addEventListener('keydown', event => {
  if (event.key === 'Escape' && avatarToggle.getAttribute('aria-expanded') === 'true') {
    setAvatarPickerOpen(false);
    avatarToggle.focus();
  }
});
function nextUrl() {
  const n = new URLSearchParams(location.search).get('next');
  return n && n.startsWith('/') && !n.startsWith('//') ? n : '/profile.html';
}
function setMode(reg) {
  registerMode = reg;
  document.querySelectorAll('.reg-only').forEach(el => { el.style.display = reg ? '' : 'none'; });
  ['a-first', 'a-last', 'a-user', 'a-phone'].forEach(id => { document.getElementById(id).required = reg; });
  const em = document.getElementById('a-email');
  em.type = reg ? 'email' : 'text';
  em.placeholder = t(reg ? 'account_email' : 'reg_login_id');
  em.autocomplete = reg ? 'email' : 'username';
  document.getElementById('a-pass').autocomplete = reg ? 'new-password' : 'current-password';
  document.getElementById('acct-title').textContent = t(reg ? 'account_register' : 'account_login');
  document.getElementById('a-submit').textContent = t(reg ? 'account_register' : 'account_login');
  document.getElementById('a-switch').textContent = t(reg ? 'account_have' : 'account_new');
  status.textContent = '';
}
document.getElementById('a-switch').addEventListener('click', () => setMode(!registerMode));
let userTimer = null;
document.getElementById('a-user').addEventListener('input', e => {
  const hint = document.getElementById('a-user-hint');
  const v = e.target.value.trim();
  clearTimeout(userTimer);
  if (!v) { hint.textContent = t('reg_user_hint'); hint.className = 'field-hint'; return; }
  if (!/^[A-Za-z][A-Za-z0-9_.]{2,19}$/.test(v)) { hint.textContent = t('reg_user_hint'); hint.className = 'field-hint err'; return; }
  userTimer = setTimeout(async () => {
    try {
      const r = await (await fetch('/api/account/username-available?u=' + encodeURIComponent(v))).json();
      hint.textContent = r.available ? '\u2713 ' + t('reg_user_ok') : t('reg_user_taken');
      hint.className = 'field-hint ' + (r.available ? 'ok' : 'err');
    } catch (err) { hint.textContent = ''; }
  }, 350);
});
form.addEventListener('submit', async e => {
  e.preventDefault();
  status.textContent = '';
  if (registerMode && !document.getElementById('a-terms').checked) { status.textContent = t('reg_agree_needed'); status.className = 'contact-status err'; return; }
  status.className = 'contact-status';
  try {
    const res = await fetch(registerMode ? '/api/account/register' : '/api/account/login', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerMode
        ? { firstName: document.getElementById('a-first').value, lastName: document.getElementById('a-last').value, username: document.getElementById('a-user').value,
            email: document.getElementById('a-email').value, phone: document.getElementById('a-phone').value, password: document.getElementById('a-pass').value, avatarId: document.querySelector('input[name="avatarId"]:checked')?.value || 'kratos', inviteCode: document.getElementById('a-invite').value, acceptTerms: document.getElementById('a-terms').checked, lang: getLang() }
        : { identifier: document.getElementById('a-email').value, password: document.getElementById('a-pass').value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('account_error'));
    if (data.needsVerification) { showVerify(data); return; }
    location.href = nextUrl();
  } catch (err) {
    status.textContent = err.message;
    status.className = 'contact-status err';
  }
});
// ---- email verification step ----
let verifyEmail = '';
let resendTimer = null;
const vStatus = document.getElementById('v-status');
function vSay(text, kind) { vStatus.textContent = text; vStatus.className = 'contact-status ' + (kind || ''); }
function showVerify(data) {
  verifyEmail = data.email;
  form.style.display = 'none';
  document.getElementById('verify-form').style.display = '';
  document.getElementById('verify-text').textContent = t('verify_text').replace('{email}', data.email);
  startExpiryCountdown(data.expiresInSeconds || 600);
  const localEmailCode = data.devVerificationCode ? ' · ' + (getLang() === 'fa' ? 'کد آزمایشی: ' : 'Local test code: ') + data.devVerificationCode : '';
  vSay(data.emailSent === false ? t('verify_dev') + localEmailCode : '', '');
  startResendCountdown(data.resendInSeconds || 60);
  document.getElementById('v-code').focus();
}
// "Code expires in 9:41": counts down; when it hits zero the Verify button is disabled
let expiryTimer = null;
function startExpiryCountdown(seconds) {
  clearInterval(expiryTimer);
  const el = document.getElementById('v-expiry');
  const submit = document.getElementById('v-submit');
  const end = Date.now() + seconds * 1000;
  const paint = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    if (left > 0) {
      const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0');
      el.textContent = t('verify_expires_in') + ' ' + mm + ':' + ss;
      el.className = 'verify-expiry' + (left <= 60 ? ' soon' : '');
      submit.disabled = false;
    } else {
      el.textContent = t('verify_expired');
      el.className = 'verify-expiry gone';
      submit.disabled = true;
      clearInterval(expiryTimer);
    }
  };
  paint();
  expiryTimer = setInterval(paint, 1000);
}
function startResendCountdown(seconds) {
  const btn = document.getElementById('v-resend');
  clearInterval(resendTimer);
  let left = seconds;
  const paint = () => {
    btn.disabled = left > 0;
    btn.textContent = left > 0 ? t('verify_resend_in').replace('{s}', left) : t('verify_resend');
  };
  paint();
  resendTimer = setInterval(() => { left -= 1; paint(); if (left <= 0) clearInterval(resendTimer); }, 1000);
}
document.getElementById('verify-form').addEventListener('submit', async e => {
  e.preventDefault();
  vSay('');
  try {
    const res = await fetch('/api/account/verify', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyEmail, code: document.getElementById('v-code').value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('account_error'));
    try { localStorage.removeItem('gv_invite'); } catch (e) { /* ignore */ }
    location.href = nextUrl();
  } catch (err) { vSay(err.message, 'err'); }
});
document.getElementById('v-resend').addEventListener('click', async () => {
  vSay('');
  try {
    const res = await fetch('/api/account/resend', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verifyEmail, lang: getLang() }),
    });
    const data = await res.json();
    if (res.status === 429 && data.retryAfter) { startResendCountdown(data.retryAfter); throw new Error(data.error); }
    if (!res.ok) throw new Error(data.error || t('account_error'));
    if (data.sent === false) {
      const localEmailCode = data.devVerificationCode ? ' · ' + (getLang() === 'fa' ? 'کد آزمایشی: ' : 'Local test code: ') + data.devVerificationCode : '';
      vSay(t('verify_dev') + localEmailCode, '');
    } else vSay(t('verify_sent'), 'ok');
    startResendCountdown(data.retryAfter || 60);
    startExpiryCountdown(data.expiresInSeconds || 600);
    document.getElementById('v-code').value = '';
  } catch (err) { vSay(err.message, 'err'); }
});
document.getElementById('v-change').addEventListener('click', () => {
  clearInterval(resendTimer);
  clearInterval(expiryTimer);
  document.getElementById('verify-form').style.display = 'none';
  form.style.display = '';
  document.getElementById('v-code').value = '';
});

// ---- phone verification (SMS) ----
let phTimer = null, phExpiry = null;
const phMsg = (text, kind) => { const m = document.getElementById('ph-msg'); m.textContent = text || ''; m.className = 'contact-status ' + (kind || ''); };
function phCountdown(id, seconds, onEnd, fmtText) {
  const el = document.getElementById(id);
  const end = Date.now() + seconds * 1000;
  const tick = () => {
    const left = Math.max(0, Math.round((end - Date.now()) / 1000));
    fmtText(el, left);
    if (left <= 0) { clearInterval(el._t); if (onEnd) onEnd(); }
  };
  clearInterval(el._t);
  tick();
  el._t = setInterval(tick, 1000);
}
function startPhoneTimers(expires, resend) {
  const submit = document.getElementById('ph-confirm');
  submit.disabled = false;
  phCountdown('ph-expiry', expires, () => { submit.disabled = true; }, (el, left) => {
    if (left > 0) { el.textContent = t('verify_expires_in') + ' ' + Math.floor(left / 60) + ':' + String(left % 60).padStart(2, '0'); el.className = 'verify-expiry' + (left <= 60 ? ' soon' : ''); }
    else { el.textContent = t('verify_expired'); el.className = 'verify-expiry gone'; }
  });
  const btn = document.getElementById('ph-resend');
  phCountdown('ph-resend', resend, null, (el, left) => {
    el.disabled = left > 0;
    el.textContent = left > 0 ? t('ph_resend_in').replace('{s}', left) : t('ph_resend');
  });
}
async function phoneSend() {
  phMsg('');
  const btn = document.getElementById('ph-send');
  btn.disabled = true;
  try {
    const res = await fetch('/api/account/phone/send', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: document.getElementById('ph-number').value, lang: getLang() }),
    });
    const data = await res.json();
    if (res.status === 429 && data.retryAfter) { document.getElementById('ph-step2').style.display = ''; startPhoneTimers(600, data.retryAfter); throw new Error(data.error); }
    if (!res.ok) throw new Error(data.error || t('account_error'));
    if (data.alreadyVerified) { showProfile(data.user); return; }
    document.getElementById('ph-number').value = data.phone;
    document.getElementById('ph-step2').style.display = '';
    startPhoneTimers(data.expiresInSeconds || 600, data.resendInSeconds || 60);
    document.getElementById('ph-code').value = '';
    document.getElementById('ph-code').focus();
    const localPhoneCode = data.devVerificationCode ? ' · ' + (getLang() === 'fa' ? 'کد آزمایشی: ' : 'Local test code: ') + data.devVerificationCode : '';
    phMsg(data.sent === false ? t('ph_dev') + localPhoneCode : t('ph_sent').replace('{phone}', data.phone), data.sent === false ? '' : 'ok');
  } catch (e) { phMsg(e.message, 'err'); }
  btn.disabled = false;
}
document.getElementById('ph-send').addEventListener('click', phoneSend);
document.getElementById('ph-resend').addEventListener('click', phoneSend);
document.getElementById('ph-confirm').addEventListener('click', async () => {
  phMsg('');
  try {
    const res = await fetch('/api/account/phone/verify', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: document.getElementById('ph-code').value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || t('account_error'));
    showProfile(data.user);
    phMsg(t('ph_done'), 'ok');
  } catch (e) { phMsg(e.message, 'err'); }
});
function paintPhone(user) {
  const status = document.getElementById('phone-status');
  const form = document.getElementById('phone-form');
  if (!user || !user.phone) { status.textContent = ''; form.style.display = 'none'; return; }
  status.replaceChildren();
  const tag = document.createElement('span');
  tag.className = 'phone-tag ' + (user.phoneVerified ? 'ok' : 'no');
  tag.textContent = (user.phoneVerified ? '\u2713 ' : '\u26a0 ') + t(user.phoneVerified ? 'ph_status_ok' : 'ph_status_no');
  status.appendChild(tag);
  if (!user.phoneVerified) {
    const open = document.createElement('button');
    open.type = 'button';
    open.className = 'acct-switch';
    open.textContent = t('ph_verify_btn');
    open.addEventListener('click', () => { form.style.display = form.style.display === 'none' ? '' : 'none'; document.getElementById('ph-number').value = user.phone; });
    status.appendChild(open);
  } else form.style.display = 'none';
}

// ---- invitations ----
function fillTxt(text, vars) { return text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m)); }
let inviteTimer = null;
function checkInvite() {
  const inp = document.getElementById('a-invite');
  const hint = document.getElementById('a-invite-hint');
  const v = inp.value.trim();
  clearTimeout(inviteTimer);
  if (!v) { hint.textContent = ''; hint.className = 'field-hint'; return; }
  inviteTimer = setTimeout(async () => {
    try {
      const r = await (await fetch('/api/account/invite-check?code=' + encodeURIComponent(v))).json();
      hint.textContent = r.valid ? fillTxt(t('reg_invite_ok'), { inviter: r.inviter || '' }) : t('reg_invite_bad');
      hint.className = 'field-hint ' + (r.valid ? 'ok' : 'err');
    } catch (e) { hint.textContent = ''; }
  }, 350);
}
document.getElementById('a-invite').addEventListener('input', checkInvite);
(function prefillInvite() {
  let code = '';
  try { code = localStorage.getItem('gv_invite') || ''; } catch (e) { /* storage blocked */ }
  if (code) {
    document.getElementById('a-invite').value = code;
    // someone followed an invitation link: open the sign-up form straight away
    if (new URLSearchParams(location.search).get('invite')) setMode(true);
    checkInvite();
  }
})();
async function paintPublicInvite(box) {
  const res = await fetch('/api/account/invites', { credentials: 'same-origin', cache: 'no-store' });
  if (!res.ok) return false;
  const d = await res.json();
  const num = n => Number(n || 0).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US');
  box.style.display = '';
  document.getElementById('inv-code').textContent = d.code || '—';
  document.getElementById('inv-text').textContent = t('inv_text');
  document.getElementById('inv-count').textContent = num(d.count);
  document.getElementById('inv-count').parentElement.querySelector('span').textContent = t('inv_friends_invited');
  document.getElementById('inv-earned').textContent = '—';
  document.getElementById('inv-next').textContent = '—';
  const tree = document.getElementById('inv-tree'); tree.replaceChildren();
  for (const rowData of d.tree || []) {
    const row = document.createElement('div'); row.className = 'inv-tree-level';
    row.append(document.createElement('span'), document.createElement('b'));
    row.firstChild.textContent = fillTxt(t('inv_level'), { level: num(rowData.level) });
    row.lastChild.textContent = num(rowData.customers) + ' ' + t('inv_customers'); tree.appendChild(row);
  }
  const friends = document.getElementById('inv-friends'); friends.replaceChildren();
  if (!d.friends?.length) friends.appendChild(Object.assign(document.createElement('div'), { className: 'muted-text', textContent: t('inv_tree_empty') }));
  const copy = (btn, text) => { navigator.clipboard.writeText(text).then(() => { const old = btn.textContent; btn.textContent = t('inv_copied'); setTimeout(() => { btn.textContent = old; }, 1400); }).catch(() => { prompt('', text); }); };
  document.getElementById('inv-copy').onclick = e => copy(e.target, d.code);
  document.getElementById('inv-copy-link').onclick = e => copy(e.target, location.origin + '/account.html?invite=' + encodeURIComponent(d.code));
  return true;
}
async function loadInvites() {
  const box = document.getElementById('invite-box');
  try {
    const res = await fetch('/api/account/earnings', { credentials: 'same-origin' });
    if (!res.ok) { if (await paintPublicInvite(box)) return; box.style.display = 'none'; return; }
    const d = await res.json();
    if (d.eligible !== true) { if (await paintPublicInvite(box)) return; box.style.display = 'none'; return; }
    const num = n => Number(n).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US');
    box.style.display = '';
    document.getElementById('inv-code').textContent = d.code;
    document.getElementById('inv-text').textContent = (d.eligible ? t('earnings_status_approved') : t('inv_off')) + (d.debt ? ' ' + fillTxt(t('earnings_debt'), { amount: num(d.debt) }) : '');
    document.getElementById('inv-count').textContent = num(d.teamSalesThisWeek);
    document.getElementById('inv-earned').textContent = num(d.payable);
    document.getElementById('inv-next').textContent = num(d.pending);
    const tree = document.getElementById('inv-tree');
    tree.replaceChildren();
    const rankRows = [
      [t('earnings_rank'), d.rankThisWeek.name || t('earnings_no_rank')],
      [t('earnings_next_rank'), d.rankForNextWeek.name || t('earnings_no_rank')],
      [t('earnings_layers'), num(d.layersOpen)],
    ];
    for (const [labelText, valueText] of rankRows) {
      const row = document.createElement('div'); row.className = 'inv-tree-level';
      const label = document.createElement('span'); label.textContent = labelText;
      const count = document.createElement('b'); count.textContent = valueText;
      row.append(label, count); tree.appendChild(row);
    }
    const list = document.getElementById('inv-friends');
    list.replaceChildren();
    if (!d.recent.length) { const p = document.createElement('div'); p.className = 'muted-text'; p.textContent = t('inv_none'); list.appendChild(p); }
    for (const f of d.recent) {
      const row = document.createElement('div'); row.className = 'inv-friend';
      const name = document.createElement('span'); name.textContent = t('earnings_order') + ' · ' + (f.level === 0 ? t('earnings_direct') : fillTxt(t('inv_level'), { level: num(f.level) }));
      const when = document.createElement('small'); when.textContent = new Date(f.date).toLocaleDateString(getLang() === 'fa' ? 'fa-IR' : undefined);
      const state = f.status === 'paid' ? t('earnings_paid') : f.status === 'reversed' ? t('earnings_reversed') : t('earnings_pending');
      const rw = document.createElement('b'); rw.textContent = num(f.amount) + ' ' + t('currency_toman') + ' · ' + state;
      row.append(name, when, rw); list.appendChild(row);
    }
    const copy = (btn, text) => { navigator.clipboard.writeText(text).then(() => { const old = btn.textContent; btn.textContent = t('inv_copied'); setTimeout(() => { btn.textContent = old; }, 1400); }).catch(() => { prompt('', text); }); };
    document.getElementById('inv-copy').onclick = e => copy(e.target, d.code);
    document.getElementById('inv-copy-link').onclick = e => copy(e.target, location.origin + d.referralLink);
  } catch (e) { box.style.display = 'none'; }
}
let codeBoxMade = false;

// consent sentence: "I agree to the [Terms of Service] and the [Privacy Policy]"
(function buildConsent() {
  const span = document.getElementById('a-terms-text');
  const link = (href, key) => { const a = document.createElement('a'); a.href = href; a.target = '_blank'; a.rel = 'noopener'; a.textContent = t(key); return a; };
  span.append(document.createTextNode(t('reg_agree_pre')), link('/terms.html', 'legal_terms'), document.createTextNode(t('reg_agree_mid')), link('/privacy.html', 'legal_privacy'), document.createTextNode(t('reg_agree_post')));
})();

function showProfile(user) {
  form.style.display = user ? 'none' : '';
  const card = document.getElementById('acct-card');
  card.style.display = user ? '' : 'none';
  if (!user) return;
  const lang = getLang();
  document.getElementById('acct-name').textContent = user.name;
  const avatar = document.getElementById('acct-avatar');
  if (avatar) {
    avatar.onerror = () => { avatar.onerror = null; avatar.src = window.DRT_PLAYSTATION_DEFAULT_AVATAR || '/avatar-fallback.svg'; };
    avatar.src = window.drtAvatarImageUrl ? window.drtAvatarImageUrl(user.avatarId) : (window.DRT_PLAYSTATION_DEFAULT_AVATAR || '/avatar-fallback.svg');
  }
  document.getElementById('acct-email').textContent = user.email;
  paintPhone(user);
  loadInvites();
  if (!codeBoxMade) { codeBoxMade = true; drtCodeBox(document.getElementById('acct-code-box')); }
  document.getElementById('acct-more').textContent = [user.username ? '@' + user.username : '', user.phone || ''].filter(Boolean).join('  \u00b7  ');
  document.getElementById('acct-quota').textContent = window.drtFormatQuota ? window.drtFormatQuota(user.downloadQuotaGB) : Number(user.downloadQuotaGB || 0).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US') + ' GB';
  document.getElementById('acct-plan').textContent = user.plan
    ? t('account_plan') + ': ' + (user['planName_' + lang] || user.planName_en) + ' ' + t('account_until') + ' ' + new Date(user.planEnd).toLocaleDateString(lang === 'fa' ? 'fa-IR' : undefined)
    : t('account_no_plan');
}
document.addEventListener('drt:user', e => showProfile(e.detail.user));
document.getElementById('acct-logout').addEventListener('click', async () => {
  await fetch('/api/account/logout', { method: 'POST', credentials: 'same-origin' });
  location.href = '/';
});
