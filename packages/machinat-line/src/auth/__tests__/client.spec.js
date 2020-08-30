import url from 'url';
import { JSDOM } from 'jsdom';
import moxy from '@moxyjs/moxy';
import ClientAuthorizer from '../client';
import LineChannel from '../../channel';
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
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
    });

    expect(authorizer.platform).toBe('line');
    expect(authorizer.shouldResign).toBe(true);
    expect(authorizer.liffId).toBe('_LIFF_ID_');
    expect(authorizer.providerId).toBe('_PROVIDER_ID_');
    expect(authorizer.isSDKLoaded).toBe(false);
  });

  it('throw if providerId id is empty', () => {
    expect(
      () =>
        new ClientAuthorizer({
          botChannelId: '_BOT_CHANNEL_ID_',
          liffId: '_LIFF_ID_',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.providerId must not be empty"`
    );
  });

  it('throw if botChannelId id is empty', () => {
    expect(
      () =>
        new ClientAuthorizer({
          providerId: '_PROVIDER_ID_',
          liffId: '_LIFF_ID_',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.botChannelId must not be empty"`
    );
  });

  it('throw if liff id is empty', () => {
    expect(
      () =>
        new ClientAuthorizer({
          providerId: '_PROVIDER_ID_',
          botChannelId: '_BOT_CHANNEL_ID_',
        })
    ).toThrowErrorMatchingInlineSnapshot(`"options.liffId must not be empty"`);
  });
});

describe('#init()', () => {
  it('add liff sdk and call init() after loaded', async () => {
    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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

  it('ignore adding sdk if options.isSDKLoaded set to true', async () => {
    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(authorizer.init()).resolves.toBe(undefined);

    expect(global.document.getElementById('LIFF')).toBe(null);
    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);
  });

  it('call liff.login() if isLoggedIn() is false', async () => {
    global.liff.isLoggedIn.mock.fakeReturnValue(false);

    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
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
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        data: {
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

  it('set fromBotChannel options.fromBotChannel is true', async () => {
    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
      fromBotChannel: true,
    });

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        data: {
          fromBotChannel: '_BOT_CHANNEL_ID_',
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

  it('set fromBotChannel if "fromBotChannel" in query param is truthy', async () => {
    global.window.location.mock
      .getter('search')
      .fakeReturnValue('?fromBotChannel=true');

    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        accessToken: '_ACCESS_TOKEN_',
        data: {
          fromBotChannel: '_BOT_CHANNEL_ID_',
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
  it('return channel and user according to auth data', async () => {
    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', '_USER_ID_'),
      channel: new LineChannel(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        'utou',
        '_UTOU_ID_'
      ),
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        contextType: 'external',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', '_USER_ID_'),
      channel: null,
    });
  });

  it('return utob channel if botChannelId exist in data', async () => {
    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        fromBotChannel: '_BOT_CHANNEL_ID_',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_BOT_CHANNEL_ID_', '_USER_ID_'),
      channel: new LineChannel(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        'utob',
        '_USER_ID_'
      ),
    });
  });

  it('return null if data.fromBotChannel not match', async () => {
    const authorizer = new ClientAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        fromBotChannel: '_SOME_OTHER_BOT_CHANNEL_ID_',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toBe(null);
  });
});
