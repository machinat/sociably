import { moxy } from '@moxyjs/moxy';
import TelegramClientAuthenticator from '../ClientAuthenticator.js';
import TelegramChat from '../../Chat.js';
import TelegramUser from '../../User.js';

const location = moxy();
const navigator = moxy({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
});
beforeAll(() => {
  global.window = { location, navigator } as never;
});
afterAll(() => {
  global.window = undefined as never;
});
beforeEach(() => {
  location.mock.reset();
  navigator.mock.reset();
});

test('.constructor() properties', () => {
  const authenticator = new TelegramClientAuthenticator({ botId: 12345 });

  expect(authenticator.marshalTypes.map((t) => t.name)).toMatchInlineSnapshot(`
    [
      "TelegramChat",
      "TelegramUser",
      "TelegramChatSender",
      "TelegramUserProfile",
      "TelegramChatProfile",
    ]
  `);
});

describe('.init()', () => {
  const authData = {
    botId: 12345,
    botName: 'MyBot',
    chat: undefined,
    user: {
      id: 12345,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
    },
    photo: 'http://crazy.dm/stand.png',
  };

  it('throw if `botId` is not set on constructor options or querystring', async () => {
    const authenticator = new TelegramClientAuthenticator();
    await expect(
      authenticator.init('https://sociably.io/auth/telegram/', null, null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Telegram bot ID is required on either \`options.botId\` or \`botId\` querystring"`
    );
  });

  it('redirect to login page', async () => {
    jest.useFakeTimers();
    const authenticator = new TelegramClientAuthenticator({
      botId: 12345,
      chatId: 67890,
    });

    location.mock
      .getter('href')
      .fakeReturnValue('https://sociably.io/webview/foo?bar=baz');

    const promise = authenticator.init(
      'https://sociably.io/auth/telegram/',
      null,
      null
    );

    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
      `"https://sociably.io/auth/telegram/login?botId=12345&redirectUrl=https%3A%2F%2Fsociably.io%2Fwebview%2Ffoo%3Fbar%3Dbaz&chatId=67890"`
    );

    jest.advanceTimersByTime(5000);
    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"redirect timeout"`
    );

    jest.useRealTimers();
  });

  test('with `botId` querystring', async () => {
    jest.useFakeTimers();
    const authenticator = new TelegramClientAuthenticator();

    location.mock.getter('search').fakeReturnValue('?bar=baz&botId=12345');
    location.mock
      .getter('href')
      .fakeReturnValue('https://sociably.io/webview/foo?bar=baz&botId=12345');

    authenticator.init('https://sociably.io/auth/telegram/', null, null);

    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
      `"https://sociably.io/auth/telegram/login?botId=12345&redirectUrl=https%3A%2F%2Fsociably.io%2Fwebview%2Ffoo%3Fbar%3Dbaz%26botId%3D12345"`
    );

    jest.useRealTimers();
  });

  test('with `chatId` querystring', async () => {
    jest.useFakeTimers();
    const authenticator = new TelegramClientAuthenticator({ botId: 12345 });

    location.mock.getter('search').fakeReturnValue('?bar=baz&chatId=67890');
    location.mock
      .getter('href')
      .fakeReturnValue('https://sociably.io/webview/foo?bar=baz&chatId=67890');

    authenticator.init('https://sociably.io/auth/telegram/', null, null);

    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
      `"https://sociably.io/auth/telegram/login?botId=12345&redirectUrl=https%3A%2F%2Fsociably.io%2Fwebview%2Ffoo%3Fbar%3Dbaz%26chatId%3D67890&chatId=67890"`
    );

    jest.useRealTimers();
  });

  it('do nothing if there is error or data from backend', async () => {
    const authenticator = new TelegramClientAuthenticator({ botId: 12345 });

    await expect(
      authenticator.init(
        'https://sociably.io/auth/telegram/',
        new Error('boom'),
        null
      )
    ).resolves.toBe(undefined);

    await expect(
      authenticator.init('https://sociably.io/auth/telegram/', null, authData)
    ).resolves.toBe(undefined);
  });

  it('redirect to login page if specified `botId` is different from auth data', async () => {
    jest.useFakeTimers();

    location.mock
      .getter('href')
      .fakeReturnValue('https://sociably.io/webview/foo?bar=baz');

    // with botId option
    new TelegramClientAuthenticator({ botId: 54321 }).init(
      'https://sociably.io/auth/telegram/',
      null,
      authData
    );

    // with botId querystring
    location.mock.getter('search').fakeReturnValue('?botId=54321&bar=baz');
    new TelegramClientAuthenticator().init(
      'https://sociably.io/auth/telegram/',
      null,
      authData
    );

    expect(location.mock.setter('href')).toHaveBeenCalledTimes(2);
    expect(location.mock.setter('href').calls.map(({ args }) => args[0]))
      .toMatchInlineSnapshot(`
      [
        "https://sociably.io/auth/telegram/login?botId=54321&redirectUrl=https%3A%2F%2Fsociably.io%2Fwebview%2Ffoo%3Fbar%3Dbaz",
        "https://sociably.io/auth/telegram/login?botId=54321&redirectUrl=https%3A%2F%2Fsociably.io%2Fwebview%2Ffoo%3Fbar%3Dbaz",
      ]
    `);

    jest.useRealTimers();
  });
});

test('.fetchCredential() return not ok', async () => {
  const authenticator = new TelegramClientAuthenticator({ botId: 12345 });
  await expect(authenticator.fetchCredential()).resolves.toMatchInlineSnapshot(`
    {
      "code": 400,
      "ok": false,
      "reason": "should only initiate from backend",
    }
  `);
});

test('.checkAuthData()', () => {
  const authenticator = new TelegramClientAuthenticator({ botId: 12345 });

  const authData = {
    botId: 12345,
    botName: 'MyBot',
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
    false,
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
      botName: 'MyBot',
      channel: new TelegramUser(12345, true),
      user: expectedUser,
      thread: new TelegramChat(12345, 67890, {
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
      botName: 'MyBot',
      channel: new TelegramUser(12345, true),
      user: expectedUser,
      thread: new TelegramChat(12345, 67890, { type: 'group', id: 67890 }),
      photoUrl: 'http://crazy.dm/stand.png',
    },
  });
});

it('.closeWebview() redirect to telegram.me while in mobile devices', () => {
  const authenticator = new TelegramClientAuthenticator({ botId: 12345 });

  expect(authenticator.closeWebview(null)).toBe(false);

  navigator.mock
    .getter('userAgent')
    .fakeReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    );
  expect(
    authenticator.closeWebview({
      platform: 'telegram',
      botId: 12345,
      botName: 'MyBot',
      channel: new TelegramUser(12345, true),
      user: new TelegramUser(67890, false),
      thread: new TelegramChat(12345, 67890),
      photoUrl: 'http://crazy.dm/stand.png',
      loginAt: new Date(),
      expireAt: new Date(Date.now() + 9999),
    })
  ).toBe(true);
  expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
  expect(location.mock.setter('href')).toHaveBeenCalledWith(
    'https://telegram.me/MyBot'
  );
});
