/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { GET_API_PATH } from '../symbol';

const LEAVE = {
  // eslint-disable-next-line consistent-return
  [GET_API_PATH]: thread => {
    const { type, groupId, roomId } = thread;

    switch (type) {
      case 'group':
        return `group/${groupId}/leave`;
      case 'room':
        return `room/${roomId}/leave`;
      default:
        invariant(
          false,
          '<Leave /> should be only used in a group or room thread'
        );
    }
  },
};

export const Leave = () => LEAVE;
