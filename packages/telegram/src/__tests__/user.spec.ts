import TelegramUser from '../user';

it('user with no data attached', () => {
  const user = new TelegramUser(12345);

  expect(user.platform).toBe('telegram');
  expect(user.id).toBe(12345);
  expect(user.data).toBe(null);

  expect(user.typeName()).toBe('TelegramUser');
  expect(user.toJSONValue()).toMatchInlineSnapshot(`
    Object {
      "id": 12345,
    }
  `);
  expect(TelegramUser.fromJSONValue(user.toJSONValue())).toStrictEqual(user);
});

it('user with no data attached', () => {
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
