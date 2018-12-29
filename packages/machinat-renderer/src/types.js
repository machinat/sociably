// @flow
import type {
  MachinatNode,
  MachinatText,
  MachinatElementType,
  NativeElement,
  GeneralElement,
  PauseElement,
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
  isPause: false,
  element: MachinatText,
  value: MachinatText,
  path: string,
|};

export type ElementRenderedAction<Action, Native> = {|
  isPause: false,
  element: NativeElement<Native> | GeneralElement,
  value: Action,
  path: string,
|};

export type RawRenderedAction = {|
  isPause: false,
  element: void,
  value: Object,
  path: string,
|};

export type PauseRenderedAction = {|
  isPause: true,
  element: PauseElement,
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
  | PauseRenderedAction;

export type RenderInnerFn = (
  node: MachinatNode,
  path: string,
  payload: any
) => ?Array<InnerAction<any, any>>;
