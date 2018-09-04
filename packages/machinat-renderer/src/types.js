// @flow
import type {
  MachinatText,
  MachinatElement,
  MachinatElementType,
  MachinatNativeElement,
  MachinatGeneralElement,
} from 'types/element';

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
  createJobsFromRendered: (Array<RenderResult<Rendered>>) => Array<Job>,
};

export type RenderResult<Rendered> = {
  element: MachinatText | MachinatNativeElement | MachinatGeneralElement,
  rendered: Rendered,
  path: string,
};

export type RenderCallback = (
  MachinatElement<any>,
  string,
  any
) => ?Array<RenderResult<any>>;
