import { makeUnitSegment, UnitSegment } from '@machinat/core/renderer';
import { annotateMessengerComponent } from '../utils';
import type { MessengerComponent, SenderActionValue } from '../types';

const MARK_SEEN_VALUE = { sender_action: 'mark_seen' as const };

const TYPING_OFF_VALUE = { sender_action: 'typing_off' as const };

const TYPING_ON_VALUE = { sender_action: 'typing_on' as const };

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
> = annotateMessengerComponent(function MarkSeen(node, path) {
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
> = annotateMessengerComponent(function TypingOn(node, path) {
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
> = annotateMessengerComponent(function TypingOff(node, path) {
  return [makeUnitSegment(node, path, TYPING_OFF_VALUE)];
});
