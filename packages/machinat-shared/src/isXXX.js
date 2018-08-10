// @flow
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_IMMEDIATELY_TYPE,
} from './symbol';
import isValidElementType from './isValidElementType';

export const isEmpty = (element: any) =>
  typeof element === 'boolean' || element === null || element === undefined;

export const isElement = (element: any) =>
  typeof element === 'object' &&
  element !== null &&
  element.$$typeof === MACHINAT_ELEMENT_TYPE &&
  isValidElementType(element.type);

export const isFragment = (element: any) =>
  typeof element === 'object' &&
  element !== null &&
  element.type === MACHINAT_FRAGMENT_TYPE;

export const isImmediately = (element: any) =>
  typeof element === 'object' &&
  element !== null &&
  element.type === MACHINAT_IMMEDIATELY_TYPE;

export const isValidRenderable = (element: any) =>
  typeof element === 'string' ||
  typeof element === 'number' ||
  (typeof element === 'object' &&
    element !== null &&
    element.$$typeof === MACHINAT_ELEMENT_TYPE &&
    (typeof element.type === 'string' || typeof element.type === 'function'));

export const isNative = (element: any) =>
  typeof element === 'object' &&
  element !== null &&
  // $FlowFixMe: remove this after symbol primitive supported
  (typeof element.$$native === 'symbol' ||
    typeof element.$$native === 'string');
