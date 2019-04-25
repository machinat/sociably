// @flow
import { MACHINAT_FRAGMENT_TYPE, MACHINAT_PAUSE_TYPE } from './symbol';
import createElement from './createElement';

const Machinat = {
  createElement,
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Pause: MACHINAT_PAUSE_TYPE,
};

export default Machinat;
export * from './symbol';
