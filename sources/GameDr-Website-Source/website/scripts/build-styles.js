const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const cssnano = require('cssnano');
async function build() {
  const root = path.resolve(__dirname, '..');
  const files = ['base', 'home', 'performance', 'subscription'];
  const source = files.map(name => fs.readFileSync(path.join(root, 'styles', name + '.css'), 'utf8')).join('\n');
  const result = await postcss([cssnano({preset:['default',{mergeLonghand:false, reduceInitial:false, normalizeUrl:false}]})]).process(source,{from:undefined,map:false});
  fs.writeFileSync(path.join(root,'public','style.css'),result.css);
  console.log('Styles: '+Buffer.byteLength(source)+' → '+Buffer.byteLength(result.css)+' bytes');
}
build().catch(e=>{console.error(e);process.exit(1)});
