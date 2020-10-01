import { unitSegment } from '@machinat/core/renderer';
import type { UnitSegment } from '@machinat/core/renderer/types';
import { annotateMessengerComponent } from '../utils';
import type { MessengerComponent, SenderActionValue } from '../types';

/** @ignore */
const MARK_SEEN_VALUE = { sender_action: 'mark_seen' as const };

/** @ignore */
const TYPING_OFF_VALUE = { sender_action: 'typing_off' as const };

/** @ignore */
const TYPING_ON_VALUE = { sender_action: 'typing_on' as const };

/** @ignore */
const __MarkSeen = function MarkSeen(node, path) {
  return [unitSegment(node, path, MARK_SEEN_VALUE)];
};
/**
 * Display the confirmation icon.
 * @category Component
 * @props {@link LoginButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const MarkSeen: MessengerComponent<
  {},
  UnitSegment<SenderActionValue>
> = annotateMessengerComponent(__MarkSeen);

/** @ignore */
const __TypingOn = function TypingOn(node, path) {
  return [unitSegment(node, path, TYPING_ON_VALUE)];
};
/**
 * Display the typing bubble.
 * @category Component
 * @props {@link LoginButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOn: MessengerComponent<
  {},
  UnitSegment<SenderActionValue>
> = annotateMessengerComponent(__TypingOn);

/** @ignore */
const __TypingOff = function TypingOff(node, path) {
  return [unitSegment(node, path, TYPING_OFF_VALUE)];
};
/**
 * Remove the typing bubble.
 * @category Component
 * @props {@link LoginButtonProps}
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOff: MessengerComponent<
  {},
  UnitSegment<SenderActionValue>
> = annotateMessengerComponent(__TypingOff);
