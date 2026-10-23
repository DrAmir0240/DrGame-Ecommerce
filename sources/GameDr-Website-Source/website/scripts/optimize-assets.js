// Shrinks the two heavy site images without changing how they look at the sizes the site shows them:
//   public/logo.png  640px -> 320px   (the logo is shown 38-44px tall, at most about 160px)
//   public/coin.svg  its embedded logo 640px -> 280px (the coin is drawn at most about 140px wide)
// The untouched originals are kept in scripts/originals/. Run: node scripts/optimize-assets.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pub = path.join(__dirname, '..', 'public');
const orig = path.join(__dirname, 'originals');
(async () => {
  const logo = await sharp(path.join(orig, 'logo-640.png')).resize(320, 320).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  fs.writeFileSync(path.join(pub, 'logo.png'), logo);
  let svg = fs.readFileSync(path.join(orig, 'coin-original.svg'), 'utf8');
  const m = /href="data:image\/png;base64,([A-Za-z0-9+/=]+)"/.exec(svg);
  const small = await sharp(Buffer.from(m[1], 'base64')).resize(280, 280).png({ compressionLevel: 9, effort: 10 }).toBuffer();
  svg = svg.replace(m[1], small.toString('base64'));
  fs.writeFileSync(path.join(pub, 'coin.svg'), svg);
  console.log('logo.png', fs.statSync(path.join(orig, 'logo-640.png')).size, '->', logo.length, '| coin.svg', fs.statSync(path.join(orig, 'coin-original.svg')).size, '->', svg.length);
})();
