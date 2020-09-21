import type {
  MachinatNode,
  RawElement,
  ThunkEffectFn,
  PauseUntilFn,
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
  value: null | PauseUntilFn;
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

export type OutputableSegment<Value> =
  | TextSegment
  | UnitSegment<Value>
  | RawSegment<Value>
  | PauseSegment
  | ThunkSegment;

export type IntermediateSegment<UnitValue, PartValue = any> =
  | OutputableSegment<UnitValue>
  | BreakSegment
  | PartSegment<PartValue>;

export type InnerRenderFn<Value> = (
  node: MachinatNode,
  path: string
) => Promise<null | IntermediateSegment<Value>[]>;

export type FunctionOf<Fn extends (...args: unknown[]) => unknown> = (
  ...args: Parameters<Fn>
) => ReturnType<Fn>;
