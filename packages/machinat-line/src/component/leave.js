/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { asSingleUnitComponentWithEntryGetter } from './utils';

const LEAVE_RENDERED = {};

const Leave = async () => LEAVE_RENDERED;

const __Leave = asSingleUnitComponentWithEntryGetter(channel => {
  const { type, subtype, sourceId } = channel;

  invariant(
    type === 'chat' && subtype !== 'user',
    '<Leave /> should be only used in a group or room channel'
  );

  return `${subtype}/${sourceId}/leave`;
})(Leave);

export { __Leave as Leave };
