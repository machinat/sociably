import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_IMMEDIATELY_TYPE,
} from 'machinat-shared';
import createElement from './createElement';

const Machinat = {
  createElement,
  Fragment: MACHINAT_FRAGMENT_TYPE,
  Immediately: MACHINAT_IMMEDIATELY_TYPE,
};

export default Machinat;
