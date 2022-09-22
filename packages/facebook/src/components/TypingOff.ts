/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { FacebookComponent, SenderActionValue } from '../types';

const TYPING_OFF_VALUE = {
  type: 'message' as const,
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'typing_off' as const },
};

/**
 * Remove the typing bubble.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOff: FacebookComponent<
  {},
  UnitSegment<SenderActionValue>
> = makeFacebookComponent(function TypingOff(node, path) {
  return [makeUnitSegment(node, path, TYPING_OFF_VALUE)];
});
