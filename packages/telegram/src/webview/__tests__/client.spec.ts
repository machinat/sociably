import moxy from '@moxyjs/moxy';
import TelegramClientAuthenticator from '../client';
import { TelegramChat } from '../../channel';
import TelegramUser from '../../user';

const authenticator = new TelegramClientAuthenticator();

const location = moxy();
beforeAll(() => {
  global.window = { location } as any;
});
afterAll(() => {
  global.window = undefined as any;
});
beforeEach(() => {
  location.mock.reset();
});

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

describe('#closeWebview()', () => {
  it('return false if no botName is provided', () => {
    expect(authenticator.closeWebview()).toBe(false);
  });

  it('redirect to telegram.me if botName is provided', () => {
    const authenticatorWithBotName = new TelegramClientAuthenticator({
      botName: 'MyBot',
    });
    expect(authenticatorWithBotName.closeWebview()).toBe(true);
    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href')).toHaveBeenCalledWith(
      'https://telegram.me/MyBot'
    );
  });
});
