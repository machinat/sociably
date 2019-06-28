// @flow
import invariant from 'invariant';

import type { MachinatNativeComponent } from 'machinat/types';
import type { InnerSegment } from 'machinat-renderer/types';

import formatNode from './formatNode';

const getTagName = t => (typeof t === 'function' ? t.name : t);

const valuesOfAssertedType = <Value>(
  ...types: (string | MachinatNativeComponent<Value>)[]
) => {
  const allowed = new Set(types);

  return (segments: null | InnerSegment<Value, any>[]): void | Value[] => {
    if (segments === null) {
      return undefined;
    }

    const len = segments.length;
    const values: Value[] = new Array(len);

    for (let i = 0; i < len; i += 1) {
      const { type, node, value, path } = segments[i];

      invariant(
        type === 'raw' || (typeof node === 'object' && allowed.has(node.type)),
        `${formatNode(node)} at ${path} is invalid, only <[${types
          .map(getTagName)
          .join(', ')}]/> allowed`
      );

      values[i] = (value: any);
    }

    return values;
  };
};

export default valuesOfAssertedType;
