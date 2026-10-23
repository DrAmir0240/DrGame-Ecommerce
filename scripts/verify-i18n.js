/**
 * CI/CD Missing-Key Detector for DrGame I18n System
 * Enforces zero missing keys across all supported language catalogs
 */
const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/src/locales');
if (!fs.existsSync(localesDir)) {
  console.error(`[i18n ERROR] Locales directory not found: ${localesDir}`);
  process.exit(1);
}

const baseFilePath = path.join(localesDir, 'en.json');
if (!fs.existsSync(baseFilePath)) {
  console.error(`[i18n ERROR] Base locale file not found: ${baseFilePath}`);
  process.exit(1);
}

const baseLocale = JSON.parse(fs.readFileSync(baseFilePath, 'utf8'));
const baseKeys = Object.keys(baseLocale);
console.log(`[i18n] Base locale 'en.json' loaded with ${baseKeys.length} keys.`);

let hasError = false;
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json') && f !== 'en.json');

files.forEach(file => {
  const currentLocale = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  const missingKeys = baseKeys.filter(key => !(key in currentLocale));
  if (missingKeys.length > 0) {
    console.error(`[i18n ERROR] File ${file} is missing ${missingKeys.length} keys:`, missingKeys);
    hasError = true;
  } else {
    console.log(`[i18n] ✅ ${file} has all ${baseKeys.length} keys synchronized.`);
  }
});

if (hasError) {
  console.error('[i18n] Verification failed with missing keys.');
  process.exit(1);
}

console.log('✅ All locales are 100% synchronized with en.json baseline (0 missing keys).');
