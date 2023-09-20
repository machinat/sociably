import type {
  SociablyNode,
  RawElement,
  ThunkEffectFn,
  PauseDelayFn,
} from '../types.js';

export type TextSegment = {
  type: 'text';
  node: SociablyNode;
  value: string;
  path: string;
};

export type PartSegment<Value> = {
  type: 'part';
  node: SociablyNode;
  value: Value;
  path: string;
};

export type UnitSegment<Value> = {
  type: 'unit';
  node: SociablyNode;
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
  node: SociablyNode;
  value: null | PauseDelayFn;
  path: string;
};

export type BreakSegment = {
  type: 'break';
  node: SociablyNode;
  value: null;
  path: string;
};

export type ThunkSegment = {
  type: 'thunk';
  node: SociablyNode;
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
  node: SociablyNode,
  path: string,
) => Promise<null | IntermediateSegment<UnitValue, PartValue>[]>;
