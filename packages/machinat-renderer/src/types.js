// @flow
import type {
  MachinatText,
  MachinatElement,
  MachinatElementType,
  MachinatNativeElement,
  MachinatGeneralElement,
} from 'types/element';
// eslint-disable-next-line import/prefer-default-export
export { default as JobSequence } from './jobSequence';

type RenderDelegateCallback<Rendered> = (
  MachinatNativeElement,
  RenderCallback,
  any,
  string
) => ?Rendered;

export type RenderDelegate<Rendered, Job> = {
  isNativeComponent: MachinatElementType => boolean,
  renderNativeElement: RenderDelegateCallback<Rendered>,
  renderGeneralElement: RenderDelegateCallback<Rendered>,
  createJobsFromRendered: (Array<RenderResult<Rendered>>, any) => Array<Job>,
};

export type RenderResult<Rendered> = {
  element: void | MachinatText | MachinatNativeElement | MachinatGeneralElement,
  value: Rendered,
  path: string,
};

export type RenderCallback = (
  MachinatElement<any>,
  string,
  any
) => ?Array<RenderResult<any>>;

export type ImmediateEle = MachinatElement<Symbol>;
export type RenderResultBatch = Array<RenderResult<any>>;
export type BatchesAndSeparators = Array<RenderResultBatch | ImmediateEle>;
export type RenderTraverseContext<
  Acc: RenderResultBatch | BatchesAndSeparators
> = {
  payload: any,
  accumulates: Acc,
};
