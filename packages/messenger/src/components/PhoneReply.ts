/* eslint-disable import/prefer-default-export */
import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

const PHONE_QUICK_REPLY_VALUES = { content_type: 'user_phone_number' };

export function PhoneReply(
  node: NativeElement<{}, AnyNativeComponent>,
  path: string
): PartSegment<{}>[] {
  return [makePartSegment(node, path, PHONE_QUICK_REPLY_VALUES)];
}
