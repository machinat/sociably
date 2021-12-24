import TelegramClientAuthenticator from '../client';
import { TelegramChat } from '../../channel';
import TelegramUser from '../../user';

const authenticator = new TelegramClientAuthenticator();

test('#constructor() properties', () => {
  expect(authenticator.marshalTypes.map((t) => t.name)).toMatchInlineSnapshot(`
    Array [
      "TelegramChat",
      "TelegramChatTarget",
      "TelegramUser",
      "TelegramUserProfile",
      "TelegramChatProfile",
    ]
  `);
});

test('#init() do nothing', async () => {
  await expect(authenticator.init()).resolves.toBe(undefined);
});

test('#fetchCredential() return not ok', async () => {
  await expect(authenticator.fetchCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "reason": "should only initiate from backend",
            "success": false,
          }
        `);
});

test('#checkAuthContext()', () => {
  const authData = {
    bot: 12345,
    chat: undefined,
    user: {
      id: 12345,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    photo: 'http://crazy.dm/stand.png',
  };

  const expectedUser = new TelegramUser(
    12345,
    {
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    'http://crazy.dm/stand.png'
  );

  expect(authenticator.checkAuthContext(authData)).toEqual({
    success: true,
    contextSupplment: {
      botId: 12345,
      user: expectedUser,
      channel: new TelegramChat(12345, {
        type: 'private',
        id: 12345,
        first_name: 'Jojo',
        last_name: 'Doe',
        username: 'jojodoe',
      }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });
  expect(
    authenticator.checkAuthContext({
      ...authData,
      chat: { type: 'group', id: 67890 },
    })
  ).toEqual({
    success: true,
    contextSupplment: {
      botId: 12345,
      user: expectedUser,
      channel: new TelegramChat(12345, { type: 'group', id: 67890 }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });
});

test('#closeWebview() return false', () => {
  expect(authenticator.closeWebview()).toBe(false);
});
