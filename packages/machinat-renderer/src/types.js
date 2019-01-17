// @flow
import type {
  MachinatNode,
  MachinatText,
  MachinatElementType,
  NativeElement,
  GeneralElement,
  PauseElement,
} from 'types/element';

type RenderDelegateCallback<Rendered, Native, Element> = (
  element: Element,
  render: RenderInnerFn,
  payload: any,
  path: string
) => ?(MachinatAction<Rendered, Native>[]);

export type RenderDelegate<Rendered, Native> = {
  isNativeComponent: MachinatElementType => boolean,
  renderNativeElement: RenderDelegateCallback<
    Rendered,
    Native,
    NativeElement<Native>
  >,
  renderGeneralElement: RenderDelegateCallback<
    Rendered,
    Native,
    GeneralElement
  >,
};

export type TextRenderedAction = {|
  isPause: false,
  asUnit: true,
  element: MachinatText,
  value: MachinatText,
  path: string,
|};

export type ElementRenderedAction<Rendered, Element> = {|
  isPause: false,
  asUnit: boolean,
  element: Element,
  value: Rendered,
  path: string,
|};

export type RawAction = {|
  isPause: false,
  asUnit: true,
  element: void,
  value: Object,
  path: string,
|};

export type PauseAction = {|
  isPause: true,
  asUnit: true,
  element: PauseElement,
  value: void,
  path: string,
|};

export type MachinatAction<Rendered, Native> =
  | TextRenderedAction
  | ElementRenderedAction<Rendered, GeneralElement>
  | ElementRenderedAction<Rendered, NativeElement<Native>>
  | RawAction
  | PauseAction;

export type RenderInnerFn = (
  node: MachinatNode,
  path: string,
  payload: any
) => null | Array<MachinatAction<any, any>>;
