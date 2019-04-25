// @flow
import invariant from 'invariant';

import type { MachinatNode } from 'machinat/types';
import type { RenderInnerFn, SegmentNativeType } from 'machinat-renderer/types';

import formatElement from './formatElement';

const getTagName = t => (typeof t === 'function' ? t.name : t);

const valuesOfAssertedType = <Value>(
  ...types: (string | SegmentNativeType<Value>)[]
) => (
  node: MachinatNode,
  render: RenderInnerFn,
  propPath: string
): void | Value[] => {
  const rendered = render(node, propPath);
  if (rendered === null) {
    return undefined;
  }

  const len = rendered.length;
  const values: Value[] = new Array(len);

  for (let i = 0; i < len; i += 1) {
    const { element, value } = rendered[i];

    invariant(
      element === undefined ||
        (typeof element === 'object' && types.includes(element.type)),
      `${formatElement(element)} is invalid in ${propPath}, only <[${types
        .map(getTagName)
        .join(', ')}]/> allowed`
    );

    // $FlowFixMe too complicated to refine value type, just allow it
    values[i] = value;
  }

  return values;
};

export default valuesOfAssertedType;
