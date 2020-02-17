// @flow
import type {
  MachinatNode,
  MachinatText,
  NativeElement,
  GeneralElement,
  PauseElement,
  ThunkElement,
  RawElement,
  ThunkEffectFn,
  PauseUntilFn,
} from '../types';

export type TextSegment = {|
  type: 'text',
  node: MachinatText | GeneralElement | NativeElement<any, any, any>,
  value: string,
  path: string,
|};

export type PartSegment<Value, Native> = {|
  type: 'part',
  node: GeneralElement | NativeElement<any, Value, Native>,
  value: Value,
  path: string,
|};

export type UnitSegment<Value, Native> = {|
  type: 'unit',
  node: GeneralElement | NativeElement<any, Value, Native>,
  value: Value,
  path: string,
|};

export type RawSegment<Value> = {|
  type: 'raw',
  node: RawElement,
  value: Value,
  path: string,
|};

export type PauseSegment = {|
  type: 'pause',
  node: PauseElement,
  value: null | PauseUntilFn,
  path: string,
|};

export type BreakSegment = {|
  type: 'break',
  node: GeneralElement | NativeElement<any, any, any>,
  value: void,
  path: string,
|};

export type ThunkSegment = {|
  type: 'thunk',
  node: ThunkElement,
  value: ThunkEffectFn,
  path: string,
|};

export type OutputableSegment<Value, Native> =
  | TextSegment
  | UnitSegment<Value, Native>
  | RawSegment<Value>
  | PauseSegment
  | ThunkSegment;

export type IntermediateSegment<Value, Native> =
  | OutputableSegment<Value, Native>
  | BreakSegment
  | PartSegment<Value, Native>;

export type InnerRenderFn<Value, Native> = (
  node: MachinatNode,
  path: string
) => Promise<null | IntermediateSegment<Value, Native>[]>;
