// @flow
import invariant from 'invariant';

import type { MachinatNode } from 'machinat/types';
import type { RenderInnerFn, SegmentNativeType } from 'machinat-renderer/types';

import formatNode from './formatNode';

const getTagName = t => (typeof t === 'function' ? t.name : t);

const valuesOfAssertedType = <Value>(
  ...types: (string | SegmentNativeType<Value>)[]
) => (
  message: MachinatNode,
  render: RenderInnerFn,
  propPath: string
): void | Value[] => {
  const rendered = render(message, propPath);
  if (rendered === null) {
    return undefined;
  }

  const len = rendered.length;
  const values: Value[] = new Array(len);

  for (let i = 0; i < len; i += 1) {
    const { node, value } = rendered[i];

    invariant(
      node === undefined ||
        (typeof node === 'object' && types.includes(node.type)),
      `${formatNode(node)} is invalid in ${propPath}, only <[${types
        .map(getTagName)
        .join(', ')}]/> allowed`
    );

    // $FlowFixMe too complicated to refine value type, just allow it
    values[i] = value;
  }

  return values;
};

export default valuesOfAssertedType;
