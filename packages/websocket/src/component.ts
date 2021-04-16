/* eslint-disable import/prefer-default-export */
import {
  annotateNativeComponent,
  makeUnitSegment,
  UnitSegment,
} from '@machinat/core/renderer';
import type { NativeComponent } from '@machinat/core';
import { WEBSOCKET } from './constant';
import type { EventInput } from './types';

const __Event = function Event(node, path) {
  const { type, category, payload } = node.props;
  return [
    makeUnitSegment(node, path, {
      category,
      type,
      payload,
    }),
  ];
};

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = annotateNativeComponent(WEBSOCKET)(__Event);
