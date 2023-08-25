import TelegramUser from '../User.js';
import TelegramUserProfile from '../UserProfile.js';

test('marshallable type meta', () => {
  expect(TelegramUser.typeName).toBe('TgUser');
  expect(TelegramUser.fromJSONValue({ id: 12345 })).toEqual(
    new TelegramUser(12345)
  );
});

test('user with id only', () => {
  const user = new TelegramUser(12345);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toBe(null);
  expect(user.avatarUrl).toBe(undefined);
  expect(user.profile).toBe(null);
  expect(user.type).toBe('user');
  expect(user.isBot).toBe(false);

  expect(user.uid).toMatchInlineSnapshot(`"tg.12345"`);
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "platform": "telegram",
    }
  `);

  expect(user.typeName()).toBe('TgUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": undefined,
    }
  `);
});

test('bot user', () => {
  const bot = new TelegramUser(12345, true);

  expect(bot.platform).toBe('telegram');
  expect(bot.id).toBe(12345);
  expect(bot.data).toBe(null);
  expect(bot.avatarUrl).toBe(undefined);
  expect(bot.profile).toBe(null);
  expect(bot.type).toBe('user');
  expect(bot.isBot).toBe(true);

  expect(bot.uid).toMatchInlineSnapshot(`"tg.12345"`);
  expect(bot.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "platform": "telegram",
    }
  `);

  expect(bot.typeName()).toBe('TgUser');
  expect(bot.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": true,
    }
  `);
});

test('user with raw data', () => {
  const data = {
    id: 12345,
    is_bot: false,
    first_name: 'Jojo',
    last_name: 'Doe',
    username: 'jojodoe',
    language_code: 'en-US',
  };
  const user = new TelegramUser(12345, undefined, data);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toEqual(data);
  expect(user.avatarUrl).toBe(undefined);
  expect(user.profile).toStrictEqual(new TelegramUserProfile(data));
  expect(user.type).toBe('user');

  expect(user.uid).toMatchInlineSnapshot(`"tg.12345"`);
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "platform": "telegram",
    }
  `);

  expect(user.typeName()).toBe('TgUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": undefined,
    }
  `);
  expect(TelegramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new TelegramUser(12345)
  );
});

test('user with photo url', () => {
  const avatarUrl = 'https://...';
  const user = new TelegramUser(12345, undefined, undefined, avatarUrl);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toBe(null);
  expect(user.avatarUrl).toBe(avatarUrl);
  expect(user.type).toBe('user');

  expect(user.uid).toMatchInlineSnapshot(`"tg.12345"`);
  expect(user.uniqueIdentifier).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "platform": "telegram",
    }
  `);

  expect(user.typeName()).toBe('TgUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": undefined,
    }
  `);
});
