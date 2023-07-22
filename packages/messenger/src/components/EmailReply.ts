/* eslint-disable import/prefer-default-export */
import { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

const EMAIL_QUICK_REPLY_VALUES = { content_type: 'user_email' };

export function EmailReply(
  node: NativeElement<{}, AnyNativeComponent>,
  path: string
): PartSegment<{}>[] {
  return [makePartSegment(node, path, EMAIL_QUICK_REPLY_VALUES)];
}
