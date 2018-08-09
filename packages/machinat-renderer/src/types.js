// @flow
import type {
  MachinatText,
  MachinatElement,
  MachinatNode,
  MachinatElementType,
  MachinatNativeElement,
  MachinatGeneralElement,
} from 'types/element';

type RenderDelegateCallback<Rendered> = (
  MachinatNativeElement,
  RenderCallback,
  string,
  any
) => ?Rendered;

export type RenderDelegate<Rendered, Job> = {
  isNativeElementType: MachinatElementType => boolean,
  renderNativeElement: RenderDelegateCallback<Rendered>,
  renderGeneralElement: RenderDelegateCallback<Rendered>,
  wrapRootMessagingJobs: (Array<RenderResult<Rendered>>) => Array<Job>,
};

export type RenderResult<Rendered> = {
  element: MachinatText | MachinatNativeElement | MachinatGeneralElement,
  rendered: Rendered,
};

export type RenderContext = {
  renderPath: string,
  payload: Object,
};

export type RenderCallback = (
  MachinatElement<any>,
  string,
  any
) => ?Array<RenderResult<any>>;
