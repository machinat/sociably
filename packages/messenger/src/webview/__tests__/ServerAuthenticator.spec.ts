import moxy from '@moxyjs/moxy';
import { IncomingMessage, ServerResponse } from 'http';
import { MessengerServerAuthenticator } from '../ServerAuthenticator';
import MessengerChannel from '../../Chat';
import MessengerUser from '../../User';
import { MessengerChatType } from '../../constant';

const request: IncomingMessage = {
  url: '/foo',
  type: 'GET',
  headers: {},
} as never;

const appSecret = 'APP_SECRET';
const pageId = 1234567890;

describe('#constructor(options)', () => {
  it('is messenger platform', () => {
    expect(
      new MessengerServerAuthenticator({ appSecret, pageId }).platform
    ).toBe('messenger');
  });

  it('throw if options.appSecret not given', () => {
    expect(
      () => new MessengerServerAuthenticator(undefined as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret must not be empty"`
    );
    expect(
      () => new MessengerServerAuthenticator({ pageId } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret must not be empty"`
    );
  });

  it('throw if options.pageId not given', () => {
    expect(
      () => new MessengerServerAuthenticator({ appSecret } as never)
    ).toThrowErrorMatchingInlineSnapshot(`"options.pageId must not be empty"`);
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });
    const res = moxy(new ServerResponse({} as never));

    await expect(authenticator.delegateAuthRequest(request, res)).resolves.toBe(
      undefined
    );

    expect(res.statusCode).toBe(403);
    expect(res.end.mock).toHaveBeenCalled();
  });
});

describe('#verifyCredential(credential)', () => {
  const MockDate = moxy(Date);
  const _Date = Date;

  beforeAll(() => {
    global.Date = MockDate;
  });

  afterAll(() => {
    global.Date = _Date;
  });

  beforeEach(() => {
    MockDate.mock.reset();
  });

  it('resolve auth context if verification ok', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });
    MockDate.now.mock.fake(() => 1504046389999);

    await expect(
      authenticator.verifyCredential({
        signedRequest:
          'djtx96RQaNCtszsQ7GOIXy8jBF659cNCBVM69n3g6h8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
        client: 'messenger',
      })
    ).resolves.toStrictEqual({
      success: true,
      data: {
        page: 682498171943165,
        user: '1254459154682919',
        chat: {
          id: '1254459154682919',
          type: MessengerChatType.UserToPage,
        },
        client: 'messenger',
      },
    });
  });

  it('fail if context is invalid', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });

    await expect(authenticator.verifyCredential(null as never)).resolves
      .toMatchInlineSnapshot(`
                      Object {
                        "code": 400,
                        "reason": "invalid extension context",
                        "success": false,
                      }
                `);
    await expect(authenticator.verifyCredential({} as never)).resolves
      .toMatchInlineSnapshot(`
                      Object {
                        "code": 400,
                        "reason": "invalid extension context",
                        "success": false,
                      }
                `);
    await expect(
      authenticator.verifyCredential({
        signedRequest: 'invalid content',
        client: 'messenger',
      })
    ).resolves.toMatchInlineSnapshot(`
                  Object {
                    "code": 400,
                    "reason": "invalid signed request token",
                    "success": false,
                  }
              `);
  });

  it('fail if signature is invalid', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });

    await expect(
      authenticator.verifyCredential({
        signedRequest:
          '__invalid_signature_part__.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
        client: 'messenger',
      })
    ).resolves.toMatchInlineSnapshot(`
                    Object {
                      "code": 401,
                      "reason": "invalid signature",
                      "success": false,
                    }
              `);
  });

  it('fail is signed request token is outdated', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
      issueTimeLimit: 999,
    });
    MockDate.now.mock.fake(() => 1504047380000);

    await expect(
      authenticator.verifyCredential({
        signedRequest:
          'djtx96RQaNCtszsQ7GOIXy8jBF659cNCBVM69n3g6h8.eyJhbGdvcml0aG0iOiJITUFDLVNIQTI1NiIsImlzc3VlZF9hdCI6MTUwNDA0NjM4MCwicGFnZV9pZCI6NjgyNDk4MTcxOTQzMTY1LCJwc2lkIjoiMTI1NDQ1OTE1NDY4MjkxOSIsInRocmVhZF90eXBlIjoiVVNFUl9UT19QQUdFIiwidGlkIjoiMTI1NDQ1OTE1NDY4MjkxOSJ9',
        client: 'messenger',
      })
    ).resolves.toMatchInlineSnapshot(`
                  Object {
                    "code": 401,
                    "reason": "signed request token timeout",
                    "success": false,
                  }
              `);
  });
});

describe('#verifyRefreshment()', () => {
  it('return success and original data', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });
    const authData = {
      page: pageId,
      user: '1254459154682919',
      chat: {
        type: MessengerChatType.UserToPage,
        id: '1254459154682919',
      },
      client: 'facebook' as const,
    };

    await expect(authenticator.verifyRefreshment(authData)).resolves.toEqual({
      success: true,
      data: authData,
    });
  });

  it('fail is pageId not match', async () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });

    await expect(
      authenticator.verifyRefreshment({
        page: 666666666,
        user: '1254459154682919',
        chat: {
          type: MessengerChatType.UserToPage,
          id: '1254459154682919',
        },
        client: 'facebook',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "page not match",
              "success": false,
            }
          `);
  });
});

describe('#checkAuthContext(data)', () => {
  it('resolve auth context form extension context', () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });
    expect(
      authenticator.checkAuthContext({
        page: pageId,
        user: '1254459154682919',
        chat: {
          type: MessengerChatType.UserToPage,
          id: '1254459154682919',
        },
        client: 'messenger',
      })
    ).toEqual({
      success: true,
      contextSupplment: {
        pageId,
        user: new MessengerUser(pageId, '1254459154682919'),
        channel: new MessengerChannel(pageId, {
          id: '1254459154682919',
        }),
        clientType: 'messenger',
      },
    });
  });

  it('fail if pageId not match', () => {
    const authenticator = new MessengerServerAuthenticator({
      pageId,
      appSecret,
    });

    expect(
      authenticator.checkAuthContext({
        page: 666666666666,
        user: '1254459154682919',
        chat: {
          type: MessengerChatType.UserToPage,
          id: '1254459154682919',
        },
        client: 'messenger',
      })
    ).toMatchInlineSnapshot(`
      Object {
        "code": 400,
        "reason": "page not match",
        "success": false,
      }
    `);
  });
});
