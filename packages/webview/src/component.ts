/* eslint-disable import/prefer-default-export */
import type { NativeComponent } from '@sociably/core';
import { UnitSegment, makeNativeComponent } from '@sociably/core/renderer';
import { EventInput, Event as _Event } from '@sociably/websocket';
import { WEBVIEW } from './constant';

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = makeNativeComponent(WEBVIEW)(_Event);
