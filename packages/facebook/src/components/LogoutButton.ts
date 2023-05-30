/* eslint-disable import/prefer-default-export */
import { makePartSegment } from '@sociably/core/renderer';
import type { PartSegment } from '@sociably/core/renderer';
import makeFacebookComponent from '../utils/makeFacebookComponent.js';
import type { FacebookComponent } from '../types.js';

/**
 * The log out button triggers the account unlinking flow.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.facebook.com/docs/messenger-platform/send-messages/buttons#game_play)
 *   and [reference](https://developers.facebook.com/docs/messenger-platform/reference/buttons/game-play).
 */
export const LogoutButton: FacebookComponent<
  {},
  PartSegment<{}>
> = makeFacebookComponent(function LogoutButton(node, path) {
  return [makePartSegment(node, path, { type: 'account_unlink' })];
});
