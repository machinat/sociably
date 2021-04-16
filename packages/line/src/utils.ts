import { annotateNativeComponent } from '@machinat/core/renderer';
import type { LineSegmentValue, LineMessageSegmentValue } from './types';
import { LINE, CHANNEL_REQUEST_GETTER } from './constant';

export const annotateLineComponent = annotateNativeComponent(LINE);

export const isMessageValue = (
  value: string | LineSegmentValue
): value is string | LineMessageSegmentValue =>
  typeof value === 'string' ||
  (typeof value === 'object' &&
    !Object.prototype.hasOwnProperty.call(value, CHANNEL_REQUEST_GETTER));
