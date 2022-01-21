import TelegramUser from '../User';
import TelegramChat from '../Chat';

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
