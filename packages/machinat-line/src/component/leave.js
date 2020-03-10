/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../constant';
import { asUnitComponent } from '../utils';

const LEAVE_API_CALLER = {
  [CHANNEL_API_CALL_GETTER]({ type, sourceId }) {
    invariant(
      type !== 'user',
      '<Leave /> should cannot be used within an user channel'
    );

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

const Leave = async () => LEAVE_API_CALLER;

const __Leave = asUnitComponent(Leave);

export { __Leave as Leave };
