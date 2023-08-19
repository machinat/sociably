/* eslint-disable import/prefer-default-export */
import type { NativeComponent } from '@sociably/core';
import { UnitSegment, makeNativeComponent } from '@sociably/core/renderer';
import { EventInput, Event as WebSocketEvent } from '@sociably/websocket';
import { WEBVIEW } from './constant.js';

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = makeNativeComponent(WEBVIEW)(WebSocketEvent.$$render);
