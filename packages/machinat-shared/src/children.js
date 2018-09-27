// @flow
import type { MachinatNode, MachinatRenderable } from 'types/element';

import { isFragment, isEmpty } from './isXXX';
import type {
  TraverseElementCallback,
  ElementReducer,
  ReduceContext,
} from './types';

const ITER_SEPARATOR = ':';

export const traverse = (
  children: MachinatNode,
  prefix: string = '',
  context: any,
  callback: TraverseElementCallback
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
        children.props.children,
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

const reduceCallback: TraverseElementCallback = (
  child,
  path,
  context: ReduceContext<any>
) => {
  const { reduced, reducer, payload } = context;
  context.reduced = reducer(reduced, child, path, payload);
};

export const reduce = <Reduced>(
  children: MachinatNode,
  reducer: ElementReducer,
  initial: Reduced,
  prefix: string,
  payload: any
): ?Reduced => {
  if (children === undefined || children === null) {
    return children;
  }
  const context: ReduceContext<Reduced> = {
    reduced: initial,
    reducer,
    payload,
  };
  traverse(children, prefix, context, reduceCallback);
  return context.reduced;
};

const mapCallback: TraverseElementCallback = (
  child,
  path,
  context: ReduceContext<any>
) => {
  const { mapper, payload, mappedArray } = context;
  const mapped = mapper(child, path, payload);
  mappedArray.push(mapped);
};

export const map = <Mapped>(
  children: MachinatNode,
  mapper: MachinatRenderable => Promise<Mapped>,
  prefix: string,
  payload: any
): ?Array<Mapped> => {
  if (children === undefined || children === null) {
    return children;
  }

  const mappedArray = [];
  traverse(children, prefix, { mapper, payload, mappedArray }, mapCallback);
  return mappedArray;
};

const identity: any = ele => ele;
export const toArray = (children: MachinatNode) =>
  map<MachinatNode>(children, identity, '');
