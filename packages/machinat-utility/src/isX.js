// @flow
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
} from 'machinat-symbol';

export const isEmpty = (element: any): boolean %checks =>
  typeof element === 'boolean' || element === null || element === undefined;

export const isElement = (element: any): boolean %checks =>
  typeof element === 'object' &&
  element !== null &&
  element.$$typeof === MACHINAT_ELEMENT_TYPE;

export const isFragment = (element: any): boolean %checks =>
  typeof element === 'object' &&
  element !== null &&
  element.type === MACHINAT_FRAGMENT_TYPE;

export const isPause = (element: any): boolean %checks =>
  typeof element === 'object' &&
  element !== null &&
  element.type === MACHINAT_PAUSE_TYPE;

export const isValidRenderable = (element: any): boolean %checks =>
  typeof element === 'string' ||
  typeof element === 'number' ||
  (typeof element === 'object' &&
    element !== null &&
    element.$$typeof === MACHINAT_ELEMENT_TYPE &&
    (typeof element.type === 'string' || typeof element.type === 'function'));

export const isNative = (element: any): boolean %checks =>
  typeof element === 'object' &&
  element !== null &&
  // $FlowFixMe: remove me after symbol primitive supported
  (typeof element.type.$$native === 'symbol' ||
    typeof element.type.$$native === 'string');
