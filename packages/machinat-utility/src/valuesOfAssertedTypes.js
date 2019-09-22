// @flow
import invariant from 'invariant';

import type { MachinatNativeComponent } from 'machinat/types';
import type { InnerSegment } from 'machinat-renderer/types';

import formatNode from './formatNode';

const getTagName = t => (typeof t === 'function' ? t.name : t);

const memoized = fn => {
  let firstTimeCalled = false;
  let result;

  return (...args) => {
    if (firstTimeCalled) {
      return result;
    }

    firstTimeCalled = true;
    result = fn(...args);
    return result;
  };
};

const valuesOfAssertedTypes = <Value>(
  getTypes: () => (string | MachinatNativeComponent<Value>)[]
) => {
  const memoizedGetTypes = memoized(getTypes);

  return (segments: null | InnerSegment<Value, any>[]): void | Value[] => {
    if (segments === null) {
      return undefined;
    }

    const len = segments.length;
    const values: Value[] = new Array(len);

    for (let i = 0; i < len; i += 1) {
      const { type, node, value, path } = segments[i];
      const allowedTypes = memoizedGetTypes();

      invariant(
        type === 'raw' ||
          (typeof node === 'object' && allowedTypes.includes(node.type)),
        `${formatNode(node)} at ${path} is invalid, only <[${allowedTypes
          .map(getTagName)
          .join(', ')}]/> allowed`
      );

      values[i] = (value: any);
    }

    return values;
  };
};

export default valuesOfAssertedTypes;
