import TelegramChat from '../Chat';
import ChatProfile from '../ChatProfile';

test('marshallable type meta', () => {
  expect(TelegramChat.typeName).toBe('TgChat');
  expect(TelegramChat.fromJSONValue({ bot: 12345, id: 67890 })).toEqual(
    new TelegramChat(12345, 67890)
  );
});

test('private chat', () => {
  const data = {
    id: 67890,
    type: 'private' as const,
    username: 'johndoe',
    first_name: 'John',
    last_name: 'Doe',
  };
  const chat = new TelegramChat(12345, 67890, data);

  expect(chat.platform).toBe('telegram');
  expect(chat.botId).toBe(12345);
  expect(chat.id).toBe(67890);
  expect(chat.type).toBe('private');
  expect(chat.data).toEqual(data);
  expect(chat.uid).toMatchInlineSnapshot(`"tg.12345.67890"`);
  expect(chat.profile).toStrictEqual(new ChatProfile(data));

  expect(chat.typeName()).toBe('TgChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "bot": 12345,
      "id": 67890,
    }
  `);
});

test('group chat', () => {
  const data = { id: 67890, type: 'group' as const, title: 'foo_group' };
  const chat = new TelegramChat(12345, 67890, data);

  expect(chat.platform).toBe('telegram');
  expect(chat.botId).toBe(12345);
  expect(chat.id).toBe(67890);
  expect(chat.type).toBe('group');
  expect(chat.data).toEqual(data);
  expect(chat.uid).toMatchInlineSnapshot(`"tg.12345.67890"`);
  expect(chat.profile).toStrictEqual(new ChatProfile(data));

  expect(chat.typeName()).toBe('TgChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "bot": 12345,
      "id": 67890,
    }
  `);
});

test('without raw data', () => {
  let chat = new TelegramChat(12345, 67890);

  expect(chat.platform).toBe('telegram');
  expect(chat.botId).toBe(12345);
  expect(chat.id).toBe(67890);
  expect(chat.type).toBe(undefined);
  expect(chat.data).toEqual(null);
  expect(chat.uid).toMatchInlineSnapshot(`"tg.12345.67890"`);
  expect(chat.profile).toBe(null);

  expect(chat.typeName()).toBe('TgChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "bot": 12345,
      "id": 67890,
    }
  `);

  chat = new TelegramChat(12345, '@foo_channel');

  expect(chat.platform).toBe('telegram');
  expect(chat.botId).toBe(12345);
  expect(chat.id).toBe('@foo_channel');
  expect(chat.type).toBe(undefined);
  expect(chat.data).toEqual(null);
  expect(chat.uid).toMatchInlineSnapshot(`"tg.12345.@foo_channel"`);
  expect(chat.profile).toBe(null);

  expect(chat.typeName()).toBe('TgChat');
  expect(chat.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "bot": 12345,
      "id": "@foo_channel",
    }
  `);
});
