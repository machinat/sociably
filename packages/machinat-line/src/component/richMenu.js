/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import { LINE_NAITVE_TYPE, NO_BODY } from '../symbol';

import { hasBody } from './utils';

export const LinkRichMenu = ({ id }) => [{ id }];

annotate(
  asNative(LINE_NAITVE_TYPE),
  asUnit(true),
  hasBody(false),
  hasEntry((thread, act) => {
    const { type, source } = thread;

    invariant(
      type === 'user',
      '<RichMenu /> should be only used in a user thread'
    );

    return `user/${source.userId}/richmenu/${act.id}`;
  })
)(LinkRichMenu);
