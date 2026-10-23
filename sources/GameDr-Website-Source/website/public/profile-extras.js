(function () {
  'use strict';
  const fa = () => getLang() === 'fa';
  const tr = (en, per) => fa() ? per : en;
  const date = value => value ? new Date(value).toLocaleString(fa() ? 'fa-IR' : 'en-US') : '—';
  const el = (tag, text, cls) => { const node = document.createElement(tag); if (text != null) node.textContent = text; if (cls) node.className = cls; return node; };
  let bound = false;
  let currentUser = null;

  function panel(title, cls) {
    const section = el('section', null, 'profile-panel profile-extra-panel' + (cls ? ' ' + cls : ''));
    section.append(el('h3', title));
    return section;
  }
  function showStatus(node, message, kind) {
    node.textContent = message || '';
    node.className = 'contact-status ' + (kind || '');
  }

  function buildPanels() {
    const card = document.getElementById('acct-card');
    if (!card || card.dataset.profileExtras === 'true') return;
    card.dataset.profileExtras = 'true';
    const anchor = card.querySelector('.row-btns') || null;

    const alerts = panel(tr('Account alerts', 'هشدارهای حساب'), 'profile-alerts-panel');
    const alertList = el('div', null, 'profile-alert-list'); alertList.id = 'profile-alerts';
    alerts.append(alertList);
    card.insertBefore(alerts, anchor);

    const notifications = panel(tr('Notifications', 'اعلان‌ها'), 'profile-notifications-panel');
    const notificationTools = el('div', null, 'profile-panel-tools');
    const notificationList = el('div', null, 'profile-notifications'); notificationList.id = 'profile-notifications';
    const readAll = el('button', tr('Mark all as read', 'خواندن همه'), 'profile-small-btn'); readAll.type = 'button';
    notificationTools.append(readAll); notifications.append(notificationTools, notificationList); card.insertBefore(notifications, anchor);
    readAll.addEventListener('click', async () => {
      await fetch('/api/account/notifications/read-all', { method: 'POST', credentials: 'same-origin' });
      loadNotifications();
    });

    const traffic = panel(tr('Traffic usage', 'مصرف ترافیک'), 'profile-traffic-panel');
    const trafficSummary = el('div', null, 'profile-traffic-summary');
    const trafficList = el('div', null, 'profile-traffic-list'); trafficList.id = 'profile-traffic-usage';
    traffic.append(trafficSummary, trafficList); card.insertBefore(traffic, anchor);

    const devices = panel(tr('Connected devices', 'دستگاه‌های متصل'), 'profile-devices-panel');
    const deviceList = el('div', null, 'profile-devices'); deviceList.id = 'profile-devices';
    const deviceHint = el('p', tr('Manage signed-in devices from your main device. You can remove any other device below.', 'دستگاه‌های واردشده را از دستگاه اصلی مدیریت کنید. می‌توانید هر دستگاه دیگری را از فهرست حذف کنید.'), 'profile-devices-hint');
    devices.append(deviceHint, deviceList); card.insertBefore(devices, anchor);

    const userAgent = panel(tr('User agent & device stats', 'مشخصات دستگاه و User Agent'), 'profile-user-agent-panel');
    const userAgentHint = el('p', tr('Details detected from the device and browser you are using right now.', 'جزئیات شناسایی‌شده از دستگاه و مرورگری که اکنون استفاده می‌کنید.'), 'profile-devices-hint');
    const userAgentStats = el('div', null, 'profile-user-agent-stats'); userAgentStats.id = 'profile-user-agent-stats';
    userAgent.append(userAgentHint, userAgentStats); card.insertBefore(userAgent, anchor);

    const tools = el('div', null, 'profile-extra-grid');
    const support = panel(tr('Contact support', 'ارتباط با پشتیبانی'), 'profile-form-panel');
    const supportForm = document.createElement('form'); supportForm.id = 'profile-support-form'; supportForm.className = 'profile-inline-form';
    const supportSubject = el('input', null, 'contact-input'); supportSubject.id = 'profile-support-subject'; supportSubject.required = true; supportSubject.maxLength = 160; supportSubject.placeholder = tr('Subject', 'موضوع');
    const supportMessage = el('textarea', null, 'contact-input'); supportMessage.id = 'profile-support-message'; supportMessage.required = true; supportMessage.maxLength = 3000; supportMessage.rows = 5; supportMessage.placeholder = tr('How can we help?', 'چطور می‌توانیم کمک کنیم؟');
    const supportButton = el('button', tr('Send to support', 'ارسال به پشتیبانی'), 'plan-btn contact-send'); supportButton.type = 'submit';
    const supportStatus = el('div', null, 'contact-status'); supportStatus.id = 'profile-support-status';
    supportForm.append(supportSubject, supportMessage, supportButton, supportStatus); support.append(supportForm);

    const feedback = panel(tr('Ideas and proposals', 'ایده‌ها و پیشنهادها'), 'profile-form-panel');
    feedback.id = 'profile-feedback-panel';
    const feedbackForm = document.createElement('form'); feedbackForm.id = 'profile-feedback-form'; feedbackForm.className = 'profile-inline-form';
    const feedbackCategory = document.createElement('select'); feedbackCategory.id = 'profile-feedback-category'; feedbackCategory.className = 'contact-input';
    [["idea", tr('Idea', 'ایده')], ["proposal", tr('Proposal', 'پیشنهاد')], ["improvement", tr('Improvement', 'بهبود')]].forEach(([value, text]) => { const option = el('option', text); option.value = value; feedbackCategory.append(option); });
    const feedbackMessage = el('textarea', null, 'contact-input'); feedbackMessage.id = 'profile-feedback-message'; feedbackMessage.required = true; feedbackMessage.maxLength = 3000; feedbackMessage.rows = 5; feedbackMessage.placeholder = tr('Tell us what you would improve…', 'چه چیزی را بهتر می‌کنید؟');
    const feedbackButton = el('button', tr('Send idea', 'ارسال ایده'), 'plan-btn contact-send'); feedbackButton.type = 'submit';
    const feedbackStatus = el('div', null, 'contact-status'); feedbackStatus.id = 'profile-feedback-status';
    feedbackForm.append(feedbackCategory, feedbackMessage, feedbackButton, feedbackStatus); feedback.append(feedbackForm);
    tools.append(support, feedback); card.insertBefore(tools, anchor);

    const links = panel(tr('Quick links', 'دسترسی سریع'), 'profile-links-panel');
    const linkRow = el('div', null, 'profile-quick-links');
    [[tr('About us', 'درباره ما'), '/about.html'], [tr('Terms of service', 'قوانین و مقررات'), '/terms.html'], [tr('Privacy policy', 'حریم خصوصی'), '/privacy.html']].forEach(([text, href]) => { const a = el('a', text, 'view-all-btn'); a.href = href; linkRow.append(a); });
    const language = el('button', fa() ? 'English' : 'فارسی', 'view-all-btn'); language.type = 'button'; language.addEventListener('click', () => setLang(fa() ? 'en' : 'fa')); linkRow.append(language);
    links.append(linkRow); card.insertBefore(links, anchor);

    supportForm.addEventListener('submit', async event => {
      event.preventDefault(); supportButton.disabled = true; showStatus(supportStatus, '');
      try {
        const response = await fetch('/api/account/support', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subject: supportSubject.value, message: supportMessage.value }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || tr('Could not send your message.', 'ارسال پیام انجام نشد.'));
        supportForm.reset(); showStatus(supportStatus, tr('Your support request was sent.', 'درخواست پشتیبانی شما ارسال شد.'), 'ok'); loadNotifications();
      } catch (error) { showStatus(supportStatus, error.message, 'err'); }
      supportButton.disabled = false;
    });
    feedbackForm.addEventListener('submit', async event => {
      event.preventDefault(); feedbackButton.disabled = true; showStatus(feedbackStatus, '');
      try {
        const response = await fetch('/api/account/feedback', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category: feedbackCategory.value, message: feedbackMessage.value }) });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || tr('Could not send your idea.', 'ارسال ایده انجام نشد.'));
        feedbackForm.reset(); showStatus(feedbackStatus, tr('Thank you. Your idea was sent.', 'ممنون. ایده شما ارسال شد.'), 'ok'); loadNotifications();
      } catch (error) { showStatus(feedbackStatus, error.message, 'err'); }
      feedbackButton.disabled = false;
    });
  }

  function setupProfileTabs() {
    const card = document.getElementById('acct-card');
    if (!card) return;
    let shell = card.querySelector('.profile-tab-layout');
    if (!shell) {
      shell = el('div', null, 'profile-tab-layout');
      const nav = el('nav', null, 'profile-tab-nav');
      nav.setAttribute('aria-label', tr('Profile sections', 'بخش‌های پروفایل'));
      const content = el('div', null, 'profile-tab-content');
      shell.append(nav, content);
      card.append(shell);
      const tabs = [
        ['overview', tr('Overview', 'خلاصه حساب'), '◈'],
        ['library', tr('Games & wishlist', 'بازی‌ها و علاقه‌مندی‌ها'), '▣'],
        ['activity', tr('Activity & transactions', 'فعالیت و تراکنش‌ها'), '↗'],
        ['traffic', tr('Traffic usage', 'مصرف ترافیک'), '◒'],
        ['invites', tr('Invitations', 'دعوت‌ها'), '⌁'],
        ['security', tr('Security & devices', 'امنیت و دستگاه‌ها'), '◇'],
        ['support', tr('Support & links', 'پشتیبانی و لینک‌ها'), '?'],
      ];
      for (const [id, label, icon] of tabs) {
        const button = el('button', null, 'profile-tab-button');
        button.type = 'button';
        button.dataset.profileTab = id;
        button.setAttribute('aria-selected', 'false');
        button.append(el('span', icon, 'profile-tab-icon'), el('span', label));
        nav.append(button);
        const pane = el('section', null, 'profile-tab-pane');
        pane.dataset.profilePane = id;
        pane.setAttribute('role', 'tabpanel');
        pane.hidden = true;
        content.append(pane);
        button.addEventListener('click', () => activateProfileTab(shell, id));
      }
      shell.dataset.activeTab = 'overview';
    }

    const panes = new Map([...shell.querySelectorAll('[data-profile-pane]')].map(pane => [pane.dataset.profilePane, pane]));
    const seen = new Set();
    const resolve = (selector, parentSelector) => [...card.querySelectorAll(selector)].map(node => parentSelector ? node.closest(parentSelector) : node).filter(Boolean);
    const assignments = {
      overview: [
        ...resolve('#profile-alerts', '.profile-extra-panel'),
        ...resolve('#profile-details'), ...resolve('.profile-actions'), ...resolve('.tk-balance'), ...resolve('#acct-plan'), ...resolve('.row-btns'),
      ],
      library: [
        ...resolve('#profile-purchases', '.profile-panel'), ...resolve('#customer-wishlist', '.profile-panel'), ...resolve('#customer-requests', '.profile-panel'),
      ],
      activity: [
        ...resolve('#profile-history', '.profile-panel'), ...resolve('#profile-notifications', '.profile-extra-panel'),
      ],
      traffic: [...resolve('#profile-traffic-usage', '.profile-extra-panel')],
      invites: [...resolve('#invite-box'), ...resolve('#acct-code-box')],
      security: [...resolve('#phone-box'), ...resolve('#profile-devices', '.profile-extra-panel'), ...resolve('#profile-user-agent-stats', '.profile-extra-panel')],
      support: [...resolve('.profile-extra-grid'), ...resolve('.profile-links-panel')],
    };
    for (const [id, nodes] of Object.entries(assignments)) {
      const pane = panes.get(id);
      if (!pane) continue;
      for (const node of nodes) {
        if (seen.has(node) || node === shell || node.contains(shell)) continue;
        seen.add(node);
        if (node.parentElement !== pane) pane.append(node);
      }
    }
    activateProfileTab(shell, shell.dataset.activeTab || 'overview');
    activateRequestedProfileTab(shell);
  }

  function requestedProfileTab() {
    const requested = new URLSearchParams(location.search).get('tab');
    if (requested && /^[a-z-]+$/.test(requested)) return requested;
    return ['ideas', 'feedback'].includes(location.hash.slice(1)) ? 'support' : '';
  }

  function activateRequestedProfileTab(shell) {
    const requested = requestedProfileTab();
    if (!requested || !shell.querySelector('[data-profile-pane="' + requested + '"]')) return;
    activateProfileTab(shell, requested);
    if (['ideas', 'feedback', 'notifications'].includes(location.hash.slice(1))) {
      const targetId = location.hash.slice(1) === 'notifications' ? 'profile-notifications-panel' : 'profile-feedback-panel';
      requestAnimationFrame(() => document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  }

  function activateProfileTab(shell, id) {
    const target = shell.querySelector('[data-profile-pane="' + id + '"]') || shell.querySelector('[data-profile-pane="overview"]');
    if (!target) return;
    const activeId = target.dataset.profilePane;
    shell.dataset.activeTab = activeId;
    shell.querySelectorAll('[data-profile-tab]').forEach(button => {
      const active = button.dataset.profileTab === activeId;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    shell.querySelectorAll('[data-profile-pane]').forEach(pane => {
      const active = pane === target;
      pane.hidden = !active;
      pane.classList.toggle('is-active', active);
    });
  }

  function renderAlerts(user) {
    const list = document.getElementById('profile-alerts'); if (!list) return;
    list.replaceChildren();
    if (user && !user.verified) list.append(el('div', tr('Please verify your email address.', 'لطفاً ایمیل خود را تأیید کنید.'), 'profile-alert warning'));
    if (user && user.phone && !user.phoneVerified) {
      const row = el('div', null, 'profile-alert warning');
      row.append(el('span', tr('Verify your phone number to secure the account.', 'برای امنیت حساب، شماره موبایل خود را تأیید کنید.')));
      const button = el('button', tr('Verify now', 'تأیید اکنون'), 'profile-small-btn'); button.type = 'button'; button.addEventListener('click', () => { document.getElementById('phone-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); document.querySelector('#phone-status .acct-switch')?.click(); }); row.append(button); list.append(row);
    }
    if (user && user.activeCode) list.append(el('div', tr('A discount code is ready for your next matching subscription purchase.', 'یک کد تخفیف برای خرید بعدی اشتراک مرتبط آماده است.'), 'profile-alert success'));
    if (!list.childElementCount) list.append(el('div', tr('Your account is up to date.', 'حساب شما وضعیت به‌روزی دارد.'), 'profile-alert success'));
  }

  async function loadNotifications() {
    const box = document.getElementById('profile-notifications'); if (!box || !currentUser) return;
    box.textContent = tr('Loading…', 'در حال بارگذاری…');
    try {
      const response = await fetch('/api/account/notifications', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json(); if (!response.ok) throw new Error();
      box.replaceChildren();
      for (const row of data.notifications || []) {
        const item = el('article', null, 'profile-notification' + (row.read ? '' : ' is-unread'));
        const copy = el('div', null, 'profile-notification-copy'); copy.append(el('strong', fa() ? row.title_fa : row.title_en), el('p', fa() ? row.body_fa : row.body_en), el('small', date(row.date)));
        item.append(copy);
        if (!row.read) { const button = el('button', tr('Mark read', 'خوانده شد'), 'profile-small-btn'); button.type = 'button'; button.addEventListener('click', async () => { await fetch('/api/account/notifications/' + encodeURIComponent(row.id) + '/read', { method: 'PUT', credentials: 'same-origin' }); loadNotifications(); }); item.append(button); }
        box.append(item);
      }
      if (!box.childElementCount) box.append(el('p', tr('No notifications yet.', 'هنوز اعلانی وجود ندارد.'), 'muted-text'));
    } catch (error) { box.textContent = tr('Notifications could not be loaded.', 'اعلان‌ها بارگذاری نشدند.'); }
  }

  function browserStats(userAgent) {
    const ua = String(userAgent || '');
    const browserMatch = /Edg\/([\d.]+)/.exec(ua) || /OPR\/([\d.]+)/.exec(ua) || /Chrome\/([\d.]+)/.exec(ua) || /Firefox\/([\d.]+)/.exec(ua) || /Version\/([\d.]+).*Safari\//.exec(ua);
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : tr('Browser', 'مرورگر');
    const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : tr('Unknown', 'نامشخص');
    const deviceType = /iPad|Tablet/.test(ua) ? tr('Tablet', 'تبلت') : /Mobile|Android|iPhone|iPod/.test(ua) ? tr('Mobile', 'موبایل') : tr('Desktop', 'رومیزی');
    const consoleMatch = /PlayStation\s*;\s*PlayStation\s*(5|4)[\/ ]([\d.-]+)/i.exec(ua) || /PlayStation\s*(5|4)[\/ ]([\d.-]+)/i.exec(ua);
    return {
      browser: browser + (browserMatch ? ' ' + browserMatch[1] : ''),
      os,
      deviceType,
      console: consoleMatch ? 'PlayStation ' + consoleMatch[1] : '',
      firmware: consoleMatch ? consoleMatch[2] : '',
    };
  }

  function renderUserAgentStats() {
    const box = document.getElementById('profile-user-agent-stats');
    if (!box) return;
    const ua = navigator.userAgent || '';
    const stats = browserStats(ua);
    const screenSize = window.screen && window.screen.width && window.screen.height ? window.screen.width + ' × ' + window.screen.height + ' px' : '—';
    const viewport = window.innerWidth && window.innerHeight ? window.innerWidth + ' × ' + window.innerHeight + ' px' : '—';
    const timezone = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || '—'; } catch (error) { return '—'; } })();
    const rows = [
      [tr('Browser', 'مرورگر'), stats.browser],
      [tr('Operating system', 'سیستم‌عامل'), stats.os],
      [tr('Device type', 'نوع دستگاه'), stats.deviceType],
      [tr('Console', 'کنسول'), stats.console || tr('Not detected', 'تشخیص داده نشد')],
      [tr('Console firmware', 'سیستم‌افزار کنسول'), stats.firmware || (stats.console ? tr('Not exposed by browser', 'در User-Agent مرورگر اعلام نشده') : tr('Not a console session', 'این نشست کنسولی نیست'))],
      [tr('Platform', 'پلتفرم'), navigator.platform || '—'],
      [tr('Screen resolution', 'وضوح نمایشگر'), screenSize],
      [tr('Browser window', 'پنجره مرورگر'), viewport],
      [tr('Language', 'زبان'), navigator.language || '—'],
      [tr('Time zone', 'منطقه زمانی'), timezone],
      [tr('Touch points', 'نقاط لمس'), String(navigator.maxTouchPoints || 0)],
      [tr('Connection', 'اتصال'), navigator.onLine ? tr('Online', 'آنلاین') : tr('Offline', 'آفلاین')],
    ];
    box.replaceChildren();
    for (const [label, value] of rows) {
      const row = el('div', null, 'profile-user-agent-row');
      row.append(el('dt', label, 'profile-user-agent-label'), el('dd', value, 'profile-user-agent-value'));
      box.append(row);
    }
    const raw = el('div', null, 'profile-user-agent-raw');
    raw.append(el('span', tr('User agent string', 'رشته User Agent'), 'profile-user-agent-label'), el('code', ua || '—', 'profile-user-agent-value'));
    box.append(raw);
  }

  async function loadDevices() {
    const box = document.getElementById('profile-devices'); if (!box || !currentUser) return;
    box.textContent = tr('Loading…', 'در حال بارگذاری…');
    try {
      const response = await fetch('/api/account/devices', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json(); if (!response.ok) throw new Error();
      box.replaceChildren();
      for (const device of data.devices || []) {
        const row = el('div', null, 'profile-device');
        row.classList.toggle('is-current', !!device.current);
        const copy = el('div', null, 'profile-device-copy');
        copy.append(el('strong', device.device + (device.current ? ' · ' + tr('Main device', 'دستگاه اصلی') : '')), el('small', tr('Last active: ', 'آخرین فعالیت: ') + date(device.lastSeen)), el('small', tr('Connected: ', 'اتصال: ') + date(device.createdAt)));
        const deviceStats = [device.console, device.firmware && (tr('Firmware', 'سیستم‌عامل') + ' ' + device.firmware), device.browser && (device.browser + (device.browserVersion ? ' ' + device.browserVersion : '')), device.os, device.deviceType].filter(Boolean);
        if (deviceStats.length) copy.append(el('small', deviceStats.join(' · '), 'profile-device-stats'));
        row.append(copy);
        if (!device.current) {
          const button = el('button', tr('Remove device', 'حذف دستگاه'), 'profile-small-btn danger');
          button.type = 'button';
          button.addEventListener('click', async () => {
            const confirmed = window.confirm(tr('Remove this device from your account?', 'این دستگاه از حساب شما حذف شود؟'));
            if (!confirmed) return;
            button.disabled = true;
            button.textContent = tr('Removing…', 'در حال حذف…');
            try {
              const result = await fetch('/api/account/devices/' + encodeURIComponent(device.id), { method: 'DELETE', credentials: 'same-origin' });
              if (!result.ok) throw new Error();
              loadDevices();
            } catch (error) {
              button.disabled = false;
              button.textContent = tr('Remove device', 'حذف دستگاه');
              window.alert(tr('The device could not be removed. Please try again.', 'حذف دستگاه انجام نشد. دوباره تلاش کنید.'));
            }
          });
          row.append(button);
        }
        box.append(row);
      }
      if (!box.childElementCount) box.append(el('p', tr('No active sessions found.', 'نشست فعالی پیدا نشد.'), 'muted-text'));
    } catch (error) { box.textContent = tr('Connected devices could not be loaded.', 'دستگاه‌های متصل بارگذاری نشدند.'); }
  }

  async function loadTraffic() {
    const box = document.getElementById('profile-traffic-usage');
    const summary = box?.closest('.profile-traffic-panel')?.querySelector('.profile-traffic-summary');
    if (!box || !summary || !currentUser) return;
    box.textContent = tr('Loading…', 'در حال بارگذاری…');
    summary.replaceChildren();
    try {
      const [quotaResponse, catalogResponse] = await Promise.all([
        fetch('/api/account/quota-history', { credentials: 'same-origin', cache: 'no-store' }),
        fetch('/api/games', { credentials: 'same-origin', cache: 'no-store' }),
      ]);
      if (!quotaResponse.ok) throw new Error();
      const entries = await quotaResponse.json();
      const catalog = catalogResponse.ok ? await catalogResponse.json() : [];
      const titles = new Map((Array.isArray(catalog) ? catalog : []).map(game => [game.slug, game.title]));
      const used = entries.reduce((total, entry) => total + Math.max(0, Number(entry.usedGB) || Math.abs(Math.min(0, Number(entry.deltaGB) || 0))), 0);
      const remaining = Math.max(0, Number(currentUser.downloadQuotaGB) || 0);
      const planName = currentUser.plan ? (currentUser['planName_' + getLang()] || currentUser.planName_en || currentUser.plan) : tr('No active subscription', 'اشتراک فعالی ندارید');
      const stats = [
        [tr('Remaining', 'باقی‌مانده'), formatQuota(remaining)],
        [tr('Recorded use', 'مصرف ثبت‌شده'), formatQuota(used)],
        [tr('Active plan', 'پلن فعال'), planName],
      ];
      for (const [label, value] of stats) {
        const item = el('div', null, 'profile-traffic-stat');
        item.append(el('small', label), el('strong', value));
        summary.append(item);
      }
      if (currentUser.planEnd) summary.append(el('p', tr('Plan ends: ', 'پایان اشتراک: ') + date(currentUser.planEnd), 'profile-traffic-note'));
      box.replaceChildren();
      const groups = new Map();
      for (const entry of entries) {
        const usedGB = Number(entry.usedGB) || Math.abs(Math.min(0, Number(entry.deltaGB) || 0));
        if (!(usedGB > 0)) continue;
        const slug = entry.ref || '';
        const reason = entry.reason || tr('Download usage', 'مصرف دانلود');
        const title = titles.get(slug) || reason.replace(/^Unlocked game:\s*/i, '') || tr('Download usage', 'مصرف دانلود');
        const key = slug || title;
        if (!groups.has(key)) groups.set(key, { slug, title, total: 0, entries: [] });
        const group = groups.get(key);
        group.total += usedGB;
        group.entries.push({ ...entry, usedGB });
      }
      for (const group of groups.values()) {
        const game = (Array.isArray(catalog) ? catalog : []).find(item => item.slug === group.slug);
        const card = el('article', null, 'profile-traffic-game');
        const top = el('div', null, 'profile-traffic-game-top');
        const poster = el('span', null, 'profile-traffic-game-poster');
        const fallback = group.title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase() || '?';
        if (game?.coverUrl) {
          const image = document.createElement('img'); image.src = coverSrc(game.coverUrl, 180); image.alt = ''; image.loading = 'lazy'; image.decoding = 'async';
          image.addEventListener('error', () => { poster.replaceChildren(); poster.classList.add('is-placeholder'); poster.textContent = fallback; }, { once: true });
          poster.append(image);
        } else { poster.classList.add('is-placeholder'); poster.textContent = fallback; }
        const copy = el('div', null, 'profile-traffic-game-copy');
        const titleNode = el('strong', group.title);
        if (group.slug) { const link = el('a', null, 'profile-traffic-game-link'); link.href = '/game.html?slug=' + encodeURIComponent(group.slug); link.append(titleNode); copy.append(link); } else copy.append(titleNode);
        copy.append(el('small', group.entries.length + ' ' + tr('download record(s)', 'رکورد دانلود') + ' · ' + tr('total used', 'مصرف کل') + ': ' + formatQuota(group.total)));
        const amount = el('div', null, 'profile-traffic-entry-amount');
        amount.append(el('strong', formatQuota(group.total)), el('small', tr('used by this game', 'مصرف این بازی')));
        top.append(poster, copy, amount); card.append(top);
        if (group.entries.length > 1) {
          const details = document.createElement('details'); details.className = 'profile-traffic-game-details';
          const detailsSummary = document.createElement('summary'); detailsSummary.textContent = tr('View usage details', 'مشاهده جزئیات مصرف'); details.append(detailsSummary);
          for (const entry of group.entries) {
            const detail = el('div', null, 'profile-traffic-entry');
            const detailCopy = el('div', null, 'profile-traffic-entry-copy'); detailCopy.append(el('strong', date(entry.date)), el('small', tr('Quota after use', 'سهمیه پس از مصرف') + ': ' + formatQuota(Math.max(0, Number(entry.balanceAfterGB) || 0))));
            detail.append(detailCopy, el('strong', formatQuota(entry.usedGB))); details.append(detail);
          }
          card.append(details);
        }
        box.append(card);
      }
      if (!box.childElementCount) box.append(el('p', tr('No traffic has been used yet.', 'هنوز مصرف ترافیکی ثبت نشده است.'), 'muted-text'));
    } catch (error) {
      box.textContent = tr('Traffic usage could not be loaded. Refresh to try again.', 'مصرف ترافیک بارگذاری نشد. صفحه را تازه کنید.');
    }
  }

  function formatQuota(value) {
    const amount = Number(value) || 0;
    if (window.drtFormatQuota) return window.drtFormatQuota(amount);
    return amount.toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 2 }) + ' GB';
  }

  function load(user) {
    currentUser = user;
    if (!user) return;
    buildPanels();
    setupProfileTabs();
    renderAlerts(user); renderUserAgentStats(); loadNotifications(); loadDevices(); loadTraffic();
    // storefront.js adds Wishlist and request panels from its own listener.
    // Refresh once after all user listeners have run so those panels land in
    // the Games tab instead of appearing below the tab layout.
    setTimeout(setupProfileTabs, 0);
  }
  window.refreshProfileTabs = setupProfileTabs;
  document.addEventListener('drt:user', event => load(event.detail.user));
  if (window.DRT_USER) load(window.DRT_USER);
})();
