// @flow
import typeof { SEGMENT_BREAK } from 'machinat';
import type {
  MachinatNode,
  MachinatText,
  MachinatNativeElement,
  MachinatGeneralElement,
  MachinatPause,
  MachinatConsumer,
  RenderThunkFn,
} from 'machinat/types';

export type TextSegment<Native> = {|
  type: 'text',
  node: MachinatText | MachinatGeneralElement | MachinatNativeElement<Native>,
  value: string,
  path: string,
|};

export type PartSegment<Value, Native> = {|
  type: 'part',
  node: MachinatGeneralElement | MachinatNativeElement<Native>,
  value: Value,
  path: string,
|};

export type UnitSegment<Value, Native> = {|
  type: 'unit',
  node: MachinatGeneralElement | MachinatNativeElement<Native>,
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
  node: MachinatPause,
  value: void,
  path: string,
|};

export type BreakSegment<Native> = {|
  type: 'break',
  node: MachinatGeneralElement | MachinatNativeElement<Native>,
  value: SEGMENT_BREAK,
  path: string,
|};

export type ThunkSegment = {|
  type: 'thunk',
  node: MachinatConsumer<any, any>,
  value: RenderThunkFn,
  path: string,
|};

export type MachinatSegment<Value, Native> =
  | TextSegment<Native>
  | UnitSegment<Value, Native>
  | RawSegment<Value>
  | PauseSegment
  | ThunkSegment;

export type InnerSegment<Value, Native> =
  | MachinatSegment<Value, Native>
  | BreakSegment<Native>
  | PartSegment<Value, Native>;

export type RenderInnerFn<Value, Native> = (
  node: MachinatNode,
  path: string
) => Promise<null | InnerSegment<Value, Native>[]>;
