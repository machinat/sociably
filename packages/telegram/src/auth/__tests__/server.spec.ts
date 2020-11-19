import moxy from '@moxyjs/moxy';
import { TelegramServerAuthorizer } from '../server';
import { TelegramChat } from '../../channel';
import TelegramUser from '../../user';

const createReq = ({ url }) =>
  moxy({
    method: 'GET',
    headers: {},
    url,
  });

const createRes = () =>
  moxy({
    code: 200,
    finished: false,
    writeHead(code, headers) {
      this.code = code;
      this.headers = headers;
    },
    end() {
      this.finished = true;
    },
  });

const cookieIssuer: any = moxy({
  async issueAuth() {},
  async issueError() {},
});

const authorizer = new TelegramServerAuthorizer({
  botToken: '12345:_BOT_TOKEN_',
  redirectURL: '/webview/index.html',
});

beforeEach(() => {
  cookieIssuer.mock.reset();
});

const now = moxy(() => 1601136786000);
const _Date = Date;

beforeAll(() => {
  global.Date = moxy(function Date() {
    return new _Date(now());
  });
  Date.now = now;
});

afterAll(() => {
  global.Date = _Date;
});

describe('#delegateAuthRequest()', () => {
  describe('login flow', () => {
    const routingInfo = {
      originalPath: '/auth/telegram/login',
      matchedPath: '/auth/telegram',
      trailingPath: 'login',
    };

    it('authorize request throught login_url button', async () => {
      const search = new URLSearchParams({
        id: '12345',
        auth_date: '1601136776',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        photo_url: 'https://...',
        hash:
          'b9dd29dc85707201fafad92122120a759492f14f0b997f96e5ef7734009c881b',
      });

      const req = createReq({
        url: `/auth/telegram/login?${search}`,
      });
      const res = createRes();
      await authorizer.delegateAuthRequest(req, res, cookieIssuer, routingInfo);

      expect(res.finished).toBe(true);
      expect(res.code).toBe(302);
      expect(res.headers).toEqual({ Location: '/webview/index.html' });

      expect(cookieIssuer.issueError.mock).not.toHaveBeenCalled();
      expect(cookieIssuer.issueAuth.mock).toHaveBeenCalledTimes(1);
      expect(cookieIssuer.issueAuth.mock).toHaveBeenCalledWith({
        botId: 12345,
        channel: null,
        userId: 12345,
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        photoURL: 'https://...',
      });
    });

    it('redirect to redirectURL param if specified', async () => {
      const search = new URLSearchParams({
        redirectURL: '/webview/hello_world.html',
        id: '12345',
        auth_date: '1601136776',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        photo_url: 'https://...',
        hash:
          'b9dd29dc85707201fafad92122120a759492f14f0b997f96e5ef7734009c881b',
      });

      const req = createReq({
        url: `/auth/telegram/login?${search}`,
      });
      const res = createRes();
      await authorizer.delegateAuthRequest(req, res, cookieIssuer, routingInfo);

      expect(res.finished).toBe(true);
      expect(res.code).toBe(302);
      expect(res.headers).toEqual({ Location: '/webview/hello_world.html' });

      expect(cookieIssuer.issueError.mock).not.toHaveBeenCalled();
      expect(cookieIssuer.issueAuth.mock).toHaveBeenCalledTimes(1);
    });

    it('issue error if auth_date expired (20 second)', async () => {
      const search = new URLSearchParams({
        id: '12345',
        auth_date: '1601136765',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        photo_url: 'https://...',
        hash:
          'dcf3f7fddbcb157af36167546c645620b9a78ff24e32d35a8de96c6617935c6a',
      });

      const req = createReq({
        url: `/auth/telegram/login?${search}`,
      });
      const res = createRes();
      await authorizer.delegateAuthRequest(req, res, cookieIssuer, routingInfo);

      expect(res.finished).toBe(true);
      expect(res.code).toBe(302);
      expect(res.headers).toEqual({ Location: '/webview/index.html' });

      expect(cookieIssuer.issueAuth.mock).not.toHaveBeenCalled();
      expect(cookieIssuer.issueError.mock).toHaveBeenCalledTimes(1);
      expect(cookieIssuer.issueError.mock.calls[0].args[0]).toBe(401);
      expect(
        cookieIssuer.issueError.mock.calls[0].args[1]
      ).toMatchInlineSnapshot(`"login expired"`);
    });

    it('issue error if hash invalid', async () => {
      const search = new URLSearchParams({
        id: '12345',
        auth_date: '1601136776',
        first_name: 'John',
        last_name: 'Doe',
        username: 'johndoe',
        photo_url: 'https://...',
        hash: 'fffffffffffffffffffffffffffffffffffffffff',
      });

      const req = createReq({
        url: `/auth/telegram/login?${search}`,
      });
      const res = createRes();
      await authorizer.delegateAuthRequest(req, res, cookieIssuer, routingInfo);

      expect(res.finished).toBe(true);
      expect(res.code).toBe(302);
      expect(res.headers).toEqual({ Location: '/webview/index.html' });

      expect(cookieIssuer.issueAuth.mock).not.toHaveBeenCalled();
      expect(cookieIssuer.issueError.mock).toHaveBeenCalledTimes(1);
      expect(cookieIssuer.issueError.mock.calls[0].args[0]).toBe(401);
      expect(
        cookieIssuer.issueError.mock.calls[0].args[1]
      ).toMatchInlineSnapshot(`"invalid login signature"`);
    });
  });

  test('respond 404 if unknown subpath is not login or codeGrant', async () => {
    const req1 = createReq({ url: `/auth/telegram/unknown` });
    const res1 = createRes();
    await authorizer.delegateAuthRequest(req1, res1, cookieIssuer, {
      originalPath: '/auth/telegram/codeGrant',
      matchedPath: '/auth/telegram',
      trailingPath: 'unknown',
    });

    expect(res1.finished).toBe(true);
    expect(res1.code).toBe(404);

    const req2 = createReq({ url: `/auth/telegram/unknown` });
    const res2 = createRes();
    await authorizer.delegateAuthRequest(req2, res2, cookieIssuer, {
      originalPath: '/auth/telegram/codeGrant',
      matchedPath: '/auth/telegram',
      trailingPath: '',
    });

    expect(res2.finished).toBe(true);
    expect(res2.code).toBe(404);

    expect(cookieIssuer.issueAuth.mock).not.toHaveBeenCalled();
    expect(cookieIssuer.issueError.mock).not.toHaveBeenCalled();
  });
});

test('#verifyCredential() simply return not ok', async () => {
  await expect(authorizer.verifyCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 403,
            "reason": "should initiate st server side only",
            "success": false,
          }
        `);
});

test('#verifyRefreshment() simply return ok', async () => {
  const authData = {
    botId: 12345,
    channel: {
      type: 'private' as const,
      id: 67890,
    },
    userId: 12345,
    firstName: 'Jojo',
    lastName: 'Doe',
    username: 'jojodoe',
    languageCode: 'ja',
  };
  await expect(authorizer.verifyRefreshment(authData)).resolves.toEqual({
    success: true,
    refreshable: true,
    data: authData,
  });
});

test('#refineAuth() ok', async () => {
  const authData = {
    botId: 12345,
    channel: null,
    userId: 12345,
    firstName: 'Jojo',
    lastName: 'Doe',
    username: 'jojodoe',
    languageCode: 'ja',
  };
  await expect(authorizer.refineAuth(authData)).resolves.toEqual({
    user: new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
      language_code: 'ja',
    }),
    channel: null,
  });
  await expect(
    authorizer.refineAuth({
      ...authData,
      channel: {
        type: 'group',
        id: 67890,
      },
    })
  ).resolves.toEqual({
    user: new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
      language_code: 'ja',
    }),
    channel: new TelegramChat(12345, { type: 'group', id: 67890 }),
  });
  await expect(
    authorizer.refineAuth({
      ...authData,
      channel: {
        type: 'group',
        id: 67890,
      },
    })
  ).resolves.toEqual({
    user: new TelegramUser({
      id: 12345,
      is_bot: false,
      first_name: 'Jojo',
      last_name: 'Doe',
      username: 'jojodoe',
      language_code: 'ja',
    }),
    channel: new TelegramChat(12345, { type: 'group', id: 67890 }),
  });
});
