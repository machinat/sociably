// @flow
import warning from 'warning';
import type { MachinatNode, MachinatRenderable } from 'types/element';

import { isFragment, isEmpty, isValidRenderable, isImmediately } from './isXXX';
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
  if (isValidRenderable(children) || isImmediately(children)) {
    callback(
      (children: any),
      prefix.charAt(prefix.length - 1) === ':'
        ? `${prefix + ITER_SEPARATOR}0`
        : prefix,
      context
    );
    return 1;
  }

  let count = 0;
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      count += traverse(child, prefix + ITER_SEPARATOR + i, context, callback);
    }
  } else if (isFragment(children) && (children: any).props) {
    count += traverse(
      (children: any).props.children,
      prefix + ITER_SEPARATOR,
      context,
      callback
    );
  } else {
    warning(
      isEmpty(children),
      `invalid node ${(children: any)} in the element tree at position ${prefix}`
    );
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

const mapReducer: ElementReducer = (mappedArr, node, path, context) => {
  const { mapper, payload } = context;
  const mapped = mapper(node, path, payload);
  mappedArr.push(mapped);
  return mappedArr;
};
export const map = <Mapped>(
  children: MachinatNode,
  mapper: MachinatRenderable => Promise<Mapped>,
  prefix: string,
  payload: any
): ?Array<Mapped> => {
  const context = {
    mapper,
    payload,
  };
  const result = reduce(children, mapReducer, [], prefix, context);
  return result;
};

const identity: any = ele => ele;
export const toArray = (children: MachinatNode) => {
  if (children === undefined || children === null) {
    return [];
  }
  return map<MachinatNode>(children, identity, '');
};
