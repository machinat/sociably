import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent';
import { PATH_MESSAGES } from '../constant';
import type { MessengerComponent, SenderActionValue } from '../types';

const MARK_SEEN_VALUE = {
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'mark_seen' as const },
};

const TYPING_OFF_VALUE = {
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'typing_off' as const },
};

const TYPING_ON_VALUE = {
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'typing_on' as const },
};

/**
 * Display the confirmation icon.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const MarkSeen: MessengerComponent<
  {},
  UnitSegment<SenderActionValue>
> = makeFacebookComponent(function MarkSeen(node, path) {
  return [makeUnitSegment(node, path, MARK_SEEN_VALUE)];
});

/**
 * Display the typing bubble.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOn: MessengerComponent<
  {},
  UnitSegment<SenderActionValue>
> = makeFacebookComponent(function TypingOn(node, path) {
  return [makeUnitSegment(node, path, TYPING_ON_VALUE)];
});

/**
 * Remove the typing bubble.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOff: MessengerComponent<
  {},
  UnitSegment<SenderActionValue>
> = makeFacebookComponent(function TypingOff(node, path) {
  return [makeUnitSegment(node, path, TYPING_OFF_VALUE)];
});
