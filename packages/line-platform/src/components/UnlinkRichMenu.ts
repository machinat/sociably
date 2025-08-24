/* eslint-disable import/prefer-default-export */
import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent.js';
import LineChat from '../Chat.js';
import { LineComponent, ChatActionSegmentValue } from '../types.js';

const UNLINK_RICHMENU_VALUE = {
  type: 'chat_action' as const,

  getChatRequest(thread: LineChat) {
    if (thread.type !== 'user') {
      throw new TypeError(
        '<UnlinkRichMenu /> can only be sent to an user chat',
      );
    }

    return {
      method: 'DELETE' as const,
      url: `v2/bot/user/${thread.id}/richmenu`,
      params: null,
    };
  },

  getBulkRequest(userIds: string[]) {
    return {
      method: 'POST' as const,
      url: 'v2/bot/richmenu/bulk/unlink',
      params: { userIds },
    };
  },
};

/**
 * Uninks the rich menu bound to one or multiple users.
 *
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
 *   and [reference](https://developers.line.biz/en/reference/messaging-api/#unlink-rich-menu-from-user).
 */
export const UnlinkRichMenu: LineComponent<
  {},
  UnitSegment<ChatActionSegmentValue>
> = makeLineComponent(function UnlinkRichMenu(node, path) {
  return [makeUnitSegment(node, path, UNLINK_RICHMENU_VALUE)];
});
