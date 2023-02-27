import { IncomingMessage, ServerResponse } from 'http';
import jwt from 'jsonwebtoken';
import moxy from '@moxyjs/moxy';
import HttpOperator from '../HttpOperator';
import { getCookies } from './utils';

const secret = '__SECRET__';
const serverUrl = 'https://sociably.io';
const apiRoot = '/auth';
const redirectRoot = '/webview';

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
    const operator = new HttpOperator({
      secret,
      serverUrl,
      apiRoot,
      redirectRoot,
    });
    expect(operator.secret).toBe(secret);
    expect(operator.apiRootUrl.href).toBe('https://sociably.io/auth');
    expect(operator.redirectRootUrl.href).toBe('https://sociably.io/webview');
  });

  it('throw if options.secret is empty', () => {
    expect(
      () => new HttpOperator({ redirectRoot } as any)
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
    expect(
      () => new HttpOperator({ secret: '', serverUrl })
    ).toThrowErrorMatchingInlineSnapshot(`"options.secret must not be empty"`);
  });

  it('throw if options.redirectRoot is empty', () => {
    expect(
      () => new HttpOperator({ secret } as any)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.serverUrl must not be empty"`
    );
    expect(
      () => new HttpOperator({ serverUrl: '', secret })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.serverUrl must not be empty"`
    );
  });

  it("throw if apiRoot isn't a subpath of cookiePath when both given", () => {
    expect(
      () =>
        new HttpOperator({
          secret,
          serverUrl,
          apiRoot: '/auth',
          cookiePath: '/app',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.apiRoot should be a subpath of options.cookiePath"`
    );
  });

  it("throw if redirectRoot isn't under subpath of cookiePath", () => {
    expect(
      () =>
        new HttpOperator({
          secret,
          serverUrl,
          redirectRoot: '/webview',
          apiRoot: '/app/auth',
          cookiePath: '/app',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.redirectRoot should be under a subpath of options.cookiePath"`
    );
  });

  it("throw if redirectRoot isn't under subdomain of cookieDomain", () => {
    expect(
      () =>
        new HttpOperator({
          secret,
          serverUrl,
          redirectRoot: '//view.sociably.io',
          apiRoot: '/auth',
          cookieDomain: 'api.sociably.io',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.serverUrl should be under a subdomain of options.cookieDomain"`
    );
  });

  it('throw if protocol of serverUrl is http when secure', () => {
    (() =>
      new HttpOperator({
        secure: false,
        secret,
        serverUrl: 'http://sociably.io',
      }))();

    expect(
      () =>
        new HttpOperator({
          secret,
          serverUrl: 'http://sociably.io',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"protocol of options.serverUrl should be \\"https\\" when options.secure is set to true"`
    );
  });
});

test('.issueState(res, data)', async () => {
  async function testIssueState(operator: HttpOperator) {
    const res = moxy(new ServerResponse({} as never));

    const stateToken = await operator.issueState(res, 'foo', { foo: 'state' });
    const cookies = getCookies(res);

    expect(cookies.get('sociably_auth_state').value).toBe(stateToken);
    const payload = jwt.verify(stateToken, '__SECRET__');
    return [cookies, payload];
  }

  const operator = new HttpOperator({ secret, serverUrl, apiRoot: '/auth' });

  let [cookies, payload] = await testIssueState(operator);
  expect(cookies).toMatchInlineSnapshot(`
    Map {
      "sociably_auth_state" => Object {
        "directives": "HttpOnly; Max-Age=300; Path=/auth; SameSite=Lax; Secure",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInN0YXRlIjp7ImZvbyI6InN0YXRlIn0sImlhdCI6MTU3MDAwMDAwMH0.tbccGtUNapTH99Q7SmW6F5CrXlhKWBsN-35NAydX3eg",
      },
    }
  `);
  expect(payload).toMatchInlineSnapshot(`
        Object {
          "iat": 1570000000,
          "platform": "foo",
          "state": Object {
            "foo": "state",
          },
        }
      `);

  [cookies, payload] = await testIssueState(
    new HttpOperator({
      secret,
      serverUrl,
      redirectRoot: '/app/pages',
      apiRoot: '/app/auth',
      dataCookieMaxAge: 999,
      cookieDomain: 'sociably.io',
      cookiePath: '/app',
      cookieSameSite: 'none',
      secure: false,
    })
  );
  expect(cookies).toMatchInlineSnapshot(`
        Map {
          "sociably_auth_state" => Object {
            "directives": "Domain=sociably.io; HttpOnly; Max-Age=999; Path=/app/auth; SameSite=None",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInN0YXRlIjp7ImZvbyI6InN0YXRlIn0sImlhdCI6MTU3MDAwMDAwMH0.tbccGtUNapTH99Q7SmW6F5CrXlhKWBsN-35NAydX3eg",
          },
        }
      `);
  expect(payload).toMatchInlineSnapshot(`
        Object {
          "iat": 1570000000,
          "platform": "foo",
          "state": Object {
            "foo": "state",
          },
        }
      `);
});

test('.issueAuth(data, options)', async () => {
  async function testIssueAuth(operator: HttpOperator, initiateAt?: number) {
    const res = moxy(new ServerResponse({} as never));
    const token = await operator.issueAuth(
      res,
      'foo',
      { foo: 'data' },
      initiateAt
    );

    const cookies = getCookies(res);
    expect(cookies.get('sociably_auth_state').value).toBe('');
    expect(cookies.get('sociably_auth_error').value).toBe('');
    expect(cookies.get('sociably_auth_token').value).toBe(token);

    const signature = cookies.get('sociably_auth_signature').value;
    const payload = jwt.verify(`${token}.${signature}`, '__SECRET__');
    return [cookies, payload];
  }

  const operator = new HttpOperator({ secret, serverUrl });
  let [cookies, payload] = await testIssueAuth(operator);
  expect(cookies).toMatchInlineSnapshot(`
    Map {
      "sociably_auth_signature" => Object {
        "directives": "HttpOnly; Path=/; SameSite=Lax; Secure",
        "value": "EKG7WOjtwYDAi7tisgcKPmJ_js11Jaf4347vCrFsXbc",
      },
      "sociably_auth_token" => Object {
        "directives": "Path=/; SameSite=Lax; Secure",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTcwMDAwMDAwLCJzY29wZSI6eyJwYXRoIjoiLyJ9LCJpYXQiOjE1NzAwMDAwMDAsImV4cCI6MTU3MDAwMzYwMH0",
      },
      "sociably_auth_state" => Object {
        "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
        "value": "",
      },
      "sociably_auth_error" => Object {
        "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
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
      "init": 1570000000,
      "platform": "foo",
      "scope": Object {
        "path": "/",
      },
    }
  `);

  const customizedOperator = new HttpOperator({
    secret,
    serverUrl,
    redirectRoot: '/app/pages',
    apiRoot: '/app/auth',
    tokenCookieMaxAge: 999,
    tokenLifetime: 9999,
    refreshDuration: 99999,
    cookieDomain: 'sociably.io',
    cookiePath: '/app',
    cookieSameSite: 'none',
    secure: false,
  });

  [cookies, payload] = await testIssueAuth(customizedOperator);
  expect(cookies).toMatchInlineSnapshot(`
    Map {
      "sociably_auth_signature" => Object {
        "directives": "Domain=sociably.io; HttpOnly; Path=/app; SameSite=None",
        "value": "ajZ9AB8MXaQ710FVOeRiebapqvdFaIejKqd8LRfCicQ",
      },
      "sociably_auth_token" => Object {
        "directives": "Domain=sociably.io; Path=/app; SameSite=None",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTcwMDAwMDAwLCJzY29wZSI6eyJkb21haW4iOiJzb2NpYWJseS5pbyIsInBhdGgiOiIvYXBwIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDA5OTk5fQ",
      },
      "sociably_auth_state" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app/auth; SameSite=None",
        "value": "",
      },
      "sociably_auth_error" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=None",
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
      "init": 1570000000,
      "platform": "foo",
      "scope": Object {
        "domain": "sociably.io",
        "path": "/app",
      },
    }
  `);

  // with specified init time
  [cookies, payload] = await testIssueAuth(customizedOperator, SEC_NOW - 12345);
  expect(payload).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "foo": "data",
      },
      "exp": 1570009999,
      "iat": 1570000000,
      "init": 1569987655,
      "platform": "foo",
      "scope": Object {
        "domain": "sociably.io",
        "path": "/app",
      },
    }
  `);
  expect(cookies).toMatchInlineSnapshot(`
    Map {
      "sociably_auth_signature" => Object {
        "directives": "Domain=sociably.io; HttpOnly; Path=/app; SameSite=None",
        "value": "cOah-4Tjdw3fiEMmUG5vj5eUsDmlkFP09NRG32zuTLQ",
      },
      "sociably_auth_token" => Object {
        "directives": "Domain=sociably.io; Path=/app; SameSite=None",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImRhdGEiOnsiZm9vIjoiZGF0YSJ9LCJpbml0IjoxNTY5OTg3NjU1LCJzY29wZSI6eyJkb21haW4iOiJzb2NpYWJseS5pbyIsInBhdGgiOiIvYXBwIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDA5OTk5fQ",
      },
      "sociably_auth_state" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app/auth; SameSite=None",
        "value": "",
      },
      "sociably_auth_error" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=None",
        "value": "",
      },
    }
  `);
});

test('.issueError(code, reason)', async () => {
  async function testIssueError(operator: HttpOperator) {
    const res = moxy(new ServerResponse({} as never));

    const errEncoded = await operator.issueError(
      res,
      'foo',
      418,
      "I'm a teapot"
    );
    const cookies = getCookies(res);

    expect(cookies.get('sociably_auth_error').value).toBe(errEncoded);
    const payload = jwt.verify(errEncoded, '__SECRET__');
    return [cookies, payload];
  }

  const operator = new HttpOperator({
    secret,
    serverUrl,
    apiRoot: '/auth',
  });

  let [cookies, payload] = await testIssueError(operator);
  expect(cookies).toMatchInlineSnapshot(`
    Map {
      "sociably_auth_error" => Object {
        "directives": "Max-Age=300; Path=/; SameSite=Lax; Secure",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwicmVhc29uIjoiSSdtIGEgdGVhcG90In0sInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMH0.dCs_-sNRQZoWk1dOHoRcGKCs6LEgGCwky_lWqODov3A",
      },
      "sociably_auth_state" => Object {
        "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/auth; SameSite=Lax; Secure",
        "value": "",
      },
      "sociably_auth_signature" => Object {
        "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/; SameSite=Lax; Secure",
        "value": "",
      },
      "sociably_auth_token" => Object {
        "directives": "Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax; Secure",
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
    new HttpOperator({
      secret,
      serverUrl,
      redirectRoot: '/app/pages',
      apiRoot: '/app/auth',
      dataCookieMaxAge: 999,
      cookieDomain: 'sociably.io',
      cookiePath: '/app',
      cookieSameSite: 'none',
      secure: false,
    })
  );
  expect(cookies).toMatchInlineSnapshot(`
    Map {
      "sociably_auth_error" => Object {
        "directives": "Domain=sociably.io; Max-Age=999; Path=/app; SameSite=None",
        "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImVycm9yIjp7ImNvZGUiOjQxOCwicmVhc29uIjoiSSdtIGEgdGVhcG90In0sInNjb3BlIjp7ImRvbWFpbiI6InNvY2lhYmx5LmlvIiwicGF0aCI6Ii9hcHAifSwiaWF0IjoxNTcwMDAwMDAwfQ.9N6hirUtaF4MnDnbVyarUExMqq4PLXmvgfMCs0Mr-Tc",
      },
      "sociably_auth_state" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app/auth; SameSite=None",
        "value": "",
      },
      "sociably_auth_signature" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Path=/app; SameSite=None",
        "value": "",
      },
      "sociably_auth_token" => Object {
        "directives": "Domain=sociably.io; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/app; SameSite=None",
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
            "domain": "sociably.io",
            "path": "/app",
          },
        }
      `);
});

test('.getState()', async () => {
  const operator = new HttpOperator({ secret, serverUrl, apiRoot: '/auth' });
  const req = moxy(new IncomingMessage({} as never));

  const platform = 'foo';
  const state = { foo: 'state' };
  const scope = { path: '/' };

  req.mock.getter('headers').fake(() => ({
    cookie: `no_state=existed`,
  }));
  await expect(operator.getState(req, 'foo')).resolves.toBe(null);

  const stateEnceded = jwt.sign(
    { platform, state, scope, iat: SEC_NOW - 10, exp: SEC_NOW + 10 },
    '__SECRET__'
  );

  // ok
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_state=${stateEnceded}`,
  }));
  await expect(operator.getState(req, 'foo')).resolves.toEqual({
    foo: 'state',
  });

  // wrong signature
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_state=${stateEnceded}_WITH_WRONG_SIG`,
  }));
  await expect(operator.getState(req, 'foo')).resolves.toBe(null);

  // different platform
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_state=${jwt.sign(
      { platform: 'bar', state, scope, iat: SEC_NOW - 10 },
      '__SECRET__'
    )}`,
  }));
  await expect(operator.getState(req, 'foo')).resolves.toBe(null);

  // outdated
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_state=${jwt.sign(
      { platform, state, scope, iat: SEC_NOW - 21, exp: SEC_NOW - 1 },
      '__SECRET__'
    )}`,
  }));
  await expect(operator.getState(req, 'foo')).resolves.toBe(null);
});

test('.getAuth()', async () => {
  function createTokenAndSig(payload) {
    const [headerEncoded, payloadEncoded, signature] = jwt
      .sign(payload, '__SECRET__')
      .split('.');

    return [`${headerEncoded}.${payloadEncoded}`, signature];
  }

  const operator = new HttpOperator({ secret, serverUrl, apiRoot: '/auth' });
  const req = moxy(new IncomingMessage({} as never));

  const platform = 'foo';
  const data = { foo: 'data' };
  const scope = { path: '/' };

  req.mock.getter('headers').fake(() => ({
    cookie: `no_auth=existed`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toBe(null);

  let [token, sig] = createTokenAndSig({
    platform,
    data,
    scope,
    init: SEC_NOW - 100,
    iat: SEC_NOW - 10,
    exp: SEC_NOW + 10,
  });

  // no signature
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token}`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toBe(null);

  // no token
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_signature=${sig}`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toBe(null);

  // ok
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token};sociably_auth_signature=${sig};`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toEqual({ foo: 'data' });

  // wrong signature
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token};sociably_auth_signature=WRONG_SIG;`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toBe(null);

  // different platform
  [token, sig] = createTokenAndSig({
    platform: 'bar',
    data,
    scope,
    init: SEC_NOW - 100,
    iat: SEC_NOW - 10,
    exp: SEC_NOW + 10,
  });
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token};sociably_auth_signature=${sig};`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toBe(null);

  // expired
  [token, sig] = createTokenAndSig({
    platform,
    data,
    scope,
    init: SEC_NOW - 100,
    iat: SEC_NOW - 21,
    exp: SEC_NOW - 1,
    refreshTill: SEC_NOW + 101,
  });
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token};sociably_auth_signature=${sig};`,
  }));
  await expect(operator.getAuth(req, 'foo')).resolves.toBe(null);

  // acceptRefreshable
  await expect(
    operator.getAuth(req, 'foo', { acceptRefreshable: true })
  ).resolves.toEqual({ foo: 'data' });

  const operatorWithRefreshLimit = new HttpOperator({
    secret,
    serverUrl,
    refreshDuration: 10000,
  });

  //  refreshable
  [token, sig] = createTokenAndSig({
    platform,
    data,
    scope,
    init: SEC_NOW - 9999,
    iat: SEC_NOW - 999,
    exp: SEC_NOW - 99,
  });
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token};sociably_auth_signature=${sig};`,
  }));
  await expect(operatorWithRefreshLimit.getAuth(req, 'foo')).resolves.toBe(
    null
  );
  await expect(
    operatorWithRefreshLimit.getAuth(req, 'foo', { acceptRefreshable: true })
  ).resolves.toEqual({ foo: 'data' });

  // not refreshable
  [token, sig] = createTokenAndSig({
    platform,
    data,
    scope,
    init: SEC_NOW - 19999,
    iat: SEC_NOW - 1999,
    exp: SEC_NOW - 199,
  });
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_token=${token};sociably_auth_signature=${sig};`,
  }));
  await expect(operatorWithRefreshLimit.getAuth(req, 'foo')).resolves.toBe(
    null
  );
  await expect(
    operatorWithRefreshLimit.getAuth(req, 'foo', { acceptRefreshable: true })
  ).resolves.toBe(null);
});

test('.getError()', async () => {
  const operator = new HttpOperator({ secret, serverUrl, apiRoot: '/auth' });
  const req = moxy(new IncomingMessage({} as never));

  const platform = 'foo';
  const error = { code: 418, reason: "I'm a teapot" };
  const scope = { path: '/' };

  // not existed
  req.mock.getter('headers').fake(() => ({
    cookie: `no_error=existed`,
  }));
  await expect(operator.getError(req, 'foo')).resolves.toBe(null);

  const errEncoded = jwt.sign(
    { platform, error, scope, iat: SEC_NOW - 10 },
    '__SECRET__'
  );

  // ok
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_error=${errEncoded}`,
  }));
  await expect(operator.getError(req, 'foo')).resolves.toEqual(error);

  // wrong signature
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_error=${`${errEncoded}_WITH_WRONG_SIG`}`,
  }));
  await expect(operator.getError(req, 'foo')).resolves.toBe(null);

  // different platform
  req.mock.getter('headers').fake(() => ({
    cookie: `sociably_auth_error=${jwt.sign(
      { platform: 'bar', error, scope, iat: SEC_NOW - 10 },
      '__SECRET__'
    )}`,
  }));
  await expect(operator.getError(req, 'foo')).resolves.toBe(null);
});

test('.redirect(url, options)', () => {
  const operator = new HttpOperator({
    secret,
    serverUrl,
    apiRoot: '/auth',
    redirectRoot: '/hello/world',
  });
  const res = moxy(new ServerResponse({} as never));
  res.end.mock.fake(() => {});

  expect(operator.redirect(res)).toBe(true);
  expect(res.end).toHaveBeenCalledTimes(1);
  expect(res.writeHead).toHaveBeenCalledTimes(1);
  expect(res.writeHead).toHaveBeenCalledWith(302, {
    Location: 'https://sociably.io/hello/world/',
  });

  expect(operator.redirect(res, 'foo?bar=baz')).toBe(true);
  expect(res.end).toHaveBeenCalledTimes(2);
  expect(res.writeHead).toHaveBeenCalledTimes(2);
  expect(res.writeHead).toHaveBeenCalledWith(302, {
    Location: 'https://sociably.io/hello/world/foo?bar=baz',
  });

  expect(operator.redirect(res, 'http://api.sociably.io/foo?bar=baz')).toBe(
    true
  );
  expect(res.end).toHaveBeenCalledTimes(3);
  expect(res.writeHead).toHaveBeenCalledTimes(3);
  expect(res.writeHead).toHaveBeenCalledWith(302, {
    Location: 'http://api.sociably.io/foo?bar=baz',
  });
});

test('.redirect(url, options) with assertInternal set to true', () => {
  const operator = new HttpOperator({
    secret,
    serverUrl,
    apiRoot: '/auth',
    redirectRoot: '/webview',
  });
  const res = moxy(new ServerResponse({} as never));
  res.end.mock.fake(() => {});

  expect(operator.redirect(res, '/webview', { assertInternal: true })).toBe(
    true
  );
  expect(res.end).toHaveBeenCalledTimes(1);
  expect(res.writeHead).toHaveBeenCalledTimes(1);
  expect(res.writeHead).toHaveBeenCalledWith(302, {
    Location: 'https://sociably.io/webview',
  });

  expect(operator.redirect(res, 'foo?a=b', { assertInternal: true })).toBe(
    true
  );
  expect(res.end).toHaveBeenCalledTimes(2);
  expect(res.writeHead).toHaveBeenCalledTimes(2);
  expect(res.writeHead).toHaveBeenNthCalledWith(2, 302, {
    Location: 'https://sociably.io/webview/foo?a=b',
  });

  expect(operator.redirect(res, '/foo', { assertInternal: true })).toBe(false);
  expect(res.end).toHaveBeenCalledTimes(3);
  expect(res.writeHead).toHaveBeenCalledTimes(3);
  expect(res.writeHead).toHaveBeenNthCalledWith(3, 400);

  expect(operator.redirect(res, undefined, { assertInternal: true })).toBe(
    true
  );
  expect(res.end).toHaveBeenCalledTimes(4);
  expect(res.writeHead).toHaveBeenCalledTimes(4);
  expect(res.writeHead).toHaveBeenNthCalledWith(4, 302, {
    Location: 'https://sociably.io/webview/',
  });

  expect(
    operator.redirect(res, 'https://sociably.io/webview', {
      assertInternal: true,
    })
  ).toBe(true);
  expect(res.end).toHaveBeenCalledTimes(5);
  expect(res.writeHead).toHaveBeenCalledTimes(5);
  expect(res.writeHead).toHaveBeenNthCalledWith(5, 302, {
    Location: 'https://sociably.io/webview',
  });

  expect(
    operator.redirect(res, 'http://sociably.io/webview', {
      assertInternal: true,
    })
  ).toBe(false);
  expect(res.end).toHaveBeenCalledTimes(6);
  expect(res.writeHead).toHaveBeenCalledTimes(6);
  expect(res.writeHead).toHaveBeenNthCalledWith(6, 400);
});

test('.getAuthUrl(url, options)', () => {
  const operator = new HttpOperator({ secret, serverUrl, apiRoot: '/auth' });

  expect(operator.getAuthUrl('test')).toBe('https://sociably.io/auth/test/');
  expect(operator.getAuthUrl('test', 'foo?bar=baz')).toBe(
    'https://sociably.io/auth/test/foo?bar=baz'
  );
  expect(operator.getAuthUrl('test', 'foo/bar/baz')).toBe(
    'https://sociably.io/auth/test/foo/bar/baz'
  );
});

test('.getRedirectUrl(url, options)', () => {
  const operator = new HttpOperator({
    secret,
    serverUrl,
    redirectRoot: '/webview',
  });

  expect(operator.getRedirectUrl()).toBe('https://sociably.io/webview/');
  expect(operator.getRedirectUrl('foo?bar=baz')).toBe(
    'https://sociably.io/webview/foo?bar=baz'
  );
  expect(operator.getRedirectUrl('foo/bar/baz')).toBe(
    'https://sociably.io/webview/foo/bar/baz'
  );
});

test('.signToken(platform, payload, options)', () => {
  const operator = new HttpOperator({ secret, serverUrl });

  expect(
    operator.signToken('foo', 'bar', { noTimestamp: true })
  ).toMatchInlineSnapshot(
    `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInBheWxvYWQiOiJiYXIifQ.gLdeF0o1IRiSnMof7uyN_ztn8X2kw7S-xmjBh5AL6Z4"`
  );
  expect(
    operator.signToken('foo', { bar: 'baz' }, { noTimestamp: true })
  ).toMatchInlineSnapshot(
    `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInBheWxvYWQiOnsiYmFyIjoiYmF6In19.eQMamzQAeuKRTSCV5xzuovnZdnzw7eHpvCjErkKeg-U"`
  );
});

test('.verifyToken(platform)', () => {
  const operator = new HttpOperator({ secret, serverUrl });

  expect(
    operator.verifyToken(
      'foo',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInBheWxvYWQiOiJiYXIifQ.gLdeF0o1IRiSnMof7uyN_ztn8X2kw7S-xmjBh5AL6Z4'
    )
  ).toBe('bar');
  expect(
    operator.verifyToken(
      'foo',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInBheWxvYWQiOnsiYmFyIjoiYmF6In19.eQMamzQAeuKRTSCV5xzuovnZdnzw7eHpvCjErkKeg-U'
    )
  ).toEqual({ bar: 'baz' });
  expect(
    operator.verifyToken(
      'foo',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsInBheWxvYWQiOiJiYXIifQ.__WRONG_SIGNATURE__'
    )
  ).toBe(null);
  expect(operator.verifyToken('foo', '__WRONG_TOKEN__')).toBe(null);
});
