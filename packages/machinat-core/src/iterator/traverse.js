// @flow
import type { MachinatNode, FragmentElement } from '../types';

import { isElement, isFragmentElement, isEmpty } from '../utils/isXxx';
import type { TraverseNodeCallback } from './types';

const ITER_SEPARATOR = ':';

const traverse = <Context>(
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
  } else if (isElement(children) && isFragmentElement(children)) {
    if (children.props) {
      count += traverse(
        ((children: any): FragmentElement).props.children,
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

export default traverse;
