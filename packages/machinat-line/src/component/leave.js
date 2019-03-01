/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import { LINE_NAITVE_TYPE, NO_RENDERED } from '../symbol';

import { hasBody } from './utils';

const LEAVE_RENDERED = [NO_RENDERED];

export const Leave = () => LEAVE_RENDERED;

annotate(
  asNative(LINE_NAITVE_TYPE),
  asUnit(true),
  hasBody(false),
  hasEntry(thread => {
    const { type, subtype, sourceId } = thread;

    invariant(
      type === 'chat' && subtype !== 'user',
      '<Leave /> should be only used in a group or room thread'
    );

    return `${subtype}/${sourceId}/leave`;
  })
)(Leave);
