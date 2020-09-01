import { unitSegment } from '@machinat/core/renderer';
import { CHANNEL_REQUEST_GETTER, BULK_REQUEST_GETTER } from '../constant';
import { annotateLineComponent } from '../utils';
import { LineComponent } from '../types';

/**
 * @category Props
 */
type LinkRichMenuProps = {
  /** ID of a rich menu. */
  id: string;
};

/** @internal */
const __LinkRichMenu = function LinkRichMenu(node, path) {
  return [
    unitSegment(node, path, {
      id: node.props.id,
      [CHANNEL_REQUEST_GETTER](channel) {
        if (channel.type !== 'utob') {
          throw new TypeError(
            '<LinkRichMenu /> can only be delivered in a utob chatting channel'
          );
        }

        return {
          method: 'POST' as const,
          path: `v2/bot/user/${channel.id}/richmenu/${this.id}`,
          body: null,
        };
      },
      [BULK_REQUEST_GETTER](userIds) {
        return {
          method: 'POST' as const,
          path: 'v2/bot/richmenu/bulk/link',
          body: {
            userIds,
            richMenuId: this.id,
          },
        };
      },
    }),
  ];
};
/**
 * Links a rich menu to one or multiple users.
 * @category Component
 * @props {@link LinkRichMenuProps}
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
 *   and [reference](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user).
 */
export const LinkRichMenu: LineComponent<LinkRichMenuProps> = annotateLineComponent(
  __LinkRichMenu
);

/** @ignore */
const UNLINK_RICHMENU_VALUE = {
  [CHANNEL_REQUEST_GETTER](channel) {
    if (channel.type !== 'utob') {
      throw new TypeError(
        '<UnlinkRichMenu /> can only be delivered in a utob chatting channel'
      );
    }

    return {
      method: 'DELETE' as const,
      path: `v2/bot/user/${channel.id}/richmenu`,
      body: null,
    };
  },
  [BULK_REQUEST_GETTER](userIds) {
    return {
      method: 'POST' as const,
      path: 'v2/bot/richmenu/bulk/unlink',
      body: { userIds },
    };
  },
};

/** @internal */
const __UnlinkRichMenu = function UnlinkRichMenu(node, path) {
  return [unitSegment(node, path, UNLINK_RICHMENU_VALUE)];
};

/**
 * Uninks the rich menu bound to one or multiple users.
 * @category Component
 * @props `{}`
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
 *   and [reference](https://developers.line.biz/en/reference/messaging-api/#unlink-rich-menu-from-user).
 */
export const UnlinkRichMenu: LineComponent<{}> = annotateLineComponent(
  __UnlinkRichMenu
);