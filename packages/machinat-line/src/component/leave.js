/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { asUnitComponentWithEntryGetter } from './utils';

const LEAVE_RENDERED = [{}];

const Leave = () => LEAVE_RENDERED;

const __Leave = asUnitComponentWithEntryGetter(thread => {
  const { type, subtype, sourceId } = thread;

  invariant(
    type === 'chat' && subtype !== 'user',
    '<Leave /> should be only used in a group or room thread'
  );

  return `${subtype}/${sourceId}/leave`;
})(Leave);

export { __Leave as Leave };
