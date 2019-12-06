import { IncomingMessage, ServerResponse } from 'http';
import { Readable } from 'stream';
import jsonwebtoken from 'jsonwebtoken';
import moxy from 'moxy';
import AuthError from '../../error';
import ServerController from '../controller';
import { CookieSession } from '../session';

const parseSetCookies = res => {
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

const prepareToken = payload => {
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
    }),
    { mockProperty: false }
  );
  req.mock.getter('url').fake(() => url);
  req.mock.getter('method').fake(() => method);
  req.mock.getter('headers').fake(() => headers);

  return req;
};

const fooProvider = moxy({
  platform: 'foo',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifySigning() {
    return { accepted: true, data: { foo: 'data' }, refreshable: true };
  },
  async verifyRefreshment() {
    return { accepted: true, data: { foo: 'data' }, refreshable: true };
  },
  async refineAuth() {
    return { user: { id: 'foo' }, channel: { id: 'foo' } };
  },
});

const barProvider = moxy({
  platform: 'bar',
  async delegateAuthRequest() {}, // eslint-disable-line no-empty-function
  async verifySigning() {
    return { accepted: false, code: 400, message: 'bar' };
  },
  async verifyRefreshment() {
    return { accepted: false, code: 400, message: 'bar' };
  },
  async refineAuth() {
    return { user: { id: 'bar' }, channel: { id: 'bar' } };
  },
});

const providers = [fooProvider, barProvider];
const secret = '__SECRET__';
const authEntry = 'https://machinat.com/auth';

const defaultController = new ServerController({
  providers,
  secret,
  authEntry,
});

const customizedController = new ServerController({
  providers,
  secret,
  authEntry: 'https://auth.machinat.io/api',
  dataCookieAge: 99,
  authCookieAge: 999,
  tokenAge: 9999,
  refreshPeriod: 99999,
  domainScope: 'machinat.io',
  pathScope: '/api',
  sameSite: 'Lax',
  dev: true,
});

beforeEach(() => {
  fooProvider.mock.reset();
  barProvider.mock.reset();
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
    expect(defaultController.providers).toBe(providers);
    expect(defaultController.secret).toBe(secret);
    expect(defaultController.authEntry).toBe(authEntry);
  });

  it('throw if options.providers is empty', () => {
    expect(
      () => new ServerController({ secret, authEntry })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.providers must not be empty"`
    );
    expect(
      () => new ServerController({ providers: [], secret, authEntry })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.providers must not be empty"`
    );
  });

  it('throw if options.secret is empty', () => {
    expect(
      () => new ServerController({ providers, authEntry })
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
    expect(
      () => new ServerController({ providers, secret: '', authEntry })
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
  });

  it('throw if options.authEntry is not valid url', () => {
    expect(
      () => new ServerController({ providers, secret })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authEntry must not be empty"`
    );
    expect(
      () => new ServerController({ providers, secret, authEntry: '/path/only' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid or incomplete authEntry url"`
    );
    expect(
      () =>
        new ServerController({
          providers,
          secret,
          authEntry: 'no.protocol.com/path',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"invalid or incomplete authEntry url"`
    );
  });

  it('check authEntry match cookie scopes if provided', () => {
    expect(
      () =>
        new ServerController({
          providers,
          secret,
          authEntry: 'https://auth.machinat.com',
          domainScope: 'somewhere.machinat.com',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authEntry should be located under subdomain of options.domainScope"`
    );
    expect(
      () =>
        new ServerController({
          providers,
          secret,
          authEntry: 'https://machinat.com/auth',
          pathScope: '/somewhere',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authEntry should be located under subpath of options.pathScope"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  describe('handling request', () => {
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({}));
    });

    it('do nothing and resolve false if request url not located under authEntry', async () => {
      let req = prepareReq(
        'GET',
        'https://unmatched_domain.machinat.com/auth',
        {},
        ''
      );
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(false);

      req = prepareReq('GET', 'https://machinat.com/someWhereElse', {}, '');
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(false);

      req = prepareReq('GET', 'https://machinat.com/', {}, '');
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(false);

      expect(res.end.mock).not.toHaveBeenCalled();
      expect(res.write.mock).not.toHaveBeenCalled();
      expect(res.writeHead.mock).not.toHaveBeenCalled();
      expect(res.mock.setter('statusCode')).not.toHaveBeenCalled();
    });

    it('respond 403 if being called on authEntry directly', async () => {
      const req = prepareReq('GET', 'https://machinat.com/auth', {}, '');
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(403);
      expect(res.end.mock).toHaveBeenCalled();
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
          Object {
            "error": Object {
              "code": 403,
              "message": "path forbidden",
            },
          }
      `);
    });

    it('delegate to provider correponded to the platform in the route', async () => {
      res.mock.getter('finished').fakeReturnValue(true);

      let req = prepareReq('GET', 'https://machinat.com/auth/foo', {}, '');
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
      expect(fooProvider.delegateAuthRequest.mock) //
        .toHaveBeenCalledWith(req, res, expect.any(CookieSession));

      req = prepareReq('GET', 'https://machinat.com/auth/bar/subpath', {}, '');
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(barProvider.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);
      expect(barProvider.delegateAuthRequest.mock) //
        .toHaveBeenCalledWith(req, res, expect.any(CookieSession));

      expect(res.end.mock).not.toHaveBeenCalled();
    });

    it('respond 501 if res not closed by provider', async () => {
      const req = prepareReq('GET', 'https://machinat.com/auth/foo', {}, '');

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.delegateAuthRequest.mock).toHaveBeenCalledTimes(1);

      expect(res.statusCode).toBe(501);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
          Object {
            "error": Object {
              "code": 501,
              "message": "connection not closed by provider",
            },
          }
      `);
    });

    it('respond 404 if no matched provider', async () => {
      const req = prepareReq('GET', 'https://machinat.com/auth/baz', {}, '');
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.mock).not.toHaveBeenCalled();
      expect(barProvider.mock).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(404);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
          Object {
            "error": Object {
              "code": 404,
              "message": "platform \\"baz\\" not found",
            },
          }
      `);
    });

    it('respond 404 if unknown private api called', async () => {
      const req = prepareReq(
        'POST',
        'https://machinat.com/auth/_unknown',
        {},
        ''
      );
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.mock).not.toHaveBeenCalled();
      expect(barProvider.mock).not.toHaveBeenCalled();

      expect(res.statusCode).toBe(404);
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "message": "invalid auth api route \\"_unknown\\"",
          },
        }
      `);
    });
  });

  describe('CookieSession passed to provider', () => {
    function getDelegateArgs(controller) {
      const req = moxy(new IncomingMessage());
      const res = moxy(new ServerResponse({}));

      req.mock.getter('url').fake(() => `${controller.authEntry}/foo`);
      res.mock.getter('finished').fake(() => true);

      controller.delegateAuthRequest(req, res);
      return fooProvider.delegateAuthRequest.mock.calls.slice(-1)[0].args;
    }

    test('set state cookie', async () => {
      async function testIssueState(controller) {
        const [, res, session] = getDelegateArgs(controller);

        const stateEncoded = await session.issueState({ foo: 'state' });
        const cookies = parseSetCookies(res);

        expect(cookies.get('machinat_auth_state').value).toBe(stateEncoded);
        const payload = jsonwebtoken.verify(stateEncoded, '__SECRET__');
        return [cookies, payload];
      }

      let [cookies, payload] = await testIssueState(defaultController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_state" => Object {
            "directives": "HttpOnly; Max-Age=60; Path=/auth; SameSite=None; Secure",
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

      [cookies, payload] = await testIssueState(customizedController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_state" => Object {
            "directives": "HttpOnly; Max-Age=99; Path=/api; SameSite=Lax",
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
        const [, res, session] = getDelegateArgs(controller);
        const token = await session.issueAuth({ foo: 'data' }, issueOpts);

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

      let [cookies, payload] = await testIssueAuth(defaultController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "HttpOnly; Path=/; SameSite=None; Secure",
            "value": "0QPRrXXu4uqsBTMzIu5TUqDHUkLfY7q7QBqQzTiVybk",
          },
          "machinat_auth_token" => Object {
            "directives": "Max-Age=180; Path=/; SameSite=None; Secure",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwODY0MDAsInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAxODAwfQ",
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
          "auth": Object {
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

      [cookies, payload] = await testIssueAuth(customizedController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/api; SameSite=Lax",
            "value": "XqXGZp_0LPQpBkc-hXGPQUrQ3zzxbTLkY-Hz-5fmjss",
          },
          "machinat_auth_token" => Object {
            "directives": "Domain=machinat.io; Max-Age=999; Path=/api; SameSite=Lax",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwOTk5OTksInNjb3BlIjp7ImRvbWFpbiI6Im1hY2hpbmF0LmlvIiwicGF0aCI6Ii9hcGkifSwiaWF0IjoxNTcwMDAwMDAwLCJleHAiOjE1NzAwMDk5OTl9",
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
          "auth": Object {
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
          "auth": Object {
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
          "auth": Object {
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
          "auth": Object {
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
          "auth": Object {
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
        const [, res, session] = getDelegateArgs(controller);

        const errEncoded = await session.issueError(418, "I'm a teapot");
        const cookies = parseSetCookies(res);

        expect(cookies.get('machinat_auth_error').value).toBe(errEncoded);
        const payload = jsonwebtoken.verify(errEncoded, '__SECRET__');
        return [cookies, payload];
      }

      let [cookies, payload] = await testIssueError(defaultController);
      expect(cookies).toMatchInlineSnapshot(`
            Map {
              "machinat_auth_error" => Object {
                "directives": "Max-Age=60; Path=/; SameSite=None; Secure",
                "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwibWVzc2FnZSI6IkknbSBhIHRlYXBvdCJ9LCJzY29wZSI6eyJwYXRoIjoiLyJ9LCJpYXQiOjE1NzAwMDAwMDB9.vVQZJXhJK6hqjT6lqzJah3rFD-J8A75J9S26WlosqP0",
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
                  "message": "I'm a teapot",
                },
                "iat": 1570000000,
                "platform": "foo",
                "scope": Object {
                  "path": "/",
                },
              }
      `);

      [cookies, payload] = await testIssueError(customizedController);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_error" => Object {
            "directives": "Domain=machinat.io; Max-Age=99; Path=/api; SameSite=Lax",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwibWVzc2FnZSI6IkknbSBhIHRlYXBvdCJ9LCJzY29wZSI6eyJkb21haW4iOiJtYWNoaW5hdC5pbyIsInBhdGgiOiIvYXBpIn0sImlhdCI6MTU3MDAwMDAwMH0.l_DjBDxDhJxUKMk-AcA4iwxa1k4Oaydxa5MKwuJgFAc",
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
                  "message": "I'm a teapot",
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
      const [req, , session] = getDelegateArgs(customizedController);
      const platform = 'foo';
      const state = { foo: 'state' };
      const scope = { path: '/' };

      req.mock.getter('headers').fake(() => ({
        cookie: `no_state=existed`,
      }));
      await expect(session.getState()).resolves.toBe(null);

      const stateEnceded = jsonwebtoken.sign(
        { platform, state, scope, iat: SEC_NOW - 10, exp: SEC_NOW + 10 },
        '__SECRET__'
      );

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${stateEnceded}`,
      }));
      await expect(session.getState()).resolves.toEqual({ foo: 'state' });

      // wrong signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${stateEnceded}_WITH_WRONG_SIG`,
      }));
      await expect(session.getState()).resolves.toBe(null);

      // different platform
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${jsonwebtoken.sign(
          { platform: 'bar', state, scope, iat: SEC_NOW - 10 },
          '__SECRET__'
        )}`,
      }));
      await expect(session.getState()).resolves.toBe(null);

      // outdated
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_state=${jsonwebtoken.sign(
          { platform, state, scope, iat: SEC_NOW - 21, exp: SEC_NOW - 1 },
          '__SECRET__'
        )}`,
      }));
      await expect(session.getState()).resolves.toBe(null);
    });

    it('get auth from cookies', async () => {
      function createTokenAndSig(payload) {
        const [headerEncoded, payloadEncoded, signature] = jsonwebtoken
          .sign(payload, '__SECRET__')
          .split('.');

        return [`${headerEncoded}.${payloadEncoded}`, signature];
      }

      const [req, , session] = getDelegateArgs(customizedController);
      const platform = 'foo';
      const auth = { foo: 'data' };
      const scope = { path: '/' };

      req.mock.getter('headers').fake(() => ({
        cookie: `no_auth=existed`,
      }));
      await expect(session.getAuth()).resolves.toBe(null);

      let [token, sig] = createTokenAndSig({
        platform,
        auth,
        scope,
        iat: SEC_NOW - 10,
        exp: SEC_NOW + 10,
      });

      // no signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token}`,
      }));
      await expect(session.getAuth()).resolves.toBe(null);

      // no token
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_signature=${sig}`,
      }));
      await expect(session.getAuth()).resolves.toBe(null);

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(session.getAuth()).resolves.toEqual({ foo: 'data' });

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(session.getAuth()).resolves.toEqual({ foo: 'data' });

      // wrong signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=WRONG_SIG;`,
      }));
      await expect(session.getAuth()).resolves.toBe(null);

      // different platform
      [token, sig] = createTokenAndSig({
        platform: 'bar',
        auth,
        scope,
        iat: SEC_NOW - 10,
        exp: SEC_NOW + 10,
      });
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(session.getAuth()).resolves.toBe(null);

      // expired
      [token, sig] = createTokenAndSig({
        platform,
        auth,
        scope,
        iat: SEC_NOW - 21,
        exp: SEC_NOW - 1,
      });
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_token=${token};machinat_auth_signature=${sig};`,
      }));
      await expect(session.getAuth()).resolves.toBe(null);
    });

    it('get error from cookies', async () => {
      const [req, , session] = getDelegateArgs(customizedController);
      const platform = 'foo';
      const error = { code: 418, message: "I'm a teapot" };
      const scope = { path: '/' };

      // not existed
      req.mock.getter('headers').fake(() => ({
        cookie: `no_error=existed`,
      }));
      await expect(session.getError()).resolves.toBe(null);

      const errEncoded = jsonwebtoken.sign(
        { platform, error, scope, iat: SEC_NOW - 10 },
        '__SECRET__'
      );

      // ok
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${errEncoded}`,
      }));
      await expect(session.getError()).resolves.toEqual(error);

      // woring signature
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${`${errEncoded}_WITH_WRONG_SIG`}`,
      }));
      await expect(session.getError()).resolves.toBe(null);

      // different platform
      req.mock.getter('headers').fake(() => ({
        cookie: `machinat_auth_error=${jsonwebtoken.sign(
          { platform: 'bar', error, scope, iat: SEC_NOW - 10 },
          '__SECRET__'
        )}`,
      }));
      await expect(session.getError()).resolves.toBe(null);
    });

    it('check url scope for redirection', () => {
      let [, , session] = getDelegateArgs(defaultController);

      // should match https://machinat.com/**
      expect(session.checkURLScope('https://machinat.com')).toBe(true);
      expect(session.checkURLScope('https://machinat.io')).toBe(false);
      expect(session.checkURLScope('https://machinat.com/foo/bar')).toBe(true);
      expect(session.checkURLScope('https://xxx.machinat.com')).toBe(false);

      [, , session] = getDelegateArgs(customizedController);

      // should match http(s?)://*.machinat.io/api/**
      expect(session.checkURLScope('https://machinat.io')).toBe(false);
      expect(session.checkURLScope('https://machinat.io/foo')).toBe(false);
      expect(session.checkURLScope('http://machinat.io/api')).toBe(true);
      expect(session.checkURLScope('https://machinat.io/api/foo')).toBe(true);
      expect(session.checkURLScope('https://xxx.machinat.io')).toBe(false);
      expect(session.checkURLScope('https://xxx.machinat.io/api')).toBe(true);
      expect(session.checkURLScope('https://machinat.com/api')).toBe(false);
    });
  });

  describe('_sign api', () => {
    let req;
    let res;
    beforeEach(() => {
      res = moxy(new ServerResponse({}));
      req = prepareReq(
        'POST',
        'http://machinat.com/auth/_sign',
        {},
        { platform: 'foo', credential: { foo: 'data' } }
      );
    });

    it('sign cookie and respond token if provider verfication passed', async () => {
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.verifySigning.mock).toHaveBeenCalledTimes(1);
      expect(fooProvider.verifySigning.mock).toHaveBeenCalledWith({
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
            "directives": "HttpOnly; Path=/; SameSite=None; Secure",
            "value": "0QPRrXXu4uqsBTMzIu5TUqDHUkLfY7q7QBqQzTiVybk",
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
          "auth": Object {
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

    test('sign with customized controller options', async () => {
      req.mock
        .getter('url')
        .fakeReturnValue('https://auth.machinat.io/api/_sign');

      await expect(
        customizedController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.verifySigning.mock).toHaveBeenCalledTimes(1);
      expect(fooProvider.verifySigning.mock).toHaveBeenCalledWith({
        foo: 'data',
      });

      const cookies = parseSetCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/api; SameSite=Lax",
            "value": "XqXGZp_0LPQpBkc-hXGPQUrQ3zzxbTLkY-Hz-5fmjss",
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
          "auth": Object {
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
      fooProvider.verifySigning.mock.fake(() => ({
        accepted: true,
        data: { foo: 'data' },
        refreshable: false,
      }));

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      const sig = parseSetCookies(res).get('machinat_auth_signature').value;
      const { token } = JSON.parse(res.end.mock.calls[0].args[0]);

      expect(jsonwebtoken.verify(`${token}.${sig}`, '__SECRET__'))
        .toMatchInlineSnapshot(`
        Object {
          "auth": Object {
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
        'http://machinat.com/auth/_sign',
        {},
        { platform: 'baz', credential: { baz: 'data' } }
      );

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(fooProvider.verifySigning.mock).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(404);
      expect(res.end.mock).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "message": "unknown platform \\"baz\\"",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond error if provider.verifySigning() resolve unaccepted', async () => {
      fooProvider.verifySigning.mock.fake(() => ({
        accepted: false,
        code: 418,
        message: "I'm a teapot",
      }));

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(418);
      expect(res.end.mock).toHaveBeenCalledTimes(1);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 418,
            "message": "I'm a teapot",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const url = 'http://machinat.com/auth/_sign';

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, {}, '"Woooof"'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "invalid body type",
          },
        }
      `);

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, {}, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "Unexpected token P in JSON at position 0",
          },
        }
      `);

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, {}, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "invalid sign params",
          },
        }
      `);
    });

    it('respond 500 if porvider.verifySigning() thrown', async () => {
      fooProvider.verifySigning.mock.fake(() => {
        throw new Error('Broken inside');
      });

      await defaultController.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 500,
            "message": "Broken inside",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      await defaultController.delegateAuthRequest(
        prepareReq('GET', 'https://machinat.com/auth/_sign', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 405,
            "message": "method not allowed",
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
        auth: { foo: 'data' },
        exp: SEC_NOW - 1,
        iat: SEC_NOW - 10000,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://machinat.com/auth/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      res = moxy(new ServerResponse({}));
    });

    it('refresh token if provider.verifyRefreshment() passed', async () => {
      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

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
            "directives": "HttpOnly; Path=/; SameSite=None; Secure",
            "value": "cINpkfOnN7PttofzGFS3Oj2KFCTjNzeU42I76i38ORQ",
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
          "auth": Object {
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

    test('refresh with customized controller options', async () => {
      req.mock
        .getter('url')
        .fake(() => 'https://auth.machinat.io/api/_refresh');

      await expect(
        customizedController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(200);
      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);

      const cookies = parseSetCookies(res);
      expect(cookies).toMatchInlineSnapshot(`
        Map {
          "machinat_auth_signature" => Object {
            "directives": "Domain=machinat.io; HttpOnly; Path=/api; SameSite=Lax",
            "value": "XqXGZp_0LPQpBkc-hXGPQUrQ3zzxbTLkY-Hz-5fmjss",
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
          "auth": Object {
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
        auth: { baz: 'data' },
        exp: SEC_NOW - 1,
        iat: SEC_NOW - 10000,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://machinat.com/auth/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(404);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "message": "unknown platform \\"baz\\"",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond error if provider.verifySigning() resolve unaccepted', async () => {
      fooProvider.verifyRefreshment.mock.fake(() => ({
        accepted: false,
        code: 418,
        message: "I'm a teapot",
      }));

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(418);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 418,
            "message": "I'm a teapot",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      req.mock.getter('headers').fakeReturnValue({});

      await defaultController.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "message": "no signature found",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);

      req.mock.getter('headers').fakeReturnValue({
        cookie: 'machinat_auth_signature=INVALID_SIGNATURE',
      });
      res = moxy(new ServerResponse({}));
      await defaultController.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "message": "invalid signature",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if refreshPeriod outdated', async () => {
      const [token, signature] = prepareToken({
        platform: 'foo',
        auth: { foo: 'data' },
        exp: SEC_NOW - 9999,
        iat: SEC_NOW - 99999,
        refreshLimit: SEC_NOW - 1,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://machinat.com/auth/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(401);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "message": "token refreshment period outdated",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if no refreshLimit existed in payload', async () => {
      const [token, signature] = prepareToken({
        platform: 'foo',
        auth: { foo: 'data' },
        exp: SEC_NOW - 9999,
        iat: SEC_NOW - 99999,
        scope: { path: '/' },
      });
      req = prepareReq(
        'POST',
        'http://machinat.com/auth/_refresh',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(400);

      const resBody = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(resBody).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "token not refreshable",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const url = 'http://machinat.com/auth/_refresh';
      const header = { cookie: `machinat_auth_signature=SOMETHING_WHATEVER` };

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "invalid body type",
          },
        }
      `);

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, header, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "Unexpected token P in JSON at position 0",
          },
        }
      `);

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, header, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "empty token received",
          },
        }
      `);
    });

    it('respond 500 if porvider.verifyRefreshment() thrown', async () => {
      fooProvider.verifyRefreshment.mock.fake(() => {
        throw new Error('Broken inside');
      });

      await defaultController.delegateAuthRequest(req, res);

      expect(res.statusCode).toBe(500);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 500,
            "message": "Broken inside",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      await defaultController.delegateAuthRequest(
        prepareReq('get', 'https://machinat.com/auth/_refresh', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 405,
            "message": "method not allowed",
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
        auth: { foo: 'data' },
        exp: SEC_NOW + 9999,
        iat: SEC_NOW - 999,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
    });

    it('respond 200 if token and signature valid', async () => {
      const req = prepareReq(
        'POST',
        'http://machinat.com/auth/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({}));

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.end.mock.calls[0].args[0]);
      expect(body).toEqual({ platform: 'foo', token });

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if token expired', async () => {
      [token, signature] = prepareToken({
        platform: 'foo',
        auth: { foo: 'data' },
        exp: SEC_NOW - 999,
        iat: SEC_NOW - 9999,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://machinat.com/auth/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({}));

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "message": "jwt expired",
          },
        }
      `);

      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 404 platform not found', async () => {
      [token, signature] = prepareToken({
        platform: 'baz',
        auth: { baz: 'data' },
        exp: SEC_NOW + 9999,
        iat: SEC_NOW - 999,
        refreshLimit: SEC_NOW + 99999,
        scope: { path: '/' },
      });
      const req = prepareReq(
        'POST',
        'http://machinat.com/auth/_verify',
        { cookie: `machinat_auth_signature=${signature}` },
        { token }
      );
      const res = moxy(new ServerResponse({}));

      await expect(
        defaultController.delegateAuthRequest(req, res)
      ).resolves.toBe(true);

      expect(res.statusCode).toBe(404);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 404,
            "message": "unknown platform \\"baz\\"",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 401 if signature not found or invalid', async () => {
      let res;

      await defaultController.delegateAuthRequest(
        prepareReq('POST', 'http://machinat.com/auth/_verify', {}, { token }),
        (res = moxy(new ServerResponse({})))
      );

      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "message": "no signature found",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);

      await defaultController.delegateAuthRequest(
        prepareReq(
          'POST',
          'http://machinat.com/auth/_verify',
          { cookie: `machinat_auth_signature=INVALID_SIGNATURE` },
          { token }
        ),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(401);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 401,
            "message": "invalid signature",
          },
        }
      `);
      expect(res.getHeader('Set-Cookie')).toBe(undefined);
    });

    it('respond 400 if invalid body received', async () => {
      const url = 'http://machinat.com/auth/_verify';
      const header = { cookie: `machinat_auth_signature=SOMETHING_WHATEVER` };
      let res;

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, header, '"Woooof"'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "invalid body type",
          },
        }
      `);

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, header, 'Prrrrrrr'),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "Unexpected token P in JSON at position 0",
          },
        }
      `);

      await defaultController.delegateAuthRequest(
        prepareReq('POST', url, header, { hey: 'Roarrrr' }),
        (res = moxy(new ServerResponse({})))
      );
      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 400,
            "message": "empty token received",
          },
        }
      `);
    });

    it('respond 405 if non POST request called on prvate api', async () => {
      const res = moxy(new ServerResponse({}));
      await defaultController.delegateAuthRequest(
        prepareReq('get', 'https://machinat.com/auth/_verify', {}, ''),
        res
      );
      expect(res.statusCode).toBe(405);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
        Object {
          "error": Object {
            "code": 405,
            "message": "method not allowed",
          },
        }
      `);
    });
  });
});

describe('#verifyHTTPAuthorization(req)', () => {
  const [token, signature] = prepareToken({
    platform: 'foo',
    auth: { foo: 'data' },
    exp: SEC_NOW + 9999,
    iat: SEC_NOW - 999,
    refreshLimit: SEC_NOW + 99999,
    scope: { path: '/' },
  });

  it('resolve auth context if authorization verified', async () => {
    await expect(
      defaultController.verifyHTTPAuthorization(
        prepareReq(
          'POST',
          'https://machinat.com/api/foo',
          {
            authorization: `Bearer ${token}`,
            cookie: `machinat_auth_signature=${signature}`,
          },
          { user_api: 'stuff' }
        )
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "channel": Object {
                "id": "foo",
              },
              "data": Object {
                "foo": "data",
              },
              "expireAt": 2019-10-02T09:53:19.000Z,
              "loginAt": 2019-10-02T06:50:01.000Z,
              "platform": "foo",
              "user": Object {
                "id": "foo",
              },
            }
          `);

    expect(fooProvider.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('work with token passed as 2nd param', async () => {
    await expect(
      defaultController.verifyHTTPAuthorization(
        prepareReq(
          'POST',
          'https://machinat.com/api/foo',
          { cookie: `machinat_auth_signature=${signature}` },
          { user_api: 'stuff' }
        ),
        token
      )
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "channel": Object {
                "id": "foo",
              },
              "data": Object {
                "foo": "data",
              },
              "expireAt": 2019-10-02T09:53:19.000Z,
              "loginAt": 2019-10-02T06:50:01.000Z,
              "platform": "foo",
              "user": Object {
                "id": "foo",
              },
            }
          `);

    expect(fooProvider.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  const testVerifyAuthThrowing = async req => {
    try {
      await defaultController.verifyHTTPAuthorization(req);
    } catch (err) {
      expect(err).toBeInstanceOf(AuthError);
      return err;
    }
    throw new Error('not thorwn as expected');
  };

  it('throw 401 if signature invalid', async () => {
    const err = await testVerifyAuthThrowing(
      prepareReq(
        'POST',
        'https://machinat.com/api/foo',
        {
          authorization: `Bearer ${token}`,
          cookie: `machinat_auth_signature=INVALID_SIGNATURE`,
        },
        { user_api: 'stuff' }
      )
    );

    expect(err.code).toBe(401);
    expect(err.message).toMatchInlineSnapshot(`"invalid signature"`);
    expect(fooProvider.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 401 if no signature in cookies', async () => {
    const err = await testVerifyAuthThrowing(
      prepareReq(
        'POST',
        'https://machinat.com/api/foo',
        { authorization: `Bearer ${token}` },
        { user_api: 'stuff' }
      )
    );

    expect(err.code).toBe(401);
    expect(err.message).toMatchInlineSnapshot(`"require signature"`);
    expect(fooProvider.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 401 if no token provided', async () => {
    const err = await testVerifyAuthThrowing(
      prepareReq(
        'POST',
        'https://machinat.com/api/foo',
        { cookie: `machinat_auth_signature=${signature}` },
        { user_api: 'stuff' }
      )
    );

    expect(err.code).toBe(401);
    expect(err.message).toMatchInlineSnapshot(`"no Authorization header"`);
    expect(fooProvider.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 400 if no invalid authorization format received', async () => {
    const err = await testVerifyAuthThrowing(
      prepareReq(
        'POST',
        'https://machinat.com/api/foo',
        {
          authorization: `Unknown-Scheme ${token}`,
          cookie: `machinat_auth_signature=${signature}`,
        },
        { user_api: 'stuff' }
      )
    );

    expect(err.code).toBe(400);
    expect(err.message).toMatchInlineSnapshot(`"invalid auth scheme"`);
    expect(fooProvider.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 404 if platform not found', async () => {
    const [bazToken, bazSignature] = prepareToken({
      platform: 'baz',
      auth: { baz: 'data' },
      exp: SEC_NOW + 9999,
      iat: SEC_NOW - 999,
      refreshLimit: SEC_NOW + 99999,
      scope: { path: '/' },
    });

    const err = await testVerifyAuthThrowing(
      prepareReq(
        'POST',
        'https://machinat.com/api/foo',
        {
          authorization: `Bearer ${bazToken}`,
          cookie: `machinat_auth_signature=${bazSignature}`,
        },
        { user_api: 'stuff' }
      )
    );

    expect(err.code).toBe(404);
    expect(err.message).toMatchInlineSnapshot(`"unknown platform \\"baz\\""`);
    expect(fooProvider.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw 400 if provider.refineAuth() resolve empty', async () => {
    fooProvider.refineAuth.mock.fake(async () => {
      return null;
    });

    const err = await testVerifyAuthThrowing(
      prepareReq(
        'POST',
        'https://machinat.com/api/foo',
        {
          authorization: `Bearer ${token}`,
          cookie: `machinat_auth_signature=${signature}`,
        },
        { user_api: 'stuff' }
      )
    );

    expect(err.code).toBe(400);
    expect(err.message).toMatchInlineSnapshot(`"invalid auth data"`);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledTimes(1);
  });
});
