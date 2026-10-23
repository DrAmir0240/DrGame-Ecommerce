applyLanguage();
initLangToggle();
(async function load() {
  const lang = getLang();
  const box = document.getElementById('legal-body');
  try {
    const d = await (await fetch('/api/legal/terms?lang=' + lang)).json();
    document.title = d.title + ' \u2014 Dr Game';
    document.getElementById('legal-title').textContent = d.title;
    if (d.updated) document.getElementById('legal-updated').textContent = t('legal_updated') + ': ' + d.updated;
    box.replaceChildren();
    // tiny markdown: "# h1", "## h2", "- bullet", blank line = paragraph; **bold** inside text
    const inline = (el, text) => {
      text.split(/(\*\*[^*]+\*\*)/).forEach(part => {
        if (/^\*\*[^*]+\*\*$/.test(part)) { const b = document.createElement('strong'); b.textContent = part.slice(2, -2); el.appendChild(b); }
        else if (part) el.appendChild(document.createTextNode(part));
      });
    };
    let list = null;
    for (const raw of d.body.split('\n')) {
      const line = raw.trimEnd();
      if (!line.trim()) { list = null; continue; }
      let el;
      if (line.startsWith('## ')) { el = document.createElement('h2'); inline(el, line.slice(3)); list = null; }
      else if (line.startsWith('# ')) { list = null; continue; }   // the page title is already shown above
      else if (line.startsWith('- ')) {
        if (!list) { list = document.createElement('ul'); box.appendChild(list); }
        const li = document.createElement('li'); inline(li, line.slice(2)); list.appendChild(li); continue;
      } else { el = document.createElement('p'); inline(el, line); list = null; }
      box.appendChild(el);
    }
  } catch (e) { box.textContent = 'Could not load this page.'; }
})();
