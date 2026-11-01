import common from '../../locales/hi.json';
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
