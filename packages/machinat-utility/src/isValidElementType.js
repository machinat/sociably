// @flow
import { MACHINAT_FRAGMENT_TYPE, MACHINAT_PAUSE_TYPE } from 'machinat-symbol';

const isValidElementType = (type: any) =>
  typeof type === 'string' ||
  typeof type === 'function' ||
  type === MACHINAT_FRAGMENT_TYPE ||
  type === MACHINAT_PAUSE_TYPE;

export default isValidElementType;
