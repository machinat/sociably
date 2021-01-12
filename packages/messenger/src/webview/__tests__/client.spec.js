import moxy from '@moxyjs/moxy';
import { JSDOM } from 'jsdom';
import MessengerClientAuthorizer from '../client';
import MessengerChannel from '../../channel';
import MessengerUser from '../../user';

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

describe('#constructor(options)', () => {
  it('contain proper property', () => {
    const provider = new MessengerClientAuthorizer({ appId: 'MY_APP' });
    expect(provider.platform).toBe('messenger');
    expect(provider.appId).toBe('MY_APP');
    expect(provider.isExtensionReady).toBe(false);

    expect(
      new MessengerClientAuthorizer({ appId: 'MY_APP', isExtensionReady: true })
        .isExtensionReady
    ).toBe(true);
  });

  it('throw if appId not provided', () => {
    expect(
      () => new MessengerClientAuthorizer()
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
    expect(
      () => new MessengerClientAuthorizer({})
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
  });
});

describe('#init()', () => {
  it('add extension script and callback', async () => {
    const provider = new MessengerClientAuthorizer({ appId: '_APP_ID_' });
    const promise = provider.init();

    const extScriptEle = global.document.getElementById('Messenger');
    expect(extScriptEle.tagName).toBe('SCRIPT');
    expect(extScriptEle.getAttribute('src')).toBe(
      '//connect.facebook.net/en_US/messenger.Extensions.js'
    );

    expect(global.window.mock.setter('extAsyncInit')).toHaveBeenCalledTimes(1);
    expect(typeof global.window.extAsyncInit).toBe('function');

    global.window.extAsyncInit();

    await expect(promise).resolves.toBe(undefined);
  });

  it('do nothing if options.isExtensionReady set to true', async () => {
    const provider = new MessengerClientAuthorizer({
      appId: '_APP_ID_',
      isExtensionReady: true,
    });

    await expect(provider.init()).resolves.toBe(undefined);

    expect(global.document.getElementById('Messenger')).toBe(null);
    expect(global.window.extAsyncInit).toBe(undefined);
  });

  it('throw if extAsyncInit not being called in initTimeout', async () => {
    jest.useFakeTimers();

    const provider = new MessengerClientAuthorizer({
      appId: 'APP_ID',
      initTimeout: 1000000,
      isExtensionReady: false,
    });

    const promise = provider.init();

    jest.advanceTimersByTime(1000000);
    await nextTick();

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"extension initiation timeout"`
    );

    jest.useRealTimers();
  });
});

describe('#fetchCredential()', () => {
  it('resolve credential with signed request', async () => {
    const provider = new MessengerClientAuthorizer({ appId: 'APP_ID' });

    const promise = provider.fetchCredential();

    const getContextMock = global.MessengerExtensions.getContext.mock;
    expect(getContextMock).toHaveBeenCalledTimes(1);
    expect(getContextMock).toHaveBeenCalledWith(
      'APP_ID',
      expect.any(Function),
      expect.any(Function)
    );

    const [, resolve] = getContextMock.calls[0].args;
    resolve({
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
      signed_request:
        '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    });

    await expect(promise).resolves.toEqual({
      success: true,
      credential: {
        signedRequest:
          '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
      },
    });
  });

  it('throw if getContext fail', async () => {
    const provider = new MessengerClientAuthorizer({ appId: 'APP_ID' });

    const promise = provider.fetchCredential();

    const getContextMock = global.MessengerExtensions.getContext.mock;
    expect(getContextMock).toHaveBeenCalledTimes(1);

    const [, , reject] = getContextMock.calls[0].args;
    reject(new Error('somthing wrong!'));

    await expect(promise).resolves.toEqual({
      success: false,
      code: 401,
      reason: 'somthing wrong!',
    });
  });
});

describe('#refineAuth(data)', () => {
  it('resolve auth context form extension context', async () => {
    const provider = new MessengerClientAuthorizer({
      appId: 'APP_ID',
      isExtensionReady: true,
    });
    const context = {
      algorithm: 'HMAC-SHA256',
      issued_at: 1504046380,
      page_id: 682498171943165,
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
    };

    await expect(provider.refineAuth(context)).resolves.toEqual({
      user: new MessengerUser(682498171943165, '1254459154682919'),
      channel: new MessengerChannel(682498171943165, {
        id: '1254459154682919',
      }),
    });
  });

  it('resolve null if extension context invalid', async () => {
    const provider = new MessengerClientAuthorizer({
      appId: 'APP_ID',
      isExtensionReady: true,
    });

    await expect(provider.refineAuth(null)).resolves.toBe(null);
    await expect(provider.refineAuth({})).resolves.toBe(null);
  });
});
