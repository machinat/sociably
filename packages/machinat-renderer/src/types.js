// @flow
import typeof { SEGMENT_BREAK, MACHINAT_ELEMENT_TYPE } from 'machinat';
import type {
  MachinatNode,
  MachinatText,
  NativeElement,
  GeneralElement,
  PauseElement,
} from 'machinat/types';

export type TextSegment<Native> = {|
  type: 'text',
  node: MachinatText | GeneralElement | NativeElement<Native>,
  value: string,
  path: string,
|};

export type PartSegment<Value, Native> = {|
  type: 'part',
  node: GeneralElement | NativeElement<Native>,
  value: Value,
  path: string,
|};

export type UnitSegment<Value, Native> = {|
  type: 'unit',
  node: GeneralElement | NativeElement<Native>,
  value: Value,
  path: string,
|};

export type RawSegment<Value> = {|
  type: 'raw',
  node: void,
  value: Value,
  path: string,
|};

export type PauseSegment = {|
  type: 'pause',
  node: PauseElement,
  value: void,
  path: string,
|};

export type BreakSegment<Native> = {|
  type: 'break',
  node: GeneralElement | NativeElement<Native>,
  value: SEGMENT_BREAK,
  path: string,
|};

export type MachinatSegment<Value, Native> =
  | TextSegment<Native>
  | UnitSegment<Value, Native>
  | RawSegment<Value>
  | PauseSegment;

export type InnerSegment<Value, Native> =
  | MachinatSegment<Value, Native>
  | BreakSegment<Native>
  | PartSegment<Value, Native>;

export type RenderInnerFn<Value, Native> = (
  node: MachinatNode,
  path: string
) => null | Array<InnerSegment<Value, Native>>;

export type MachinatNativeComponent<Value> = {
  (
    element: NativeElement<MachinatNativeComponent<Value>>,
    render: RenderInnerFn<Value, MachinatNativeComponent<Value>>,
    path: string
  ): null | InnerSegment<Value, MachinatNativeComponent<Value>>[],
  $$native: MACHINAT_ELEMENT_TYPE,
  $$namespace: string,
};
