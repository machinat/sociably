// @flow
import invariant from 'invariant';

import type { GeneralElement, NativeElement } from 'machinat/types';
import type {
  TextSegment,
  BreakSegment,
  InnerSegment,
} from 'machinat-renderer/types';

import formatNode from './formatNode';

const joinTextualSegments = (
  segments: null | InnerSegment<any, any>[],
  node: GeneralElement | NativeElement<any>,
  path: string
): null | (TextSegment<any> | BreakSegment<any>)[] => {
  if (segments === null) {
    return null;
  }

  const joined: (TextSegment<any> | BreakSegment<any>)[] = [];
  let slot: void | TextSegment<any>;

  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];

    if (segment.type === 'text') {
      if (slot === undefined) {
        slot = segment;
        slot.node = node;
        slot.path = path;
      } else {
        slot.value += segment.value;
      }
    } else if (segment.type === 'break') {
      if (slot !== undefined) {
        joined.push(slot);
        slot = undefined;
      }

      joined.push(segment);
    } else {
      invariant(
        false,
        `${formatNode(segment.node)} at ${
          segment.path
        } is not valid textual content`
      );
    }
  }

  if (slot !== undefined) {
    joined.push(slot);
  }

  return joined;
};

export default joinTextualSegments;
