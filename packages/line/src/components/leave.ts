/* eslint-disable import/prefer-default-export */
import { unitSegment } from '@machinat/core/renderer';
import { CHANNEL_REQUEST_GETTER, BULK_REQUEST_GETTER } from '../constant';
import { annotateLineComponent } from '../utils';
import { LineComponent } from '../types';

const LEAVE_REQUESTER = {
  [CHANNEL_REQUEST_GETTER]({ type, id }) {
    if (type !== 'group' && type !== 'room') {
      throw new TypeError(
        '<Leave /> should cannot be used within an user channel'
      );
    }

    return {
      method: 'POST' as const,
      path: `v2/bot/${type}/${id}/leave`,
      body: null,
    };
  },
  [BULK_REQUEST_GETTER]() {
    throw new Error('cannot <Leave/> using multicast api');
  },
};

const __Leave = function Leave(node, path) {
  return [unitSegment(node, path, LEAVE_REQUESTER)];
};

/**
 * Leave a room or group. It throw when being sent to an user or by multicast.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/group-chats/).
 */
export const Leave: LineComponent<{}> = annotateLineComponent(__Leave);
