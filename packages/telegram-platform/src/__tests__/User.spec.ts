import TelegramUser from '../User.js';
import TelegramUserProfile from '../UserProfile.js';

test('marshallable type meta', () => {
  expect(TelegramUser.typeName).toBe('TelegramUser');
  expect(TelegramUser.fromJSONValue({ id: 12345 })).toEqual(
    new TelegramUser(12345),
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

  expect(user.uid).toMatchInlineSnapshot(`"telegram.12345"`);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": undefined,
    }
  `);
});

test('sender user', () => {
  const sender = new TelegramUser(12345, true);

  expect(sender.platform).toBe('telegram');
  expect(sender.id).toBe(12345);
  expect(sender.data).toBe(null);
  expect(sender.avatarUrl).toBe(undefined);
  expect(sender.profile).toBe(null);
  expect(sender.type).toBe('user');
  expect(sender.isBot).toBe(true);

  expect(sender.uid).toMatchInlineSnapshot(`"telegram.12345"`);

  expect(sender.typeName()).toBe('TelegramUser');
  expect(sender.toJSONValue()).toMatchInlineSnapshot(`
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

  expect(user.uid).toMatchInlineSnapshot(`"telegram.12345"`);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": undefined,
    }
  `);
  expect(TelegramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new TelegramUser(12345),
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

  expect(user.uid).toMatchInlineSnapshot(`"telegram.12345"`);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    {
      "id": 12345,
      "isBot": undefined,
    }
  `);
});
