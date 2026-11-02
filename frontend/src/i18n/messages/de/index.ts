/**
 * de message bundle.
 *
 * Merged in the order: base catalog → sections. Later files win.
 */

import base from '../../locales/de.json';

import store from './store.json';
import account from './account.json';
import adminA from './adminA.json';
import adminB from './adminB.json';
import adminC from './adminC.json';
import adminD from './adminD.json';
import uiA from './uiA.json';
import uiB from './uiB.json';
import uiC from './uiC.json';

import { buildBundle } from '../build';

export default buildBundle(
  base,
  store,
  account,
  adminA,
  adminB,
  adminC,
  adminD,
  uiA,
  uiB,
  uiC,
);
