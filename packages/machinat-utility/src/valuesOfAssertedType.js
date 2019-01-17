// @flow
import invariant from 'invariant';

import type { MachinatNode, MachinatNativeType } from 'types/element';
import type { RenderInnerFn, MachinatAction } from 'machinat-renderer/types';

import formatElement from './formatElement';

const getTagName = t => (typeof t === 'function' ? t.name : t);

const valuesOfAssertedType = <Rendered>(
  ...types: (string | MachinatNativeType)[]
) => (
  node: MachinatNode,
  render: RenderInnerFn,
  propPath: string
): void | Rendered[] => {
  const rendered = render(node, propPath);
  if (rendered === null) {
    return undefined;
  }

  const len = rendered.length;
  const values = new Array(len);

  for (let i = 0; i < len; i += 1) {
    const { element, value } = rendered[i];

    invariant(
      element === undefined ||
        (typeof element === 'object' && types.includes(element.type)),
      `${formatElement(element)} is invalid in ${propPath}, only <[${types
        .map(getTagName)
        .join(', ')}]/> allowed`
    );

    values[i] = value;
  }

  return values;
};

export default valuesOfAssertedType;
