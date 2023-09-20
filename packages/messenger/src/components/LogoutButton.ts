/* eslint-disable import/prefer-default-export */
import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

export const LogoutButton = function LogoutButton(
  node: NativeElement<{}, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
  return [makePartSegment(node, path, { type: 'account_unlink' })];
};
