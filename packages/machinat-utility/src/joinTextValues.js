// @flow
import invariant from 'invariant';
import { SEGMENT_BREAK } from 'machinat';
import type { MachinatNode } from 'machinat/types';
import type { RenderInnerFn } from 'machinat-renderer/types';

import formatNode from './formatNode';

const joinTextValues = (
  message: MachinatNode,
  render: RenderInnerFn,
  propPath: string
) => {
  const segments = render(message, propPath);
  if (segments === null) {
    return undefined;
  }

  const values: (string | Symbol)[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const { value } = segment;
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
        `${formatNode(segment.node)} at ${
          segment.path
        } is not rendered as text content`
      );
    }
  }

  return values;
};

export default joinTextValues;
