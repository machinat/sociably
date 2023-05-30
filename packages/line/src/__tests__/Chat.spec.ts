import LineUser from '../User.js';
import LineChat from '../Chat.js';

test('user chat', () => {
  const chat = new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_');

  expect(chat.channelId).toBe('_CHANNEL_ID_');
  expect(chat.type).toBe('user');
  expect(chat.id).toBe('_USER_ID_');

  expect(chat.platform).toBe('line');
  expect(chat.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._USER_ID_"`);
  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_USER_ID_",
      "platform": "line",
      "scopeId": "_CHANNEL_ID_",
    }
  `);

  expect(chat.typeName()).toBe('LineChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "channel": "_CHANNEL_ID_",
      "id": "_USER_ID_",
      "type": "user",
    }
  `);
  expect(LineChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('room chat', () => {
  const chat = new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_');

  expect(chat.channelId).toBe('_CHANNEL_ID_');
  expect(chat.type).toBe('room');
  expect(chat.id).toBe('_ROOM_ID_');

  expect(chat.platform).toBe('line');
  expect(chat.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._ROOM_ID_"`);
  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_ROOM_ID_",
      "platform": "line",
      "scopeId": "_CHANNEL_ID_",
    }
  `);

  expect(chat.typeName()).toBe('LineChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "channel": "_CHANNEL_ID_",
      "id": "_ROOM_ID_",
      "type": "room",
    }
  `);
  expect(LineChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

test('group chat', () => {
  const chat = new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_');

  expect(chat.channelId).toBe('_CHANNEL_ID_');
  expect(chat.type).toBe('group');
  expect(chat.id).toBe('_GROUP_ID_');

  expect(chat.platform).toBe('line');
  expect(chat.uid).toMatchInlineSnapshot(`"line._CHANNEL_ID_._GROUP_ID_"`);
  expect(chat.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "$$typeof": [
        "thread",
      ],
      "id": "_GROUP_ID_",
      "platform": "line",
      "scopeId": "_CHANNEL_ID_",
    }
  `);

  expect(chat.typeName()).toBe('LineChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    {
      "channel": "_CHANNEL_ID_",
      "id": "_GROUP_ID_",
      "type": "group",
    }
  `);
  expect(LineChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(chat);
});

describe('LineChat.fromMessagingSource(channelId, source)', () => {
  test('user source', () => {
    expect(
      LineChat.fromMessagingSource('_CHANNEL_ID_', {
        type: 'user',
        userId: 'john_doe',
      })
    ).toEqual(new LineChat('_CHANNEL_ID_', 'user', 'john_doe'));
  });

  test('room source', () => {
    expect(
      LineChat.fromMessagingSource('_CHANNEL_ID_', {
        type: 'room',
        roomId: '_ROOM_ID_',
        userId: 'john_doe',
      })
    ).toEqual(new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'));
  });

  test('group source', () => {
    expect(
      LineChat.fromMessagingSource('_CHANNEL_ID_', {
        type: 'group',
        groupId: '_GROUP_ID_',
        userId: 'john_doe',
      })
    ).toEqual(new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'));
  });
});

test('LineChat.fromUser(channelId, user)', () => {
  expect(
    LineChat.fromUser(
      '_CHANNEL_ID_',
      new LineUser('_PORVIDER_ID_', '_USER_ID_')
    )
  ).toEqual(new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'));
});
