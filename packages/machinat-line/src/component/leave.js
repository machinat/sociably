/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import { LINE_NAITVE_TYPE, NO_BODY } from '../symbol';

const LEAVE_RENDERED = [{ [NO_BODY]: true }];

export const Leave = () => LEAVE_RENDERED;

annotate(
  asNative(LINE_NAITVE_TYPE),
  asUnit(true),
  // eslint-disable-next-line consistent-return
  hasEntry(thread => {
    const { type, source } = thread;

    switch (type) {
      case 'group':
        return `group/${source.groupId}/leave`;
      case 'room':
        return `room/${source.roomId}/leave`;
      default:
        invariant(
          false,
          '<Leave /> should be only used in a group or room thread'
        );
    }
  })
)(Leave);
