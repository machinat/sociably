import { JSDOM } from 'jsdom';
import moxy from 'moxy';
import LineClientAuthProvider from '../client';
import { LineUser } from '../../user';

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

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
  it('ok', () => {
    const provider = new LineClientAuthProvider({
      channelId: '_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
    });

    expect(provider.platform).toBe('line');
    expect(provider.options).toEqual({
      channelId: '_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: false,
    });
  });

  it('throw if liff id is empty', () => {
    expect(
      () => new LineClientAuthProvider({ channelId: '_CHANNEL_ID_' })
    ).toThrowErrorMatchingInlineSnapshot(`"options.liffId must not be empty"`);
  });

  it('throw if channl id is empty', () => {
    expect(
      () => new LineClientAuthProvider({ liffId: '_LIFF_ID_' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.channelId must not be empty"`
    );
  });
});

describe('#init()', () => {
  it('add liff sdk and init() after loaded', async () => {
    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
    });

    provider.init();

    const liffScriptEle = global.document.getElementById('LIFF');
    expect(liffScriptEle.tagName).toBe('SCRIPT');
    expect(liffScriptEle.getAttribute('src')).toBe(
      'https://static.line-scdn.net/liff/edge/2.1/sdk.js'
    );
    expect(global.liff.init.mock).not.toHaveBeenCalled();

    liffScriptEle.onload();

    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);

    await nextTick();
    expect(global.liff.login.mock).not.toHaveBeenCalled();
  });

  it('ignore adding sdk if options.isSDKLoaded set to true', () => {
    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });

    provider.init();

    expect(global.document.getElementById('LIFF')).toBe(null);
    expect(global.liff.init.mock).toHaveBeenCalledTimes(1);
  });

  it('login() after init() if isLoggedIn() is false', async () => {
    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
    });

    global.liff.isLoggedIn.mock.fakeReturnValue(false);

    provider.init();
    global.document.getElementById('LIFF').onload();
    expect(global.liff.login.mock).not.toHaveBeenCalled();

    await nextTick();
    expect(global.liff.login.mock).toHaveBeenCalledTimes(1);
  });
});

describe('#startAuthFlow()', () => {
  it('wait init() then resolve liff infos', async () => {
    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });
    provider.init();

    const promise = provider.startAuthFlow();

    expect(global.liff.getProfile.mock).not.toHaveBeenCalled();
    await nextTick();
    expect(global.liff.getProfile.mock).toHaveBeenCalledTimes(1);

    await expect(promise).resolves.toEqual({
      user: new LineUser('_LINE_CHANNEL_ID_', '_USER_ID_'),
      channel: null,
      loginAt: expect.any(Date),
      data: {
        os: 'ios',
        language: 'zh-TW',
        version: 'v2.1',
        isInClient: true,
        idLoggedIn: true,
        accessToken: '_ACCESS_TOKEN_',
        profile: {
          userId: '_USER_ID_',
          displayName: 'John',
          pictureUrl: 'https://example.com/abcdefghijklmn',
          statusMessage: 'Hello, LINE!',
        },
        loginTime: expect.any(Number),
      },
    });
  });

  it('throw if not isLoggedIn() but not redirect in time', async () => {
    jest.useFakeTimers();
    global.liff.isLoggedIn.mock.fakeReturnValue(false);

    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });
    provider.init();
    await nextTick();

    const promise = provider.startAuthFlow();
    jest.advanceTimersByTime(10000000);

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"timeout for redirecting to line login"`
    );
    jest.useRealTimers();
  });
});

describe('#refineAuthData(data)', () => {
  const authData = {
    os: 'ios',
    language: 'zh-TW',
    version: 'v2.1',
    isInClient: true,
    idLoggedIn: true,
    accessToken: '_ACCESS_TOKEN_',
    profile: {
      userId: '_USER_ID_',
      displayName: 'John',
      pictureUrl: 'https://example.com/abcdefghijklmn',
      statusMessage: 'Hello, LINE!',
    },
    loginTime: 1573530545840,
  };

  it('resolve context according to auth data', async () => {
    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });
    await expect(provider.refineAuthData({ data: authData })).resolves.toEqual({
      channel: null,
      user: new LineUser('_LINE_CHANNEL_ID_', '_USER_ID_'),
      loginAt: new Date(1573530545840),
      data: authData,
    });
  });

  it('resolve null if profile is empty', async () => {
    const provider = new LineClientAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
      liffId: '_LIFF_ID_',
      isSDKLoaded: true,
    });
    await expect(provider.refineAuthData({ data: {} })).resolves.toBe(null);
  });
});
