import moxy from 'moxy';
import { ServerResponse } from 'http';
import ServerAuthProvider from '../server';
import MessengerChannel from '../../channel';
import { MessengerUser } from '../../user';

const request = {
  url: '/foo',
  type: 'GET',
  headers: {},
};

beforeEach(() => {});

describe('#constructor(options)', () => {
  it('is messenger platform', () => {
    expect(new ServerAuthProvider({ appSecret: 'SECRET' }).platform).toBe(
      'messenger'
    );
  });

  it('throw if options.appSecret not given', () => {
    expect(() => new ServerAuthProvider()).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret must not be empty"`
    );
    expect(() => new ServerAuthProvider({})).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret must not be empty"`
    );
  });
});

describe('#handleAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const provider = new ServerAuthProvider({ appSecret: '_APP_SECRET_' });
    const res = moxy(new ServerResponse({}));

    await expect(provider.handleAuthRequest(request, res)).resolves.toBe(
      undefined
    );

    expect(res.statusCode).toBe(403);
    expect(res.end.mock).toHaveBeenCalled();
  });
});

describe('#verifyAuthData(data)', () => {
  it('resolve auth context if verification ok', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'APP_SECRET' });
    const extContext = {
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
      signed_request:
        'djtx96RQaNCtszsQ7GOIXy8jBF659cNCBVM69n3g6h8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    };

    await expect(
      provider.verifyAuthData({ data: extContext })
    ).resolves.toStrictEqual({
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
      data: extContext,
    });
  });

  it('reject if context invalid', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'APP_SECRET' });

    await expect(
      provider.verifyAuthData({ data: null })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"invalid extension context"`);
    await expect(
      provider.verifyAuthData({ data: {} })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"invalid extension context"`);
    await expect(
      provider.verifyAuthData({ data: { signed_request: 'invalid content' } })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"invalid signed request"`);
  });

  it('reject if signature verification fail', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'APP_SECRET' });
    const extContext = {
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
      signed_request:
        '__invalid_signature_part__.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    };

    await expect(
      provider.verifyAuthData({ data: extContext })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"invalid signature"`);
  });
});

describe('#refineAuthData(data)', () => {
  it('resolve auth context form extension context', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'SECRET' });
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
    const provider = new ServerAuthProvider({ appSecret: 'SECRET' });

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
