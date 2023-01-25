import type {
  SociablyEmpty,
  SociablyElement,
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
  SOCIABLY_FRAGMENT_TYPE,
  SOCIABLY_ELEMENT_TYPE,
  SOCIABLY_PAUSE_TYPE,
  SOCIABLY_THUNK_TYPE,
  SOCIABLY_RAW_TYPE,
  SOCIABLY_PROVIDER_TYPE,
  SOCIABLY_NATIVE_TYPE,
  SOCIABLY_SERVICE_CONTAINER,
} from '../symbol';

export const isEmpty = (node: unknown): node is SociablyEmpty =>
  typeof node === 'boolean' || node === null || node === undefined;

export const isElement = (node: any): node is SociablyElement<unknown, any> =>
  typeof node === 'object' &&
  node !== null &&
  node.$$typeof === SOCIABLY_ELEMENT_TYPE;

export const isFragmentType = (
  node: SociablyElement<unknown, unknown>
): node is FragmentElement => node.type === SOCIABLY_FRAGMENT_TYPE;

export const isPauseType = (
  node: SociablyElement<unknown, unknown>
): node is PauseElement => node.type === SOCIABLY_PAUSE_TYPE;

export const isThunkType = (
  node: SociablyElement<unknown, unknown>
): node is ThunkElement => node.type === SOCIABLY_THUNK_TYPE;

export const isRawType = (
  node: SociablyElement<unknown, unknown>
): node is RawElement => node.type === SOCIABLY_RAW_TYPE;

export const isProviderType = (
  node: SociablyElement<unknown, unknown>
): node is ProviderElement<unknown> => node.type === SOCIABLY_PROVIDER_TYPE;

export const isFunctionalType = (
  node: SociablyElement<unknown, any>
): node is FunctionalElement<unknown, FunctionalComponent<unknown>> =>
  typeof node.type === 'function' &&
  node.type.$$typeof !== SOCIABLY_NATIVE_TYPE &&
  node.type.$$typeof !== SOCIABLY_SERVICE_CONTAINER;

export const isContainerType = (
  node: SociablyElement<unknown, any>
): node is ContainerElement<unknown, ContainerComponent<unknown>> =>
  typeof node.type === 'function' &&
  node.type.$$typeof === SOCIABLY_SERVICE_CONTAINER;

export const isGeneralType = (
  node: SociablyElement<unknown, unknown>
): node is GeneralElement => typeof node.type === 'string';

export const isNativeType = <Component extends NativeComponent<unknown, any>>(
  node: SociablyElement<unknown, any>
): node is NativeElement<unknown, Component> =>
  typeof node.type === 'function' &&
  node.type.$$typeof === SOCIABLY_NATIVE_TYPE;

export const isElementTypeValid = (
  node: SociablyElement<unknown, unknown>
): boolean => {
  const { type } = node;
  return (
    typeof type === 'string' ||
    typeof type === 'function' ||
    type === SOCIABLY_FRAGMENT_TYPE ||
    type === SOCIABLY_PAUSE_TYPE ||
    type === SOCIABLY_PROVIDER_TYPE ||
    type === SOCIABLY_THUNK_TYPE ||
    type === SOCIABLY_RAW_TYPE
  );
};
