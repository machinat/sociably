// @flow
import { annotateNativeComponent } from '@machinat/core/renderer';
import type { LineSegmentValue } from './types';
import { LINE, CHANNEL_API_CALL_GETTER } from './constant';

export const annotateLineComponent = annotateNativeComponent(LINE);

export const isMessageValue = (
  value: string | LineSegmentValue
): boolean %checks =>
  typeof value === 'string' ||
  (typeof value === 'object' &&
    !Object.prototype.hasOwnProperty.call(value, CHANNEL_API_CALL_GETTER));
