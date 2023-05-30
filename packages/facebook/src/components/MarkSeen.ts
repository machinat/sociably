/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import { PATH_MESSAGES } from '../constant.js';
import type { FacebookComponent, SenderActionValue } from '../types.js';

const MARK_SEEN_VALUE = {
  type: 'message' as const,
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'mark_seen' as const },
};

/**
 * Display the confirmation icon.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const MarkSeen: FacebookComponent<
  {},
  UnitSegment<SenderActionValue>
> = makeFacebookComponent(function MarkSeen(node, path) {
  return [makeUnitSegment(node, path, MARK_SEEN_VALUE)];
});
