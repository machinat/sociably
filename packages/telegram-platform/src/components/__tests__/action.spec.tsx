import Sociably, { SociablyNode } from '@sociably/core';
import { isNativeType } from '@sociably/core/utils';
import Renderer from '@sociably/core/renderer';
import {
  ForwardMessage,
  ChatAction,
  KickChatMember,
  UnbanChatMember,
  RestrictChatMember,
  PromoteChatMember,
  SetChatAdministratorCustomTitle,
  SetChatPermissions,
  SetChatPhoto,
  DeleteChatPhoto,
  SetChatTitle,
  SetChatDescription,
  PinChatMessage,
  UnpinChatMessage,
  LeaveChat,
  SetChatStickerSet,
  DeleteChatStickerSet,
} from '../action.js';

const renderer = new Renderer('telegram', async () => null);
const render = async (node: SociablyNode) => renderer.render(node, null, null);

describe.each([
  ForwardMessage,
  ChatAction,
  KickChatMember,
  UnbanChatMember,
  RestrictChatMember,
  PromoteChatMember,
  SetChatAdministratorCustomTitle,
  SetChatPermissions,
  SetChatPhoto,
  DeleteChatPhoto,
  SetChatTitle,
  SetChatDescription,
  PinChatMessage,
  UnpinChatMessage,
  LeaveChat,
  SetChatStickerSet,
  DeleteChatStickerSet,
])('%p', (Action) => {
  it('is valid unit Component', () => {
    expect(isNativeType(<Action {...({} as any)} />)).toBe(true);
    expect(Action.$$platform).toBe('telegram');
  });
});

test('ForwardMessage match snapshot', async () => {
  await expect(render(<ForwardMessage fromChatId={12345} messageId={6789} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ForwardMessage
          fromChatId={12345}
          messageId={6789}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "forwardMessage",
          "params": {
            "disable_notification": undefined,
            "from_chat_id": 12345,
            "message_id": 6789,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <ForwardMessage
        fromChatId={54321}
        messageId={9876}
        disableNotification
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <ForwardMessage
          disableNotification={true}
          fromChatId={54321}
          messageId={9876}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "forwardMessage",
          "params": {
            "disable_notification": true,
            "from_chat_id": 54321,
            "message_id": 9876,
          },
        },
      },
    ]
  `);
});

test('ChatAction match snapshot', async () => {
  await expect(render(<ChatAction action="typing" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <ChatAction
          action="typing"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "sendChatAction",
          "params": {
            "action": "typing",
          },
        },
      },
    ]
  `);
  await expect(render(<ChatAction action="upload_photo" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <ChatAction
          action="upload_photo"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "sendChatAction",
          "params": {
            "action": "upload_photo",
          },
        },
      },
    ]
  `);
});

test('KickChatMember match snapshot', async () => {
  await expect(render(<KickChatMember userId={123456} />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <KickChatMember
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "kickChatMember",
          "params": {
            "until_date": undefined,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
  await expect(render(<KickChatMember userId={123456} untilDate={160077304} />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <KickChatMember
          untilDate={160077304}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "kickChatMember",
          "params": {
            "until_date": 160077304,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <KickChatMember userId={123456} untilDate={new Date(160077304000)} />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <KickChatMember
          untilDate={1975-01-27T17:55:04.000Z}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "kickChatMember",
          "params": {
            "until_date": 160077304,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
});

test('UnbanChatMember match snapshot', async () => {
  await expect(render(<UnbanChatMember userId={123456} />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <UnbanChatMember
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "unbanChatMember",
          "params": {
            "user_id": 123456,
          },
        },
      },
    ]
  `);
});

test('RestrictChatMember match snapshot', async () => {
  await expect(render(<RestrictChatMember userId={123456} canSendMessages />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <RestrictChatMember
          canSendMessages={true}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "restrictChatMember",
          "params": {
            "permisions": {
              "can_add_web_page_previews": undefined,
              "can_change_info": undefined,
              "can_invite_users": undefined,
              "can_pin_messages": undefined,
              "can_send_media_messages": undefined,
              "can_send_messages": true,
              "can_send_other_messages": undefined,
              "can_send_polls": undefined,
            },
            "until_date": undefined,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <RestrictChatMember
        userId={123456}
        canSendMessages
        canSendMediaMessages
        canSendPolls
        canSendOtherMessages
        untilDate={160077304}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <RestrictChatMember
          canSendMediaMessages={true}
          canSendMessages={true}
          canSendOtherMessages={true}
          canSendPolls={true}
          untilDate={160077304}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "restrictChatMember",
          "params": {
            "permisions": {
              "can_add_web_page_previews": undefined,
              "can_change_info": undefined,
              "can_invite_users": undefined,
              "can_pin_messages": undefined,
              "can_send_media_messages": true,
              "can_send_messages": true,
              "can_send_other_messages": true,
              "can_send_polls": true,
            },
            "until_date": 160077304,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <RestrictChatMember
        userId={123456}
        canAddWebPagePreviews={false}
        canChangeInfo={false}
        canInviteUsers={false}
        canPinMessages={false}
        untilDate={new Date(160077304000)}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <RestrictChatMember
          canAddWebPagePreviews={false}
          canChangeInfo={false}
          canInviteUsers={false}
          canPinMessages={false}
          untilDate={1975-01-27T17:55:04.000Z}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "restrictChatMember",
          "params": {
            "permisions": {
              "can_add_web_page_previews": false,
              "can_change_info": false,
              "can_invite_users": false,
              "can_pin_messages": false,
              "can_send_media_messages": undefined,
              "can_send_messages": undefined,
              "can_send_other_messages": undefined,
              "can_send_polls": undefined,
            },
            "until_date": 160077304,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
});

test('PromoteChatMember match snapshot', async () => {
  await expect(render(<PromoteChatMember userId={123456} canPostMessages />))
    .resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PromoteChatMember
          canPostMessages={true}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "promoteChatMember",
          "params": {
            "can_change_info": undefined,
            "can_delete_messages": undefined,
            "can_edit_messages": undefined,
            "can_invite_users": undefined,
            "can_pin_messages": undefined,
            "can_post_messages": true,
            "can_promote_members": undefined,
            "can_restrict_members": undefined,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <PromoteChatMember
        userId={123456}
        canChangeInfo
        canPostMessages={false}
        canEditMessages
        canDeleteMessages={false}
        canInviteUsers
        canRestrictMembers={false}
        canPinMessages
        canPromoteMembers={false}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PromoteChatMember
          canChangeInfo={true}
          canDeleteMessages={false}
          canEditMessages={true}
          canInviteUsers={true}
          canPinMessages={true}
          canPostMessages={false}
          canPromoteMembers={false}
          canRestrictMembers={false}
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "promoteChatMember",
          "params": {
            "can_change_info": true,
            "can_delete_messages": false,
            "can_edit_messages": true,
            "can_invite_users": true,
            "can_pin_messages": true,
            "can_post_messages": false,
            "can_promote_members": false,
            "can_restrict_members": false,
            "user_id": 123456,
          },
        },
      },
    ]
  `);
});

test('SetChatAdministratorCustomTitle match snapshot', async () => {
  await expect(
    render(
      <SetChatAdministratorCustomTitle
        userId={123456}
        customTitle="Big Boss"
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatAdministratorCustomTitle
          customTitle="Big Boss"
          userId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "setChatAdministratorCustomTitle",
          "params": {
            "custom_title": "Big Boss",
            "user_id": 123456,
          },
        },
      },
    ]
  `);
});

test('SetChatPermissions match snapshot', async () => {
  await expect(render(<SetChatPermissions canSendMessages />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatPermissions
          canSendMessages={true}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "setChatPermissions",
          "params": {
            "permisions": {
              "can_add_web_page_previews": undefined,
              "can_change_info": undefined,
              "can_invite_users": undefined,
              "can_pin_messages": undefined,
              "can_send_media_messages": undefined,
              "can_send_messages": true,
              "can_send_other_messages": undefined,
              "can_send_polls": undefined,
            },
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <SetChatPermissions
        canSendMessages
        canSendMediaMessages
        canSendPolls
        canSendOtherMessages
        canAddWebPagePreviews={false}
        canChangeInfo={false}
        canInviteUsers={false}
        canPinMessages={false}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatPermissions
          canAddWebPagePreviews={false}
          canChangeInfo={false}
          canInviteUsers={false}
          canPinMessages={false}
          canSendMediaMessages={true}
          canSendMessages={true}
          canSendOtherMessages={true}
          canSendPolls={true}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "setChatPermissions",
          "params": {
            "permisions": {
              "can_add_web_page_previews": false,
              "can_change_info": false,
              "can_invite_users": false,
              "can_pin_messages": false,
              "can_send_media_messages": true,
              "can_send_messages": true,
              "can_send_other_messages": true,
              "can_send_polls": true,
            },
          },
        },
      },
    ]
  `);
});

test('SetChatPhoto match snapshot', async () => {
  await expect(render(<SetChatPhoto file={{ data: '__DATA__' }} />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatPhoto
          file={
            {
              "data": "__DATA__",
            }
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": undefined,
              "fieldName": "photo",
              "source": {
                "data": "__DATA__",
              },
            },
          ],
          "method": "setChatPhoto",
          "params": {
            "photo": undefined,
          },
        },
      },
    ]
  `);
  await expect(
    render(
      <SetChatPhoto
        file={{
          data: '__DATA__',
          fileName: 'bar.jpg',
          contentType: 'image/jpeg',
        }}
      />,
    ),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatPhoto
          file={
            {
              "contentType": "image/jpeg",
              "data": "__DATA__",
              "fileName": "bar.jpg",
            }
          }
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "files": [
            {
              "assetTag": undefined,
              "fieldName": "photo",
              "source": {
                "contentType": "image/jpeg",
                "data": "__DATA__",
                "fileName": "bar.jpg",
              },
            },
          ],
          "method": "setChatPhoto",
          "params": {
            "photo": undefined,
          },
        },
      },
    ]
  `);
});

test('DeleteChatPhoto match snapshot', async () => {
  await expect(render(<DeleteChatPhoto />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <DeleteChatPhoto />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "deleteChatPhoto",
          "params": {},
        },
      },
    ]
  `);
});

test('SetChatTitle match snapshot', async () => {
  await expect(render(<SetChatTitle title="Foo" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatTitle
          title="Foo"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "setChatTitle",
          "params": {
            "title": "Foo",
          },
        },
      },
    ]
  `);
});

test('SetChatDescription match snapshot', async () => {
  await expect(render(<SetChatDescription description="Bar" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatDescription
          description="Bar"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "setChatDescription",
          "params": {
            "description": "Bar",
          },
        },
      },
    ]
  `);
});

test('PinChatMessage match snapshot', async () => {
  await expect(render(<PinChatMessage messageId={123456} />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <PinChatMessage
          messageId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "pinChatMessage",
          "params": {
            "disable_notification": undefined,
            "message_id": 123456,
          },
        },
      },
    ]
  `);
  await expect(
    render(<PinChatMessage messageId={123456} disableNotification />),
  ).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <PinChatMessage
          disableNotification={true}
          messageId={123456}
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "pinChatMessage",
          "params": {
            "disable_notification": true,
            "message_id": 123456,
          },
        },
      },
    ]
  `);
});

test('UnpinChatMessage match snapshot', async () => {
  await expect(render(<UnpinChatMessage />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <UnpinChatMessage />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "unpinChatMessage",
          "params": {},
        },
      },
    ]
  `);
});

test('LeaveChat match snapshot', async () => {
  await expect(render(<LeaveChat />)).resolves.toMatchInlineSnapshot(`
    [
      {
        "node": <LeaveChat />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "leaveChat",
          "params": {},
        },
      },
    ]
  `);
});

test('SetChatStickerSet match snapshot', async () => {
  await expect(render(<SetChatStickerSet stickerSetName="Stitch" />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <SetChatStickerSet
          stickerSetName="Stitch"
        />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "setChatStickerSet",
          "params": {
            "sticker_set_name": "Stitch",
          },
        },
      },
    ]
  `);
});

test('DeleteChatStickerSet match snapshot', async () => {
  await expect(render(<DeleteChatStickerSet />)).resolves
    .toMatchInlineSnapshot(`
    [
      {
        "node": <DeleteChatStickerSet />,
        "path": "$",
        "type": "unit",
        "value": {
          "method": "deleteChatStickerSet",
          "params": {},
        },
      },
    ]
  `);
});
