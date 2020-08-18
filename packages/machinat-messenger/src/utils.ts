import { annotateNativeComponent } from '@machinat/core/renderer';
import type {
  MessengerSegmentValue,
  MessageValue,
  SenderActionValue,
} from './types';
import { MESSENGER, ENTRY_PATH } from './constant';

const { hasOwnProperty } = Object.prototype;
export const isMessageEntry = (
  value: string | MessengerSegmentValue
): value is string | MessageValue | SenderActionValue =>
  typeof value === 'string' ||
  (typeof value === 'object' &&
    value !== null &&
    !hasOwnProperty.call(value, ENTRY_PATH));

export const annotateMessengerComponent = annotateNativeComponent(MESSENGER);
