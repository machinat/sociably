import { makeNativeComponent } from '@machinat/core/renderer';
import type { LineMessageSegmentValue } from './types';
import { LINE, CHANNEL_REQUEST_GETTER } from './constant';

export const makeLineComponent = makeNativeComponent(LINE);

export const isMessageValue = (
  value: unknown
): value is string | LineMessageSegmentValue =>
  typeof value === 'string' ||
  (typeof value === 'object' &&
    value !== null &&
    !Object.prototype.hasOwnProperty.call(value, CHANNEL_REQUEST_GETTER));
