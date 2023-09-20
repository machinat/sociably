import type { NativeElement, AnyNativeComponent } from '@sociably/core';
import { makePartSegment, PartSegment } from '@sociably/core/renderer';

/** @category Props */
export type TextReplyProps = {
  /** The text to display on the quick reply button. 20 character limit. */
  title: string;
  /**
   * Custom data that will be sent back to you via the messaging_postbacks
   * webhook event. 1000 character limit.
   */
  payload: string;
  /**
   * URL of image to display on the quick reply button for text quick replies.
   * Image should be a minimum of 24px x 24px. Larger images will be
   * automatically cropped and resized. Required if title is an empty string.
   */
  imageUrl?: string;
};

export function TextReply(
  node: NativeElement<TextReplyProps, AnyNativeComponent>,
  path: string,
): PartSegment<{}>[] {
  const { title, payload, imageUrl } = node.props;
  return [
    makePartSegment(node, path, {
      content_type: 'text',
      title,
      payload,
      image_url: imageUrl,
    }),
  ];
}
