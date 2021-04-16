import { makePartSegment, PartSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';
import { MessengerComponent } from '../types';

/**
 * @category Props
 */
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

const __TextReply = function TextReply(node, path) {
  const { title, payload, imageUrl } = node.props;
  return [
    makePartSegment(node, path, {
      content_type: 'text',
      title,
      payload,
      image_url: imageUrl,
    }),
  ];
};
/**
 * Add an text quick reply button with postback payload after an
 * {@link Expression}.
 * @category Component
 * @props {@link TextReplyProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const TextReply: MessengerComponent<
  TextReplyProps,
  PartSegment<any>
> = annotateMessengerComponent(__TextReply);

const PHONE_QUICK_REPLY_VALUES = { content_type: 'user_phone_number' };

const __PhoneReply = function PhoneReply(node, path) {
  return [makePartSegment(node, path, PHONE_QUICK_REPLY_VALUES)];
};
/**
 * Add an phone quick reply button after an {@link Expression}
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const PhoneReply: MessengerComponent<
  {},
  PartSegment<any>
> = annotateMessengerComponent(__PhoneReply);

const EMAIL_QUICK_REPLY_VALUES = { content_type: 'user_email' };

const __EmailReply = function EmailReply(node, path) {
  return [makePartSegment(node, path, EMAIL_QUICK_REPLY_VALUES)];
};
/**
 * Add an e-amil quick reply button after an {@link Expression}
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const EmailReply: MessengerComponent<
  {},
  PartSegment<any>
> = annotateMessengerComponent(__EmailReply);
