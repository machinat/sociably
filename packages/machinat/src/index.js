import { MACHINAT_FRAGMENT_TYPE, MACHINAT_ASYNC_TYPE } from 'machinat-shared';
import createElement from './createElement';

const Machinat = {
  createElement,
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Async: MACHINAT_ASYNC_TYPE,
};

export default Machinat;
