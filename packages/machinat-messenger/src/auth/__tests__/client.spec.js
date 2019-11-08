import moxy from 'moxy';
import { JSDOM } from 'jsdom';
import ClientAuthProvider from '../client';
import MessengerChannel from '../../channel';
import { MessengerUser } from '../../user';

const nextTick = () => new Promise(process.nextTick);

global.MessengerExtensions = moxy({
  getContext: () => {},
});

beforeEach(() => {
  global.window = moxy();
  global.MessengerExtensions.mock.reset();

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

afterEach(() => {
  global.document = undefined;
});

describe('#constructor(options)', () => {
  it('is messenger platform', () => {
    expect(new ClientAuthProvider({ appId: 'MY_APP' }).platform).toBe(
      'messenger'
    );
  });

  it('throw if appId not provided', () => {
    expect(() => new ClientAuthProvider()).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
    expect(() => new ClientAuthProvider({})).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
  });
});

describe('#init()', () => {
  it('add extension script and callback', () => {
    const provider = new ClientAuthProvider({ appId: '_APP_ID_' });
    expect(provider.init()).toBe(undefined);

    const extScriptEle = global.document.getElementById('Messenger');
    expect(extScriptEle.tagName).toBe('SCRIPT');
    expect(extScriptEle.getAttribute('src')).toBe(
      '//connect.facebook.net/en_US/messenger.Extensions.js'
    );

    expect(global.window.mock.setter('extAsyncInit')).toHaveBeenCalledTimes(1);
    expect(typeof global.window.extAsyncInit).toBe('function');

    global.window.extAsyncInit();
  });

  it('do nothing if options.isExtensionReady set to true', () => {
    const provider = new ClientAuthProvider({
      appId: '_APP_ID_',
      isExtensionReady: true,
    });
    expect(provider.init()).toBe(undefined);

    expect(global.document.getElementById('Messenger')).toBe(null);
    expect(global.window.extAsyncInit).toBe(undefined);
  });
});

describe('#startAuthFlow()', () => {
  it('work if options.isExtensionReady set to true', async () => {
    const provider = new ClientAuthProvider({
      appId: 'APP_ID',
      isExtensionReady: true,
    });

    provider.init();
    const promise = provider.startAuthFlow();

    const getContextMock = global.MessengerExtensions.getContext.mock;
    expect(getContextMock).toHaveBeenCalledTimes(1);
    expect(getContextMock).toHaveBeenCalledWith(
      'APP_ID',
      expect.any(Function),
      expect.any(Function)
    );

    const [, resolve] = getContextMock.calls[0].args;
    const chatContext = {
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
      signed_request:
        '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    };
    resolve(chatContext);

    const { channel, user, data, loginAt } = await promise;

    expect(channel).toStrictEqual(
      MessengerChannel.fromExtensionContext({
        algorithm: 'HMAC-SHA256',
        issued_at: 1504046380,
        page_id: 682498171943165,
        psid: '1254459154682919',
        thread_type: 'USER_TO_PAGE',
        tid: '1254459154682919',
      })
    );
    expect(user).toStrictEqual(
      new MessengerUser(682498171943165, '1254459154682919')
    );
    expect(loginAt.valueOf()).toBe(1504046380000);
    expect(data).toEqual(chatContext);
  });

  it('wait extAsyncInit if options.isExtensionReady is falsy', async () => {
    const provider = new ClientAuthProvider({
      appId: 'APP_ID',
    });

    provider.init();
    provider.startAuthFlow();

    const getContextMock = global.MessengerExtensions.getContext.mock;
    expect(getContextMock).not.toHaveBeenCalled();

    global.window.extAsyncInit();
    await nextTick();

    expect(getContextMock).toHaveBeenCalledTimes(1);
    expect(getContextMock).toHaveBeenCalledWith(
      'APP_ID',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('throw if getContext fail', async () => {
    const provider = new ClientAuthProvider({
      appId: 'APP_ID',
      isExtensionReady: true,
    });

    provider.init();
    const promise = provider.startAuthFlow();

    const getContextMock = global.MessengerExtensions.getContext.mock;
    expect(getContextMock).toHaveBeenCalledTimes(1);

    const [, , reject] = getContextMock.calls[0].args;
    reject(new Error('somthing wrong!'));

    await expect(promise).rejects.toThrowError(new Error('somthing wrong!'));
  });

  it('throw if extAsyncInit not being called in initTimeout', async () => {
    jest.useFakeTimers();

    const provider = new ClientAuthProvider({
      appId: 'APP_ID',
      initTimeout: 1000000,
      isExtensionReady: false,
    });

    provider.init();
    const promise = provider.startAuthFlow();

    jest.advanceTimersByTime(1000000);
    await nextTick();

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"extension initiation timeout"`
    );
    expect(global.MessengerExtensions.getContext.mock).not.toHaveBeenCalled();

    jest.useRealTimers();
  });
});

describe('#refineAuthData(data)', () => {
  it('resolve auth context form extension context', async () => {
    const provider = new ClientAuthProvider({
      appId: 'APP_ID',
      isExtensionReady: true,
    });
    const extCtx = {
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
      signed_request:
        '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    };

    await expect(provider.refineAuthData({ data: extCtx })).resolves.toEqual({
      channel: MessengerChannel.fromExtensionContext({
        algorithm: 'HMAC-SHA256',
        issued_at: 1504046380,
        page_id: 682498171943165,
        psid: '1254459154682919',
        thread_type: 'USER_TO_PAGE',
        tid: '1254459154682919',
      }),
      user: new MessengerUser(682498171943165, '1254459154682919'),
      loginAt: new Date(1504046380000),
      data: extCtx,
    });
  });

  it('resolve null if extension context invalid', async () => {
    const provider = new ClientAuthProvider({
      appId: 'APP_ID',
      isExtensionReady: true,
    });

    await expect(provider.refineAuthData({ data: null })).resolves.toBe(null);
    await expect(provider.refineAuthData({ data: {} })).resolves.toBe(null);
    await expect(
      provider.refineAuthData({
        data: {
          psid: '1254459154682919',
          thread_type: 'USER_TO_PAGE',
          tid: '1254459154682919',
          signed_request: 'somthing invalid',
        },
      })
    ).resolves.toBe(null);
  });
});
