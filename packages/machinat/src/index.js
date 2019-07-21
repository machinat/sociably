// @flow
import { MACHINAT_FRAGMENT_TYPE, MACHINAT_PAUSE_TYPE } from './symbol';
import createElement from './createElement';
import createService from './createService';

const Machinat = {
  createElement,
  createService,
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Pause: MACHINAT_PAUSE_TYPE,
};

export default Machinat;
export * from './symbol';
export { default as context } from './context';
