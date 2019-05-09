/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { asSingleUnitComponentWithEntryGetter } from './utils';

const LinkRichMenu = ({ props: { id } }) => ({ id });

const __LinkRichMenu = asSingleUnitComponentWithEntryGetter((thread, act) => {
  const { type, subtype, source } = thread;

  invariant(
    type === 'chat' && subtype === 'user',
    '<RichMenu /> can only be delivered in a user chatting thread'
  );

  return `user/${source.userId}/richmenu/${act.id}`;
})(LinkRichMenu);

export { __LinkRichMenu as LinkRichMenu };
