import Machinat from '@machinat/core';
import { isNativeType } from '@machinat/core/utils';
import Renderer from '@machinat/core/renderer';
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
} from '../action';

const renderer = new Renderer('telegram', () => null);

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
    expect(typeof Action).toBe('function');
    expect(isNativeType(<Action />)).toBe(true);
    expect(Action.$$platform).toBe('telegram');
  });
});

test('ForwardMessage match snapshot', async () => {
  await expect(
    renderer.render(<ForwardMessage fromChatId={12345} messageId={6789} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ForwardMessage
                fromChatId={12345}
                messageId={6789}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "forwardMessage",
                "parameters": Object {
                  "disable_notification": undefined,
                  "from_chat_id": 12345,
                  "message_id": 6789,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <ForwardMessage fromChatId={54321} messageId={9876} disableNotification />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ForwardMessage
                disableNotification={true}
                fromChatId={54321}
                messageId={9876}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "forwardMessage",
                "parameters": Object {
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
  await expect(renderer.render(<ChatAction action="typing" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ChatAction
                action="typing"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendChatAction",
                "parameters": Object {
                  "action": "typing",
                },
              },
            },
          ]
        `);
  await expect(renderer.render(<ChatAction action="upload_photo" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <ChatAction
                action="upload_photo"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "sendChatAction",
                "parameters": Object {
                  "action": "upload_photo",
                },
              },
            },
          ]
        `);
});

test('KickChatMember match snapshot', async () => {
  await expect(renderer.render(<KickChatMember userId={123456} />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <KickChatMember
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "kickChatMember",
                "parameters": Object {
                  "until_date": undefined,
                  "user_id": 123456,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(<KickChatMember userId={123456} untilDate={160077304} />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <KickChatMember
                untilDate={160077304}
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "kickChatMember",
                "parameters": Object {
                  "until_date": 160077304,
                  "user_id": 123456,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <KickChatMember userId={123456} untilDate={new Date(160077304000)} />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <KickChatMember
                untilDate={1975-01-27T17:55:04.000Z}
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "kickChatMember",
                "parameters": Object {
                  "until_date": 160077304,
                  "user_id": 123456,
                },
              },
            },
          ]
        `);
});

test('UnbanChatMember match snapshot', async () => {
  await expect(renderer.render(<UnbanChatMember userId={123456} />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <UnbanChatMember
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "unbanChatMember",
                "parameters": Object {
                  "user_id": 123456,
                },
              },
            },
          ]
        `);
});

test('RestrictChatMember match snapshot', async () => {
  await expect(
    renderer.render(<RestrictChatMember userId={123456} canSendMessages />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <RestrictChatMember
                canSendMessages={true}
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "restrictChatMember",
                "parameters": Object {
                  "permisions": Object {
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
    renderer.render(
      <RestrictChatMember
        userId={123456}
        canSendMessages
        canSendMediaMessages
        canSendPolls
        canSendOtherMessages
        untilDate={160077304}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "restrictChatMember",
                "parameters": Object {
                  "permisions": Object {
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
    renderer.render(
      <RestrictChatMember
        userId={123456}
        canAddWebPagePreviews={false}
        canChangeInfo={false}
        canInviteUsers={false}
        canPinMessages={false}
        untilDate={new Date(160077304000)}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "restrictChatMember",
                "parameters": Object {
                  "permisions": Object {
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
  await expect(
    renderer.render(<PromoteChatMember userId={123456} canPostMessages />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PromoteChatMember
                canPostMessages={true}
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "promoteChatMember",
                "parameters": Object {
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
    renderer.render(
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
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "promoteChatMember",
                "parameters": Object {
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
    renderer.render(
      <SetChatAdministratorCustomTitle userId={123456} customTitle="Big Boss" />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatAdministratorCustomTitle
                customTitle="Big Boss"
                userId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatAdministratorCustomTitle",
                "parameters": Object {
                  "custom_title": "Big Boss",
                  "user_id": 123456,
                },
              },
            },
          ]
        `);
});

test('SetChatPermissions match snapshot', async () => {
  await expect(renderer.render(<SetChatPermissions canSendMessages />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatPermissions
                canSendMessages={true}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatPermissions",
                "parameters": Object {
                  "permisions": Object {
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
    renderer.render(
      <SetChatPermissions
        canSendMessages
        canSendMediaMessages
        canSendPolls
        canSendOtherMessages
        canAddWebPagePreviews={false}
        canChangeInfo={false}
        canInviteUsers={false}
        canPinMessages={false}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
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
              "value": Object {
                "method": "setChatPermissions",
                "parameters": Object {
                  "permisions": Object {
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
  await expect(renderer.render(<SetChatPhoto fileData="__DATA__" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatPhoto
                fileData="__DATA__"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatPhoto",
                "parameters": Object {
                  "photo": undefined,
                },
                "uploadingFiles": Array [
                  Object {
                    "assetTag": undefined,
                    "fieldName": "photo",
                    "fileData": "__DATA__",
                    "fileInfo": undefined,
                  },
                ],
              },
            },
          ]
        `);
  await expect(
    renderer.render(
      <SetChatPhoto
        fileData="__DATA__"
        fileInfo={{
          filename: 'bar.jpg',
          filepath: 'baz',
          contentType: 'image/jpeg',
          knownLength: 7777,
        }}
      />
    )
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatPhoto
                fileData="__DATA__"
                fileInfo={
                  Object {
                    "contentType": "image/jpeg",
                    "filename": "bar.jpg",
                    "filepath": "baz",
                    "knownLength": 7777,
                  }
                }
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatPhoto",
                "parameters": Object {
                  "photo": undefined,
                },
                "uploadingFiles": Array [
                  Object {
                    "assetTag": undefined,
                    "fieldName": "photo",
                    "fileData": "__DATA__",
                    "fileInfo": Object {
                      "contentType": "image/jpeg",
                      "filename": "bar.jpg",
                      "filepath": "baz",
                      "knownLength": 7777,
                    },
                  },
                ],
              },
            },
          ]
        `);
});

test('DeleteChatPhoto match snapshot', async () => {
  await expect(renderer.render(<DeleteChatPhoto />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <DeleteChatPhoto />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "deleteChatPhoto",
                "parameters": Object {},
              },
            },
          ]
        `);
});

test('SetChatTitle match snapshot', async () => {
  await expect(renderer.render(<SetChatTitle title="Foo" />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatTitle
                title="Foo"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatTitle",
                "parameters": Object {
                  "title": "Foo",
                },
              },
            },
          ]
        `);
});

test('SetChatDescription match snapshot', async () => {
  await expect(renderer.render(<SetChatDescription description="Bar" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatDescription
                description="Bar"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatDescription",
                "parameters": Object {
                  "description": "Bar",
                },
              },
            },
          ]
        `);
});

test('PinChatMessage match snapshot', async () => {
  await expect(renderer.render(<PinChatMessage messageId={123456} />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PinChatMessage
                messageId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "pinChatMessage",
                "parameters": Object {
                  "disable_notification": undefined,
                  "message_id": 123456,
                },
              },
            },
          ]
        `);
  await expect(
    renderer.render(<PinChatMessage messageId={123456} disableNotification />)
  ).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <PinChatMessage
                disableNotification={true}
                messageId={123456}
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "pinChatMessage",
                "parameters": Object {
                  "disable_notification": true,
                  "message_id": 123456,
                },
              },
            },
          ]
        `);
});

test('UnpinChatMessage match snapshot', async () => {
  await expect(renderer.render(<UnpinChatMessage />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <UnpinChatMessage />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "unpinChatMessage",
                "parameters": Object {},
              },
            },
          ]
        `);
});

test('LeaveChat match snapshot', async () => {
  await expect(renderer.render(<LeaveChat />)).resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <LeaveChat />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "leaveChat",
                "parameters": Object {},
              },
            },
          ]
        `);
});

test('SetChatStickerSet match snapshot', async () => {
  await expect(renderer.render(<SetChatStickerSet stickerSetName="Stitch" />))
    .resolves.toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <SetChatStickerSet
                stickerSetName="Stitch"
              />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "setChatStickerSet",
                "parameters": Object {
                  "sticker_set_name": "Stitch",
                },
              },
            },
          ]
        `);
});

test('DeleteChatStickerSet match snapshot', async () => {
  await expect(renderer.render(<DeleteChatStickerSet />)).resolves
    .toMatchInlineSnapshot(`
          Array [
            Object {
              "node": <DeleteChatStickerSet />,
              "path": "$",
              "type": "unit",
              "value": Object {
                "method": "deleteChatStickerSet",
                "parameters": Object {},
              },
            },
          ]
        `);
});
