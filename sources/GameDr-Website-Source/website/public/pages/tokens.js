applyLanguage();
initLangToggle();

const fmtN = n => Number(n || 0).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US');
const fmtD = iso => new Date(iso).toLocaleString(getLang() === 'fa' ? 'fa-IR' : undefined);
const tx = text => document.createTextNode(text);
const sm = text => {
  const el = document.createElement('small');
  el.textContent = text;
  el.style.display = 'block';
  return el;
};

function paintBalance(user) {
  document.getElementById('tk-amount').textContent = window.drtFormatQuota ? window.drtFormatQuota(user ? user.downloadQuotaGB : 0) : fmtN(user ? user.downloadQuotaGB : 0) + ' GB';
  const lang = getLang();
  const plan = document.getElementById('tk-plan');
  plan.textContent = user && user.plan
    ? t('account_plan') + ': ' + (user['planName_' + lang] || user.planName_en) + ' ' + t('account_until') + ' ' + new Date(user.planEnd).toLocaleDateString(lang === 'fa' ? 'fa-IR' : undefined)
    : '';
  document.getElementById('tk-login').style.display = user ? 'none' : 'flex';
}

function row(left, right, extraClass) {
  const el = document.createElement('div');
  el.className = 'tk-row' + (extraClass ? ' ' + extraClass : '');
  const main = document.createElement('div');
  main.append(...left);
  const side = document.createElement('div');
  side.className = 'tk-row-right';
  side.append(...right);
  el.append(main, side);
  return el;
}

async function loadHistory() {
  if (!window.DRT_USER) return;
  const response = await fetch('/api/account/history', { credentials: 'same-origin' });
  if (!response.ok) return;
  const history = await response.json();
  const quotaResponse = await fetch('/api/account/quota-history', { credentials: 'same-origin' });
  const quotaRows = quotaResponse.ok ? await quotaResponse.json() : [];
  document.getElementById('tk-history').style.display = 'block';
  const ledger = document.getElementById('tk-ledger');
  ledger.replaceChildren(...(quotaRows.length
    ? quotaRows.map(item => row([tx(item.reason), sm(fmtD(item.date))], [tx((item.deltaGB > 0 ? '+' : '') + fmtN(item.deltaGB) + ' GB')], item.deltaGB > 0 ? 'plus' : 'minus'))
    : [tx(t('tokens_none'))]));
  const orders = document.getElementById('tk-orders');
  const subscriptions = history.orders.filter(order => order.type === 'subscription');
  orders.replaceChildren(...(subscriptions.length
    ? subscriptions.map(order => row([tx(order.label), sm(fmtD(order.date))], [tx(t('status_' + order.status))], 'st-' + order.status))
    : [tx(t('tokens_none'))]));
}

document.addEventListener('drt:user', event => {
  paintBalance(event.detail.user);
  loadHistory();
});

if (window.DRT_USER) {
  paintBalance(window.DRT_USER);
  loadHistory();
} else {
  paintBalance(null);
}
