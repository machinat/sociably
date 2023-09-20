/* eslint-disable import/prefer-default-export */
import type { NativeComponent } from '@sociably/core';
import {
  makeNativeComponent,
  makeUnitSegment,
  UnitSegment,
} from '@sociably/core/renderer';
import { WEBSOCKET } from './constant.js';
import type { EventInput } from './types.js';

/** @category Component */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = makeNativeComponent(WEBSOCKET)(function Event(node, path) {
  const { type, category, payload } = node.props;
  return [
    makeUnitSegment(node, path, {
      category,
      type,
      payload,
    }),
  ];
});
