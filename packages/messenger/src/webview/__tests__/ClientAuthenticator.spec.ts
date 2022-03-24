import moxy from '@moxyjs/moxy';
import { JSDOM } from 'jsdom';
import MessengerClientAuthenticator from '../ClientAuthenticator';
import MessengerChannel from '../../Chat';
import MessengerUser from '../../User';
import { MessengerChatType } from '../../constant';

const nextTick = () => new Promise(process.nextTick);

const MessengerExtensions = moxy({
  getContext: () => {},
  requestCloseBrowser: () => {},
});

const { document } = new JSDOM('').window;

const window = moxy({
  name: 'messenger_ref',
  MessengerExtensions,
  document,
  extAsyncInit: undefined,
});

beforeAll(() => {
  (global as any).window = window;
  (global as any).document = document;
  (global as any).MessengerExtensions = MessengerExtensions;
});

beforeEach(() => {
  window.extAsyncInit = undefined;
  window.mock.reset();
  MessengerExtensions.mock.reset();
  document.body.innerHTML = `
    <html>
      <head>
        <script src="..."/>
      </head>
      <body>
        <dev id="app"/>
      </body>
    </html>
  `;
});

describe('.constructor(options)', () => {
  test('properties', () => {
    const authenticator = new MessengerClientAuthenticator({ appId: 'MY_APP' });
    expect(authenticator.platform).toBe('messenger');
    expect(authenticator.appId).toBe('MY_APP');
    expect(authenticator.isSdkReady).toBe(false);
    expect(authenticator.marshalTypes.map((t) => t.name))
      .toMatchInlineSnapshot(`
      Array [
        "MessengerChat",
        "MessengerUser",
        "MessengerUserProfile",
      ]
    `);

    expect(
      new MessengerClientAuthenticator({ appId: 'MY_APP', isSdkReady: true })
        .isSdkReady
    ).toBe(true);
  });

  it('throw if appId not provided', () => {
    expect(
      () => new MessengerClientAuthenticator(undefined as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
    expect(
      () => new MessengerClientAuthenticator({} as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
  });
});

describe('.init()', () => {
  it('add extension script and callback', async () => {
    const authenticator = new MessengerClientAuthenticator({
      appId: '_APP_ID_',
    });
    const promise = authenticator.init();

    const extScriptEle = document.getElementById('Messenger') as HTMLElement;
    expect(extScriptEle.tagName).toBe('SCRIPT');
    expect(extScriptEle.getAttribute('src')).toBe(
      '//connect.facebook.net/en_US/messenger.Extensions.js'
    );

    expect(window.mock.setter('extAsyncInit')).toHaveBeenCalledTimes(1);
    expect(typeof window.extAsyncInit).toBe('function');

    (window.extAsyncInit as any)();

    await expect(promise).resolves.toBe(undefined);
    expect(authenticator.extensionsSdk).toBe(MessengerExtensions);
  });

  it('do nothing if options.isSdkReady set to true', async () => {
    const authenticator = new MessengerClientAuthenticator({
      appId: '_APP_ID_',
      isSdkReady: true,
    });

    await expect(authenticator.init()).resolves.toBe(undefined);
    expect(authenticator.extensionsSdk).toBe(MessengerExtensions);

    expect(document.getElementById('Messenger')).toBe(null);
    expect(window.extAsyncInit).toBe(undefined);
  });

  it('throw if extAsyncInit take too long to called back', async () => {
    jest.useFakeTimers();

    const authenticator = new MessengerClientAuthenticator({
      appId: 'APP_ID',
      isSdkReady: false,
    });

    const promise = authenticator.init();

    jest.advanceTimersByTime(1000000);
    await nextTick();

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"extension initiation timeout"`
    );

    jest.useRealTimers();
  });
});

describe('.fetchCredential()', () => {
  const extensionContext = {
    psid: '1254459154682919',
    thread_type: 'USER_TO_PAGE',
    tid: '1254459154682919',
    signed_request:
      '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
  };

  it('resolve credential with signed request', async () => {
    const authenticator = new MessengerClientAuthenticator({
      appId: 'APP_ID',
      isSdkReady: true,
    });
    MessengerExtensions.getContext.mock.fake((_, cb) => cb(extensionContext));
    await authenticator.init();

    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        signedRequest: extensionContext.signed_request,
        client: 'messenger',
      },
    });

    expect(MessengerExtensions.getContext.mock).toHaveBeenCalledTimes(1);
    expect(MessengerExtensions.getContext.mock).toHaveBeenCalledWith(
      'APP_ID',
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('throw if getContext fail', async () => {
    const authenticator = new MessengerClientAuthenticator({
      appId: 'APP_ID',
      isSdkReady: true,
    });
    await authenticator.init();

    MessengerExtensions.getContext.mock.fake((_, cb, fail) => fail(-12345));

    await expect(authenticator.fetchCredential()).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 401,
              "ok": false,
              "reason": "Messenger extension error -12345",
            }
          `);
  });

  it('set client according to window.name', async () => {
    const authenticator = new MessengerClientAuthenticator({
      appId: 'APP_ID',
      isSdkReady: true,
    });
    MessengerExtensions.getContext.mock.fake((_, cb) => cb(extensionContext));
    await authenticator.init();

    window.mock.getter('name').fake(() => 'facebook_ref');
    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        signedRequest: extensionContext.signed_request,
        client: 'facebook',
      },
    });

    window.mock.getter('name').fake(() => 'messenger_ref');
    await expect(authenticator.fetchCredential()).resolves.toEqual({
      ok: true,
      credential: {
        signedRequest: extensionContext.signed_request,
        client: 'messenger',
      },
    });
  });
});

describe('.checkAuthData(data)', () => {
  it('resolve auth context form extension context', () => {
    const authenticator = new MessengerClientAuthenticator({
      appId: 'APP_ID',
      isSdkReady: true,
    });

    expect(
      authenticator.checkAuthData({
        page: 682498171943165,
        user: '1254459154682919',
        chat: {
          id: '1254459154682919',
          type: MessengerChatType.UserToPage,
        },
        client: 'messenger',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        user: new MessengerUser(682498171943165, '1254459154682919'),
        channel: new MessengerChannel(682498171943165, {
          id: '1254459154682919',
        }),
        pageId: 682498171943165,
        clientType: 'messenger',
      },
    });
  });
});

test('.closeWebview()', async () => {
  const authenticator = new MessengerClientAuthenticator({
    appId: 'APP_ID',
    isSdkReady: true,
  });
  await authenticator.init();

  expect(authenticator.closeWebview()).toBe(true);
  expect(MessengerExtensions.requestCloseBrowser.mock).toHaveBeenCalledTimes(1);
  expect(MessengerExtensions.requestCloseBrowser.mock).toHaveBeenCalledWith(
    expect.any(Function),
    expect.any(Function)
  );
});
