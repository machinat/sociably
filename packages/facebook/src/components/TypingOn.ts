/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import { PATH_MESSAGES } from '../constant.js';
import type { FacebookComponent, SenderActionValue } from '../types.js';

const TYPING_ON_VALUE = {
  type: 'message' as const,
  apiPath: PATH_MESSAGES,
  params: { sender_action: 'typing_on' as const },
};

/**
 * Display the typing bubble.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/sender-actions)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/send-api/).
 */
export const TypingOn: FacebookComponent<
  {},
  UnitSegment<SenderActionValue>
> = makeFacebookComponent(function TypingOn(node, path) {
  return [makeUnitSegment(node, path, TYPING_ON_VALUE)];
});
