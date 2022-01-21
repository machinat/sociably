import moxy from '@moxyjs/moxy';
import TelegramClientAuthenticator from '../ClientAuthenticator';
import TelegramChat from '../../Chat';
import TelegramUser from '../../User';

const authenticator = new TelegramClientAuthenticator();

const location = moxy();
const navigator = moxy({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
});
beforeAll(() => {
  global.window = { location, navigator } as any;
});
afterAll(() => {
  global.window = undefined as any;
});
beforeEach(() => {
  location.mock.reset();
  navigator.mock.reset();
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
  it('redirect to telegram.me while in mobile devices', () => {
    const authenticatorWithBotName = new TelegramClientAuthenticator({
      botName: 'MyBot',
    });
    expect(authenticatorWithBotName.closeWebview()).toBe(false);

    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
      );
    expect(authenticatorWithBotName.closeWebview()).toBe(true);
    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href')).toHaveBeenCalledWith(
      'https://telegram.me/MyBot'
    );
  });

  it('return false if botName is not provided', () => {
    expect(authenticator.closeWebview()).toBe(false);

    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
      );
    expect(authenticator.closeWebview()).toBe(false);
    expect(location.mock.setter('href')).not.toHaveBeenCalled();
  });
});
