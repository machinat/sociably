import type {
  MachinatEmpty,
  MachinatElement,
  FragmentElement,
  PauseElement,
  ThunkElement,
  RawElement,
  InjectionElement,
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
  MACHINAT_INJECTION_TYPE,
  MACHINAT_NATIVE_TYPE,
  MACHINAT_SERVICE_CONTAINER,
} from '../symbol';

export const isEmpty = (node: unknown): node is MachinatEmpty =>
  typeof node === 'boolean' || node === null || node === undefined;

export const isElement = (node: unknown): node is MachinatElement<any, any> =>
  typeof node === 'object' &&
  node !== null &&
  (node as any).$$typeof === MACHINAT_ELEMENT_TYPE;

export const isFragmentType = (
  node: MachinatElement<any, any>
): node is FragmentElement => node.type === MACHINAT_FRAGMENT_TYPE;

export const isPauseType = (
  node: MachinatElement<any, any>
): node is PauseElement => node.type === MACHINAT_PAUSE_TYPE;

export const isThunkType = (
  node: MachinatElement<any, any>
): node is ThunkElement => node.type === MACHINAT_THUNK_TYPE;

export const isRawType = (
  node: MachinatElement<any, any>
): node is RawElement => node.type === MACHINAT_RAW_TYPE;

export const isInjectionType = (
  node: MachinatElement<any, any>
): node is InjectionElement => node.type === MACHINAT_INJECTION_TYPE;

export const isFunctionalType = (
  node: MachinatElement<any, any>
): node is FunctionalElement<any, FunctionalComponent<any>> =>
  typeof node.type === 'function' &&
  node.type.$$typeof !== MACHINAT_NATIVE_TYPE &&
  node.type.$$typeof !== MACHINAT_SERVICE_CONTAINER;

export const isContainerType = (
  node: MachinatElement<any, any>
): node is ContainerElement<any, ContainerComponent<any>> =>
  typeof node.type === 'function' &&
  node.type.$$typeof === MACHINAT_SERVICE_CONTAINER;

export const isGeneralType = (
  node: MachinatElement<any, any>
): node is GeneralElement => typeof node.type === 'string';

export const isNativeType = <Component extends NativeComponent<any, any>>(
  node: MachinatElement<any, any>
): node is NativeElement<any, Component> =>
  typeof node.type === 'function' &&
  node.type.$$typeof === MACHINAT_NATIVE_TYPE;

export const isElementTypeValid = (
  node: MachinatElement<any, any>
): boolean => {
  const { type } = node;
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === MACHINAT_FRAGMENT_TYPE ||
    type === MACHINAT_PAUSE_TYPE ||
    type === MACHINAT_INJECTION_TYPE ||
    type === MACHINAT_THUNK_TYPE ||
    type === MACHINAT_RAW_TYPE
  );
};
