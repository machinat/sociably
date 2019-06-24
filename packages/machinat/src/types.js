// @flow
/* eslint-disable no-use-before-define */
import type { MachinatNativeComponent } from 'machinat-renderer/types';

export type MachinatNode =
  | MachinatEmpty
  | MachinatText
  | MachinatElement<any>
  | Array<MachinatNode>;

export type MachinatElementType =
  | string
  | Symbol
  | MachinatComponentType
  | MachinatNativeComponent<any>;

export type MachinatElement<ElementType: MachinatElementType> = {|
  $$typeof: Symbol,
  type: ElementType,
  props: MachinatElementProps,
|};

export type MachinatText = string | number;
export type MachinatEmpty = null | void | boolean;

export type MachinatElementProps = {|
  children: MachinatChildren,
  [string]: any,
|};

export type MachinatComponentType = MachinatElementProps => MachinatNode;

export type MachinatRenderable = MachinatText | MachinatElement<any>;

export type FragmentElement = MachinatElement<Symbol>;
export type NativeElement<
  Native: MachinatNativeComponent<any>
> = MachinatElement<Native>;
export type GeneralElement = MachinatElement<string>;
export type PauseElement = MachinatElement<Symbol>;

export type MachinatChildren = MachinatNode;
