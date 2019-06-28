// @flow
import type { MachinatNode, MachinatFragment } from 'machinat/types';

import { isFragment, isEmpty } from './isX';
import type { TraverseNodeCallback, NodeReducer, NodeMapper } from './types';

const ITER_SEPARATOR = ':';

export type ReduceTraverseContext<Reduced, Payload> = {
  reduced: Reduced,
  reducer: NodeReducer,
  payload: Payload,
};

export type MapTraverseContext<Mapped, Payload> = {
  mappedArray: Array<Mapped>,
  mapper: NodeMapper,
  payload: Payload,
};

export const traverse = <Context>(
  children: MachinatNode,
  prefix: string = '',
  context: Context,
  callback: TraverseNodeCallback<Context>
): number => {
  let count = 0;
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      count += traverse(child, prefix + ITER_SEPARATOR + i, context, callback);
    }
  } else if (isFragment(children)) {
    if (children.props) {
      count += traverse(
        ((children: any): MachinatFragment).props.children,
        prefix + ITER_SEPARATOR,
        context,
        callback
      );
    }
  } else if (!isEmpty(children)) {
    callback(
      children,
      prefix.charAt(prefix.length - 1) === ':'
        ? `${prefix + ITER_SEPARATOR}0`
        : prefix,
      context
    );
    return 1;
  }

  return count;
};

const reduceCallback = <Reduced, Payload>(
  child,
  path,
  context: ReduceTraverseContext<Reduced, Payload>
) => {
  const { reduced, reducer, payload } = context;
  context.reduced = reducer(reduced, child, path, payload);
};

export const reduce = <Reduced, Payload>(
  children: MachinatNode,
  reducer: NodeReducer,
  initial: Reduced,
  prefix: string,
  payload: Payload
): ?Reduced => {
  if (children === undefined || children === null) {
    return children;
  }
  const context: ReduceTraverseContext<Reduced, Payload> = {
    reduced: initial,
    reducer,
    payload,
  };
  traverse(children, prefix, context, reduceCallback);
  return context.reduced;
};

const mapCallback = <Mapped, Payload>(
  child,
  path,
  context: MapTraverseContext<Mapped, Payload>
) => {
  const { mapper, payload, mappedArray } = context;
  const mapped = mapper(child, path, payload);
  mappedArray.push(mapped);
};

export const map = <Mapped, Payload>(
  children: MachinatNode,
  mapper: NodeMapper,
  prefix: string,
  payload: any
): ?Array<Mapped> => {
  if (children === undefined || children === null) {
    return children;
  }

  const context: MapTraverseContext<Mapped, Payload> = {
    mapper,
    payload,
    mappedArray: [],
  };

  traverse(children, prefix, context, mapCallback);
  return context.mappedArray;
};

const identity: any = ele => ele;
export const toArray = (children: MachinatNode) =>
  map<MachinatNode, void>(children, identity, '');
