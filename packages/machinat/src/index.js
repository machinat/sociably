import { MACHINAT_FRAGMENT_TYPE, MACHINAT_PAUSE_TYPE } from 'machinat-utility';
import createElement from './createElement';
import createServer from './server/http';

const Machinat = {
  createElement,
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Pause: MACHINAT_PAUSE_TYPE,
};

export { Machinat as default, createServer };
