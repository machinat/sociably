import { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';
import { Readable } from 'stream';
import { moxy, Moxy } from '@moxyjs/moxy';
import { AuthController } from '../Controller.js';
import { AnyServerAuthenticator } from '../types.js';
import HttpOperator from '../HttpOperator.js';
import { getCookies } from './utils.js';

const prepareToken = (payload) => {
  const [head, body, signature] = jwt.sign(payload, '__SECRET__').split('.');

  return [`${head}.${body}`, signature];
};

const prepareReq = (
  method,
  url,
  headers,
  body
): Moxy<IncomingMessage & { method: string; url: string }> => {
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

  return req as never;
};

const fooAuthenticator: Moxy<AnyServerAuthenticator> = moxy({
  platform: 'foo',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifyCredential() {
    return { ok: true, data: { foo: 'data' } };
  },
  async verifyRefreshment() {
    return { ok: true, data: { foo: 'data' } };
  },
  checkAuthData() {
    return {
      ok: true,
      contextDetails: {
        user: { platform: 'foo', uid: 'john_doe' },
        thread: { platform: 'foo', uid: 'foo.thread' },
        foo: 'foo.data',
      },
    };
  },
});

const barAuthenticator: Moxy<AnyServerAuthenticator> = moxy({
  platform: 'bar',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifyCredential() {
    return { ok: false, code: 400, reason: 'bar' };
  },
  async verifyRefreshment() {
    return { ok: false, code: 400, reason: 'bar' };
  },
  checkAuthData() {
    return {
      ok: true,
      contextDetails: {
        user: { platform: 'bar', uid: 'jojo_doe' },
        thread: { platform: 'bar', uid: 'bar.thread' },
        bar: 'bar.data',
      },
    };
  },
});

const authenticators = [fooAuthenticator, barAuthenticator];
const secret = '__SECRET__';
const serverUrl = 'https://sociably.io';

beforeEach(() => {
  fooAuthenticator.mock.reset();
  barAuthenticator.mock.reset();
});

const _DateNow = Date.now;
const FAKE_NOW = 1570000000000;
const SEC_NOW = FAKE_NOW / 1000;

beforeAll(() => {
  Date.now = () => FAKE_NOW;
});
afterAll(() => {
  Date.now = _DateNow;
});

describe('#constructor()', () => {
  it('initiate ok', () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    expect(controller.authenticators).toBe(authenticators);
    expect(controller.secret).toBe(secret);
  });

  it('throw if options.authenticators is empty', () => {
    expect(
      () => new AuthController(new HttpOperator({ secret, serverUrl }), [])
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authenticators must not be empty"`
    );
    expect(
      () =>
        new AuthController(new HttpOperator({ secret, serverUrl }), null as any)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authenticators must not be empty"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  describe('handling request', () => {
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({} as never));
    });

    it('respond 403 if being called outside fo apiRoot scope', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl, apiRoot: '/auth' }),
        authenticators
      );

      let req = prepareReq('GET', 'https://auth.sociably.io', {}, '');
      await controller.delegateAuthRequest(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.end).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 403,
            "reason": "path forbidden",
          },
        }
      `);

      res = moxy(new ServerResponse({} as never));
      req = prepareReq('GET', 'https://sociably.io/someWhereElse', {}, '');
      await controller.delegateAuthRequest(req, res);
      expect(res.statusCode).toBe(403);
      expect(res.end).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 403,
            "reason": "path forbidden",
          },
        }
      `);
    });

    it('respond 403 if being called on apiRoot directly', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      const req = prepareReq('GET', 'https://auth.sociably.io', {}, '');

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(403);
      expect(res.end).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 403,
            "reason": "path forbidden",
          },
        }
      `);
    });

    it('delegate to provider correponded to the platform in the route', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      res.mock.getter('finished').fakeReturnValue(true);

      let req = prepareReq('GET', 'https://auth.sociably.io/foo', {}, '');
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.delegateAuthRequest).toHaveBeenCalledTimes(1);
      expect(fooAuthenticator.delegateAuthRequest).toHaveBeenCalledWith(
        req,
        res,
        { originalPath: '/foo', matchedPath: '/foo', trailingPath: '' }
      );

      req = prepareReq('GET', 'https://auth.sociably.io/bar/baz', {}, '');
      await controller.delegateAuthRequest(req, res);

      expect(barAuthenticator.delegateAuthRequest).toHaveBeenCalledTimes(1);
      expect(barAuthenticator.delegateAuthRequest).toHaveBeenCalledWith(
        req,
        res,
        { originalPath: '/bar/baz', matchedPath: '/bar', trailingPath: 'baz' }
      );

      expect(res.end).not.toHaveBeenCalled();
    });

    it('respond 501 if res not closed by provider', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      const req = prepareReq('GET', 'https://auth.sociably.io/foo', {}, '');

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.delegateAuthRequest).toHaveBeenCalledTimes(1);

      expect(res.statusCode).toBe(501);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 501,
            "reason": "connection not closed by authenticator",
          },
          "platform": "foo",
        }
      `);
    });

    it('respond 404 if no matched provider', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      const req = prepareReq('GET', 'https://auth.sociably.io/baz', {}, '');

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.delegateAuthRequest).not.toHaveBeenCalled();
      expect(barAuthenticator.delegateAuthRequest).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(404);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 404,
            "reason": "platform "baz" not found",
          },
        }
      `);
    });

    it('respond 404 if unknown private api called', async () => {
      const req = prepareReq('POST', 'https://sociably.io/_unknown', {}, '');

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.delegateAuthRequest).not.toHaveBeenCalled();
      expect(barAuthenticator.delegateAuthRequest).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(404);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 404,
            "reason": "invalid auth api route "_unknown"",
          },
        }
      `);
    });
  });

  describe('_sign api', () => {
    let req;
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({} as never));
      req = prepareReq(
        'POST',
        'http://auth.sociably.io/_sign',
        {},
        { platform: 'foo', credential: { foo: 'data' } }
      );
    });

    it('sign cookie and respond token if provider verfication passed', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.verifyCredential).toHaveBeenCalledTimes(1);
      expect(fooAuthenticator.verifyCredential).toHaveBeenCalledWith({
        foo: 'data',
      });

      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toEqual({
        platform: 'foo',
        token: expect.any(String),
      });

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "sociably_auth_signature" => {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "EKG7WOjtwYDAi7tisgcKPmJ_js11Jaf4347vCrFsXbc",
          },
          "sociably_auth_token" => {
            "directives": "Path=/; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTcwMDAwMDAwLCJzY29wZSI6eyJwYXRoIjoiLyJ9LCJpYXQiOjE1NzAwMDAwMDAsImV4cCI6MTU3MDAwMzYwMH0",
          },
          "sociably_auth_state" => {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
            "value": "",
          },
          "sociably_auth_error" => {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
            "value": "",
          },
        }
      `);

      expect(
        jwt.verify(
          `${resBody.token}.${cookies.get('sociably_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        {
          "data": {
            "foo": "data",
          },
          "exp": 1570003600,
          "iat": 1570000000,
          "init": 1570000000,
          "platform": "foo",
          "scope": {
            "path": "/",
          },
        }
      `);
    });

    test('sign with more detailed controller options', async () => {
      req.mock
        .getter('url')
        .fakeReturnValue('https://sociably.io/app/auth/_sign');

      const controller = new AuthController(
        new HttpOperator({
          secret,
          serverUrl,
          redirectRoot: '/app/pages',
          apiRoot: '/app/auth',
          tokenCookieMaxAge: 999,
          tokenLifetime: 9999,
          refreshDuration: 99999,
          cookieDomain: 'sociably.io',
          cookiePath: '/app',
          cookieSameSite: 'strict',
          secure: false,
        }),
        authenticators
      );

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.verifyCredential).toHaveBeenCalledTimes(1);
      expect(fooAuthenticator.verifyCredential).toHaveBeenCalledWith({
        foo: 'data',
      });

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "sociably_auth_signature" => {
            "directives": "Domain=sociably.io; HttpOnly; Path=/app; SameSite=Strict",
            "value": "ajZ9AB8MXaQ710FVOeRiebapqvdFaIejKqd8LRfCicQ",
          },
          "sociably_auth_token" => {
            "directives": "Domain=sociably.io; Path=/app; SameSite=Strict",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTcwMDAwMDAwLCJzY29wZSI6eyJkb21haW4iOiJzb2NpYWJseS5pbyIsInBhdGgiOiIvYXBwIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDA5OTk5fQ",
          },
          "sociably_auth_state" => {
            "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app/auth; SameSite=Strict",
            "value": "",
          },
          "sociably_auth_error" => {
            "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Strict",
            "value": "",
          },
        }
      `);

      const { token } = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(
        jwt.verify(
          `${token}.${cookies.get('sociably_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        {
          "data": {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "init": 1570000000,
          "platform": "foo",
          "scope": {
            "domain": "sociably.io",
            "path": "/app",
          },
        }
      `);
    });

    it('respond 404 if platform not found', async () => {
      req = prepareReq(
        'POST',
        'http://auth.sociably.io/_sign',
        {},
        { platform: 'baz', credential: { baz: 'data' } }
      );

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthenticator.verifyCredential).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.end).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 404,
            "reason": "unknown platform "baz"",
          },
          "platform": "baz",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond error if provider.verifyCredential() resolve not success', async () => {
      fooAuthenticator.verifyCredential.mock.fake(() => ({
        success: false,
        code: 418,
        reason: "I'm a teapot",
      }));

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(418);
      expect(res.end).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 418,
            "reason": "I'm a teapot",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      const url = 'http://auth.sociably.io/_sign';

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, '"Woooof"'),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid sign params",
          },
        }
      `);
    });

    it('respond 500 if porvider.verifyCredential() thrown', async () => {
      fooAuthenticator.verifyCredential.mock.fake(() => {
        throw new Error('Broken inside');
      });

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 500,
            "reason": "Broken inside",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(
        prepareReq('GET', 'https://auth.sociably.io/_sign', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
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
        init: SEC_NOW - 19999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.sociably.io/_refresh',
        { cookie: `sociably_auth_signature=${signature}` },
        { token }
      );
      res = moxy(new ServerResponse({} as never));
    });

    it('refresh token if provider.verifyRefreshment() passed', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.end).toHaveBeenCalledTimes(1);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toEqual({
        platform: 'foo',
        token: expect.any(String),
      });

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "sociably_auth_signature" => {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "3N2v9MBHZEcUr5-EYnyFCKiOk8ShTwu_wj0gAu9FYpw",
          },
          "sociably_auth_token" => {
            "directives": "Path=/; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTY5OTgwMDAxLCJzY29wZSI6eyJwYXRoIjoiLyJ9LCJpYXQiOjE1NzAwMDAwMDAsImV4cCI6MTU3MDAwMzYwMH0",
          },
          "sociably_auth_state" => {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
            "value": "",
          },
          "sociably_auth_error" => {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
            "value": "",
          },
        }
      `);

      expect(
        jwt.verify(
          `${resBody.token}.${cookies.get('sociably_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        {
          "data": {
            "foo": "data",
          },
          "exp": 1570003600,
          "iat": 1570000000,
          "init": 1569980001,
          "platform": "foo",
          "scope": {
            "path": "/",
          },
        }
      `);
    });

    test('refresh with more detailed controller options', async () => {
      req.mock
        .getter('url')
        .fake(() => 'https://sociably.io/app/auth/_refresh');

      const controller = new AuthController(
        new HttpOperator({
          secret,
          serverUrl,
          redirectRoot: '/app/pages',
          apiRoot: '/app/auth',
          tokenCookieMaxAge: 999,
          tokenLifetime: 9999,
          refreshDuration: 99999,
          cookieDomain: 'sociably.io',
          cookiePath: '/app',
          cookieSameSite: 'strict',
          secure: false,
        }),
        authenticators
      );

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "sociably_auth_signature" => {
            "directives": "Domain=sociably.io; HttpOnly; Path=/app; SameSite=Strict",
            "value": "xC5b7EcZ937SYP3QVOix0PpbhG-OySyZYBIsSjvHQlo",
          },
          "sociably_auth_token" => {
            "directives": "Domain=sociably.io; Path=/app; SameSite=Strict",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTY5OTgwMDAxLCJzY29wZSI6eyJkb21haW4iOiJzb2NpYWJseS5pbyIsInBhdGgiOiIvYXBwIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDA5OTk5fQ",
          },
          "sociably_auth_state" => {
            "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app/auth; SameSite=Strict",
            "value": "",
          },
          "sociably_auth_error" => {
            "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Strict",
            "value": "",
          },
        }
      `);

      expect(
        jwt.verify(
          `${resBody.token}.${cookies.get('sociably_auth_signature').value}`,
          '__SECRET__'
        )
      ).toMatchInlineSnapshot(`
        {
          "data": {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "init": 1569980001,
          "platform": "foo",
          "scope": {
            "domain": "sociably.io",
            "path": "/app",
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
        init: SEC_NOW - 19999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.sociably.io/_refresh',
        { cookie: `sociably_auth_signature=${signature}` },
        { token }
      );

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(404);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 404,
            "reason": "unknown platform "baz"",
          },
          "platform": "baz",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond error if provider.verifyCredential() fail', async () => {
      fooAuthenticator.verifyRefreshment.mock.fake(() => ({
        success: false,
        code: 418,
        reason: "I'm a teapot",
      }));

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(418);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 418,
            "reason": "I'm a teapot",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      req.mock.getter('headers').fakeReturnValue({});

      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 401,
            "reason": "no signature found",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);

      req.mock.getter('headers').fakeReturnValue({
        cookie: 'sociably_auth_signature=INVALID_SIGNATURE',
      });
      res = moxy(new ServerResponse({} as never));
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid signature",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if refreshDuration expired', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl, refreshDuration: 66666 }),
        authenticators
      );

      const [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 999,
        iat: SEC_NOW - 9999,
        init: SEC_NOW - 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.sociably.io/_refresh',
        { cookie: `sociably_auth_signature=${signature}` },
        { token }
      );

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 401,
            "reason": "refreshment period expired",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      const url = 'http://auth.sociably.io/_refresh';
      const header = { cookie: `sociably_auth_signature=SOMETHING_WHATEVER` };

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "empty token received",
          },
        }
      `);
    });

    it('respond 500 if porvider.verifyRefreshment() thrown', async () => {
      fooAuthenticator.verifyRefreshment.mock.fake(() => {
        throw new Error('Broken inside');
      });
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 500,
            "reason": "Broken inside",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(
        prepareReq('get', 'https://auth.sociably.io/_refresh', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
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
        init: SEC_NOW - 9999,
        scope: { path: '/' },
      });
    });

    it('respond 200 if token and signature valid', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );

      const req = prepareReq(
        'POST',
        'http://auth.sociably.io/_verify',
        { cookie: `sociably_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({} as never));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(body).toEqual({ platform: 'foo', token });

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if token expired', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );

      [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 999,
        iat: SEC_NOW - 9999,
        refreshTill: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://auth.sociably.io/_verify',
        { cookie: `sociably_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({} as never));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 401,
            "reason": "jwt expired",
          },
          "platform": "foo",
        }
      `);

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 404 platform not found', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );

      [token, signature] = prepareToken({
        platform: 'baz',
        data: { baz: 'data' },
        exp: SEC_NOW + 9999,
        iat: SEC_NOW - 999,
        init: SEC_NOW - 9999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://auth.sociably.io/_verify',
        { cookie: `sociably_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({} as never));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 404,
            "reason": "unknown platform "baz"",
          },
          "platform": "baz",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      let res;

      await controller.delegateAuthRequest(
        prepareReq('POST', 'http://auth.sociably.io/_verify', {}, { token }),
        (res = moxy(new ServerResponse({} as never)))
      );

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 401,
            "reason": "no signature found",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);

      await controller.delegateAuthRequest(
        prepareReq(
          'POST',
          'http://auth.sociably.io/_verify',
          { cookie: `sociably_auth_signature=INVALID_SIGNATURE` },
          { token }
        ),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid signature",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      const url = 'http://auth.sociably.io/_verify';
      const header = { cookie: `sociably_auth_signature=SOMETHING_WHATEVER` };
      let res;

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "invalid body format",
          },
        }
      `);

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
            "code": 400,
            "reason": "empty token received",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const res = moxy(new ServerResponse({} as never));
      const controller = new AuthController(
        new HttpOperator({ secret, serverUrl }),
        authenticators
      );
      await controller.delegateAuthRequest(
        prepareReq('GET', 'https://auth.sociably.io/_verify', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        {
          "error": {
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
    init: SEC_NOW - 9999,
    scope: { path: '/' },
  });

  it('resolve auth context if authorization verified', async () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `sociably_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "context": {
          "expireAt": 2019-10-02T09:53:19.000Z,
          "foo": "foo.data",
          "loginAt": 2019-10-02T06:50:01.000Z,
          "platform": "foo",
          "thread": {
            "platform": "foo",
            "uid": "foo.thread",
          },
          "user": {
            "platform": "foo",
            "uid": "john_doe",
          },
        },
        "ok": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwiaW5pdCI6MTU2OTk5MDAwMSwic2NvcGUiOnsicGF0aCI6Ii8ifX0",
      }
    `);

    expect(fooAuthenticator.checkAuthData).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthData).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('work with token passed as 2nd param', async () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          { cookie: `sociably_auth_signature=${signature}` },
          { user_api: 'stuff' }
        ),
        token
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "context": {
          "expireAt": 2019-10-02T09:53:19.000Z,
          "foo": "foo.data",
          "loginAt": 2019-10-02T06:50:01.000Z,
          "platform": "foo",
          "thread": {
            "platform": "foo",
            "uid": "foo.thread",
          },
          "user": {
            "platform": "foo",
            "uid": "john_doe",
          },
        },
        "ok": true,
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwiaW5pdCI6MTU2OTk5MDAwMSwic2NvcGUiOnsicGF0aCI6Ii8ifX0",
      }
    `);

    expect(fooAuthenticator.checkAuthData).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthData).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('throw 401 if signature invalid', async () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `sociably_auth_signature=INVALID_SIGNATURE`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 400,
        "ok": false,
        "reason": "invalid signature",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwiaW5pdCI6MTU2OTk5MDAwMSwic2NvcGUiOnsicGF0aCI6Ii8ifX0",
      }
    `);

    expect(fooAuthenticator.checkAuthData).not.toHaveBeenCalled();
  });

  it('throw 401 if no signature in cookies', async () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          { authorization: `Bearer ${token}` },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 401,
        "ok": false,
        "reason": "require signature",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwiaW5pdCI6MTU2OTk5MDAwMSwic2NvcGUiOnsicGF0aCI6Ii8ifX0",
      }
    `);

    expect(fooAuthenticator.checkAuthData).not.toHaveBeenCalled();
  });

  it('throw 401 if no token provided', async () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          { cookie: `sociably_auth_signature=${signature}` },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 401,
        "ok": false,
        "reason": "no Authorization header",
        "token": undefined,
      }
    `);

    expect(fooAuthenticator.checkAuthData).not.toHaveBeenCalled();
  });

  it('throw 400 if no invalid authorization format received', async () => {
    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          {
            authorization: `Unknown-Scheme ${token}`,
            cookie: `sociably_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 400,
        "ok": false,
        "reason": "invalid auth scheme",
        "token": undefined,
      }
    `);

    expect(fooAuthenticator.checkAuthData).not.toHaveBeenCalled();
  });

  it('throw 404 if platform not found', async () => {
    const [bazToken, bazSignature] = prepareToken({
      platform: 'baz',
      data: { baz: 'data' },
      init: SEC_NOW - 9999,
      exp: SEC_NOW + 9999,
      iat: SEC_NOW - 999,
      scope: { path: '/' },
    });

    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          {
            authorization: `Bearer ${bazToken}`,
            cookie: `sociably_auth_signature=${bazSignature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 404,
        "ok": false,
        "reason": "unknown platform "baz"",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImJheiIsImRhdGEiOnsiYmF6IjoiZGF0YSJ9LCJpbml0IjoxNTY5OTkwMDAxLCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwic2NvcGUiOnsicGF0aCI6Ii8ifX0",
      }
    `);

    expect(fooAuthenticator.checkAuthData).not.toHaveBeenCalled();
  });

  it('throw 400 if provider.checkAuthData() fail', async () => {
    fooAuthenticator.checkAuthData.mock.fake(() => {
      return {
        ok: false,
        code: 400,
        reason: 'invalid auth data',
      };
    });

    const controller = new AuthController(
      new HttpOperator({ secret, serverUrl }),
      authenticators
    );
    await expect(
      controller.verifyAuth(
        prepareReq(
          'POST',
          'https://auth.sociably.io/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `sociably_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 400,
        "ok": false,
        "reason": "invalid auth data",
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwiaW5pdCI6MTU2OTk5MDAwMSwic2NvcGUiOnsicGF0aCI6Ii8ifX0",
      }
    `);

    expect(fooAuthenticator.checkAuthData).toHaveBeenCalledTimes(1);
  });
});
