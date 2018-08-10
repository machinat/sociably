// @flow
import { MACHINAT_FRAGMENT_TYPE, MACHINAT_IMMEDIATELY_TYPE } from './symbol';

const isValidElementType = (type: any) =>
  typeof type === 'string' ||
  typeof type === 'function' ||
  type === MACHINAT_FRAGMENT_TYPE ||
  type === MACHINAT_IMMEDIATELY_TYPE;

export default isValidElementType;
