import type { SociablyNode } from '../types.js';
import { isElement, isFragmentType, isEmpty } from '../utils/isX.js';
import type { TraverseNodeCallback } from './types.js';

const ITER_SEPARATOR = ':';

const traverse = <Context>(
  children: SociablyNode,
  prefix: string,
  context: Context,
  callback: TraverseNodeCallback<Context>
): number => {
  let count = 0;
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i += 1) {
      const child = children[i];
      count += traverse(child, prefix + ITER_SEPARATOR + i, context, callback);
    }
  } else if (isElement(children) && isFragmentType(children)) {
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

export default traverse;
