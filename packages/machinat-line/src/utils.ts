import { annotateNativeComponent } from '@machinat/core/renderer';
import type {
  LineComponent,
  LineSegmentValue,
  LineMessageSegmentValue,
} from './types';
import { LINE, CHANNEL_API_CALL_GETTER } from './constant';

export const annotateLineComponent = annotateNativeComponent<LineComponent>(
  LINE
);

export const isMessageValue = (
  value: string | LineSegmentValue
): value is string | LineMessageSegmentValue =>
  typeof value === 'string' ||
  (typeof value === 'object' &&
    !Object.prototype.hasOwnProperty.call(value, CHANNEL_API_CALL_GETTER));
