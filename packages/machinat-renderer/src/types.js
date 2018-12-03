// @flow
import type {
  MachinatNode,
  MachinatText,
  MachinatElement,
  MachinatElementType,
  MachinatNativeElement,
  MachinatGeneralElement,
} from 'types/element';
// eslint-disable-next-line import/prefer-default-export
export { default as JobSequence } from './jobSequence';

type RenderDelegateCallback<R, E> = (
  element: E,
  render: RenderInnerFn,
  payload: any,
  path: string
) => ?R;

export type RenderDelegate<R, J, N> = {
  isNativeComponent: MachinatElementType => boolean,
  renderNativeElement: RenderDelegateCallback<R, MachinatNativeElement<N>>,
  renderGeneralElement: RenderDelegateCallback<R, MachinatGeneralElement>,
  createJobsFromRendered: (Array<RenderResult<R, N>>, any) => Array<J>,
};

export type TextRendered = {|
  element: MachinatText,
  value: MachinatText,
  path: string,
|};

export type ElementRendered<R, N> = {|
  element: MachinatNativeElement<N> | MachinatGeneralElement,
  value: R,
  path: string,
|};

export type RawRendered = {|
  element: void,
  value: Object,
  path: string,
|};

export type RenderResult<R, N> =
  | TextRendered
  | ElementRendered<R, N>
  | RawRendered;

export type RenderInnerFn = (
  node: MachinatNode,
  path: string,
  payload: any
) => ?Array<RenderResult<any>>;

export type ImmediateEle = MachinatElement<Symbol>;
export type RenderResultBatch = Array<RenderResult<any, any>>;
export type BatchesAndSeparators = Array<RenderResultBatch | ImmediateEle>;
export type RenderTraverseContext<
  Acc: RenderResultBatch | BatchesAndSeparators
> = {
  payload: any,
  accumulates: Acc,
};
