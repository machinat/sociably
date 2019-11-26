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

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const provider = new ServerAuthProvider({ appSecret: '_APP_SECRET_' });
    const res = moxy(new ServerResponse({}));

    await expect(provider.delegateAuthRequest(request, res)).resolves.toBe(
      undefined
    );

    expect(res.statusCode).toBe(403);
    expect(res.end.mock).toHaveBeenCalled();
  });
});

describe('#verifySigning(credential)', () => {
  it('resolve auth context if verification ok', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'APP_SECRET' });
    const credential = {
      signedRequest:
        'djtx96RQaNCtszsQ7GOIXy8jBF659cNCBVM69n3g6h8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    };

    await expect(provider.verifySigning(credential)).resolves.toStrictEqual({
      accepted: true,
      refreshable: false,
      data: {
        algorithm: 'HMAC-SHA256',
        issued_at: 1504046380,
        page_id: 682498171943165,
        psid: '1254459154682919',
        thread_type: 'USER_TO_PAGE',
        tid: '1254459154682919',
      },
    });
  });

  it('reject if context invalid', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'APP_SECRET' });

    await expect(provider.verifySigning(null)).resolves.toMatchInlineSnapshot(`
            Object {
              "accepted": false,
              "code": 400,
              "message": "invalid extension context",
            }
          `);
    await expect(provider.verifySigning({})).resolves.toMatchInlineSnapshot(`
            Object {
              "accepted": false,
              "code": 400,
              "message": "invalid extension context",
            }
          `);
    await expect(provider.verifySigning({ signed_request: 'invalid content' }))
      .resolves.toMatchInlineSnapshot(`
            Object {
              "accepted": false,
              "code": 400,
              "message": "invalid extension context",
            }
          `);
  });

  it('reject if signature verification fail', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'APP_SECRET' });
    const credentrial = {
      signedRequest:
        '__invalid_signature_part__.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
    };

    await expect(provider.verifySigning(credentrial)).resolves
      .toMatchInlineSnapshot(`
          Object {
            "accepted": false,
            "code": 401,
            "message": "invalid signature",
          }
      `);
  });
});

describe('#verifyRefreshment()', () => {
  it('return unaccepted anyway', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'SECRET' });

    await expect(provider.verifyRefreshment({})).resolves
      .toMatchInlineSnapshot(`
          Object {
            "accepted": false,
            "code": 403,
            "message": "should resign only",
          }
      `);
  });
});

describe('#refineAuth(data)', () => {
  it('resolve auth context form extension context', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'SECRET' });
    const context = {
      algorithm: 'HMAC-SHA256',
      issued_at: 1504046380,
      page_id: 682498171943165,
      psid: '1254459154682919',
      thread_type: 'USER_TO_PAGE',
      tid: '1254459154682919',
    };

    await expect(provider.refineAuth(context)).resolves.toEqual({
      channel: MessengerChannel.fromExtensionContext(context),
      user: new MessengerUser(682498171943165, '1254459154682919'),
    });
  });

  it('resolve null if extension context invalid', async () => {
    const provider = new ServerAuthProvider({ appSecret: 'SECRET' });

    await expect(provider.refineAuth()).resolves.toBe(null);
    await expect(provider.refineAuth({})).resolves.toBe(null);
  });
});
