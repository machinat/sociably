// @flow
import { MACHINAT_FRAGMENT_TYPE } from './symbol';

const isValidElementType = (type: any) =>
  typeof type === 'string' ||
  typeof type === 'function' ||
  type === MACHINAT_FRAGMENT_TYPE;

export default isValidElementType;
