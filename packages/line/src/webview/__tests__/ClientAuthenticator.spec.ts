import url from 'url';
import _liff from '@line/liff';
import moxy, { Moxy } from '@moxyjs/moxy';
import ClientAuthenticator from '../ClientAuthenticator';
import LineChat from '../../Chat';
import LineUser from '../../User';
import { LiffOs, LiffReferer } from '../../constant';
import LineUserProfile from '../../UserProfile';

jest.mock('@line/liff', () => {
  const actualMoxy = jest.requireActual('@moxyjs/moxy').default;
  return actualMoxy({
    init: () => Promise.resolve(),
    getOS: () => 'ios',
    getLanguage: () => 'en-US',
    getVersion: () => 'v2.1',
    isInClient: () => true,
    isLoggedIn: () => true,
    login: () => {},
    getAccessToken: () => '_ACCESS_TOKEN_',
    getContext: () => ({}),
    getProfile: () =>
      Promise.resolve({
        userId: '_USER_ID_',
        displayName: 'John',
        pictureUrl: 'https://example.com/abcdefghijklmn',
        statusMessage: 'Hello, LINE!',
      }),
    closeWindow: () => {},
  });
});

const liff = _liff as Moxy<typeof _liff>;

const liffContext = {
  type: 'utou',
  utouId: '_UTOU_ID_',
  userId: '_USER_ID_',
  viewType: 'full',
  accessTokenHash: 'XXXXXX',
  availability: {
    shareTargetPicker: {
      permission: true,
      minVer: '10.3.0',
    },
  },
};

const window = moxy(
  {
    location: url.parse(
      'https://sociably.io/foo?bar=baz'
    ) as unknown as Moxy<Location>,
  },
  { includeProperties: ['*'] }
);

beforeAll(() => {
  (global as any).window = window;
});

beforeEach(() => {
  liff.mock.reset();
  window.mock.reset();
});

describe('.constructor()', () => {
  test('properties', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(authenticator.platform).toBe('line');
    expect(authenticator.liffId).toBe('_LIFF_ID_');
    expect(authenticator.marshalTypes.map((t) => t.name))
      .toMatchInlineSnapshot(`
      Array [
        "LineChat",
        "LineUser",
        "LineUserProfile",
        "LineGroupProfile",
      ]
    `);
  });

  it('throw if liffId is empty', () => {
    expect(
      () => new ClientAuthenticator({} as never)
    ).toThrowErrorMatchingInlineSnapshot(`"options.liffId must not be empty"`);
  });
});

describe('.init()', () => {
  it('add liff sdk and call init() after loaded', async () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    await expect(authenticator.init()).resolves.toBe(undefined);
    expect(liff.init).toHaveBeenCalledTimes(1);
    expect(liff.login).not.toHaveBeenCalled();
  });

  it('wait for redirect while in LIFF primary redirecting', async () => {
    jest.useFakeTimers();

    window.location.mock
      .getter('search')
      .fakeReturnValue('?liff.state=__DATA_FROM_LIFF__');

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    const promise = authenticator.init();
    setImmediate(jest.runAllTimers);

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"redirect timeout"`
    );
    expect(liff.init).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });
});

describe('.fetchCredential()', () => {
  it('resolve credential containing liff infos and access token', async () => {
    liff.getContext.mock.fakeReturnValue(liffContext);

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });
    await authenticator.init();

    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        os: 'ios',
        refererType: 'utou',
        language: 'en-US',
        userId: '_USER_ID_',
      },
    });

    expect(liff.login).not.toHaveBeenCalled();
  });

  test('credential in group chat', async () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    liff.getContext.mock.fakeReturnValue({
      ...liffContext,
      type: 'group',
    });

    await authenticator.init();
    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        refererType: 'group',
        os: 'ios',
        language: 'en-US',
        userId: '_USER_ID_',
      },
    });

    expect(liff.login).not.toHaveBeenCalled();
  });

  test('credential in room chat', async () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    liff.getContext.mock.fakeReturnValue({
      ...liffContext,
      type: 'room',
    });

    await authenticator.init();
    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        refererType: 'room',
        os: 'ios',
        language: 'en-US',
        userId: '_USER_ID_',
      },
    });

    expect(liff.login).not.toHaveBeenCalled();
  });

  it('call liff.login() if liff.isLoggedIn() is false', async () => {
    jest.useFakeTimers();
    liff.isLoggedIn.mock.fakeReturnValue(false);

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(liff.login).not.toHaveBeenCalled();

    await authenticator.init();
    const promise = authenticator.fetchCredential();
    setImmediate(jest.runAllTimers);

    expect(liff.isLoggedIn).toHaveBeenCalledTimes(1);
    expect(liff.login).toHaveBeenCalledTimes(1);
    expect(liff.login).toHaveBeenCalledWith({
      redirectUri: 'https://sociably.io/foo?bar=baz',
    });

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"redirect timeout"`
    );

    jest.useRealTimers();
  });
});

describe('.checkAuthData(data)', () => {
  it('resolve utou chat', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(
      authenticator.checkAuthData({
        provider: '_PROVIDER_ID_',
        channel: '_BOT_CHANNEL_ID_',
        client: '_CLIENT_ID_',
        ref: LiffReferer.Utou,
        os: LiffOs.Web,
        lang: 'en-US',
        user: '_USER_ID_',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '_CLIENT_ID_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: new LineChat('_BOT_CHANNEL_ID_', 'user', '_USER_ID_'),
        refererType: 'utou',
        os: 'web',
        language: 'en-US',
      },
    });
  });

  it('resolve group chat', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(
      authenticator.checkAuthData({
        provider: '_PROVIDER_ID_',
        channel: '_BOT_CHANNEL_ID_',
        client: '_CLIENT_ID_',
        ref: LiffReferer.Group,
        os: LiffOs.Ios,
        lang: 'zh-TW',
        user: '_USER_ID_',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '_CLIENT_ID_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: null,
        refererType: 'group',
        os: 'ios',
        language: 'zh-TW',
      },
    });
  });

  it('resolve room chat', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(
      authenticator.checkAuthData({
        provider: '_PROVIDER_ID_',
        channel: '_BOT_CHANNEL_ID_',
        client: '_CLIENT_ID_',
        ref: LiffReferer.Room,
        os: LiffOs.Android,
        lang: 'jp',
        user: '_USER_ID_',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '_CLIENT_ID_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: null,
        refererType: 'room',
        os: 'android',
        language: 'jp',
      },
    });
  });
});

test('.closeWebview', async () => {
  const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });
  await authenticator.init();

  expect(authenticator.closeWebview()).toBe(true);
  expect(liff.closeWindow).toHaveBeenCalledTimes(1);
});
