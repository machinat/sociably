import type {
  MachinatRenderable,
  RawElement,
  ThunkEffectFn,
  PauseUntilFn,
} from '../types';

export type TextSegment = {
  type: 'text';
  node: MachinatRenderable;
  value: string;
  path: string;
};

export type PartSegment<Value> = {
  type: 'part';
  node: MachinatRenderable;
  value: Value;
  path: string;
};

export type UnitSegment<Value> = {
  type: 'unit';
  node: MachinatRenderable;
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
  node: MachinatRenderable;
  value: null | PauseUntilFn;
  path: string;
};

export type BreakSegment = {
  type: 'break';
  node: MachinatRenderable;
  value: null;
  path: string;
};

export type ThunkSegment = {
  type: 'thunk';
  node: MachinatRenderable;
  value: ThunkEffectFn;
  path: string;
};

export type OutputableSegment<Value> =
  | TextSegment
  | UnitSegment<Value>
  | RawSegment<Value>
  | PauseSegment
  | ThunkSegment;

export type IntermediateSegment<Value> =
  | OutputableSegment<Value>
  | BreakSegment
  | PartSegment<Value>;

export type InnerRenderFn<Value> = (
  node: MachinatRenderable,
  path: string
) => Promise<null | IntermediateSegment<Value>[]>;
