/* eslint-disable import/prefer-default-export */
import { unitSegment } from '@machinat/core/renderer';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../constant';
import { annotateLineComponent } from '../utils';

const LEAVE_API_CALLER = {
  [CHANNEL_API_CALL_GETTER]({ type, sourceId }) {
    if (type === 'user') {
      throw new TypeError(
        '<Leave /> should cannot be used within an user channel'
      );
    }

    return {
      method: 'POST',
      path: `v2/bot/${type}/${sourceId}/leave`,
      body: null,
    };
  },
  [BULK_API_CALL_GETTER]() {
    throw new Error('cannot <Leave/> using multicast api');
  },
};

export const Leave = (node, path) => [
  unitSegment(node, path, LEAVE_API_CALLER),
];

annotateLineComponent(Leave);
