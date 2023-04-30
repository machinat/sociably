import url from 'url';
import _liff from '@line/liff';
import moxy, { Moxy } from '@moxyjs/moxy';
import ClientAuthenticator from '../ClientAuthenticator';
import LineChannel from '../../Channel';
import LineChat from '../../Chat';
import LineUser from '../../User';
import GroupProfile from '../../GroupProfile';
import UserProfile from '../../UserProfile';
import { LiffOs, RefChatType } from '../constant';

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
    expect(authenticator.marshalTypes).toEqual(
      expect.arrayContaining([
        LineChannel,
        LineUser,
        LineChat,
        UserProfile,
        GroupProfile,
      ])
    );
  });

  test('use "liffId" querystring if not given in options', () => {
    window.mock
      .getter('location')
      .fakeReturnValue(
        url.parse('https://sociably.io/foo?bar=baz&liffId=_LIFF_ID_')
      );

    const authenticator = new ClientAuthenticator();
    expect(authenticator.liffId).toBe('_LIFF_ID_');
  });

  it('throw if liffId is empty', () => {
    expect(
      () => new ClientAuthenticator({} as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"liff id is required on either \`options.liffId\` or \`liffId\` query param"`
    );
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
  it('resolve credential data', async () => {
    liff.getContext.mock.fakeReturnValue(liffContext);

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });
    await authenticator.init();

    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        os: 'ios',
        contextType: 'utou',
        language: 'en-US',
        userId: '_USER_ID_',
      },
    });

    expect(liff.login).not.toHaveBeenCalled();
  });

  test('credential data with chat channel ID', async () => {
    liff.getContext.mock.fakeReturnValue({ ...liffContext, type: 'external' });
    window.mock
      .getter('location')
      .fakeReturnValue(
        url.parse(
          'https://sociably.io/foo?bar=baz&chatChannelId=_CHAT_CHANNEL_'
        )
      );

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });
    await authenticator.init();

    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        chatChannelId: '_CHAT_CHANNEL_',
        accessToken: '_ACCESS_TOKEN_',
        os: 'ios',
        contextType: 'external',
        language: 'en-US',
        userId: '_USER_ID_',
      },
    });
  });

  test('credential data with group chat', async () => {
    liff.getContext.mock.fakeReturnValue({ ...liffContext, type: 'group' });
    window.mock
      .getter('location')
      .fakeReturnValue(
        url.parse(
          'https://sociably.io/foo?bar=baz&chatChannelId=_CHAT_CHANNEL_&groupId=_GROUP_ID_'
        )
      );

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });
    await authenticator.init();

    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        chatChannelId: '_CHAT_CHANNEL_',
        groupId: '_GROUP_ID_',
        accessToken: '_ACCESS_TOKEN_',
        os: 'ios',
        contextType: 'group',
        language: 'en-US',
        userId: '_USER_ID_',
      },
    });
  });

  test('credential data with room chat', async () => {
    liff.getContext.mock.fakeReturnValue({ ...liffContext, type: 'room' });
    window.mock
      .getter('location')
      .fakeReturnValue(
        url.parse(
          'https://sociably.io/foo?bar=baz&chatChannelId=_CHAT_CHANNEL_&roomId=_ROOM_ID_'
        )
      );

    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });
    await authenticator.init();

    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        chatChannelId: '_CHAT_CHANNEL_',
        roomId: '_ROOM_ID_',
        accessToken: '_ACCESS_TOKEN_',
        os: 'ios',
        contextType: 'room',
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
  const authData = {
    provider: '_PROVIDER_ID_',
    channel: '_CHANNEL_ID_',
    client: '1234567890',
    ref: RefChatType.External,
    os: LiffOs.Web,
    lang: 'en-US',
    user: '_USER_ID_',
  };

  test('with no messaging channel', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(authenticator.checkAuthData(authData)).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        channel: null,
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: null,
        refChatType: 'external',
        os: 'web',
        language: 'en-US',
      },
    });
  });

  test('with private chat', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(
      authenticator.checkAuthData({
        ...authData,
        chan: '_CHANNEL_ID_',
        ref: RefChatType.Utou,
        os: LiffOs.Ios,
        lang: 'zh-TW',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        channel: new LineChannel('_CHANNEL_ID_'),
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'),
        refChatType: 'utou',
        os: 'ios',
        language: 'zh-TW',
      },
    });
  });

  test('with group chat', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(
      authenticator.checkAuthData({
        ...authData,
        chan: '_CHANNEL_ID_',
        group: '_GROUP_ID_',
        ref: RefChatType.Group,
        os: LiffOs.Ios,
        lang: 'zh-TW',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        channel: new LineChannel('_CHANNEL_ID_'),
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'),
        refChatType: 'group',
        os: 'ios',
        language: 'zh-TW',
      },
    });
  });

  test('with room chat', () => {
    const authenticator = new ClientAuthenticator({ liffId: '_LIFF_ID_' });

    expect(
      authenticator.checkAuthData({
        ...authData,
        chan: '_CHANNEL_ID_',
        room: '_ROOM_ID_',
        ref: RefChatType.Room,
        os: LiffOs.Android,
        lang: 'jp',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        channel: new LineChannel('_CHANNEL_ID_'),
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'),
        refChatType: 'room',
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
