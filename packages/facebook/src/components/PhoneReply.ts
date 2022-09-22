/* eslint-disable import/prefer-default-export */
import { makePartSegment, PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { FacebookComponent } from '../types';

const PHONE_QUICK_REPLY_VALUES = { content_type: 'user_phone_number' };

/**
 * Add an phone quick reply button after an {@link Expression}
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/quick-replies)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/quick-replies).
 */
export const PhoneReply: FacebookComponent<
  {},
  PartSegment<{}>
> = makeFacebookComponent(function PhoneReply(node, path) {
  return [makePartSegment(node, path, PHONE_QUICK_REPLY_VALUES)];
});
