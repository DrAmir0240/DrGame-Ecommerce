// Builds the faded gaming-icon background tiles:
//   public/bg-pattern-dark.svg   (white icons, for dark mode)
//   public/bg-pattern-light.svg  (purple-gray icons, for light mode)
// Each tile is 560x560 = the 280x280 icon set repeated 2x2, plus several copies of the
// Dr Game logo (as a flat silhouette, like the icons) in different sizes and slight
// rotations, scattered at "random" spots that never touch an icon or each other.
// The placement is seeded, so every run gives the same result; change SEED for a new layout.
//
// Usage: node scripts/make-pattern.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

const SEED = 20260506;
const TILE = 560;           // output tile size
const ICON_TILE = 280;      // the icon set repeats every 280px
const LOGO_COUNT = 7;
const LOGO_SIZES = [120, 104, 90, 78, 68, 58, 50];   // px, one per logo (largest placed first)

const pub = p => path.join(__dirname, '..', 'public', p);

// ---------- the icon set (one 280x280 tile) ----------
// each icon: its drawing and a rough bounding box (x0, y0, x1, y1)
const ICON_SET = [
  { box: [14, 20, 126, 102], svg: `<g transform="translate(26 30) rotate(-12 40 22)">
      <path d="M14 6h52a14 14 0 0 1 13.600 10.600l5.400 22c1.600 6.600-3.400 12.400-10.200 12.400-4 0-7.400-2-9.600-5.400L60 40H20l-5.200 5.600C12.600 49 9.200 51 5.200 51-1.600 51-6.600 45.200-5 38.600l5.400-22A14 14 0 0 1 14 6Z"/>
      <path d="M22 20v12M16 26h12"/>
      <circle cx="58" cy="22" r="2.400"/><circle cx="65" cy="29" r="2.400"/>
    </g>` },
  { box: [178, 30, 214, 60], svg: '<path d="M196 34l13 22h-26z"/>' },                       // triangle
  { box: [224, 70, 252, 98], svg: '<circle cx="238" cy="84" r="11"/>' },                    // circle
  { box: [162, 98, 196, 132], svg: '<path d="M168 104l22 22M190 104l-22 22"/>' },            // cross
  { box: [218, 144, 252, 178], svg: '<rect x="224" y="150" width="22" height="22" rx="3"/>' }, // square
  { box: [10, 138, 62, 196], svg: '<path d="M52 160h-10v-10h-12v10H20v12h10v10h12v-10h10z" transform="rotate(14 36 166)"/>' }, // d-pad
  { box: [100, 182, 156, 238], svg: '<circle cx="128" cy="210" r="22"/><circle cx="128" cy="210" r="9"/>' }, // joystick
  { box: [188, 222, 240, 268], svg: '<path d="M214 232l4.400 9 9.800 1.400-7.100 6.900 1.700 9.800-8.800-4.600-8.800 4.600 1.700-9.800-7.100-6.900 9.800-1.400z"/>' }, // star
  { box: [86, 106, 108, 128], svg: '<path d="M92 118h10M97 113v10"/>' },                    // plus
  { box: [144, 40, 156, 52], svg: '<circle cx="150" cy="46" r="3"/>' },
  { box: [78, 252, 90, 264], svg: '<circle cx="84" cy="258" r="3"/>' },
  { box: [256, 190, 268, 202], svg: '<circle cx="262" cy="196" r="3"/>' },
  { box: [10, 222, 44, 256], svg: '<path d="M18 238l9-9 9 9-9 9z"/>' },                      // diamond
];

// ---------- seeded random ----------
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
const REPS = TILE / ICON_TILE;                       // 2 -> the icon set repeats 2x2

// The logo image is square, but the artwork only fills about 96% x 58% of it (centered),
// so collisions are checked against that shape.
function logoBox(cx, cy, size) {
  const hw = size * 0.49, hh = size * 0.31;
  return [cx - hw, cy - hh, cx + hw, cy + hh];
}

// How many icons may a logo of this size push out of the way? (0 = it must fit in a real gap)
const maxRemoved = size => (size >= 100 ? 2 : size >= 80 ? 1 : 0);

function placeLogos() {
  const rnd = mulberry32(SEED);
  const removed = new Set();                          // "tx,ty,i" of icons left out of the tile
  const placed = [];
  const wraps = [-TILE, 0, TILE];
  for (const size of LOGO_SIZES.slice(0, LOGO_COUNT)) {
    let best = null;
    for (let tries = 0; tries < 6000; tries++) {
      const cx = rnd() * TILE, cy = rnd() * TILE;
      let bad = false;
      const hits = new Set();
      for (const dx of wraps) for (const dy of wraps) {
        const b = logoBox(cx + dx, cy + dy, size);
        // other logos (and their wrapped copies)
        for (const p of placed) for (const px of wraps) for (const py of wraps) {
          if (overlap(b, p.box.map((v, k) => v + (k % 2 === 0 ? px : py)))) bad = true;
        }
        if (Math.hypot(0, 0) && bad) break;
        // icons: which instances does this copy touch?
        for (let ty = -1; ty < REPS + 1; ty++) for (let tx = -1; tx < REPS + 1; tx++) {
          ICON_SET.forEach((ic, i) => {
            const ib = [ic.box[0] + tx * ICON_TILE, ic.box[1] + ty * ICON_TILE, ic.box[2] + tx * ICON_TILE, ic.box[3] + ty * ICON_TILE];
            if (overlap(b, ib)) hits.add(((tx % REPS) + REPS) % REPS + ',' + (((ty % REPS) + REPS) % REPS) + ',' + i);
          });
        }
      }
      if (bad) continue;
      const newHits = [...hits].filter(k => !removed.has(k));
      if (newHits.length > maxRemoved(size)) continue;
      if (placed.some(p => Math.hypot(p.cx - cx, p.cy - cy) < (p.size + size) * 0.5 + 16)) continue;
      if (!best || newHits.length < best.newHits.length) best = { cx, cy, newHits };
      if (newHits.length === 0 && tries > 300) break;  // a free gap was found: good enough
    }
    if (!best) throw new Error('could not place a logo of size ' + size + ' - lower LOGO_COUNT or change SEED');
    best.newHits.forEach(k => removed.add(k));
    placed.push({ cx: best.cx, cy: best.cy, size, rot: Math.round((rnd() - 0.5) * 36), box: logoBox(best.cx, best.cy, size) });
  }
  return { placed, removed };
}

// ---------- gray logo silhouettes (white for dark mode, purple-gray for light mode) ----------
function silhouette(rgb, alpha, name) {
  const out = path.join(require('os').tmpdir(), name);
  // lutrgb paints every pixel the same colour but keeps the logo's own transparency;
  // colorchannelmixer then lowers the overall opacity so it sits like the line icons do
  const vf = `scale=300:-1,format=rgba,lutrgb=r=${rgb[0]}:g=${rgb[1]}:b=${rgb[2]},colorchannelmixer=aa=${alpha}`;
  const r = spawnSync(ffmpegPath, ['-y', '-loglevel', 'error', '-i', pub('logo.png'), '-vf', vf, out]);
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + (r.stderr || '').toString());
  return fs.readFileSync(out).toString('base64');
}

// ---------- assemble a tile ----------
function tile(color, strokeOpacity, logo64, layout) {
  const { placed: logos, removed } = layout;
  const icons = [];
  for (let ty = 0; ty < REPS; ty++) for (let tx = 0; tx < REPS; tx++) {
    ICON_SET.forEach((ic, i) => { if (!removed.has(tx + ',' + ty + ',' + i)) icons.push(`<g transform="translate(${tx * ICON_TILE} ${ty * ICON_TILE})">${ic.svg}</g>`); });
  }
  // each logo is drawn at its spot and, when it hangs over an edge, again on the opposite side
  const uses = [];
  for (const l of logos) {
    for (const dx of [-TILE, 0, TILE]) for (const dy of [-TILE, 0, TILE]) {
      const b = l.box;
      if (b[2] + dx < 0 || b[0] + dx > TILE || b[3] + dy < 0 || b[1] + dy > TILE) continue;
      const half = l.size / 2;
      uses.push(`<use xlink:href="#lg" transform="translate(${(l.cx + dx - half).toFixed(1)} ${(l.cy + dy - half).toFixed(1)}) rotate(${l.rot} ${half} ${half}) scale(${(l.size / 300).toFixed(4)})"/>`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${TILE}" height="${TILE}" viewBox="0 0 ${TILE} ${TILE}">
  <defs><image id="lg" width="300" height="300" xlink:href="data:image/png;base64,${logo64}"/></defs>
  <g fill="none" stroke="${color}" stroke-opacity="${strokeOpacity}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
  ${icons.join('\n  ')}
  </g>
  <g>
  ${uses.join('\n  ')}
  </g>
</svg>
`;
}

const layout = placeLogos();
const logos = layout.placed;
fs.writeFileSync(pub('bg-pattern-dark.svg'), tile('#ffffff', 0.9, silhouette([255, 255, 255], 0.85, 'drgame-logo-white.png'), layout));
fs.writeFileSync(pub('bg-pattern-light.svg'), tile('#5b2a91', 0.9, silhouette([91, 42, 145], 0.85, 'drgame-logo-purple.png'), layout));
// the old separate logo layer is gone: the logos now live inside the pattern tiles
if (fs.existsSync(pub('bg-logo.svg'))) fs.unlinkSync(pub('bg-logo.svg'));
console.log('icons left out to make room:', layout.removed.size, '| placed', logos.length, 'logos:', logos.map(l => `${l.size}px@(${Math.round(l.cx)},${Math.round(l.cy)}) ${l.rot}deg`).join('  '));
for (const f of ['bg-pattern-dark.svg', 'bg-pattern-light.svg']) console.log('wrote', f, Math.round(fs.statSync(pub(f)).size / 1024) + ' KB');
