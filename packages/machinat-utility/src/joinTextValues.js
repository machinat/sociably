// @flow
import invariant from 'invariant';
import { SEGMENT_BREAK } from 'machinat-symbol';
import type { MachinatNode } from 'machinat/types';
import type { RenderInnerFn } from 'machinat-renderer/types';

import formatElement from './formatElement';

const joinTextValues = (
  node: MachinatNode,
  render: RenderInnerFn,
  propPath: string
) => {
  const actions = render(node, propPath);
  if (actions === null) {
    return undefined;
  }

  const values: (string | Symbol)[] = [];

  for (let i = 0; i < actions.length; i += 1) {
    const action = actions[i];
    const { value } = action;
    const len = values.length;

    if (typeof value === 'string') {
      const lastValue = values[len - 1];

      if (len === 0 || typeof lastValue !== 'string') {
        values.push(String(value));
      } else {
        values[len - 1] = lastValue + value;
      }
    } else if (value === SEGMENT_BREAK) {
      values.push(SEGMENT_BREAK);
    } else {
      invariant(
        false,
        `${formatElement(action.element)} at ${
          action.path
        } is not rendered as text content`
      );
    }
  }

  return values;
};

export default joinTextValues;
