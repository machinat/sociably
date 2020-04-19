import { JSDOM } from 'jsdom';
import moxy from 'moxy';
import LineClientAuthProvider from '../client';
import { LineUser } from '../../user';

global.liff = moxy({
  init: () => Promise.resolve(),
  getOS: () => 'ios',
  getLanguage: () => 'zh-TW',
  getVersion: () => 'v2.1',
  isInClient: () => true,
  isLoggedIn: () => true,
  login: () => {},
  getAccessToken: () => '_ACCESS_TOKEN_',
  getProfile: () =>
    Promise.resolve({
      userId: '_USER_ID_',
      displayName: 'John',
      pictureUrl: 'https://example.com/abcdefghijklmn',
      statusMessage: 'Hello, LINE!',
    }),
});

beforeEach(() => {
  global.window = moxy();
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
    const provider = new LineClientAuthProvider({
      channelId: '_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
    });

    expect(provider.platform).toBe('line');
    expect(provider.shouldResign).toBe(true);
    expect(provider.liffId).toBe('_LIFF_ID_');
    expect(provider.isSDKLoaded).toBe(false);
  });

  it('throw if liff id is empty', () => {
    expect(
      () => new LineClientAuthProvider({})
    ).toThrowErrorMatchingInlineSnapshot(`"options.liffId must not be empty"`);
  });
});

describe('#init()', () => {
  it('add liff sdk and call init() after loaded', async () => {
    const provider = new LineClientAuthProvider({
      liffId: '_LIFF_ID_',
    });

    const promise = provider.init();

    const liffScriptEle = global.document.getElementById('LIFF');
    expect(liffScriptEle.tagName).toBe('SCRIPT');
    expect(liffScriptEle.getAttribute('src')).toBe(
      'https://static.line-scdn.net/liff/edge/2.1/sdk.js'
    );
    expect(global.liff.init.mock).not.toHaveBeenCalled();

    liffScriptEle.onload();

    await expect(promise).resolves.toBe(undefined);
    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);
    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });

  it('ignore adding sdk if options.isSDKLoaded set to true', async () => {
    const provider = new LineClientAuthProvider({
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(provider.init()).resolves.toBe(undefined);

    expect(global.document.getElementById('LIFF')).toBe(null);
    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);
  });
});

describe('#fetchCredential()', () => {
  it('resolve credential containt liff infos and access token', async () => {
    const provider = new LineClientAuthProvider({
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    await expect(provider.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        os: 'ios',
        language: 'zh-TW',
        version: 'v2.1',
        isInClient: true,
        accessToken: '_ACCESS_TOKEN_',
      },
    });

    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });

  it('login() if isLoggedIn() is false', async () => {
    jest.useFakeTimers();
    global.liff.isLoggedIn.mock.fakeReturnValue(false);

    const provider = new LineClientAuthProvider({
      liffId: '_LIFF_ID_',
    });

    expect(global.liff.login.mock).not.toHaveBeenCalled();

    const promise = provider.fetchCredential();

    expect(global.liff.isLoggedIn.mock).toHaveBeenCalledTimes(1);
    expect(global.liff.login.mock).toHaveBeenCalledTimes(1);

    // resolves unaccepted if location not redircted in time
    jest.advanceTimersByTime(10000000);
    await expect(promise).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 408,
              "reason": "timeout for redirecting to line login",
              "success": false,
            }
          `);

    jest.useRealTimers();
  });
});

describe('#refineAuth(data)', () => {
  const authData = {
    os: 'ios',
    language: 'zh-TW',
    version: 'v2.1',
    isInClient: true,
    profile: {
      userId: '_USER_ID_',
      displayName: 'John',
      pictureUrl: 'https://example.com/abcdefghijklmn',
      statusMessage: 'Hello, LINE!',
    },
  };

  it('resolve context according to auth data', async () => {
    const provider = new LineClientAuthProvider({
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });
    await expect(provider.refineAuth(authData)).resolves.toEqual({
      user: new LineUser('_USER_ID_'),
      authorizedChannel: null,
    });
  });

  it('resolve null if profile is empty', async () => {
    const provider = new LineClientAuthProvider({
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });
    await expect(provider.refineAuth({})).resolves.toBe(null);
  });
});
