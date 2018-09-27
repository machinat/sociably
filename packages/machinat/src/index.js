import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_IMMEDIATELY_TYPE,
} from 'machinat-shared';
import createElement from './createElement';
import createServer from './server/native';

const Machinat = {
  createElement,
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Immediate: MACHINAT_IMMEDIATELY_TYPE,
};

export { Machinat as default, createServer };
