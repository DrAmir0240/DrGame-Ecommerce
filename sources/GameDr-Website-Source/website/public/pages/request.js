applyLanguage();
initLangToggle();

const params = new URLSearchParams(location.search);
const typeOf = () => document.querySelector('input[name="rtype"]:checked').value;
// links from a game page arrive as ?type=subtitle&game=Name&slug=name
if (['game', 'subtitle', 'other'].includes(params.get('type'))) document.querySelector('input[name="rtype"][value="' + params.get('type') + '"]').checked = true;
if (params.get('game')) document.getElementById('r-game').value = params.get('game').slice(0, 120);

// suggestions: the games already in the catalog (useful for subtitle requests)
DRT.fetchPublic('/api/games').then(r => r.json()).then(list => {
  document.getElementById('game-names').replaceChildren(...list.map(g => { const o = document.createElement('option'); o.value = g.title; return o; }));
}).catch(() => {});

// logged-in customers do not need to type a contact
document.addEventListener('drt:user', e => {
  const c = document.getElementById('r-contact');
  if (e.detail.user) { c.value = e.detail.user.email; }
});

document.getElementById('req-form').addEventListener('submit', async e => {
  e.preventDefault();
  const st = document.getElementById('r-status');
  st.textContent = ''; st.className = 'contact-status';
  try {
    const res = await fetch('/api/requests', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: typeOf(), game: document.getElementById('r-game').value, details: document.getElementById('r-details').value,
        contact: document.getElementById('r-contact').value, slug: params.get('slug') || '', website: document.getElementById('r-website').value }),
    });
    const d = await res.json();
    if (!res.ok) throw new Error(d.error || t('contact_error'));
    st.textContent = typeOf() === 'game'
      ? t(d.autoAddQueued ? 'req_auto_add' : (d.merged ? 'req_merged' : 'req_thanks'))
      : t(d.merged ? 'req_merged' : 'req_thanks');
    st.className = 'contact-status ok';
    document.getElementById('r-details').value = '';
  } catch (err) { st.textContent = err.message; st.className = 'contact-status err'; }
});
