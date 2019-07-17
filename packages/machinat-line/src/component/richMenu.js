import invariant from 'invariant';
import { ENTRY_GETTER } from '../constant';
import { asUnitComponent } from '../utils';

function getLinkRichMenuEntry({ type, subtype, source }) {
  invariant(
    type === 'chat' && subtype === 'user',
    '<RichMenu /> can only be delivered in a user chatting channel'
  );

  return {
    method: 'POST',
    path: `v2/bot/user/${source.userId}/richmenu/${this.id}`,
  };
}

const LinkRichMenu = async ({ props: { id } }) => ({
  id,
  [ENTRY_GETTER]: getLinkRichMenuEntry,
});
const __LinkRichMenu = asUnitComponent(LinkRichMenu);

function getUnlinkRichMenuEntry({ type, subtype, source }) {
  invariant(
    type === 'chat' && subtype === 'user',
    '<UnlinkRichMenu /> can only be delivered in a user chatting channel'
  );

  return {
    method: 'DELETE',
    path: `v2/bot/user/${source.userId}/richmenu/${this.id}`,
  };
}

const UnlinkRichMenu = async ({ props: { id } }) => ({
  id,
  [ENTRY_GETTER]: getUnlinkRichMenuEntry,
});
const __UnlinkRichMenu = asUnitComponent(UnlinkRichMenu);

export { __LinkRichMenu as LinkRichMenu, __UnlinkRichMenu as UnlinkRichMenu };
