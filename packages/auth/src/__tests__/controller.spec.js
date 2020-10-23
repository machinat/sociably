import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import jsonwebtoken from 'jsonwebtoken';
import moxy from '@moxyjs/moxy';
import { AuthController } from '../controller';
import { CookieAccessor } from '../cookie';

const parseSetCookies = (res) => {
  let setCookieHeaders = res.getHeader('Set-Cookie');
  if (typeof setCookieHeaders === 'string') {
    setCookieHeaders = [setCookieHeaders];
  }

  const cookies = new Map();
  for (const header of setCookieHeaders) {
    const [cookiePair, ...directives] = header.split(/;\s*/);
    const [key, value] = cookiePair.split('=', 2);
    cookies.set(key, {
      value,
      directives: directives.sort().join('; '),
    });
  }

  return cookies;
};

const prepareToken = (payload) => {
  const [head, body, signature] = jsonwebtoken
    .sign(payload, '__SECRET__')
    .split('.');

  return [`${head}.${body}`, signature];
};

const prepareReq = (method, url, headers, body) => {
  const req = moxy(
    new Readable({
      read() {
        this.push(typeof body === 'string' ? body : JSON.stringify(body));
        this.push(null);
      },
    })
  );
  req.mock.getter('url').fake(() => url);
  req.mock.getter('method').fake(() => method);
  req.mock.getter('headers').fake(() => headers);

  return req;
};

const fooAuthorizer = moxy({
  platform: 'foo',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifyCredential() {
    return { success: true, data: { foo: 'data' }, refreshable: true };
  },
  async verifyRefreshment() {
    return { success: true, data: { foo: 'data' }, refreshable: true };
  },
  async refineAuth() {
    return { user: { john: 'doe' }, channel: { uid: 'foo.channel' } };
  },
});

const barAuhtorizer = moxy({
  platform: 'bar',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifyCredential() {
    return { success: false, code: 400, reason: 'bar' };
  },
  async verifyRefreshment() {
    return { success: false, code: 400, reason: 'bar' };
  },
  async refineAuth() {
    return { user: { jojo: 'doe' }, channel: { uid: 'bar.channel' } };
  },
});

const authorizers = [fooAuthorizer, barAuhtorizer];
const secret = '__SECRET__';

beforeEach(() => {
  fooAuthorizer.mock.reset();
  barAuhtorizer.mock.reset();
});

const _DateNow = Date.now;
const FAKE_NOW = 1570000000000;
const SEC_NOW = FAKE_NOW / 1000;
Date.now = () => FAKE_NOW;

afterAll(() => {
  Date.now = _DateNow;
});

describe('#constructor()', () => {
  it('initiate ok', () => {
    const controller = new AuthController(authorizers, { secret });
    expect(controller.authorizers).toBe(authorizers);
    expect(controller.secret).toBe(secret);
  });

  it('throw if options.authorizers is empty', () => {
    expect(
      () => new AuthController(null, { secret, entryHost: 'machinat.com' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authorizers must not be empty"`
    );
    expect(
      () => new AuthController([], { secret, entryHost: 'machinat.com' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authorizers must not be empty"`
    );
  });

  it('throw if options.secret is empty', () => {
    expect(
      () => new AuthController(authorizers, { entryHost: 'machinat.com' })
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
    expect(
      () =>
        new AuthController(authorizers, {
          secret: '',
          entryHost: 'machinat.com',
        })
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
  });

  it('check entryPath is a subpath of cookiePath if both given', () => {
    expect(
      () =>
        new AuthController(authorizers, {
          secret,
          entryPath: '/auth',
          cookiePath: '/api',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.entryPath should be a subpath of options.cookiePath"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  describe('handling request', () => {
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({}));
    });

    it('respond 403 if being called outside fo entryPath scope', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        entryPath: '/auth',
      });

      let req = prepareReq('GET', 'https://auth.machinat.com', {}, '');
      await controller.delegateAuthRequest(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.end.mock).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 403,
            "reason": "path forbidden",
          },
        }
      `);

      res = moxy(new ServerResponse({}));
      req = prepareReq('GET', 'https://machinat.com/someWhereElse', {}, '');
      await expect(controller.delegateAuthRequest(req, res));
      expect(res.statusCode).toBe(403);
      expect(res.end.mock).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 403,
            "reason": "path forbidden",
          },
        }
      `);
    });

    it('respond 403 if being called on entryPath directly', async () => {
      const controller = new AuthController(authorizers, { secret });
      const req = prepareReq('GET', 'https://auth.machinat.com', {}, '');

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.end.mock).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 403,
            "reason": "path forbidden",
          },
        }
      `);
    });

    it('delegate to provider correponded to the platform in the route', async () => {
      const controller = new AuthController(authorizers, { secret });
      res.mock.getter('finished').fakeReturnValue(true);

      let req = prepareReq('GET', 'https://auth.machinat.com/foo', {}, '');
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
      expect(fooAuthorizer.delegateAuthRequest.mock).toHaveBeenCalledWith(
        req,
        res,
        expect.any(CookieAccessor),
        { originalPath: '/foo', matchedPath: '/foo', trailingPath: '' }
      );

      req = prepareReq('GET', 'https://auth.machinat.com/bar/baz', {}, '');
      await controller.delegateAuthRequest(req, res);

      expect(barAuhtorizer.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
      expect(barAuhtorizer.delegateAuthRequest.mock).toHaveBeenCalledWith(
        req,
        res,
        expect.any(CookieAccessor),
        { originalPath: '/bar/baz', matchedPath: '/bar', trailingPath: 'baz' }
      );

      expect(res.end.mock).not.toHaveBeenCalled();
    });

    it('respond 501 if res not closed by provider', async () => {
      const controller = new AuthController(authorizers, { secret });
      const req = prepareReq('GET', 'https://auth.machinat.com/foo', {}, '');

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);

      expect(res.statusCode).toBe(501);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 501,
            "reason": "connection not closed by authorizer",
          },
        }
      `);
    });

    it('respond 404 if no matched provider', async () => {
      const controller = new AuthController(authorizers, { secret });
      const req = prepareReq('GET', 'https://auth.machinat.com/baz', {}, '');

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.mock).not.toHaveBeenCalled();
      expect(barAuhtorizer.mock).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(404);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "platform \\"baz\\" not found",
          },
        }
      `);
    });

    it('respond 404 if unknown private api called', async () => {
      const req = prepareReq('POST', 'https://machinat.com/_unknown', {}, '');

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.mock).not.toHaveBeenCalled();
      expect(barAuhtorizer.mock).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(404);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "invalid auth api route \\"_unknown\\"",
          },
        }
      `);
    });
  });

  describe('passing CookieAccessor to provider', () => {
    function getDelegateArgs(controller) {
      const req = moxy(new IncomingMessage());
      const res = moxy(new ServerResponse({}));

      req.mock.getter('url').fake(() => `${controller.entryPath}/foo`);
      res.mock.getter('finished').fake(() => true);

      controller.delegateAuthRequest(req, res);
      return fooAuthorizer.delegateAuthRequest.mock.calls.slice(-1)[0].args;
    }

    test('set state cookie', async () => {
      async function testIssueState(controller) {
        const [, res, cookieAccessor] = getDelegateArgs(controller);

        const stateEncoded = await cookieAccessor.issueState({ foo: 'state' });
        const cookies = parseSetCookies(res);

        expect(cookies.get('machinat_auth_state').value).toBe(stateEncoded);
        const payload = jsonwebtoken.verify(stateEncoded, '__SECRET__');
        return [cookies, payload];
      }

      const controller = new AuthController(authorizers, {
        secret,
        entryPath: '/auth',
      });

      let [cookies, payload] = await testIssueState(controller);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_state" => Object {
            "directives": "HttpOnly; Max-Age=60; Path=/auth; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInN0YXRlIjp7ImZvbyI6InN0YXRlIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAwMDYwfQ.1KZrxH4_vdbYJPe8tT_qwEK1dGsaiMAi0ZPJ-S6MEpU",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "exp": 1570000060,
          "iat": 1570000000,
          "platform": "foo",
          "state": Object {
            "foo": "state",
          },
        }
      `);

      [cookies, payload] = await testIssueState(
        new AuthController(authorizers, {
          secret,
          entryPath: '/api/auth',
          dataCookieAge: 99,
          cookieDomain: 'machinat.io',
          cookiePath: '/api',
          sameSite: 'None',
          secure: false,
        })
      );
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_state" => Object {
            "directives": "HttpOnly; Max-Age=99; Path=/api/auth; SameSite=None",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInN0YXRlIjp7ImZvbyI6InN0YXRlIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAwMDk5fQ.pSU15ehXOSHEy2gcyNLDz_XiYqm_477JgWsr082koQc",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "exp": 1570000099,
          "iat": 1570000000,
          "platform": "foo",
          "state": Object {
            "foo": "state",
          },
        }
      `);
    });

    test('set auth cookie', async () => {
      async function testIssueAuth(controller, issueOpts) {
        const [, res, cookieAccessor] = getDelegateArgs(controller);
        const token = await cookieAccessor.issueAuth(
          { foo: 'data' },
          issueOpts
        );

        const cookies = parseSetCookies(res);
        expect(cookies.get('machinat_auth_state').value).toBe('');
        expect(cookies.get('machinat_auth_error').value).toBe('');
        if (issueOpts && issueOpts.signatureOnly) {
          expect(cookies.get('machinat_auth_token')).toBe(undefined);
        } else {
          expect(cookies.get('machinat_auth_token').value).toBe(token);
        }

        const signature = cookies.get('machinat_auth_signature').value;
        const payload = jsonwebtoken.verify(
          `${token}.${signature}`,
          '__SECRET__'
        );
        return [cookies, payload];
      }

      const controller = new AuthController(authorizers, { secret });
      let [cookies, payload] = await testIssueAuth(controller);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "KxoRsruKQqsJXgl1JZDkvVAWQoUCiahrvVjYirphkoA",
          },
          "machinat_auth_token" => Object {
            "directives": "Max-Age=180; Path=/; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwODY0MDAsInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAxODAwfQ",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570001800,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570086400,
          "scope": Object {
            "path": "/",
          },
        }
      `);

      const customizedController = new AuthController(authorizers, {
        secret,
        entryPath: '/api/auth',
        authCookieAge: 999,
        tokenAge: 9999,
        refreshPeriod: 99999,
        cookieDomain: 'machinat.io',
        cookiePath: '/api',
        sameSite: 'None',
        secure: false,
      });

      [cookies, payload] = await testIssueAuth(customizedController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/api; SameSite=None",
            "value": "TPe85Bf7ME2A9MJhTIx62cvRJ1k_tMyByTZ8fBVLTeo",
          },
          "machinat_auth_token" => Object {
            "directives": "Domain=machinat.io; Max-Age=999; Path=/api; SameSite=None",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwOTk5OTksInNjb3BlIjp7ImRvbWFpbiI6Im1hY2hpbmF0LmlvIiwicGF0aCI6Ii9hcGkifSwiaWF0IjoxNTcwMDAwMDAwLCJleHAiOjE1NzAwMDk5OTl9",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);

      // with specified refreshLimit
      [cookies, payload] = await testIssueAuth(customizedController, {
        refreshLimit: SEC_NOW + 12345,
      });
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570012345,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);

      // ignore refreshLimit if refreshable
      [cookies, payload] = await testIssueAuth(customizedController, {
        refreshLimit: SEC_NOW + 12345,
        refreshable: false,
      });
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);

      // ignoer refreshLimit if it's before token expire
      [cookies, payload] = await testIssueAuth(customizedController, {
        refreshLimit: SEC_NOW + 1,
      });
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);

      [cookies, payload] = await testIssueAuth(customizedController, {
        signatureOnly: true,
      });
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);
    });

    it('set error cookie', async () => {
      async function testIssueError(controller) {
        const [, res, cookieAccessor] = getDelegateArgs(controller);

        const errEncoded = await cookieAccessor.issueError(418, "I'm a teapot");
        const cookies = parseSetCookies(res);

        expect(cookies.get('machinat_auth_error').value).toBe(errEncoded);
        const payload = jsonwebtoken.verify(errEncoded, '__SECRET__');
        return [cookies, payload];
      }

      const controller = new AuthController(authorizers, {
        secret,
        entryPath: '/auth',
      });
      let [cookies, payload] = await testIssueError(controller);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_error" => Object {
            "directives": "Max-Age=60; Path=/; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwicmVhc29uIjoiSSdtIGEgdGVhcG90In0sInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMH0.dCs_-sNRQZoWk1dOHoRcGKCs6LEgGCwky_lWqODov3A",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
          "machinat_auth_signature" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
          "machinat_auth_token" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 418,
            "reason": "I'm a teapot",
          },
          "iat": 1570000000,
          "platform": "foo",
          "scope": Object {
            "path": "/",
          },
        }
      `);

      [cookies, payload] = await testIssueError(
        new AuthController(authorizers, {
          secret,
          entryPath: '/api/auth',
          dataCookieAge: 99,
          cookieDomain: 'machinat.io',
          cookiePath: '/api',
          sameSite: 'None',
          secure: false,
        })
      );
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Max-Age=99; Path=/api; SameSite=None",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwicmVhc29uIjoiSSdtIGEgdGVhcG90In0sInNjb3BlIjp7ImRvbWFpbiI6Im1hY2hpbmF0LmlvIiwicGF0aCI6Ii9hcGkifSwiaWF0IjoxNTcwMDAwMDAwfQ.fUDnYLpCFTR8nlsxMPoqdRzApkQRZ1lw86uEJTB_6Z8",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
          "machinat_auth_token" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 418,
            "reason": "I'm a teapot",
          },
          "iat": 1570000000,
          "platform": "foo",
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);
    });

    it('get state from cookies', async () => {
      const [req, , cookieAccessor] = getDelegateArgs(
        new AuthController(authorizers, { secret })
      );
      const platform = 'foo';
      const state = { foo: 'state' };
      const scope = { path: '/' };

      req.mock.getter('headers').fake(() => ({
        cookie: `no_state=existed`,
      }));
      await expect(cookieAccessor.getState()).resolves.toBe(null);

      const stateEnceded = jsonwebtoken.sign(
        { platform, state, scope, iat: SEC_NOW - 10, exp: SEC_NOW + 10 },
        '__SECRET__'
      );

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${stateEnceded}`,
      }));
      await expect(cookieAccessor.getState()).resolves.toEqual({
        foo: 'state',
      });

      // wrong signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${stateEnceded}_WITH_WRONG_SIG`,
      }));
      await expect(cookieAccessor.getState()).resolves.toBe(null);

      // different platform
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${jsonwebtoken.sign(
          { platform: 'bar', state, scope, iat: SEC_NOW - 10 },
          '__SECRET__'
        )}`,
      }));
      await expect(cookieAccessor.getState()).resolves.toBe(null);

      // outdated
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${jsonwebtoken.sign(
          { platform, state, scope, iat: SEC_NOW - 21, exp: SEC_NOW - 1 },
          '__SECRET__'
        )}`,
      }));
      await expect(cookieAccessor.getState()).resolves.toBe(null);
    });

    it('get auth from cookies', async () => {
      function createTokenAndSig(payload) {
        const [headerEncoded, payloadEncoded, signature] = jsonwebtoken
          .sign(payload, '__SECRET__')
          .split('.');

        return [`${headerEncoded}.${payloadEncoded}`, signature];
      }

      const [req, , cookieAccessor] = getDelegateArgs(
        new AuthController(authorizers, { secret })
      );
      const platform = 'foo';
      const data = { foo: 'data' };
      const scope = { path: '/' };

      req.mock.getter('headers').fake(() => ({
        cookie: `no_auth=existed`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toBe(null);

      let [token, sig] = createTokenAndSig({
        platform,
        data,
        scope,
        iat: SEC_NOW - 10,
        exp: SEC_NOW + 10,
      });

      // no signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token}`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toBe(null);

      // no token
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_signature=${sig}`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toBe(null);

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toEqual({ foo: 'data' });

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toEqual({ foo: 'data' });

      // wrong signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=WRONG_SIG;`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toBe(null);

      // different platform
      [token, sig] = createTokenAndSig({
        platform: 'bar',
        data,
        scope,
        iat: SEC_NOW - 10,
        exp: SEC_NOW + 10,
      });
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toBe(null);

      // expired
      [token, sig] = createTokenAndSig({
        platform,
        data,
        scope,
        iat: SEC_NOW - 21,
        exp: SEC_NOW - 1,
      });
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(cookieAccessor.getAuth()).resolves.toBe(null);
    });

    it('get error from cookies', async () => {
      const [req, , cookieAccessor] = getDelegateArgs(
        new AuthController(authorizers, { secret })
      );
      const platform = 'foo';
      const error = { code: 418, reason: "I'm a teapot" };
      const scope = { path: '/' };

      // not existed
      req.mock.getter('headers').fake(() => ({
        cookie: `no_error=existed`,
      }));
      await expect(cookieAccessor.getError()).resolves.toBe(null);

      const errEncoded = jsonwebtoken.sign(
        { platform, error, scope, iat: SEC_NOW - 10 },
        '__SECRET__'
      );

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${errEncoded}`,
      }));
      await expect(cookieAccessor.getError()).resolves.toEqual(error);

      // woring signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${`${errEncoded}_WITH_WRONG_SIG`}`,
      }));
      await expect(cookieAccessor.getError()).resolves.toBe(null);

      // different platform
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${jsonwebtoken.sign(
          { platform: 'bar', error, scope, iat: SEC_NOW - 10 },
          '__SECRET__'
        )}`,
      }));
      await expect(cookieAccessor.getError()).resolves.toBe(null);
    });
  });

  describe('_sign api', () => {
    let req;
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({}));
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_sign',
        {},
        { platform: 'foo', credential: { foo: 'data' } }
      );
    });

    it('sign cookie and respond token if provider verfication passed', async () => {
      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.verifyCredential.mock).toHaveBeenCalledTimes(1);
      expect(fooAuthorizer.verifyCredential.mock).toHaveBeenCalledWith({
        foo: 'data',
      });

      expect(res.statusCode).toBe(200);
      expect(res.end.mock).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toEqual({
        platform: 'foo',
        token: expect.any(String),
      });

      const cookies = parseSetCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "KxoRsruKQqsJXgl1JZDkvVAWQoUCiahrvVjYirphkoA",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
        }
      `);

      expect(
        jsonwebtoken.verify(
          `${resBody.token}.${cookies.get('machinat_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570001800,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570086400,
          "scope": Object {
            "path": "/",
          },
        }
      `);
    });

    test('sign with more detailed controller options', async () => {
      req.mock
        .getter('url')
        .fakeReturnValue('https://machinat.io/api/auth/_sign');

      const controller = new AuthController(authorizers, {
        secret,
        entryPath: '/api/auth',
        dataCookieAge: 99,
        authCookieAge: 999,
        tokenAge: 9999,
        refreshPeriod: 99999,
        cookieDomain: 'machinat.io',
        cookiePath: '/api',
        sameSite: 'Strict',
        secure: false,
      });

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.verifyCredential.mock).toHaveBeenCalledTimes(1);
      expect(fooAuthorizer.verifyCredential.mock).toHaveBeenCalledWith({
        foo: 'data',
      });

      const cookies = parseSetCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/api; SameSite=Strict",
            "value": "TPe85Bf7ME2A9MJhTIx62cvRJ1k_tMyByTZ8fBVLTeo",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
        }
      `);

      const { token } = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(
        jsonwebtoken.verify(
          `${token}.${cookies.get('machinat_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);
    });

    test('sign if provider return not refreshable', async () => {
      fooAuthorizer.verifyCredential.mock.fake(() => ({
        success: true,
        data: { foo: 'data' },
        refreshable: false,
      }));

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      const sig = parseSetCookies(res).get('machinat_auth_signature').value;
      const { token } = JSON.parse(res.end.mock.calls[0].args[0]);

      expect(jsonwebtoken.verify(`${token}.${sig}`, '__SECRET__'))
        .toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570001800,
          "iat": 1570000000,
          "platform": "foo",
          "scope": Object {
            "path": "/",
          },
        }
      `);
    });

    it('respond 404 if platform not found', async () => {
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_sign',
        {},
        { platform: 'baz', credential: { baz: 'data' } }
      );

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.verifyCredential.mock).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.end.mock).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "unknown platform \\"baz\\"",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond error if provider.verifyCredential() resolve not success', async () => {
      fooAuthorizer.verifyCredential.mock.fake(() => ({
        success: false,
        code: 418,
        reason: "I'm a teapot",
      }));

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(418);
      expect(res.end.mock).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 418,
            "reason": "I'm a teapot",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(authorizers, { secret });
      const url = 'http://auth.machinat.com/_sign';

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, '"Woooof"'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid sign params",
          },
        }
      `);
    });

    it('respond 500 if porvider.verifyCredential() thrown', async () => {
      fooAuthorizer.verifyCredential.mock.fake(() => {
        throw new Error('Broken inside');
      });

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 500,
            "reason": "Broken inside",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(
        prepareReq('GET', 'https://auth.machinat.com/_sign', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 405,
            "reason": "method not allowed",
          },
        }
      `);
    });
  });

  describe('_refresh api', () => {
    let req;
    let res;
    beforeEach(() => {
      const [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 1,
        iat: SEC_NOW - 10000,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      res = moxy(new ServerResponse({}));
    });

    it('refresh token if provider.verifyRefreshment() passed', async () => {
      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toEqual({
        platform: 'foo',
        token: expect.any(String),
      });

      const cookies = parseSetCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "IMlv6j2xHcRG_OHPgCCcMO9uT58JVNGoxwumCk2W4ZQ",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/",
            "value": "",
          },
        }
      `);

      expect(
        jsonwebtoken.verify(
          `${resBody.token}.${cookies.get('machinat_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570001800,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570099999,
          "scope": Object {
            "path": "/",
          },
        }
      `);
    });

    test('refresh with more detailed controller options', async () => {
      req.mock
        .getter('url')
        .fake(() => 'https://machinat.io/api/auth/_refresh');

      const controller = new AuthController(authorizers, {
        secret,
        entryPath: '/api/auth',
        dataCookieAge: 99,
        authCookieAge: 999,
        tokenAge: 9999,
        refreshPeriod: 99999,
        cookieDomain: 'machinat.io',
        cookiePath: '/api',
        sameSite: 'Strict',
        secure: false,
      });

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);

      const cookies = parseSetCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/api; SameSite=Strict",
            "value": "TPe85Bf7ME2A9MJhTIx62cvRJ1k_tMyByTZ8fBVLTeo",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/api",
            "value": "",
          },
        }
      `);

      expect(
        jsonwebtoken.verify(
          `${resBody.token}.${cookies.get('machinat_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshLimit": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/api",
          },
        }
      `);
    });

    it('respond 404 if platform not found', async () => {
      const [token, signature] = prepareToken({
        platform: 'baz',
        data: { baz: 'data' },
        exp: SEC_NOW - 1,
        iat: SEC_NOW - 10000,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(404);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "unknown platform \\"baz\\"",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond error if provider.verifyCredential() resolve not success', async () => {
      fooAuthorizer.verifyRefreshment.mock.fake(() => ({
        success: false,
        code: 418,
        reason: "I'm a teapot",
      }));

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(418);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 418,
            "reason": "I'm a teapot",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      req.mock.getter('headers').fakeReturnValue({});

      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "reason": "no signature found",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);

      req.mock.getter('headers').fakeReturnValue({
        cookie: 'machinat_auth_signature=INVALID_SIGNATURE',
      });
      res = moxy(new ServerResponse({}));
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid signature",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if refreshPeriod outdated', async () => {
      const controller = new AuthController(authorizers, { secret });

      const [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 9999,
        iat: SEC_NOW - 99999,
        refreshLimit: SEC_NOW - 1,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "reason": "refreshment period expired",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if no refreshLimit existed in payload', async () => {
      const controller = new AuthController(authorizers, { secret });

      const [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 9999,
        iat: SEC_NOW - 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(400);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "token not refreshable",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(authorizers, { secret });
      const url = 'http://auth.machinat.com/_refresh';
      const header = { cookie: `machinat_auth_signature=SOMETHING_WHATEVER` };

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "empty token received",
          },
        }
      `);
    });

    it('respond 500 if porvider.verifyRefreshment() thrown', async () => {
      fooAuthorizer.verifyRefreshment.mock.fake(() => {
        throw new Error('Broken inside');
      });
      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 500,
            "reason": "Broken inside",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(
        prepareReq('get', 'https://auth.machinat.com/_refresh', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 405,
            "reason": "method not allowed",
          },
        }
      `);
    });
  });

  describe('_verify api', () => {
    let token;
    let signature;
    beforeEach(() => {
      [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW + 9999,
        iat: SEC_NOW - 999,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
    });

    it('respond 200 if token and signature valid', async () => {
      const controller = new AuthController(authorizers, { secret });

      const req = prepareReq(
        'POST',
        'http://auth.machinat.com/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({}));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(body).toEqual({ platform: 'foo', token });

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if token expired', async () => {
      const controller = new AuthController(authorizers, { secret });

      [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 999,
        iat: SEC_NOW - 9999,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://auth.machinat.com/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({}));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "reason": "jwt expired",
          },
        }
      `);

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 404 platform not found', async () => {
      const controller = new AuthController(authorizers, { secret });

      [token, signature] = prepareToken({
        platform: 'baz',
        data: { baz: 'data' },
        exp: SEC_NOW + 9999,
        iat: SEC_NOW - 999,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://auth.machinat.com/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({}));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "unknown platform \\"baz\\"",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      const controller = new AuthController(authorizers, { secret });
      let res;

      await controller.delegateAuthRequest(
        prepareReq('POST', 'http://auth.machinat.com/_verify', {}, { token }),
        (res = moxy(new ServerResponse({})))
      );

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "reason": "no signature found",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);

      await controller.delegateAuthRequest(
        prepareReq(
          'POST',
          'http://auth.machinat.com/_verify',
          { cookie: `machinat_auth_signature=INVALID_SIGNATURE` },
          { token }
        ),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid signature",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(authorizers, { secret });
      const url = 'http://auth.machinat.com/_verify';
      const header = { cookie: `machinat_auth_signature=SOMETHING_WHATEVER` };
      let res;

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "empty token received",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const res = moxy(new ServerResponse({}));
      const controller = new AuthController(authorizers, { secret });
      await controller.delegateAuthRequest(
        prepareReq('GET', 'https://auth.machinat.com/_verify', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 405,
            "reason": "method not allowed",
          },
        }
      `);
    });
  });
});

describe('#verifyAuth(req)', () => {
  const [token, signature] = prepareToken({
    platform: 'foo',
    data: { foo: 'data' },
    exp: SEC_NOW + 9999,
    iat: SEC_NOW - 999,
    refreshLimit: SEC_NOW + 99999,
    scope: { path: '/' },
  });

  it('resolve auth context if authorization verified', async () => {
    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `machinat_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "auth": Object {
                "channel": Object {
                  "uid": "foo.channel",
                },
                "data": Object {
                  "foo": "data",
                },
                "expireAt": 2019-10-02T09:53:19.000Z,
                "loginAt": 2019-10-02T06:50:01.000Z,
                "platform": "foo",
                "user": Object {
                  "john": "doe",
                },
              },
              "success": true,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaExpbWl0IjoxNTcwMDk5OTk5LCJzY29wZSI6eyJwYXRoIjoiLyJ9fQ",
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('work with token passed as 2nd param', async () => {
    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          { cookie: `machinat_auth_signature=${signature}` },
          { user_api: 'stuff' }
        ),
        token
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "auth": Object {
                "channel": Object {
                  "uid": "foo.channel",
                },
                "data": Object {
                  "foo": "data",
                },
                "expireAt": 2019-10-02T09:53:19.000Z,
                "loginAt": 2019-10-02T06:50:01.000Z,
                "platform": "foo",
                "user": Object {
                  "john": "doe",
                },
              },
              "success": true,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaExpbWl0IjoxNTcwMDk5OTk5LCJzY29wZSI6eyJwYXRoIjoiLyJ9fQ",
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('throw 401 if signature invalid', async () => {
    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `machinat_auth_signature=INVALID_SIGNATURE`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid signature",
              "success": false,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaExpbWl0IjoxNTcwMDk5OTk5LCJzY29wZSI6eyJwYXRoIjoiLyJ9fQ",
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 401 if no signature in cookies', async () => {
    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          { authorization: `Bearer ${token}` },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 401,
              "reason": "require signature",
              "success": false,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaExpbWl0IjoxNTcwMDk5OTk5LCJzY29wZSI6eyJwYXRoIjoiLyJ9fQ",
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 401 if no token provided', async () => {
    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          { cookie: `machinat_auth_signature=${signature}` },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 401,
              "reason": "no Authorization header",
              "success": false,
              "token": undefined,
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 400 if no invalid authorization format received', async () => {
    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          {
            authorization: `Unknown-Scheme ${token}`,
            cookie: `machinat_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid auth scheme",
              "success": false,
              "token": undefined,
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 404 if platform not found', async () => {
    const [bazToken, bazSignature] = prepareToken({
      platform: 'baz',
      data: { baz: 'data' },
      exp: SEC_NOW + 9999,
      iat: SEC_NOW - 999,
      refreshLimit: SEC_NOW + 99999,
      scope: { path: '/' },
    });

    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          {
            authorization: `Bearer ${bazToken}`,
            cookie: `machinat_auth_signature=${bazSignature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 404,
              "reason": "unknown platform \\"baz\\"",
              "success": false,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImJheiIsImRhdGEiOnsiYmF6IjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaExpbWl0IjoxNTcwMDk5OTk5LCJzY29wZSI6eyJwYXRoIjoiLyJ9fQ",
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 400 if provider.refineAuth() resolve empty', async () => {
    fooAuthorizer.refineAuth.mock.fake(async () => {
      return null;
    });

    const controller = new AuthController(authorizers, { secret });
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.machinat.com/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `machinat_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid auth data",
              "success": false,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaExpbWl0IjoxNTcwMDk5OTk5LCJzY29wZSI6eyJwYXRoIjoiLyJ9fQ",
            }
          `);

    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
  });
});
