import { makeUnitSegment, UnitSegment } from '@sociably/core/renderer';
import makeLineComponent from '../utils/makeLineComponent';
import LineChat from '../Chat';
import { LineComponent, ChatActionSegmentValue } from '../types';

/**
 * @category Props
 */
export type LinkRichMenuProps = {
  /** ID of a rich menu. */
  id: string;
};

/**
 * Links a rich menu to one or multiple users.
 * @category Component
 * @props {@link LinkRichMenuProps}
 * @guides Check official [doc](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
 *   and [reference](https://developers.line.biz/en/reference/messaging-api/#link-rich-menu-to-user).
 */
export const LinkRichMenu: LineComponent<
  LinkRichMenuProps,
  UnitSegment<ChatActionSegmentValue>
> = makeLineComponent(function LinkRichMenu(node, path) {
  const { id } = node.props;
  return [
    makeUnitSegment(node, path, {
      type: 'chat_action',

      getChatRequest: (thread: LineChat) => {
        if (thread.type !== 'user') {
          throw new TypeError(
            '<LinkRichMenu /> can only be sent to an user chat'
          );
        }

        return {
          method: 'POST',
          url: `v2/bot/user/${thread.id}/richmenu/${id}`,
          params: null,
        };
      },

      getBulkRequest: (userIds: string[]) => ({
        method: 'POST',
        url: 'v2/bot/richmenu/bulk/link',
        params: {
          userIds,
          richMenuId: id,
        },
      }),
    }),
  ];
});
