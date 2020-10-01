import TelegramUser from '../user';

it('contain correct informations', () => {
  const user1 = new TelegramUser({
    id: 12345,
    is_bot: false,
    first_name: 'John',
  });

  expect(user1.platform).toBe('telegram');
  expect(user1.id).toBe(12345);
  expect(user1.firstName).toBe('John');
  expect(user1.lastName).toBe(undefined);
  expect(user1.username).toBe(undefined);
  expect(user1.languageCode).toBe(undefined);

  const user2 = new TelegramUser({
    id: 12345,
    is_bot: false,
    first_name: 'Jojo',
    last_name: 'Doe',
    username: 'jojodoe',
    language_code: 'en-US',
  });

  expect(user2.platform).toBe('telegram');
  expect(user2.id).toBe(12345);
  expect(user2.firstName).toBe('Jojo');
  expect(user2.lastName).toBe('Doe');
  expect(user2.username).toBe('jojodoe');
  expect(user2.languageCode).toBe('en-US');
});
