// Builds public/coin.svg: the DRT coin with the site logo embedded in the
// middle (embedded as a data URI so it also works when loaded via <img>).
// Usage: node scripts/make-coin.js
const fs = require('fs');
const path = require('path');

const logo = fs.readFileSync(path.join(__dirname, '..', 'public', 'logo.png')).toString('base64');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff2b3"/>
      <stop offset="0.35" stop-color="#f6c433"/>
      <stop offset="0.7" stop-color="#b9760f"/>
      <stop offset="1" stop-color="#ffd966"/>
    </linearGradient>
    <linearGradient id="rim2" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#fff2b3"/>
      <stop offset="0.5" stop-color="#e0a21c"/>
      <stop offset="1" stop-color="#8a540a"/>
    </linearGradient>
    <radialGradient id="face" cx="0.38" cy="0.32" r="0.85">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.55" stop-color="#f4ecff"/>
      <stop offset="1" stop-color="#d9c6f5"/>
    </radialGradient>
    <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.75"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="faceclip"><circle cx="100" cy="100" r="76"/></clipPath>
  </defs>

  <!-- soft shadow -->
  <ellipse cx="100" cy="188" rx="62" ry="6" fill="#000" opacity="0.25"/>

  <!-- outer rim with reeded edge -->
  <circle cx="100" cy="100" r="96" fill="url(#rim)"/>
  <circle cx="100" cy="100" r="96" fill="none" stroke="#8a540a" stroke-width="1.5" opacity="0.7"/>
  <circle cx="100" cy="100" r="90" fill="none" stroke="#7a4a08" stroke-width="5" stroke-dasharray="2.2 3.4" opacity="0.45"/>
  <circle cx="100" cy="100" r="84" fill="url(#rim2)"/>

  <!-- inner bevel + face -->
  <circle cx="100" cy="100" r="78" fill="#a86a0c"/>
  <circle cx="100" cy="100" r="76" fill="url(#face)"/>
  <circle cx="100" cy="100" r="70" fill="none" stroke="#c026d3" stroke-width="1.6" opacity="0.55"/>

  <!-- the logo, centered -->
  <g clip-path="url(#faceclip)">
    <image x="31" y="31" width="138" height="138" xlink:href="data:image/png;base64,${logo}" preserveAspectRatio="xMidYMid meet"/>
  </g>

  <!-- DRT label on the rim bottom -->
  <text x="100" y="185" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="13" letter-spacing="3" fill="#6b3e05">DRT</text>

  <!-- glossy highlight -->
  <path d="M30 80 A76 76 0 0 1 120 28 A90 90 0 0 0 30 80 Z" fill="url(#shine)" opacity="0.8"/>
</svg>
`;
fs.writeFileSync(path.join(__dirname, '..', 'public', 'coin.svg'), svg);
console.log('wrote public/coin.svg', Math.round(svg.length / 1024) + ' KB');
