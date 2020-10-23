import url from 'url';
import { JSDOM } from 'jsdom';
import moxy from '@moxyjs/moxy';
import ClientAuthorizer from '../client';
import LineChat from '../../channel';
import LineUser from '../../user';

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

global.window = moxy(
  { location: url.parse('/') },
  { includeProperties: ['location'] }
);

beforeAll(() => {
  global.liff = moxy({
    init: () => Promise.resolve(),
    getOS: () => 'ios',
    getLanguage: () => 'zh-TW',
    getVersion: () => 'v2.1',
    isInClient: () => true,
    isLoggedIn: () => true,
    login: () => {},
    getAccessToken: () => '_ACCESS_TOKEN_',
    getContext: () => liffContext,
    getProfile: () =>
      Promise.resolve({
        userId: '_USER_ID_',
        displayName: 'John',
        pictureUrl: 'https://example.com/abcdefghijklmn',
        statusMessage: 'Hello, LINE!',
      }),
  });
});

beforeEach(() => {
  global.window.mock.reset();
  global.liff.mock.reset();

  global.document = new JSDOM(`
    <html>
      <head>
        <script src="..."/>
      </head>
      <body>
        <dev id="app"/>
      </body>
    </html>
  `).window.document;
});

describe('#constructor()', () => {
  it('contain proper property', () => {
    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
    });

    expect(authorizer.platform).toBe('line');
    expect(authorizer.shouldResign).toBe(true);
    expect(authorizer.liffId).toBe('_LIFF_ID_');
    expect(authorizer.shouldLoadSDK).toBe(true);
  });

  it('throw if liff id is empty', () => {
    expect(() => new ClientAuthorizer({})).toThrowErrorMatchingInlineSnapshot(
      `"options.liffId must not be empty"`
    );
  });
});

describe('#init()', () => {
  it('add liff sdk and call init() after loaded', async () => {
    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
    });

    const promise = authorizer.init();

    const liffScriptEle = global.document.getElementById('LIFF');
    expect(liffScriptEle.tagName).toBe('SCRIPT');
    expect(liffScriptEle.getAttribute('src')).toBe(
      'https://static.line-scdn.net/liff/edge/2/sdk.js'
    );
    expect(global.liff.init.mock).not.toHaveBeenCalled();

    liffScriptEle.onload();

    await expect(promise).resolves.toBe(undefined);
    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);
    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });

  it('skip adding sdk if options.shouldLoadSDK set to false', async () => {
    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
      shouldLoadSDK: false,
    });

    await expect(authorizer.init()).resolves.toBe(undefined);

    expect(global.document.getElementById('LIFF')).toBe(null);
    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);
  });

  it('call liff.login() if isLoggedIn() is false', async () => {
    global.liff.isLoggedIn.mock.fakeReturnValue(false);

    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
      shouldLoadSDK: false,
    });

    expect(global.liff.login.mock).not.toHaveBeenCalled();

    await authorizer.init();

    expect(global.liff.isLoggedIn.mock).toHaveBeenCalledTimes(1);
    expect(global.liff.login.mock).toHaveBeenCalledTimes(1);
  });
});

describe('#fetchCredential()', () => {
  it('resolve credential containt liff infos and access token', async () => {
    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
      shouldLoadSDK: false,
    });

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        data: {
          userToBot: false,
          os: 'ios',
          language: 'zh-TW',
          contextType: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
        },
      },
    });

    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });

  it('set data.userToBot to true options.userToBot is true', async () => {
    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
      shouldLoadSDK: false,
      userToBot: true,
    });

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        data: {
          userToBot: true,
          os: 'ios',
          language: 'zh-TW',
          contextType: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
        },
      },
    });

    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });

  it('set data.userToBot to true if "userToBot" in query param is truthy', async () => {
    global.window.location.mock
      .getter('search')
      .fakeReturnValue('?userToBot=true');

    const authorizer = new ClientAuthorizer({
      liffId: '_LIFF_ID_',
      shouldLoadSDK: false,
    });

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        data: {
          userToBot: true,
          os: 'ios',
          language: 'zh-TW',
          contextType: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
        },
      },
    });

    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });
});

describe('#refineAuth(data)', () => {
  const authorizer = new ClientAuthorizer({
    liffId: '_LIFF_ID_',
    shouldLoadSDK: false,
  });

  it('resolve utou chat', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'utou', '_UTOU_ID_'),
    });
  });

  it('resolve group chat', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'group', '_GROUP_ID_'),
    });
  });

  it('resolve room chat', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'room',
        roomId: '_ROOM_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_'),
    });
  });

  it('resolve channel as null if contextType is external or none', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'web',
        language: 'zh-TW',
        contextType: 'external',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: null,
    });

    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'none',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: null,
    });
  });

  it('return utob channel if userToBot is true in data', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: true,
        os: 'ios',
        language: 'zh-TW',
        botChannel: '_BOT_CHANNEL_ID_',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'utob', '_USER_ID_'),
    });

    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: true,
        os: 'web',
        language: 'zh-TW',
        botChannel: '_BOT_CHANNEL_ID_',
        contextType: 'external',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'utob', '_USER_ID_'),
    });
  });
});
