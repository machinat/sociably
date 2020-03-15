// @flow
import type { MachinatElement, MachinatElementType } from '../types';
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_SERVICES_CONTAINER,
} from '../symbol';

export const isEmpty = (node: any): boolean %checks =>
  typeof node === 'boolean' || node === null || node === undefined;

export const isElement = (node: any): boolean %checks =>
  typeof node === 'object' &&
  node !== null &&
  node.$$typeof === MACHINAT_ELEMENT_TYPE;

export const isFragmentElement = (node: any): boolean %checks =>
  typeof node === 'object' && node.type === MACHINAT_FRAGMENT_TYPE;

export const isPauseElement = (node: any): boolean %checks =>
  typeof node === 'object' && node.type === MACHINAT_PAUSE_TYPE;

export const isThunkElement = (node: any): boolean %checks =>
  typeof node === 'object' && node.type === MACHINAT_THUNK_TYPE;

export const isRawElement = (node: any): boolean %checks =>
  typeof node === 'object' && node.type === MACHINAT_RAW_TYPE;

export const isProviderElement = (node: any): boolean %checks =>
  typeof node === 'object' && node.type === MACHINAT_PROVIDER_TYPE;

export const isFunctionalElement = (node: any): boolean %checks =>
  typeof node === 'object' &&
  typeof node.type === 'function' &&
  node.type.$$typeof !== MACHINAT_NATIVE_TYPE &&
  node.type.$$typeof !== MACHINAT_SERVICES_CONTAINER;

export const isContainerElement = (node: any): boolean %checks =>
  typeof node === 'object' &&
  typeof node.type === 'function' &&
  node.type.$$typeof === MACHINAT_SERVICES_CONTAINER;

export const isGeneralElement = (node: any): boolean %checks =>
  typeof node === 'object' && typeof node.type === 'string';

export const isNativeElement = (node: any): boolean %checks =>
  typeof node === 'object' &&
  typeof node.type === 'function' &&
  node.type.$$typeof === MACHINAT_NATIVE_TYPE;

export const isTypeOf = (
  node: any,
  ...types: MachinatElementType[]
): boolean %checks => typeof node === 'object' && types.includes(node.types);

export const isElementTypeValid = (
  node: MachinatElement<any, any>
): boolean => {
  const { type } = node;
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === MACHINAT_FRAGMENT_TYPE ||
    type === MACHINAT_PAUSE_TYPE ||
    type === MACHINAT_PROVIDER_TYPE ||
    type === MACHINAT_THUNK_TYPE ||
    type === MACHINAT_RAW_TYPE
  );
};

export const isValidRenderable = (node: any): boolean %checks =>
  typeof node === 'string' ||
  typeof node === 'number' ||
  (typeof node === 'object' &&
    node !== null &&
    node.$$typeof === MACHINAT_ELEMENT_TYPE &&
    (typeof node.type === 'string' || typeof node.type === 'function'));
