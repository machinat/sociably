import invariant from 'invariant';
import { CHANNEL_API_CALL_GETTER, BULK_API_CALL_GETTER } from '../constant';
import { asUnitComponent } from '../utils';

function linkRichMenuCall({ type, source }) {
  invariant(
    type === 'user',
    '<LinkRichMenu /> can only be delivered in a user chatting channel'
  );

  return {
    method: 'POST',
    path: `v2/bot/user/${source.userId}/richmenu/${this.id}`,
    body: null,
  };
}

function bulkLinkRichMenuCall(userIds) {
  return {
    method: 'POST',
    path: 'v2/bot/richmenu/bulk/link',
    body: {
      userIds,
      richMenuId: this.id,
    },
  };
}

const LinkRichMenu = async ({ id }) => ({
  id,
  [CHANNEL_API_CALL_GETTER]: linkRichMenuCall,
  [BULK_API_CALL_GETTER]: bulkLinkRichMenuCall,
});

const __LinkRichMenu = asUnitComponent(LinkRichMenu);

const UNLINK_RICHMENU_API_CALLER = {
  [CHANNEL_API_CALL_GETTER]({ type, source }) {
    invariant(
      type === 'user',
      '<UnlinkRichMenu /> can only be delivered in a user chatting channel'
    );

    return {
      method: 'DELETE',
      path: `v2/bot/user/${source.userId}/richmenu`,
      body: null,
    };
  },
  [BULK_API_CALL_GETTER](userIds) {
    return {
      method: 'POST',
      path: 'v2/bot/richmenu/bulk/unlink',
      body: { userIds },
    };
  },
};

const UnlinkRichMenu = async () => UNLINK_RICHMENU_API_CALLER;
const __UnlinkRichMenu = asUnitComponent(UnlinkRichMenu);

export { __LinkRichMenu as LinkRichMenu, __UnlinkRichMenu as UnlinkRichMenu };
