/* eslint-disable import/prefer-default-export */
import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { FacebookComponent } from '../types';

const EMAIL_QUICK_REPLY_VALUES = { content_type: 'user_email' };

/**
 * Add an e-amil quick reply button after an {@link Expression}
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const EmailReply: FacebookComponent<
  {},
  PartSegment<{}>
> = makeFacebookComponent(function EmailReply(node, path) {
  return [makePartSegment(node, path, EMAIL_QUICK_REPLY_VALUES)];
});
