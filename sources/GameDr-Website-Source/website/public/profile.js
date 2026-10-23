(function () {
  const fa = () => getLang() === 'fa';
  const label = (en, persian) => fa() ? persian : en;
  const date = value => value ? new Date(value).toLocaleString(fa() ? 'fa-IR' : 'en-US') : '—';
  const number = value => Number(value || 0).toLocaleString(fa() ? 'fa-IR' : 'en-US');
  function element(tag, text, cls) {
    const node = document.createElement(tag); node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  let generation = 0;
  async function render(user) {
    const current = ++generation;
    if (!user) return;
    const details = document.getElementById('profile-details');
    details.replaceChildren();
    for (const [key, value] of [
      [label('Customer ID', 'شناسه مشتری'), user.id],
      [label('Username', 'نام کاربری'), user.username || '—'],
      [label('Member since', 'تاریخ عضویت'), date(user.created)],
      [label('Last login', 'آخرین ورود'), date(user.lastLogin)],
      [label('Email verification', 'تأیید ایمیل'), user.verified ? label('Verified', 'تأیید شده') : label('Not verified', 'تأیید نشده')],
    ]) {
      const item = element('div', '', 'profile-detail');
      item.append(element('small', key), element('strong', value)); details.append(item);
    }
    const purchases = document.getElementById('profile-purchases');
    const history = document.getElementById('profile-history');
    purchases.textContent = history.textContent = label('Loading…', 'در حال بارگذاری…');
    try {
      const res = await fetch('/api/account/history', { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (current !== generation) return;
      purchases.replaceChildren(); history.replaceChildren();
      const groups = new Map();
      for (const purchase of data.purchases || []) {
        if (!groups.has(purchase.slug)) groups.set(purchase.slug, []);
        groups.get(purchase.slug).push(purchase);
      }
      for (const [slug, files] of groups) {
        const card = element('div', '', 'profile-list-item');
        const link = element('a', files[0].title); link.href = '/game.html?slug=' + encodeURIComponent(slug);
        const fullGame = files.some(file => file.gameUnlock);
        card.append(link, element('small', fullGame ? label('Full game unlocked', 'کل بازی باز شده') : files.length + ' ' + label('legacy purchased files', 'فایل قدیمی خریداری‌شده')));
        for (const file of files) card.append(element('small', (file.gameUnlock ? label('Full game access', 'دسترسی کامل به بازی') : file.file) + (file.quotaBased ? ' · ' + number(file.quotaGB) + ' GB ' + label('quota used', 'سهمیه مصرف‌شده') : '') + ' · ' + date(file.date)));
        purchases.append(card);
      }
      if (!groups.size) purchases.append(element('p', label('You have no purchased games yet.', 'هنوز بازی‌ای خریداری نکرده‌اید.')));
      const quotaRes = await fetch('/api/account/quota-history', { credentials: 'same-origin', cache: 'no-store' });
      const quotaRows = quotaRes.ok ? await quotaRes.json() : [];
      for (const entry of quotaRows) {
        const item = element('div', '', 'profile-list-item');
        item.append(element('strong', number(entry.deltaGB) + ' GB'), element('span', entry.reason || ''), element('small', date(entry.date)));
        history.append(item);
      }
      for (const order of data.orders || []) {
        if (order.type !== 'subscription') continue;
        const item = element('div', '', 'profile-list-item');
        const amount = order.price ? label('Paid: ', 'پرداخت: ') + order.price : '';
        const discount = order.discountPercent ? ' · ' + order.discountPercent + '% ' + label('discount', 'تخفیف') : '';
        const method = order.how ? ' · ' + order.how : '';
        item.append(element('strong', order.label || order.type), element('span', label('Status: ', 'وضعیت: ') + order.status + (amount ? ' · ' + amount : '') + discount), element('small', date(order.date) + method));
        history.append(item);
      }
      if (!history.childElementCount) history.append(element('p', label('No download activity or subscription orders yet.', 'هنوز فعالیت دانلود یا سفارش اشتراکی ثبت نشده است.')));
    } catch (e) {
      if (current !== generation) return;
      purchases.textContent = history.textContent = label('Could not load your history. Please refresh to try again.', 'بارگذاری سوابق انجام نشد. صفحه را دوباره بارگذاری کنید.');
    }
  }
  document.addEventListener('drt:user', e => render(e.detail.user));
  if (window.DRT_USER) render(window.DRT_USER);
})();
