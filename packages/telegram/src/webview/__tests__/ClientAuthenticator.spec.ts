import moxy from '@moxyjs/moxy';
import TelegramClientAuthenticator from '../ClientAuthenticator';
import TelegramChat from '../../Chat';
import TelegramUser from '../../User';

const authenticator = new TelegramClientAuthenticator({ botName: 'MyBot' });

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

test('.constructor() properties', () => {
  expect(authenticator.marshalTypes.map((t) => t.name)).toMatchInlineSnapshot(`
    Array [
      "TelegramChat",
      "TelegramUser",
      "TelegramChatSender",
      "TelegramUserProfile",
      "TelegramChatProfile",
    ]
  `);
});

describe('.init()', () => {
  it('redirect to login page', async () => {
    jest.useFakeTimers();

    location.mock
      .getter('href')
      .fakeReturnValue('https://sociably.io/webview/foo?bar=baz');

    const promise = authenticator.init(
      'https://sociably.io/auth/telegram/',
      null,
      null
    );
    jest.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"redirect timeout"`
    );

    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
      `"https://sociably.io/auth/telegram/login?redirectUrl=https%3A%2F%2Fsociably.io%2Fwebview%2Ffoo%3Fbar%3Dbaz"`
    );

    jest.useRealTimers();
  });

  it('do nothing if there is error or data from backend', async () => {
    await expect(
      authenticator.init(
        'https://sociably.io/auth/telegram/',
        new Error('boom'),
        null
      )
    ).resolves.toBe(undefined);

    await expect(
      authenticator.init('https://sociably.io/auth/telegram/', null, {
        bot: 12345,
        chat: undefined,
        user: {
          id: 12345,
          first_name: 'Jojo',
          last_name: 'Doe',
          username: 'jojodoe',
        },
        photo: 'http://crazy.dm/stand.png',
      })
    ).resolves.toBe(undefined);
  });
});

test('.fetchCredential() return not ok', async () => {
  await expect(authenticator.fetchCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "should only initiate from backend",
          }
        `);
});

test('.checkAuthData()', () => {
  const authData = {
    bot: 12345,
    chat: undefined,
    user: {
      id: 67890,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    photo: 'http://crazy.dm/stand.png',
  };

  const expectedUser = new TelegramUser(
    67890,
    {
      id: 67890,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    'http://crazy.dm/stand.png'
  );

  expect(authenticator.checkAuthData(authData)).toEqual({
    ok: true,
    contextDetails: {
      botId: 12345,
      user: expectedUser,
      channel: new TelegramChat(12345, 67890, {
        type: 'private',
        id: 67890,
        first_name: 'Jojo',
        last_name: 'Doe',
        username: 'jojodoe',
      }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });
  expect(
    authenticator.checkAuthData({
      ...authData,
      chat: { type: 'group', id: 67890 },
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      botId: 12345,
      user: expectedUser,
      channel: new TelegramChat(12345, 67890, { type: 'group', id: 67890 }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });
});

it('.closeWebview() redirect to telegram.me while in mobile devices', () => {
  expect(authenticator.closeWebview()).toBe(false);

  navigator.mock
    .getter('userAgent')
    .fakeReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    );
  expect(authenticator.closeWebview()).toBe(true);
  expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
  expect(location.mock.setter('href')).toHaveBeenCalledWith(
    'https://telegram.me/MyBot'
  );
});
