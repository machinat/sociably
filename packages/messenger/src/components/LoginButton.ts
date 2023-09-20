import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

/** @category Props */
export type LoginButtonProps = {
  /** Authentication callback URL. Must use HTTPS protocol. */
  url: string;
};

export function LoginButton(
  node: NativeElement<LoginButtonProps, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
  const { url } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'account_link',
      url,
    }),
  ];
}
