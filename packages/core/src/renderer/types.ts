import type {
  MachinatNode,
  RawElement,
  ThunkEffectFn,
  PauseDelayFn,
} from '../types';

export type TextSegment = {
  type: 'text';
  node: MachinatNode;
  value: string;
  path: string;
};

export type PartSegment<Value> = {
  type: 'part';
  node: MachinatNode;
  value: Value;
  path: string;
};

export type UnitSegment<Value> = {
  type: 'unit';
  node: MachinatNode;
  value: Value;
  path: string;
};

export type RawSegment<Value> = {
  type: 'raw';
  node: RawElement;
  value: Value;
  path: string;
};

export type PauseSegment = {
  type: 'pause';
  node: MachinatNode;
  value: null | PauseDelayFn;
  path: string;
};

export type BreakSegment = {
  type: 'break';
  node: MachinatNode;
  value: null;
  path: string;
};

export type ThunkSegment = {
  type: 'thunk';
  node: MachinatNode;
  value: ThunkEffectFn;
  path: string;
};

export type OutputSegment<Value> =
  | TextSegment
  | UnitSegment<Value>
  | RawSegment<Value>
  | PauseSegment
  | ThunkSegment;

export type IntermediateSegment<UnitValue, PartValue = any> =
  | OutputSegment<UnitValue>
  | BreakSegment
  | PartSegment<PartValue>;

export type InnerRenderFn = <UnitValue, PartValue = any>(
  node: MachinatNode,
  path: string
) => Promise<null | IntermediateSegment<UnitValue, PartValue>[]>;
