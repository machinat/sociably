/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { ENTRY_GETTER } from '../constant';
import { asUnitComponent } from '../utils';

const LEAVE_RENDERED = {
  [ENTRY_GETTER]({ type, sourceId }) {
    invariant(
      type !== 'user',
      '<Leave /> should be only used in a group or room channel'
    );

    return {
      method: 'POST',
      path: `v2/bot/${type}/${sourceId}/leave`,
    };
  },
};

const Leave = async () => LEAVE_RENDERED;

const __Leave = asUnitComponent(Leave);

export { __Leave as Leave };
