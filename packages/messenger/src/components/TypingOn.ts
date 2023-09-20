/* eslint-disable import/prefer-default-export */
import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import { PATH_MESSAGES } from '../constant.js';
import type { SenderActionValue } from '../types.js';

const TYPING_ON_VALUE = {
  type: 'message' as const,
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'typing_on' as const },
};

export function TypingOn(
  node: NativeElement<{}, AnyNativeComponent>,
  path: string,
): UnitSegment<SenderActionValue>[] {
  return [makeUnitSegment(node, path, TYPING_ON_VALUE)];
}
