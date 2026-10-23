applyLanguage();
initLangToggle();

const DEFAULT_CONTACT = { email: '', phone1: '+1 (555) 123-4567', phone2: '+1 (555) 987-6543', address_en: '', address_fa: '', hours_en: '', hours_fa: '' };
(async function loadContactInfo() {
  let info = DEFAULT_CONTACT;
  try {
    const sc = await (await DRT.fetchPublic('/api/site-content')).json();
    if (sc.contact && Object.values(sc.contact).some(Boolean)) info = sc.contact;
  } catch (e) { /* keep defaults */ }
  const lang = getLang();
  const rows = [
    ['contact_phone_label', [info.phone1, info.phone2].filter(Boolean).join('  ·  ')],
    ['contact_email_label', info.email],
    ['contact_address_label', info['address_' + lang] || info.address_en],
    ['contact_hours_label', info['hours_' + lang] || info.hours_en],
  ];
  const box = document.getElementById('contact-rows');
  for (const [key, value] of rows) {
    if (!value) continue;
    const row = document.createElement('div');
    row.className = 'contact-row';
    const label = document.createElement('small');
    label.textContent = t(key);
    const val = document.createElement('div');
    val.textContent = value;
    row.append(label, val);
    box.appendChild(row);
  }
})();

document.getElementById('contact-form').addEventListener('submit', async e => {
  e.preventDefault();
  const status = document.getElementById('contact-status');
  status.textContent = '';
  try {
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: document.getElementById('c-name').value,
        email: document.getElementById('c-email').value,
        message: document.getElementById('c-message').value,
        website: document.getElementById('c-website').value,
      }),
    });
    if (!res.ok) throw new Error('send failed');
    e.target.reset();
    status.textContent = t('contact_sent');
    status.className = 'contact-status ok';
  } catch (err) {
    status.textContent = t('contact_error');
    status.className = 'contact-status err';
  }
});
