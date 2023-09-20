import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

/** @category Props */
export type PostbackButtonProps = {
  /** Button title. 20 character limit. */
  title: string;
  /** This data will be sent back to your webhook. 1000 character limit. */
  payload: string;
};

export function PostbackButton(
  node: NativeElement<PostbackButtonProps, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
  const { title, payload } = node.props;
  return [
    makePartSegment(node, path, {
      type: 'postback',
      title,
      payload,
    }),
  ];
}
