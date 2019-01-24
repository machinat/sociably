// @flow
import type {
  MachinatNode,
  MachinatText,
  MachinatElementProps,
  NativeElement,
  GeneralElement,
  PauseElement,
} from 'machinat/types';

export type ContainerNativeType<Rendered> = {
  (
    props: MachinatElementProps,
    render: RenderInnerFn
  ): null | MachinatAction<Rendered, any>[],
  $$native: Symbol,
  $$unit: boolean,
  $$container: true,
};

export type ValuesNativeType<Rendered> = {
  (props: MachinatElementProps, render: RenderInnerFn): null | Rendered[],
  $$native: Symbol,
  $$unit: boolean,
  $$container: false,
};

export type MachinatNativeType<Rendered> =
  | ContainerNativeType<Rendered>
  | ValuesNativeType<Rendered>
  | ValuesNativeType<string>;

export type TextRenderedAction = {|
  isPause: false,
  asUnit: true,
  element: MachinatText,
  value: string,
  path: string,
|};

export type ElementRenderedAction<Rendered, Native> = {|
  isPause: false,
  asUnit: boolean,
  element: GeneralElement | NativeElement<Native>,
  value: string | Rendered,
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
  | ElementRenderedAction<Rendered, Native>
  | RawAction
  | PauseAction;

export type RenderInnerFn = (
  node: MachinatNode,
  path: string,
  payload: any
) => null | Array<MachinatAction<any, any>>;
