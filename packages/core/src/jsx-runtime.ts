import { SOCIABLY_FRAGMENT_TYPE } from './symbol.js';
import createElement from './createElement.js';
import type {
  ContainerComponent,
  FragmentProps,
  NativeComponent,
  SociablyElement,
  SociablyElementType,
  SociablyNode,
} from './types.js';

type ElementProps = Record<string, unknown> | null | undefined;
type JSXKey = string | number | bigint | boolean | null | undefined;

const attachKey = (props: ElementProps, key: JSXKey): ElementProps => {
  if (key === undefined) {
    return props;
  }

  return {
    ...(props || {}),
    key,
  };
};

const createJSXElement = (
  type: SociablyElementType,
  props: ElementProps,
  key: JSXKey,
): SociablyElement<unknown, unknown> =>
  createElement(type, attachKey(props, key));

export const Fragment = SOCIABLY_FRAGMENT_TYPE as unknown as (
  props: FragmentProps,
) => null;

export const jsx = (
  type: SociablyElementType,
  props: ElementProps,
  key?: JSXKey,
): SociablyElement<unknown, unknown> => createJSXElement(type, props, key);

export const jsxs = jsx;

export const jsxDEV = (
  type: SociablyElementType,
  props: ElementProps,
  key?: JSXKey,
): SociablyElement<unknown, unknown> => createJSXElement(type, props, key);

export namespace JSX {
  export type Element = SociablyElement<any, any>;
  export type ElementClass =
    | NativeComponent<any, any>
    | ContainerComponent<any>;

  export type ElementAttributesProperty = {
    $$typeof: object;
  };

  export type ElementChildrenAttribute = {
    children: object;
  };

  export type LibraryManagedAttributes<C, P> = C extends NativeComponent<
    infer T,
    any
  >
    ? T
    : C extends ContainerComponent<infer U>
    ? U
    : P;

  export interface IntrinsicAttributes {
    key?: JSXKey;
  }

  export type GeneralTextElementProps = {
    children?: SociablyNode;
  };

  export interface IntrinsicElements {
    br: object;
    b: GeneralTextElementProps;
    i: GeneralTextElementProps;
    s: GeneralTextElementProps;
    u: GeneralTextElementProps;
    code: GeneralTextElementProps;
    pre: GeneralTextElementProps;
  }
}
