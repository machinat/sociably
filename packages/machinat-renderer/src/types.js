// @flow
import type {
  MachinatNode,
  MachinatText,
  MachinatElementProps,
  NativeElement,
  GeneralElement,
  PauseElement,
} from 'machinat/types';

export type ContainerNativeType<Value> = {
  (
    props: MachinatElementProps,
    render: RenderInnerFn
  ): null | MachinatSegment<Value, any>[],
  $$native: Symbol,
  $$unit: boolean,
  $$container: true,
};

export type SegmentNativeType<Value> = {
  (props: MachinatElementProps, render: RenderInnerFn): null | Value[],
  $$native: Symbol,
  $$unit: boolean,
  $$container: false,
};

export type MachinatNativeType<Value> =
  | ContainerNativeType<Value>
  | SegmentNativeType<Value>
  | SegmentNativeType<string>;

export type TextSegment = {|
  isPause: false,
  asUnit: true,
  node: MachinatText,
  value: string,
  path: string,
|};

export type ElementSegment<Value, Native> = {|
  isPause: false,
  asUnit: boolean,
  node: GeneralElement | NativeElement<Native>,
  value: string | Value,
  path: string,
|};

export type RawSegment<Value> = {|
  isPause: false,
  asUnit: true,
  node: void,
  value: Value,
  path: string,
|};

export type PauseSegment = {|
  isPause: true,
  asUnit: true,
  node: PauseElement,
  value: void,
  path: string,
|};

export type MachinatSegment<Value, Native> =
  | TextSegment
  | ElementSegment<Value, Native>
  | RawSegment<Value>
  | PauseSegment;

export type RenderInnerFn = (
  node: MachinatNode,
  path: string,
  payload: any
) => null | Array<MachinatSegment<any, any>>;
