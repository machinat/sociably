/* eslint-disable import/prefer-default-export */
import invariant from 'invariant';
import { asSingleUnitComponentWithEntryGetter } from './utils';

const LinkRichMenu = async ({ props: { id } }) => ({ id });

const __LinkRichMenu = asSingleUnitComponentWithEntryGetter(
  (channel, value) => {
    const { type, subtype, source } = channel;

    invariant(
      type === 'chat' && subtype === 'user',
      '<RichMenu /> can only be delivered in a user chatting channel'
    );

    return `v2/bot/user/${source.userId}/richmenu/${value.id}`;
  }
)(LinkRichMenu);

export { __LinkRichMenu as LinkRichMenu };
