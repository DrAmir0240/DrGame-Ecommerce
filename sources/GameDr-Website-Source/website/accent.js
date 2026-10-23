// The main colour of a game's cover picture, used to tint that game's page (yellow for Wolverine / Cyberpunk, and so on).
// The picture is shrunk to 48x48, every colourful pixel votes for its hue (the more saturated, the stronger), and the winning
// hue is turned into a bright, readable colour. Grey / black / white covers return null (the page keeps the normal purple).
const fs = require('fs');
const sharp = require('sharp');

const cache = new Map();   // file -> { mtime, promise }

function hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, s, l];
}
function hex([h, s, l]) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

async function compute(file) {
  const { data } = await sharp(file).resize(48, 48, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bins = Array.from({ length: 24 }, () => ({ w: 0, n: 0, s: 0 }));
  let colourful = 0;
  for (let i = 0; i < data.length; i += 3) {
    const [h, s, l] = hsl([data[i], data[i + 1], data[i + 2]]);
    if (s < 0.28 || l < 0.12 || l > 0.9) continue;                 // grey, nearly black or nearly white: not a "colour" of the cover
    const w = s * (1 - Math.abs(l - 0.5));                          // vivid mid-tones count most
    const b = bins[Math.floor(h / 15) % 24];
    b.w += w; b.n++; b.s += s; colourful++;
  }
  if (colourful < 48 * 48 * 0.06) return null;                       // under 6% colourful: a grey cover
  // hue = best bin together with its two neighbours (so orange-yellow-ish covers do not split)
  let best = 0, bestW = -1;
  for (let i = 0; i < 24; i++) { const w = bins[i].w + bins[(i + 1) % 24].w * 0.6 + bins[(i + 23) % 24].w * 0.6; if (w > bestW) { bestW = w; best = i; } }
  const hue = best * 15 + 7.5;
  const sat = Math.min(0.9, Math.max(0.6, bins[best].n ? bins[best].s / bins[best].n : 0.7));
  return hex([hue, sat, 0.56]);
}

// returns '#rrggbb' or null; result is remembered until the picture file changes
function accentFor(file) {
  let st; try { st = fs.statSync(file); } catch (e) { return Promise.resolve(null); }
  const hit = cache.get(file);
  if (hit && hit.mtime === st.mtimeMs) return hit.promise;
  const promise = compute(file).catch(() => null);
  cache.set(file, { mtime: st.mtimeMs, promise });
  return promise;
}
module.exports = { accentFor };
