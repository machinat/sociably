import moxy from '@moxyjs/moxy';
import { IncomingMessage, ServerResponse } from 'http';
import { MessengerServerAuthorizer } from '../server';
import MessengerChannel from '../../channel';
import MessengerUser from '../../user';
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
    expect(new MessengerServerAuthorizer({ appSecret, pageId }).platform).toBe(
      'messenger'
    );
  });

  it('throw if options.appSecret not given', () => {
    expect(
      () => new MessengerServerAuthorizer(undefined as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret must not be empty"`
    );
    expect(
      () => new MessengerServerAuthorizer({ pageId } as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.appSecret must not be empty"`
    );
  });

  it('throw if options.pageId not given', () => {
    expect(
      () => new MessengerServerAuthorizer({ appSecret } as never)
    ).toThrowErrorMatchingInlineSnapshot(`"options.pageId must not be empty"`);
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });
    const res = moxy(new ServerResponse({} as never));

    await expect(authorizer.delegateAuthRequest(request, res)).resolves.toBe(
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
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });
    MockDate.now.mock.fake(() => 1504046389999);

    await expect(
      authorizer.verifyCredential({
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
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });

    await expect(authorizer.verifyCredential(null as never)).resolves
      .toMatchInlineSnapshot(`
                      Object {
                        "code": 400,
                        "reason": "invalid extension context",
                        "success": false,
                      }
                `);
    await expect(authorizer.verifyCredential({} as never)).resolves
      .toMatchInlineSnapshot(`
                      Object {
                        "code": 400,
                        "reason": "invalid extension context",
                        "success": false,
                      }
                `);
    await expect(
      authorizer.verifyCredential({
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
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });

    await expect(
      authorizer.verifyCredential({
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
    const authorizer = new MessengerServerAuthorizer({
      pageId,
      appSecret,
      issueTimeLimit: 999,
    });
    MockDate.now.mock.fake(() => 1504047380000);

    await expect(
      authorizer.verifyCredential({
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
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });
    const authData = {
      page: pageId,
      user: '1254459154682919',
      chat: {
        type: MessengerChatType.UserToPage,
        id: '1254459154682919',
      },
      client: 'facebook' as const,
    };

    await expect(authorizer.verifyRefreshment(authData)).resolves.toEqual({
      success: true,
      data: authData,
    });
  });

  it('fail is pageId not match', async () => {
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });

    await expect(
      authorizer.verifyRefreshment({
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
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });
    expect(
      authorizer.checkAuthContext({
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
    const authorizer = new MessengerServerAuthorizer({ pageId, appSecret });

    expect(
      authorizer.checkAuthContext({
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
