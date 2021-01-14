import moxy from '@moxyjs/moxy';
import { JSDOM } from 'jsdom';
import MessengerClientAuthorizer from '../client';
import MessengerChannel from '../../channel';
import MessengerUser from '../../user';

const nextTick = () => new Promise(process.nextTick);

const MessengerExtensions = moxy({
  getContext: () => {},
});

const { document } = new JSDOM('').window;

const window = moxy({
  name: 'messenger_ref',
  MessengerExtensions,
  document,
  extAsyncInit: undefined,
});

beforeAll(() => {
  global.window = window as never;
  global.document = document;
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

describe('#constructor(options)', () => {
  it('contain proper property', () => {
    const authorizer = new MessengerClientAuthorizer({ appId: 'MY_APP' });
    expect(authorizer.platform).toBe('messenger');
    expect(authorizer.appId).toBe('MY_APP');
    expect(authorizer.isExtensionReady).toBe(false);

    expect(
      new MessengerClientAuthorizer({ appId: 'MY_APP', isExtensionReady: true })
        .isExtensionReady
    ).toBe(true);
  });

  it('throw if appId not provided', () => {
    expect(
      () => new MessengerClientAuthorizer(undefined as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
    expect(
      () => new MessengerClientAuthorizer({} as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appId is required to retrieve chat context"`
    );
  });
});

describe('#init()', () => {
  it('add extension script and callback', async () => {
    const authorizer = new MessengerClientAuthorizer({ appId: '_APP_ID_' });
    const promise = authorizer.init();

    const extScriptEle = document.getElementById('Messenger') as HTMLElement;
    expect(extScriptEle.tagName).toBe('SCRIPT');
    expect(extScriptEle.getAttribute('src')).toBe(
      '//connect.facebook.net/en_US/messenger.Extensions.js'
    );

    expect(window.mock.setter('extAsyncInit')).toHaveBeenCalledTimes(1);
    expect(typeof window.extAsyncInit).toBe('function');

    (window.extAsyncInit as any)();

    await expect(promise).resolves.toBe(undefined);
  });

  it('do nothing if options.isExtensionReady set to true', async () => {
    const authorizer = new MessengerClientAuthorizer({
      appId: '_APP_ID_',
      isExtensionReady: true,
    });

    await expect(authorizer.init()).resolves.toBe(undefined);

    expect(document.getElementById('Messenger')).toBe(null);
    expect(window.extAsyncInit).toBe(undefined);
  });

  it('throw if extAsyncInit take too long to called back', async () => {
    jest.useFakeTimers();

    const authorizer = new MessengerClientAuthorizer({
      appId: 'APP_ID',
      isExtensionReady: false,
    });

    const promise = authorizer.init();

    jest.advanceTimersByTime(1000000);
    await nextTick();

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"extension initiation timeout"`
    );

    jest.useRealTimers();
  });
});

describe('#fetchCredential()', () => {
  const extensionContext = {
    psid: '1254459154682919',
    thread_type: 'USER_TO_PAGE',
    tid: '1254459154682919',
    signed_request:
      '5f8i9XXH2hEaykXHKFvu-E5Nr6QRqN002JO7yl-w_9o.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
  };

  it('resolve credential with signed request', async () => {
    const authorizer = new MessengerClientAuthorizer({ appId: 'APP_ID' });
    MessengerExtensions.getContext.mock.fake((_, cb) => cb(extensionContext));

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
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
    const authorizer = new MessengerClientAuthorizer({ appId: 'APP_ID' });

    MessengerExtensions.getContext.mock.fake((_, cb, fail) =>
      fail(new Error('somthing wrong!'))
    );

    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: false,
      code: 401,
      reason: 'somthing wrong!',
    });
  });

  it('set client according to window.name', async () => {
    const authorizer = new MessengerClientAuthorizer({ appId: 'APP_ID' });
    MessengerExtensions.getContext.mock.fake((_, cb) => cb(extensionContext));

    window.mock.getter('name').fake(() => 'facebook_ref');
    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        signedRequest: extensionContext.signed_request,
        client: 'facebook',
      },
    });

    window.mock.getter('name').fake(() => 'messenger_ref');
    await expect(authorizer.fetchCredential()).resolves.toEqual({
      success: true,
      credential: {
        signedRequest: extensionContext.signed_request,
        client: 'messenger',
      },
    });
  });
});

describe('#supplementContext(data)', () => {
  it('resolve auth context form extension context', async () => {
    const authorizer = new MessengerClientAuthorizer({
      appId: 'APP_ID',
      isExtensionReady: true,
    });

    await expect(
      authorizer.supplementContext({
        pageId: 682498171943165,
        userId: '1254459154682919',
        chatType: 'USER_TO_PAGE',
        chatId: '1254459154682919',
        client: 'messenger',
      })
    ).resolves.toEqual({
      user: new MessengerUser(682498171943165, '1254459154682919'),
      channel: new MessengerChannel(682498171943165, {
        id: '1254459154682919',
      }),
      pageId: 682498171943165,
      clientType: 'messenger',
    });
  });

  it('resolve null if extension context invalid', async () => {
    const authorizer = new MessengerClientAuthorizer({
      appId: 'APP_ID',
      isExtensionReady: true,
    });

    await expect(authorizer.supplementContext(null as never)).resolves.toBe(
      null
    );
    await expect(authorizer.supplementContext({} as never)).resolves.toBe(null);
  });
});
