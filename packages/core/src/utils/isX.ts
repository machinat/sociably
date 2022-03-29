import type {
  MachinatEmpty,
  MachinatNode,
  MachinatElement,
  FragmentElement,
  PauseElement,
  ThunkElement,
  RawElement,
  ProviderElement,
  FunctionalElement,
  FunctionalComponent,
  ContainerElement,
  ContainerComponent,
  GeneralElement,
  NativeElement,
  NativeComponent,
} from '../types';
import {
  MACHINAT_FRAGMENT_TYPE,
  MACHINAT_ELEMENT_TYPE,
  MACHINAT_PAUSE_TYPE,
  MACHINAT_THUNK_TYPE,
  MACHINAT_RAW_TYPE,
  MACHINAT_PROVIDER_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_SERVICE_CONTAINER,
} from '../symbol';

export const isEmpty = (node: MachinatNode): node is MachinatEmpty =>
  typeof node === 'boolean' || node === null || node === undefined;

export const isElement = (
  node: MachinatNode
): node is MachinatElement<unknown, unknown> =>
  typeof node === 'object' &&
  node !== null &&
  !Array.isArray(node) &&
  node.$$typeof === MACHINAT_ELEMENT_TYPE;

export const isFragmentType = (node: MachinatNode): node is FragmentElement =>
  isElement(node) && node.type === MACHINAT_FRAGMENT_TYPE;

export const isPauseType = (node: MachinatNode): node is PauseElement =>
  isElement(node) && node.type === MACHINAT_PAUSE_TYPE;

export const isThunkType = (node: MachinatNode): node is ThunkElement =>
  isElement(node) && node.type === MACHINAT_THUNK_TYPE;

export const isRawType = (node: MachinatNode): node is RawElement =>
  isElement(node) && node.type === MACHINAT_RAW_TYPE;

export const isProviderType = (node: MachinatNode): node is ProviderElement =>
  isElement(node) && node.type === MACHINAT_PROVIDER_TYPE;

export const isFunctionalType = (
  node: MachinatNode
): node is FunctionalElement<unknown, FunctionalComponent<unknown>> =>
  isElement(node) &&
  typeof node.type === 'function' &&
  node.type.$$typeof !== MACHINAT_NATIVE_TYPE &&
  node.type.$$typeof !== MACHINAT_SERVICE_CONTAINER;

export const isContainerType = (
  node: MachinatNode
): node is ContainerElement<unknown, ContainerComponent<unknown>> =>
  isElement(node) &&
  typeof node.type === 'function' &&
  node.type.$$typeof === MACHINAT_SERVICE_CONTAINER;

export const isGeneralType = (node: MachinatNode): node is GeneralElement =>
  isElement(node) && typeof node.type === 'string';

export const isNativeType = <Component extends NativeComponent<unknown, any>>(
  node: MachinatNode
): node is NativeElement<unknown, Component> =>
  isElement(node) &&
  typeof node.type === 'function' &&
  node.type.$$typeof === MACHINAT_NATIVE_TYPE;
