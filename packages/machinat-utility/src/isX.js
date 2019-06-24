// @flow
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_NATIVE_TYPE,
} from 'machinat';

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
  (typeof element.type === 'function' &&
    element.type.$$typeof === MACHINAT_NATIVE_TYPE);
