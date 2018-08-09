/* eslint-disable no-use-before-define */
// @flow
export type MachinatNode =
  | MachinatEmpty
  | MachinatText
  | MachinatElement<any>
  | Iterable<MachinatNode>;

export type MachinatElementType =
  | string
  | Symbol
  | MachinatFunctionType
  | MachinatNativeType<any>;

export type MachinatElement<ElementType: MachinatElementType> = {
  $$typeof: string | Symbol,
  $$native: void | string | Symbol,
  type: ElementType,
  props: MachinatElementProps,
  async: boolean,
};

export type MachinatText = string | number;
export type MachinatEmpty = null | void | boolean;

export type MachinatElementProps = {
  children: MachinatChildren,
};

export type MachinatFunctionType = MachinatElementProps => MachinatNode;

export type MachinatNativeType<T> = {
  (MachinatElementProps): T,
  $$native: Symbol,
};

export type MachinatRenderable = MachinatText | MachinatElement<any>;

export type MachinatFragmentElement = MachinatElement<Symbol>;
export type MachinatNativeElement = MachinatElement<MachinatNativeType<any>>;
export type MachinatGeneralElement = MachinatElement<string>;

export type MachinatChildren = MachinatNode;
