/* eslint-disable import/prefer-default-export */
import type { NativeComponent } from '@machinat/core';
import { annotateNativeComponent } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer';
import type { EventInput } from '@machinat/websocket';
import { Event as _Event } from '@machinat/websocket';
import { WEBVIEW } from './constant';

/**
 * @category Component
 */
export const Event: NativeComponent<
  EventInput,
  UnitSegment<EventInput>
> = annotateNativeComponent(WEBVIEW)(_Event);
