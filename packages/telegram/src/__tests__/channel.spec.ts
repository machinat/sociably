import TelegramUser from '../user';
import { TelegramChat, TelegramChatTarget } from '../channel';

describe('TelegramChat', () => {
  test('private chat', () => {
    const data = {
      id: 67890,
      type: 'private' as const,
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
    };
    const chat = new TelegramChat(12345, data);

    expect(chat.platform).toBe('telegram');
    expect(chat.botId).toBe(12345);
    expect(chat.id).toBe(67890);
    expect(chat.type).toBe('private');
    expect(chat.data).toEqual(data);
    expect(chat.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);

    expect(chat.typeName()).toBe('TelegramChat');
    expect(chat.toJSONValue()).toMatchInlineSnapshot(`
      Object {
        "botId": 12345,
        "id": 67890,
        "type": "private",
      }
    `);
    expect(TelegramChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(
      new TelegramChat(12345, { id: 67890, type: 'private' })
    );
  });

  test('group chat', () => {
    const data = { id: 67890, type: 'group' as const, title: 'Foo' };
    const chat = new TelegramChat(12345, data);

    expect(chat.platform).toBe('telegram');
    expect(chat.botId).toBe(12345);
    expect(chat.id).toBe(67890);
    expect(chat.type).toBe('group');
    expect(chat.data).toEqual(data);
    expect(chat.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);

    expect(chat.typeName()).toBe('TelegramChat');
    expect(chat.toJSONValue()).toMatchInlineSnapshot(`
      Object {
        "botId": 12345,
        "id": 67890,
        "type": "group",
      }
    `);
    expect(TelegramChat.fromJSONValue(chat.toJSONValue())).toStrictEqual(
      new TelegramChat(12345, { id: 67890, type: 'group' })
    );
  });

  describe('.fromUser(botId, user)', () => {
    test('user without data', () => {
      const chat = TelegramChat.fromUser(12345, new TelegramUser(67890));

      expect(chat.platform).toBe('telegram');
      expect(chat.botId).toBe(12345);
      expect(chat.id).toBe(67890);
      expect(chat.type).toBe('private');
      expect(chat.data).toEqual({ id: 67890, type: 'private' });
      expect(chat.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);
    });

    test('user with data', () => {
      const chat = TelegramChat.fromUser(
        12345,
        new TelegramUser(67890, {
          id: 67890,
          is_bot: false,
          username: 'johndoe',
          first_name: 'John',
          last_name: 'Doe',
        })
      );

      expect(chat.platform).toBe('telegram');
      expect(chat.botId).toBe(12345);
      expect(chat.id).toBe(67890);
      expect(chat.type).toBe('private');
      expect(chat.data).toEqual({
        id: 67890,
        type: 'private',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
      });
      expect(chat.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);
    });
  });
});

test('TelegramChatTarget', () => {
  const idTarget = new TelegramChatTarget(12345, 67890);

  expect(idTarget.platform).toBe('telegram');
  expect(idTarget.botId).toBe(12345);
  expect(idTarget.id).toBe(67890);
  expect(idTarget.type).toBe('unknown');
  expect(idTarget.uid).toMatchInlineSnapshot(`"telegram.12345.67890"`);

  const channelTarget = new TelegramChatTarget(12345, '@foo_channel');

  expect(channelTarget.platform).toBe('telegram');
  expect(channelTarget.botId).toBe(12345);
  expect(channelTarget.id).toBe('@foo_channel');
  expect(channelTarget.type).toBe('unknown');
  expect(channelTarget.uid).toMatchInlineSnapshot(
    `"telegram.12345.@foo_channel"`
  );

  expect(channelTarget.typeName()).toBe('TelegramChatTarget');
  expect(channelTarget.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "botId": 12345,
      "id": "@foo_channel",
    }
  `);
  expect(
    TelegramChatTarget.fromJSONValue(channelTarget.toJSONValue())
  ).toStrictEqual(channelTarget);
});
