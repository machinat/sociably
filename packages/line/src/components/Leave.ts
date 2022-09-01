/* eslint-disable import/prefer-default-export */
import { makeUnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent';
import LineChat from '../Chat';
import { LineComponent } from '../types';

const LEAVE_REQUESTER = {
  type: 'chat_action' as const,
  getChatRequest({ type, id }: LineChat) {
    if (type !== 'group' && type !== 'room') {
      throw new TypeError('<Leave /> cannot be used within an user channel');
    }

    return {
      method: 'POST' as const,
      path: `v2/bot/${type}/${id}/leave`,
      body: null,
    };
  },
  getBulkRequest: null,
};

/**
 * Leave a room or group. It throw when being sent to an user or by multicast.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/group-chats/).
 */
export const Leave: LineComponent<{}> = makeLineComponent(function Leave(
  node,
  path
) {
  return [makeUnitSegment(node, path, LEAVE_REQUESTER)];
});
