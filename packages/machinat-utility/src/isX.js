// @flow
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_CONSUMER_TYPE,
} from 'machinat';

export const isEmpty = (node: any): boolean %checks =>
  typeof node === 'boolean' || node === null || node === undefined;

export const isElement = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  node.$$typeof === MACHINAT_ELEMENT_TYPE;

export const isFragment = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  node.type === MACHINAT_FRAGMENT_TYPE;

export const isPause = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  node.type === MACHINAT_PAUSE_TYPE;

export const isProvider = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  typeof node.type === 'object' &&
  node.type.$$typeof === MACHINAT_PROVIDER_TYPE;

export const isConsumer = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  typeof node.type === 'object' &&
  node.type.$$typeof === MACHINAT_CONSUMER_TYPE;

export const isValidRenderable = (node: any): boolean %checks =>
  typeof node === 'string' ||
  typeof node === 'number' ||
  (typeof node === 'object' &&
    node !== null &&
    node.$$typeof === MACHINAT_ELEMENT_TYPE &&
    (typeof node.type === 'string' || typeof node.type === 'function'));

export const isNative = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  (typeof node.type === 'function' &&
    node.type.$$typeof === MACHINAT_NATIVE_TYPE);
