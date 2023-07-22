/* eslint-disable import/prefer-default-export */
import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { SenderActionValue } from '../types.js';

const MARK_SEEN_VALUE = {
  type: 'message' as const,
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'mark_seen' as const },
};

export function MarkSeen(
  node: NativeElement<{}, AnyNativeComponent>,
  path: string
): UnitSegment<SenderActionValue>[] {
  return [makeUnitSegment(node, path, MARK_SEEN_VALUE)];
}
