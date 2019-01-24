/* eslint-disable no-use-before-define */
// @flow
import type { MachinatNativeType } from 'machinat-renderer/types';

export type MachinatNode =
  | MachinatEmpty
  | MachinatText
  | MachinatElement<any>
  | Iterable<MachinatNode>;

export type MachinatElementType =
  | string
  | Symbol
  | MachinatComponentType
  | MachinatNativeType<any>;

export type MachinatElement<ElementType: MachinatElementType> = {
  $$typeof: string | Symbol,
  type: ElementType,
  props: MachinatElementProps,
};

export type MachinatText = string | number;
export type MachinatEmpty = null | void | boolean;

export type MachinatElementProps = {
  children: MachinatChildren,
  [string]: any,
};

export type MachinatComponentType = MachinatElementProps => MachinatNode;

export type MachinatRenderable = MachinatText | MachinatElement<any>;

export type FragmentElement = MachinatElement<Symbol>;
export type NativeElement<
  Native: MachinatNativeType<any>
> = MachinatElement<Native>;
export type GeneralElement = MachinatElement<string>;
export type PauseElement = MachinatElement<Symbol>;

export type MachinatChildren = MachinatNode;
