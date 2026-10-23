applyLanguage();
initLangToggle();
DRT.fetchPublic('/api/site-content').then(r => r.json()).then(d => {
  if (!d.hasLearnVideo) return;
  document.getElementById('learn-video').src = '/learn-video.mp4?v=' + Date.now();
  document.getElementById('feature-video').style.display = '';
}).catch(() => {});
