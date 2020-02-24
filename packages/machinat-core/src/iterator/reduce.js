// @flow
import type { MachinatNode } from '../types';
import type { NodeReducer } from './types';
import traverse from './traverse';

export type ReduceTraverseContext<Reduced, Payload> = {
  reduced: Reduced,
  reducer: NodeReducer<Reduced, Payload>,
  payload: Payload,
};

const reduceCallback = <Reduced, Payload>(
  child,
  path,
  context: ReduceTraverseContext<Reduced, Payload>
) => {
  const { reduced, reducer, payload } = context;
  context.reduced = reducer(reduced, child, path, payload);
};

const reduce = <Reduced, Payload>(
  children: MachinatNode,
  reducer: NodeReducer<Reduced, Payload>,
  initial: Reduced,
  prefix: string,
  payload: Payload
): Reduced => {
  if (children === undefined || children === null) {
    return initial;
  }

  const context: ReduceTraverseContext<Reduced, Payload> = {
    reduced: initial,
    reducer,
    payload,
  };
  traverse(children, prefix, context, reduceCallback);
  return context.reduced;
};

export default reduce;