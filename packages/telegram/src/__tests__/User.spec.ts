import TelegramUser from '../User';

test('user with id only', () => {
  const user = new TelegramUser(12345);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toBe(null);
  expect(user.photoUrl).toBe(undefined);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": 12345,
    }
  `);
  expect(TelegramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
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
  const user = new TelegramUser(12345, data);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toEqual(data);
  expect(user.photoUrl).toBe(undefined);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": 12345,
    }
  `);
  expect(TelegramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new TelegramUser(12345)
  );
});

test('user with photo url', () => {
  const photoUrl = 'https://...';
  const user = new TelegramUser(12345, undefined, photoUrl);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toBe(null);
  expect(user.photoUrl).toBe(photoUrl);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": 12345,
    }
  `);
  expect(TelegramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(
    new TelegramUser(12345)
  );
});
