/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { annotate, asNative, asUnit, hasEntry } from 'machinat-utility';

import { LINE_NAITVE_TYPE } from '../symbol';

export const LinkRichMenu = ({ id }) => [{ id }];

annotate(
  asNative(LINE_NAITVE_TYPE),
  asUnit(true),
  hasEntry((thread, act) => {
    const { type, subtype, source } = thread;

    invariant(
      type === 'chat' && subtype === 'user',
      '<RichMenu /> can only be delivered in a user chatting thread'
    );

    return `user/${source.userId}/richmenu/${act.id}`;
  })
)(LinkRichMenu);
