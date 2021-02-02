import { IncomingMessage, ServerResponse } from 'http';
import jsonwebtoken from 'jsonwebtoken';
import { Readable } from 'stream';
import moxy, { Moxy } from '@moxyjs/moxy';
import { AuthController } from '../controller';
import { AnyServerAuthorizer } from '../types';

const getCookies = (res) => {
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

const fooAuthorizer: Moxy<AnyServerAuthorizer> = moxy({
  platform: 'foo',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifyCredential() {
    return { success: true, data: { foo: 'data' } };
  },
  async verifyRefreshment() {
    return { success: true, data: { foo: 'data' } };
  },
  checkAuthContext() {
    return {
      success: true,
      contextSupplment: {
        user: { platform: 'foo', uid: 'john_doe' },
        channel: { platform: 'foo', uid: 'foo.channel' },
        foo: 'foo.data',
      },
    };
  },
});

const barAuhtorizer: Moxy<AnyServerAuthorizer> = moxy({
  platform: 'bar',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifyCredential() {
    return { success: false, code: 400, reason: 'bar' };
  },
  async verifyRefreshment() {
    return { success: false, code: 400, reason: 'bar' };
  },
  checkAuthContext() {
    return {
      success: true,
      contextSupplment: {
        user: { platform: 'bar', uid: 'jojo_doe' },
        channel: { platform: 'bar', uid: 'bar.channel' },
        bar: 'bar.data',
      },
    };
  },
});

const authorizers = [fooAuthorizer, barAuhtorizer];
const secret = '__SECRET__';
const redirectUrl = '/webview';

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
    const controller = new AuthController(authorizers, { secret, redirectUrl });
    expect(controller.authorizers).toBe(authorizers);
    expect(controller.secret).toBe(secret);
  });

  it('throw if options.authorizers is empty', () => {
    expect(
      () => new AuthController([], { secret, redirectUrl })
    ).toThrowErrorMatchingInlineSnapshot(`"authorizers must not be empty"`);
    expect(
      () => new AuthController(null as any, { secret, redirectUrl })
    ).toThrowErrorMatchingInlineSnapshot(`"authorizers must not be empty"`);
  });

  it('throw if options.secret is empty', () => {
    expect(
      () => new AuthController(authorizers, { redirectUrl } as any)
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
    expect(
      () => new AuthController(authorizers, { secret: '', redirectUrl })
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
  });

  it('throw if options.redirectUrl is empty', () => {
    expect(
      () => new AuthController(authorizers, { secret } as any)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.redirectUrl must not be empty"`
    );
    expect(
      () => new AuthController(authorizers, { redirectUrl: '', secret })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.redirectUrl must not be empty"`
    );
  });

  it("throw if entryPath isn't a subpath of cookiePath when both given", () => {
    expect(
      () =>
        new AuthController(authorizers, {
          secret,
          redirectUrl: '/app/webview',
          entryPath: '/auth',
          cookiePath: '/app',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.entryPath should be a subpath of options.cookiePath"`
    );
  });

  it("throw if redirectUrl isn't under subpath of cookiePath", () => {
    expect(
      () =>
        new AuthController(authorizers, {
          secret,
          redirectUrl: '/webview',
          entryPath: '/app/auth',
          cookiePath: '/app',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.redirectUrl should be under cookie scope \\"/app\\""`
    );
  });

  it("throw if redirectUrl isn't under subdomain of cookieDomain", () => {
    expect(
      () =>
        new AuthController(authorizers, {
          secret,
          redirectUrl: 'view.machinat.io',
          entryPath: '/auth',
          cookieDomain: 'api.machinat.io',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.redirectUrl should be under cookie scope \\"//api.machinat.io/\\""`
    );
  });

  it('throw if protocol of redirectUrl is http when secure', () => {
    (() =>
      new AuthController(authorizers, {
        secure: false,
        secret,
        redirectUrl: 'http://machinat.io',
      }))();

    expect(
      () =>
        new AuthController(authorizers, {
          secret,
          redirectUrl: 'http://machinat.io',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"protocol of options.redirectUrl can only be https when options.secure set to true"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  describe('handling request', () => {
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({} as never));
    });

    it('respond 403 if being called outside fo entryPath scope', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
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

      res = moxy(new ServerResponse({} as never));
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
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      res.mock.getter('finished').fakeReturnValue(true);

      let req = prepareReq('GET', 'https://auth.machinat.com/foo', {}, '');
      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
      expect(fooAuthorizer.delegateAuthRequest.mock).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Object),
        { originalPath: '/foo', matchedPath: '/foo', trailingPath: '' }
      );

      req = prepareReq('GET', 'https://auth.machinat.com/bar/baz', {}, '');
      await controller.delegateAuthRequest(req, res);

      expect(barAuhtorizer.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
      expect(barAuhtorizer.delegateAuthRequest.mock).toHaveBeenCalledWith(
        req,
        res,
        expect.any(Object),
        { originalPath: '/bar/baz', matchedPath: '/bar', trailingPath: 'baz' }
      );

      expect(res.end.mock).not.toHaveBeenCalled();
    });

    it('respond 501 if res not closed by provider', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
          "platform": "foo",
        }
      `);
    });

    it('respond 404 if no matched provider', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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

  describe('cookie accessor helper', () => {
    function getDelegateArgs(controller) {
      const req = moxy(new IncomingMessage({} as never));
      const res = moxy(new ServerResponse({} as never));

      req.mock.getter('url').fake(() => `${controller.entryPath}/foo`);
      res.mock.getter('finished').fake(() => true);
      res.end.mock.fake(() => {});

      controller.delegateAuthRequest(req, res);
      return fooAuthorizer.delegateAuthRequest.mock.calls.slice(-1)[0].args;
    }

    test('.issueState(data)', async () => {
      async function testIssueState(controller) {
        const [, res, resHelper] = getDelegateArgs(controller);

        const stateEncoded = await resHelper.issueState({ foo: 'state' });
        const cookies = getCookies(res);

        expect(cookies.get('machinat_auth_state').value).toBe(stateEncoded);
        const payload = jsonwebtoken.verify(stateEncoded, '__SECRET__');
        return [cookies, payload];
      }

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
        entryPath: '/auth',
      });

      let [cookies, payload] = await testIssueState(controller);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_state" => Object {
            "directives": "HttpOnly; Max-Age=180; Path=/auth; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInN0YXRlIjp7ImZvbyI6InN0YXRlIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAwMTgwfQ.JGwcdkmjn12fYUI62Z-W2vMqMvVPr8m0Fxv4VzFd9g8",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "exp": 1570000180,
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
          redirectUrl: '/app/pages',
          entryPath: '/app/auth',
          dataCookieAge: 99,
          cookieDomain: 'machinat.io',
          cookiePath: '/app',
          sameSite: 'none',
          secure: false,
        })
      );
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_state" => Object {
            "directives": "HttpOnly; Max-Age=99; Path=/app/auth; SameSite=None",
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

    test('.issueAuth(data, options)', async () => {
      async function testIssueAuth(controller, issueOpts?) {
        const [, res, resHelper] = getDelegateArgs(controller);
        const token = await resHelper.issueAuth({ foo: 'data' }, issueOpts);

        const cookies = getCookies(res);
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      let [cookies, payload] = await testIssueAuth(controller);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "8kIrJgTaziNMXKlHLGKRPXNzTLpC3moIQV9vBKmLOQM",
          },
          "machinat_auth_token" => Object {
            "directives": "Max-Age=600; Path=/; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoVGlsbCI6MTU3MDA4NjQwMCwic2NvcGUiOnsicGF0aCI6Ii8ifSwiaWF0IjoxNTcwMDAwMDAwLCJleHAiOjE1NzAwMDM2MDB9",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
            "value": "",
          },
        }
      `);
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570003600,
          "iat": 1570000000,
          "platform": "foo",
          "refreshTill": 1570086400,
          "scope": Object {
            "path": "/",
          },
        }
      `);

      const customizedController = new AuthController(authorizers, {
        secret,
        redirectUrl: '/app/pages',
        entryPath: '/app/auth',
        authCookieAge: 999,
        tokenAge: 9999,
        refreshPeriod: 99999,
        cookieDomain: 'machinat.io',
        cookiePath: '/app',
        sameSite: 'none',
        secure: false,
      });

      [cookies, payload] = await testIssueAuth(customizedController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/app; SameSite=None",
            "value": "-cVGfumsXdwJOZZbeVttI4zdxEH8f7ojfH6W0wKZ6qo",
          },
          "machinat_auth_token" => Object {
            "directives": "Domain=machinat.io; Max-Age=999; Path=/app; SameSite=None",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoVGlsbCI6MTU3MDA5OTk5OSwic2NvcGUiOnsiZG9tYWluIjoibWFjaGluYXQuaW8iLCJwYXRoIjoiL2FwcCJ9LCJpYXQiOjE1NzAwMDAwMDAsImV4cCI6MTU3MDAwOTk5OX0",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
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
          "refreshTill": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/app",
          },
        }
      `);

      // with specified refreshTill
      [cookies, payload] = await testIssueAuth(customizedController, {
        refreshTill: SEC_NOW + 12345,
      });
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshTill": 1570012345,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/app",
          },
        }
      `);

      [cookies, payload] = await testIssueAuth(customizedController, {
        refreshTill: SEC_NOW + 12345,
      });
      expect(payload).toMatchInlineSnapshot(`
        Object {
          "data": Object {
            "foo": "data",
          },
          "exp": 1570009999,
          "iat": 1570000000,
          "platform": "foo",
          "refreshTill": 1570012345,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/app",
          },
        }
      `);

      // ignoer refreshTill if it's before token expire
      [cookies, payload] = await testIssueAuth(customizedController, {
        refreshTill: SEC_NOW + 1,
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
            "path": "/app",
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
          "refreshTill": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/app",
          },
        }
      `);
    });

    it('.issueError(code, reason)', async () => {
      async function testIssueError(controller) {
        const [, res, resHelper] = getDelegateArgs(controller);

        const errEncoded = await resHelper.issueError(418, "I'm a teapot");
        const cookies = getCookies(res);

        expect(cookies.get('machinat_auth_error').value).toBe(errEncoded);
        const payload = jsonwebtoken.verify(errEncoded, '__SECRET__');
        return [cookies, payload];
      }

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
        entryPath: '/auth',
      });

      let [cookies, payload] = await testIssueError(controller);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_error" => Object {
            "directives": "Max-Age=180; Path=/; SameSite=Lax; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwicmVhc29uIjoiSSdtIGEgdGVhcG90In0sInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMH0.dCs_-sNRQZoWk1dOHoRcGKCs6LEgGCwky_lWqODov3A",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_signature" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_token" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
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
          redirectUrl: '/app/pages',
          entryPath: '/app/auth',
          dataCookieAge: 99,
          cookieDomain: 'machinat.io',
          cookiePath: '/app',
          sameSite: 'none',
          secure: false,
        })
      );
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Max-Age=99; Path=/app; SameSite=None",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwicmVhc29uIjoiSSdtIGEgdGVhcG90In0sInNjb3BlIjp7ImRvbWFpbiI6Im1hY2hpbmF0LmlvIiwicGF0aCI6Ii9hcHAifSwiaWF0IjoxNTcwMDAwMDAwfQ.Tmq9hADHYlUr4mvOg-V9MZrfW_o6TRqgRMDDn_zZkXI",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_token" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
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
            "path": "/app",
          },
        }
      `);
    });

    it('/getState()', async () => {
      const [req, , resHelper] = getDelegateArgs(
        new AuthController(authorizers, { secret, redirectUrl })
      );
      const platform = 'foo';
      const state = { foo: 'state' };
      const scope = { path: '/' };

      req.mock.getter('headers').fake(() => ({
        cookie: `no_state=existed`,
      }));
      await expect(resHelper.getState()).resolves.toBe(null);

      const stateEnceded = jsonwebtoken.sign(
        { platform, state, scope, iat: SEC_NOW - 10, exp: SEC_NOW + 10 },
        '__SECRET__'
      );

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${stateEnceded}`,
      }));
      await expect(resHelper.getState()).resolves.toEqual({
        foo: 'state',
      });

      // wrong signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${stateEnceded}_WITH_WRONG_SIG`,
      }));
      await expect(resHelper.getState()).resolves.toBe(null);

      // different platform
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${jsonwebtoken.sign(
          { platform: 'bar', state, scope, iat: SEC_NOW - 10 },
          '__SECRET__'
        )}`,
      }));
      await expect(resHelper.getState()).resolves.toBe(null);

      // outdated
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${jsonwebtoken.sign(
          { platform, state, scope, iat: SEC_NOW - 21, exp: SEC_NOW - 1 },
          '__SECRET__'
        )}`,
      }));
      await expect(resHelper.getState()).resolves.toBe(null);
    });

    it('.getAuth()', async () => {
      function createTokenAndSig(payload) {
        const [headerEncoded, payloadEncoded, signature] = jsonwebtoken
          .sign(payload, '__SECRET__')
          .split('.');

        return [`${headerEncoded}.${payloadEncoded}`, signature];
      }

      const [req, , resHelper] = getDelegateArgs(
        new AuthController(authorizers, { secret, redirectUrl })
      );
      const platform = 'foo';
      const data = { foo: 'data' };
      const scope = { path: '/' };

      req.mock.getter('headers').fake(() => ({
        cookie: `no_auth=existed`,
      }));
      await expect(resHelper.getAuth()).resolves.toBe(null);

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
      await expect(resHelper.getAuth()).resolves.toBe(null);

      // no token
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_signature=${sig}`,
      }));
      await expect(resHelper.getAuth()).resolves.toBe(null);

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(resHelper.getAuth()).resolves.toEqual({ foo: 'data' });

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(resHelper.getAuth()).resolves.toEqual({ foo: 'data' });

      // wrong signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=WRONG_SIG;`,
      }));
      await expect(resHelper.getAuth()).resolves.toBe(null);

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
      await expect(resHelper.getAuth()).resolves.toBe(null);

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
      await expect(resHelper.getAuth()).resolves.toBe(null);
    });

    test('.getError()', async () => {
      const [req, , resHelper] = getDelegateArgs(
        new AuthController(authorizers, { secret, redirectUrl })
      );
      const platform = 'foo';
      const error = { code: 418, reason: "I'm a teapot" };
      const scope = { path: '/' };

      // not existed
      req.mock.getter('headers').fake(() => ({
        cookie: `no_error=existed`,
      }));
      await expect(resHelper.getError()).resolves.toBe(null);

      const errEncoded = jsonwebtoken.sign(
        { platform, error, scope, iat: SEC_NOW - 10 },
        '__SECRET__'
      );

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${errEncoded}`,
      }));
      await expect(resHelper.getError()).resolves.toEqual(error);

      // woring signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${`${errEncoded}_WITH_WRONG_SIG`}`,
      }));
      await expect(resHelper.getError()).resolves.toBe(null);

      // different platform
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${jsonwebtoken.sign(
          { platform: 'bar', error, scope, iat: SEC_NOW - 10 },
          '__SECRET__'
        )}`,
      }));
      await expect(resHelper.getError()).resolves.toBe(null);
    });

    test('.redirect(url, options)', () => {
      const [, res, resHelper] = getDelegateArgs(
        new AuthController(authorizers, { secret, redirectUrl: '/hello/world' })
      );

      expect(resHelper.redirect()).toBe(true);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(1);
      expect(res.writeHead.mock).toHaveBeenCalledWith(302, {
        Location: '/hello/world',
      });

      expect(resHelper.redirect('foo?bar=baz')).toBe(true);
      expect(res.end.mock).toHaveBeenCalledTimes(2);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(2);
      expect(res.writeHead.mock).toHaveBeenCalledWith(302, {
        Location: '/hello/foo?bar=baz',
      });

      expect(resHelper.redirect('http://machiant.io/foo?bar=baz')).toBe(true);
      expect(res.end.mock).toHaveBeenCalledTimes(3);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(3);
      expect(res.writeHead.mock).toHaveBeenCalledWith(302, {
        Location: 'http://machiant.io/foo?bar=baz',
      });
    });

    test('.redirect(url, options) with assertInternal set to true', () => {
      const [, res, resHelper] = getDelegateArgs(
        new AuthController(authorizers, {
          secret,
          redirectUrl: 'https://machinat.com/webview',
        })
      );

      expect(resHelper.redirect('/webview', { assertInternal: true })).toBe(
        true
      );
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(1);
      expect(res.writeHead.mock).toHaveBeenCalledWith(302, {
        Location: 'https://machinat.com/webview',
      });

      expect(resHelper.redirect('/foo', { assertInternal: true })).toBe(false);
      expect(res.end.mock).toHaveBeenCalledTimes(2);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(2);
      expect(res.writeHead.mock).toHaveBeenNthCalledWith(2, 400);

      expect(
        resHelper.redirect('https://machinat.io/webview', {
          assertInternal: true,
        })
      ).toBe(false);
      expect(res.end.mock).toHaveBeenCalledTimes(3);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(3);
      expect(res.writeHead.mock).toHaveBeenNthCalledWith(3, 400);

      expect(
        resHelper.redirect('http://machinat.com/webview', {
          assertInternal: true,
        })
      ).toBe(false);
      expect(res.end.mock).toHaveBeenCalledTimes(4);
      expect(res.writeHead.mock).toHaveBeenCalledTimes(4);
      expect(res.writeHead.mock).toHaveBeenNthCalledWith(4, 400);
    });
  });

  describe('_sign api', () => {
    let req;
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({} as never));
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_sign',
        {},
        { platform: 'foo', credential: { foo: 'data' } }
      );
    });

    it('sign cookie and respond token if provider verfication passed', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "8kIrJgTaziNMXKlHLGKRPXNzTLpC3moIQV9vBKmLOQM",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
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
          "exp": 1570003600,
          "iat": 1570000000,
          "platform": "foo",
          "refreshTill": 1570086400,
          "scope": Object {
            "path": "/",
          },
        }
      `);
    });

    test('sign with more detailed controller options', async () => {
      req.mock
        .getter('url')
        .fakeReturnValue('https://machinat.io/app/auth/_sign');

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl: '/app/pages',
        entryPath: '/app/auth',
        authCookieAge: 999,
        dataCookieAge: 99,
        tokenAge: 9999,
        refreshPeriod: 99999,
        cookieDomain: 'machinat.io',
        cookiePath: '/app',
        sameSite: 'strict',
        secure: false,
      });

      await controller.delegateAuthRequest(req, res);

      expect(fooAuthorizer.verifyCredential.mock).toHaveBeenCalledTimes(1);
      expect(fooAuthorizer.verifyCredential.mock).toHaveBeenCalledWith({
        foo: 'data',
      });

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/app; SameSite=Strict",
            "value": "-cVGfumsXdwJOZZbeVttI4zdxEH8f7ojfH6W0wKZ6qo",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
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
          "refreshTill": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
            "path": "/app",
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
          "platform": "baz",
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      const url = 'http://auth.machinat.com/_sign';

      await controller.delegateAuthRequest(
        prepareReq('POST', url, {}, '"Woooof"'),
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
        refreshTill: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      res = moxy(new ServerResponse({} as never));
    });

    it('refresh token if provider.verifyRefreshment() passed', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toEqual({
        platform: 'foo',
        token: expect.any(String),
      });

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
            "value": "JAoD-2IbrB6uVQ2wMBN--WuqBT2WzefriMxb71wkoDI",
          },
          "machinat_auth_state" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax",
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
          "exp": 1570003600,
          "iat": 1570000000,
          "platform": "foo",
          "refreshTill": 1570099999,
          "scope": Object {
            "path": "/",
          },
        }
      `);
    });

    test('refresh with more detailed controller options', async () => {
      req.mock
        .getter('url')
        .fake(() => 'https://machinat.io/app/auth/_refresh');

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl: '/app/pages',
        entryPath: '/app/auth',
        authCookieAge: 999,
        dataCookieAge: 99,
        tokenAge: 9999,
        refreshPeriod: 99999,
        cookieDomain: 'machinat.io',
        cookiePath: '/app',
        sameSite: 'strict',
        secure: false,
      });

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(200);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);

      const cookies = getCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/app; SameSite=Strict",
            "value": "-cVGfumsXdwJOZZbeVttI4zdxEH8f7ojfH6W0wKZ6qo",
          },
          "machinat_auth_state" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
            "value": "",
          },
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=Lax",
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
          "refreshTill": 1570099999,
          "scope": Object {
            "domain": "machinat.io",
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
        refreshTill: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://auth.machinat.com/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(404);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "unknown platform \\"baz\\"",
          },
          "platform": "baz",
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(418);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
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

      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
      res = moxy(new ServerResponse({} as never));
      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid signature",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if refreshPeriod outdated', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });

      const [token, signature] = prepareToken({
        platform: 'foo',
        data: { foo: 'data' },
        exp: SEC_NOW - 9999,
        iat: SEC_NOW - 99999,
        refreshTill: SEC_NOW - 1,
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
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if no refreshTill existed in payload', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });

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
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      const url = 'http://auth.machinat.com/_refresh';
      const header = { cookie: `machinat_auth_signature=SOMETHING_WHATEVER` };

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
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
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
        refreshTill: SEC_NOW + 99999,
        scope: { path: '/' },
      });
    });

    it('respond 200 if token and signature valid', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });

      const req = prepareReq(
        'POST',
        'http://auth.machinat.com/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
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
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });

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
        'http://auth.machinat.com/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({} as never));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "reason": "jwt expired",
          },
          "platform": "foo",
        }
      `);

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 404 platform not found', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });

      [token, signature] = prepareToken({
        platform: 'baz',
        data: { baz: 'data' },
        exp: SEC_NOW + 9999,
        iat: SEC_NOW - 999,
        refreshTill: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://auth.machinat.com/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({} as never));

      await controller.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "reason": "unknown platform \\"baz\\"",
          },
          "platform": "baz",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      let res;

      await controller.delegateAuthRequest(
        prepareReq('POST', 'http://auth.machinat.com/_verify', {}, { token }),
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "reason": "invalid signature",
          },
          "platform": "foo",
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
      const url = 'http://auth.machinat.com/_verify';
      const header = { cookie: `machinat_auth_signature=SOMETHING_WHATEVER` };
      let res;

      await controller.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
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
        (res = moxy(new ServerResponse({} as never)))
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
      const res = moxy(new ServerResponse({} as never));
      const controller = new AuthController(authorizers, {
        secret,
        redirectUrl,
      });
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
    refreshTill: SEC_NOW + 99999,
    scope: { path: '/' },
  });

  it('resolve auth context if authorization verified', async () => {
    const controller = new AuthController(authorizers, { secret, redirectUrl });
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
              "context": Object {
                "channel": Object {
                  "platform": "foo",
                  "uid": "foo.channel",
                },
                "expireAt": 2019-10-02T09:53:19.000Z,
                "foo": "foo.data",
                "loginAt": 2019-10-02T06:50:01.000Z,
                "platform": "foo",
                "user": Object {
                  "platform": "foo",
                  "uid": "john_doe",
                },
              },
              "success": true,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaFRpbGwiOjE1NzAwOTk5OTksInNjb3BlIjp7InBhdGgiOiIvIn19",
            }
          `);

    expect(fooAuthorizer.checkAuthContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.checkAuthContext.mock).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('work with token passed as 2nd param', async () => {
    const controller = new AuthController(authorizers, { secret, redirectUrl });
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
              "context": Object {
                "channel": Object {
                  "platform": "foo",
                  "uid": "foo.channel",
                },
                "expireAt": 2019-10-02T09:53:19.000Z,
                "foo": "foo.data",
                "loginAt": 2019-10-02T06:50:01.000Z,
                "platform": "foo",
                "user": Object {
                  "platform": "foo",
                  "uid": "john_doe",
                },
              },
              "success": true,
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaFRpbGwiOjE1NzAwOTk5OTksInNjb3BlIjp7InBhdGgiOiIvIn19",
            }
          `);

    expect(fooAuthorizer.checkAuthContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.checkAuthContext.mock).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('throw 401 if signature invalid', async () => {
    const controller = new AuthController(authorizers, { secret, redirectUrl });
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
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaFRpbGwiOjE1NzAwOTk5OTksInNjb3BlIjp7InBhdGgiOiIvIn19",
            }
          `);

    expect(fooAuthorizer.checkAuthContext.mock).not.toHaveBeenCalled();
  });

  it('throw 401 if no signature in cookies', async () => {
    const controller = new AuthController(authorizers, { secret, redirectUrl });
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
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaFRpbGwiOjE1NzAwOTk5OTksInNjb3BlIjp7InBhdGgiOiIvIn19",
            }
          `);

    expect(fooAuthorizer.checkAuthContext.mock).not.toHaveBeenCalled();
  });

  it('throw 401 if no token provided', async () => {
    const controller = new AuthController(authorizers, { secret, redirectUrl });
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

    expect(fooAuthorizer.checkAuthContext.mock).not.toHaveBeenCalled();
  });

  it('throw 400 if no invalid authorization format received', async () => {
    const controller = new AuthController(authorizers, { secret, redirectUrl });
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

    expect(fooAuthorizer.checkAuthContext.mock).not.toHaveBeenCalled();
  });

  it('throw 404 if platform not found', async () => {
    const [bazToken, bazSignature] = prepareToken({
      platform: 'baz',
      data: { baz: 'data' },
      exp: SEC_NOW + 9999,
      iat: SEC_NOW - 999,
      refreshTill: SEC_NOW + 99999,
      scope: { path: '/' },
    });

    const controller = new AuthController(authorizers, { secret, redirectUrl });
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
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImJheiIsImRhdGEiOnsiYmF6IjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaFRpbGwiOjE1NzAwOTk5OTksInNjb3BlIjp7InBhdGgiOiIvIn19",
            }
          `);

    expect(fooAuthorizer.checkAuthContext.mock).not.toHaveBeenCalled();
  });

  it('throw 400 if provider.checkAuthContext() resolve empty', async () => {
    fooAuthorizer.checkAuthContext.mock.fake(async () => {
      return null;
    });

    const controller = new AuthController(authorizers, { secret, redirectUrl });
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
              "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJleHAiOjE1NzAwMDk5OTksImlhdCI6MTU2OTk5OTAwMSwicmVmcmVzaFRpbGwiOjE1NzAwOTk5OTksInNjb3BlIjp7InBhdGgiOiIvIn19",
            }
          `);

    expect(fooAuthorizer.checkAuthContext.mock).toHaveBeenCalledTimes(1);
  });
});
