/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import { LINE_NAITVE_TYPE, NO_BODY } from '../symbol';

export const LinkRichMenu = ({ id }) => [{ [NO_BODY]: true, id }];

annotate(
  asNative(LINE_NAITVE_TYPE),
  asUnit(true),
  hasEntry((thread, act) => {
    const { type, source } = thread;

    invariant(
      type === 'user',
      '<RichMenu /> should be only used in a user thread'
    );

    return `user/${source.userId}/richmenu/${act.id}`;
  })
)(LinkRichMenu);
