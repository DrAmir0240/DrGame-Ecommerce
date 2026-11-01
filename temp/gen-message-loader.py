import json
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'src', 'i18n', 'messages')

LOCALES = [
    'fa', 'en', 'ar',
    'de', 'es', 'fr', 'ru', 'zh', 'ja',
    'ko', 'tr', 'it', 'pt', 'hi', 'nl',
]

SECTIONS = ['store', 'account', 'adminA', 'adminB', 'adminC', 'adminD', 'uiA', 'uiB', 'uiC']

BUILD_TS = '''/**
 * Catalog assembly.
 *
 * Each locale folder exports a bundle built from its own JSON files; this module
 * holds the merge logic so the per-locale bundles stay declarative.
 */

type Dict = { [key: string]: any };

function isPlainObject(value: unknown): value is Dict {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Recursively merge `extra` into `base` (extra wins, arrays are replaced). */
export function deepMerge(base: Dict, extra: Dict): Dict {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    if (isPlainObject(value) && isPlainObject(out[key])) {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Merge the legacy base catalog with every section file.
 * Later fragments win, which is why section files can override base keys.
 */
export function buildBundle(base: Dict, ...fragments: Dict[]): Dict {
  return fragments.reduce<Dict>((acc, fragment) => deepMerge(acc, fragment), { ...base });
}
'''

INDEX_TS_HEAD = '''/**
 * Message catalog loader.
 *
 * Every page / section owns its own namespace file under `messages/<locale>/<file>.json`.
 * Each locale folder assembles those files into one bundle (see `build.ts`), so
 * `t('gamesPage.title')` works no matter which file the key lives in.
 *
 * Adding a locale = add `messages/<locale>/` + one import line below, and register
 * it in `src/i18n/config.ts`.
 */

import type { SupportedLocale } from '../config';

'''

lines = []
lines.append(INDEX_TS_HEAD)

for loc in LOCALES:
    lines.append(f"import {loc}Bundle from './{loc}';")

lines.append('')
lines.append('type Dict = { [key: string]: any };')
lines.append('')
lines.append('export const MESSAGES: Record<SupportedLocale, Dict> = {')
for loc in LOCALES:
    lines.append(f'  {loc}: {loc}Bundle,')
lines.append('};')
lines.append('')
lines.append('export default MESSAGES;')
lines.append('')

with open(os.path.join(ROOT, 'build.ts'), 'w', encoding='utf-8', newline='\n') as handle:
    handle.write(BUILD_TS)

with open(os.path.join(ROOT, 'index.ts'), 'w', encoding='utf-8', newline='\n') as handle:
    handle.write('\n'.join(lines))

for loc in LOCALES:
    body = [
        '/**',
        f' * {loc} message bundle.',
        ' *',
        ' * Merged in the order: base catalog → sections. Later files win.',
        ' */',
        '',
        f"import base from '../../locales/{loc}.json';",
        '',
    ]
    for section in SECTIONS:
        body.append(f"import {section} from './{section}.json';")
    body.append('')
    body.append("import { buildBundle } from '../build';")
    body.append('')
    body.append('export default buildBundle(')
    body.append('  base,')
    for section in SECTIONS:
        body.append(f'  {section},')
    body.append(');')
    body.append('')
    path = os.path.join(ROOT, loc, 'index.ts')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('\n'.join(body))

print(f'wrote build.ts + index.ts + {len(LOCALES)} locale bundles')
