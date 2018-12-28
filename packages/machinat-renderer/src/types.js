// @flow
import type {
  MachinatNode,
  MachinatText,
  MachinatElementType,
  NativeElement,
  GeneralElement,
  SeparatorElement,
} from 'types/element';

type RenderDelegateCallback<Action, Element> = (
  element: Element,
  render: RenderInnerFn,
  payload: any,
  path: string
) => ?Action;

export type RenderDelegate<Action, Native> = {
  isNativeComponent: MachinatElementType => boolean,
  renderNativeElement: RenderDelegateCallback<Action, NativeElement<Native>>,
  renderGeneralElement: RenderDelegateCallback<Action, GeneralElement>,
};

export type TextRenderedAction = {|
  isSeparator: false,
  element: MachinatText,
  value: MachinatText,
  path: string,
|};

export type ElementRenderedAction<Action, Native> = {|
  isSeparator: false,
  element: NativeElement<Native> | GeneralElement,
  value: Action,
  path: string,
|};

export type RawRenderedAction = {|
  isSeparator: false,
  element: void,
  value: Object,
  path: string,
|};

export type SeparatorRenderedAction = {|
  isSeparator: true,
  element: SeparatorElement,
  value: void,
  path: string,
|};

export type InnerAction<Action, Native> =
  | TextRenderedAction
  | ElementRenderedAction<Action, Native>
  | RawRenderedAction;

export type RootAction<Action, Native> =
  | TextRenderedAction
  | ElementRenderedAction<Action, Native>
  | RawRenderedAction
  | SeparatorRenderedAction;

export type RenderInnerFn = (
  node: MachinatNode,
  path: string,
  payload: any
) => ?Array<InnerAction<any, any>>;
