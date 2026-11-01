import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MESSAGES_DIR = path.join(ROOT, 'src/i18n/messages');
const LOCALES_DIR = path.join(ROOT, 'src/i18n/locales');
const EN_DIR = path.join(MESSAGES_DIR, 'en');
const EN_LOCALE_FILE = path.join(LOCALES_DIR, 'en.json');

const TARGETS = ['fr', 'hi', 'it', 'ja', 'ko', 'nl', 'pt', 'tr'];
const SECTIONS = ['account', 'adminA', 'adminB', 'adminC', 'adminD', 'store', 'uiA', 'uiB', 'uiC'];

const enCommon = fs.readFileSync(EN_LOCALE_FILE, 'utf8');

for (const loc of TARGETS) {
  const locFile = path.join(LOCALES_DIR, `${loc}.json`);
  if (!fs.existsSync(locFile)) {
    fs.writeFileSync(locFile, enCommon, 'utf8');
    console.log(`Created ${locFile}`);
  }

  const locMsgDir = path.join(MESSAGES_DIR, loc);
  if (!fs.existsSync(locMsgDir)) {
    fs.mkdirSync(locMsgDir, { recursive: true });
  }

  for (const sec of SECTIONS) {
    const secFile = path.join(locMsgDir, `${sec}.json`);
    if (!fs.existsSync(secFile)) {
      const srcSec = path.join(EN_DIR, `${sec}.json`);
      fs.copyFileSync(srcSec, secFile);
      console.log(`Created ${secFile}`);
    }
  }

  const indexFile = path.join(locMsgDir, 'index.ts');
  const indexContent = `import common from '../../locales/${loc}.json';
import store from './store.json';
import account from './account.json';
import adminA from './adminA.json';
import adminB from './adminB.json';
import adminC from './adminC.json';
import adminD from './adminD.json';
import uiA from './uiA.json';
import uiB from './uiB.json';
import uiC from './uiC.json';

const catalog = {
  ...common,
  ...store,
  ...account,
  ...adminA,
  ...adminB,
  ...adminC,
  ...adminD,
  ...uiA,
  ...uiB,
  ...uiC,
};

export default catalog;
`;
  fs.writeFileSync(indexFile, indexContent, 'utf8');
}
console.log('All missing locale files filled successfully.');
