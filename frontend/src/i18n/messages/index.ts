/**
 * Message catalog loader.
 *
 * Every page / section owns its own namespace file under `messages/<locale>/<file>.json`.
 * The loader deep-merges all of them (plus the legacy base catalog) into a single
 * resource tree per locale, so `t('gamesPage.title')` works no matter which file
 * the key lives in.
 *
 * Adding a new section = add a JSON file for each locale + one import line here.
 * Splitting files this way keeps catalogs reviewable and avoids merge conflicts.
 */

import faBase from '../locales/fa.json';
import enBase from '../locales/en.json';
import arBase from '../locales/ar.json';

import faStore from './fa/store.json';
import enStore from './en/store.json';
import arStore from './ar/store.json';

import faAccount from './fa/account.json';
import enAccount from './en/account.json';
import arAccount from './ar/account.json';

import faAdminA from './fa/adminA.json';
import enAdminA from './en/adminA.json';
import arAdminA from './ar/adminA.json';

import faAdminB from './fa/adminB.json';
import enAdminB from './en/adminB.json';
import arAdminB from './ar/adminB.json';

import faAdminC from './fa/adminC.json';
import enAdminC from './en/adminC.json';
import arAdminC from './ar/adminC.json';

import faAdminD from './fa/adminD.json';
import enAdminD from './en/adminD.json';
import arAdminD from './ar/adminD.json';

import faUiA from './fa/uiA.json';
import enUiA from './en/uiA.json';
import arUiA from './ar/uiA.json';

import faUiB from './fa/uiB.json';
import enUiB from './en/uiB.json';
import arUiB from './ar/uiB.json';

import faUiC from './fa/uiC.json';
import enUiC from './en/uiC.json';
import arUiC from './ar/uiC.json';

type Dict = { [key: string]: any };

function isPlainObject(value: unknown): value is Dict {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Recursively merge `extra` into `base` (extra wins, arrays are replaced). */
function deepMerge(base: Dict, extra: Dict): Dict {
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

function build(base: Dict, ...fragments: Dict[]): Dict {
  return fragments.reduce<Dict>((acc, fragment) => deepMerge(acc, fragment), { ...base });
}

export const MESSAGES: Record<'fa' | 'en' | 'ar', Dict> = {
  fa: build(faBase as Dict, faStore, faAccount, faAdminA, faAdminB, faAdminC, faAdminD, faUiA, faUiB, faUiC),
  en: build(enBase as Dict, enStore, enAccount, enAdminA, enAdminB, enAdminC, enAdminD, enUiA, enUiB, enUiC),
  ar: build(arBase as Dict, arStore, arAccount, arAdminA, arAdminB, arAdminC, arAdminD, arUiA, arUiB, arUiC),
};

export default MESSAGES;
