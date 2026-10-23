/* Shared public-data requests. Never cache account or admin responses here. */
(function () {
  'use strict';
  const publicPaths = new Set(['/api/games', '/api/categories', '/api/home-labels', '/api/platforms', '/api/site-content']);
  const pending = new Map();
  function fetchPublic(path) {
    if (!publicPaths.has(path)) return fetch(path);
    if (!pending.has(path)) {
      const request = fetch(path).then(response => {
        if (!response.ok) { pending.delete(path); throw new Error('Could not load ' + path); }
        return response;
      }).catch(error => { pending.delete(path); throw error; });
      pending.set(path, request);
    }
    return pending.get(path).then(response => response.clone());
  }
  const labels = {};
  const mergeLabels = list => {
    for (const row of Array.isArray(list) ? list : []) {
      if (!row || !row.name) continue;
      labels[row.name] = { en: row.labelEn || row.name, fa: row.labelFa || row.name };
    }
    window.DRT.categoryLabels = labels;
    return list;
  };
  const setCategoryLabels = mergeLabels;
  const setHomeLabels = mergeLabels;
  const categoryLabelsReady = Promise.all([
    fetchPublic('/api/categories').then(response => response.json()).then(setCategoryLabels).catch(() => []),
    fetchPublic('/api/home-labels').then(response => response.json()).then(setHomeLabels).catch(() => []),
  ]).then(() => labels);
  window.DRT = Object.assign(window.DRT || {}, {
    fetchPublic,
    json: path => fetchPublic(path).then(response => response.json()),
    setCategoryLabels,
    setHomeLabels,
    categoryLabelsReady,
    reducedMotion: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
})();
