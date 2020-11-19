import TelegramClientAuthorizer from '../client';
import { TelegramChat } from '../../channel';
import TelegramUser from '../../user';

const authorizer = new TelegramClientAuthorizer();

test('#init() do nothing', async () => {
  await expect(authorizer.init()).resolves.toBe(undefined);
});

test('#fetchCredential() return not ok', async () => {
  await expect(authorizer.fetchCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "reason": "should only initiate from backend",
            "success": false,
          }
        `);
});

test('#refineAuth() ok', async () => {
  const authData = {
    botId: 12345,
    channel: null,
    userId: 12345,
    firstName: 'Jojo',
    lastName: 'Doe',
    username: 'jojodoe',
    languageCode: 'ja',
  };
  await expect(authorizer.refineAuth(authData)).resolves.toEqual({
    user: new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
      language_code: 'ja',
    }),
    channel: null,
  });
  await expect(
    authorizer.refineAuth({
      ...authData,
      channel: {
        type: 'group',
        id: 67890,
      },
    })
  ).resolves.toEqual({
    user: new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
      language_code: 'ja',
    }),
    channel: new TelegramChat(12345, { type: 'group', id: 67890 }),
  });
  await expect(
    authorizer.refineAuth({
      ...authData,
      channel: {
        type: 'group' as const,
        id: 67890,
      },
    })
  ).resolves.toEqual({
    user: new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
      language_code: 'ja',
    }),
    channel: new TelegramChat(12345, { type: 'group', id: 67890 }),
  });
});
