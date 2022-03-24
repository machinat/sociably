/* eslint-disable import/prefer-default-export */
import type { NativeComponent } from '@machinat/core';
import { UnitSegment, makeNativeComponent } from '@machinat/core/renderer';
import { EventInput, Event as _Event } from '@machinat/websocket';
import { WEBVIEW } from './constant';

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = makeNativeComponent(WEBVIEW)(_Event);
