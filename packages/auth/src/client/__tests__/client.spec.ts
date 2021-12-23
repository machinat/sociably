import url from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import fetch from 'node-fetch';
import jsonwebtoken from 'jsonwebtoken';
import AuthError from '../../error';
import type { AnyClientAuthenticator } from '../../types';
import AuthClient from '../client';

const resolveAfterLoops = (resolve, n) => {
  if (n === 0) {
    resolve();
  } else {
    setImmediate(resolveAfterLoops, resolve, n - 1);
  }
};
const delayLoops = (n = 1) =>
  new Promise((resolve) => resolveAfterLoops(resolve, n));

nock.disableNetConnect();
const serverEntry = nock('https://machinat.io');

const location = moxy<Location>(
  url.parse('https://machinat.io/app?platform=foo') as never
);
const document = moxy<Document>({ cookie: '' } as never);

const makeToken = (payload) =>
  jsonwebtoken.sign(payload, '__SECRET__').split('.').slice(0, 2).join('.');

const setCookieAuth = (payload) => {
  const token = makeToken(payload);
  document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_token=${token}`);
};

const setCookieError = (payload) => {
  const errorEncoded = jsonwebtoken.sign(payload, '__SECRET__');
  document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_error=${errorEncoded}`);
};

const fooUser = { platform: 'foo', uid: 'john_doe' };
const fooChannel = { platform: 'foo', uid: 'foo.channel' };
const fooData = 'foo.data';

const fooAuthenticator = moxy<AnyClientAuthenticator>({
  platform: 'foo',
  async init() {
    return undefined;
  },
  async fetchCredential() {
    return {
      success: true,
      credential: { foo: 'credential' },
    };
  },
  checkAuthContext() {
    return {
      success: true,
      contextSupplment: {
        user: fooUser,
        channel: fooChannel,
        foo: fooData,
      },
    };
  },
});

const barAuthenticator = moxy<AnyClientAuthenticator>({
  platform: 'bar',
  async init() {
    return undefined;
  },
  async fetchCredential() {
    return {
      success: false,
      code: 418,
      reason: "I'm drunk",
    };
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

const authenticators = [fooAuthenticator, barAuthenticator];
const serverUrl = '/auth';

jest.useFakeTimers();

const _Date = Date;
const FAKE_NOW = 1570000000000;
const SEC_NOW = FAKE_NOW / 1000;

beforeAll(() => {
  global.document = document;
  global.fetch = fetch as never;
  global.window = {
    location,
    document,
    fetch,
  } as never;

  global.Date = moxy(_Date, { mockNewInstance: false });
  Date.now = moxy(() => FAKE_NOW);
});

afterAll(() => {
  global.Date = _Date;
  global.document = undefined as never;
  global.fetch = undefined as never;
  global.window = undefined as never;
});

beforeEach(() => {
  (Date as Moxy<DateConstructor>).now.mock.reset();
  fooAuthenticator.mock.reset();
  barAuthenticator.mock.reset();
  location.mock.reset();
  document.mock.reset();
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('bootstraping phase', () => {
  test('default properties', () => {
    let client = new AuthClient({ authenticators, serverUrl });
    expect(client.authenticators).toEqual(authenticators);
    expect(client.refreshLeadTime).toBe(300);
    expect(client.isAuthorizing).toBe(false);

    client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 999,
    });
    expect(client.refreshLeadTime).toBe(999);
    expect(client.isAuthorizing).toBe(false);
  });

  it('throw if authenticators is empty', async () => {
    expect(
      () =>
        new AuthClient({
          authenticators: undefined as never,
          serverUrl: '/auth',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authenticators is required"`
    );
  });

  it('throw if serverUrl is empty', () => {
    expect(
      () => new AuthClient({ authenticators, serverUrl: undefined as never })
    ).toThrowErrorMatchingInlineSnapshot(`"options.serverUrl is required"`);
  });

  test.each`
    param        | query        | cookieAuth   | cookieError  | expectedPlatform
    ${undefined} | ${undefined} | ${'foo'}     | ${undefined} | ${'foo'}
    ${undefined} | ${'foo'}     | ${undefined} | ${undefined} | ${'foo'}
    ${'foo'}     | ${undefined} | ${undefined} | ${undefined} | ${'foo'}
    ${undefined} | ${'bar'}     | ${'foo'}     | ${undefined} | ${'bar'}
    ${'bar'}     | ${'foo'}     | ${'foo'}     | ${undefined} | ${'bar'}
    ${'bar'}     | ${'foo'}     | ${undefined} | ${undefined} | ${'bar'}
    ${undefined} | ${undefined} | ${undefined} | ${'foo'}     | ${'foo'}
    ${undefined} | ${'bar'}     | ${undefined} | ${'foo'}     | ${'bar'}
    ${'bar'}     | ${undefined} | ${undefined} | ${'foo'}     | ${'bar'}
  `(
    'platform input priority',
    async ({ param, query, cookieAuth, cookieError, expectedPlatform }) => {
      location.mock
        .getter('search')
        .fake(() => (query ? `?platform=${query}` : ''));

      if (cookieAuth) {
        setCookieAuth({
          platform: cookieAuth,
          data: { [cookieAuth]: '__DATA__' },
          scope: { path: '/' },
          iat: SEC_NOW - 9,
          exp: SEC_NOW + 9999,
        });
      }
      if (cookieError) {
        setCookieError({
          platform: cookieError,
          error: { code: 418, reason: "I'm a teapot" },
          scope: { path: '/' },
        });
      }

      const client = new AuthClient({ authenticators, serverUrl: '/auth' });

      // prevent further signing request
      fooAuthenticator.fetchCredential.mock.fake(() => Promise.reject());
      barAuthenticator.fetchCredential.mock.fake(() => Promise.reject());
      try {
        await client.signIn({ platform: param });
      } catch {
        // empty
      }

      expect(client.platform).toBe(expectedPlatform);
      expect(client.getAuthenticator()).toBe(
        expectedPlatform === 'foo' ? fooAuthenticator : barAuthenticator
      );

      if (expectedPlatform === 'foo') {
        expect(fooAuthenticator.init.mock).toHaveBeenCalledTimes(1);
        expect(fooAuthenticator.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/foo',
          cookieError === 'foo'
            ? new AuthError('foo', 418, "I'm a teapot")
            : null,
          cookieAuth === 'foo' ? { foo: '__DATA__' } : null
        );
      } else if (expectedPlatform === 'bar') {
        expect(barAuthenticator.init.mock).toHaveBeenCalledTimes(1);
        expect(barAuthenticator.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/bar',
          cookieError === 'bar'
            ? new AuthError('bar', 418, "I'm a teapot")
            : null,
          cookieAuth === 'bar' ? { bar: '__DATA__' } : null
        );
      }
    }
  );

  it('call authenticator.init() of the platform only once', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9,
      exp: SEC_NOW + 9999,
    });

    const client = new AuthClient({ authenticators, serverUrl });
    const promise = client.signIn();
    expect(client.isAuthorizing).toBe(true);

    await promise;
    expect(client.platform).toBe('foo');
    expect(client.isAuthorizing).toBe(false);
    expect(client.isAuthorized).toBe(true);

    expect(fooAuthenticator.init.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      {
        foo: 'data',
      }
    );

    expect(barAuthenticator.init.mock).not.toHaveBeenCalled();
  });

  it('clear error cookie', async () => {
    setCookieError({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { domain: 'machinat.io', path: '/entry' },
    });

    const client = new AuthClient({ authenticators, serverUrl });
    await expect(client.signIn()).rejects.toThrow("I'm a teapot");

    expect(client.platform).toBe('foo');
    expect(client.isAuthorized).toBe(false);

    expect(document.mock.setter('cookie')).toHaveBeenCalledTimes(1);
    expect(
      document.mock.setter('cookie').calls[0].args[0]
    ).toMatchInlineSnapshot(
      `"machinat_auth_error=; Domain=machinat.io; Path=/entry; Expires=Thu, 01 Jan 1970 00:00:00 GMT"`
    );
  });

  it('emit error if authenticator.init() reject', async () => {
    const client = new AuthClient({ authenticators, serverUrl });
    const errorSpy = moxy();
    client.on('error', errorSpy);

    fooAuthenticator.init.mock.fake(() => {
      throw new Error('Boom!');
    });

    await expect(client.signIn({ platform: 'foo' })).rejects.toThrowError(
      'Boom!'
    );

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(new Error('Boom!'), null);
  });

  it('throw if no platform specified or paltform is unknown', async () => {
    location.mock.getter('search').fakeReturnValue('');

    const client = new AuthClient({ authenticators, serverUrl });
    const errorSpy = moxy();
    client.on('error', errorSpy);

    await expect(client.signIn()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"no platform specified"`
    );

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error('no platform specified'),
      null
    );

    await expect(
      client.signIn({ platform: 'baz' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"unknown platform \\"baz\\""`
    );

    expect(client.platform).toBe(undefined);

    expect(errorSpy.mock).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock).toHaveBeenNthCalledWith(
      2,
      new Error('unknown platform "baz"'),
      null
    );
  });

  test('init the same platform only once', async () => {
    setCookieError({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { path: '/' },
    });

    const client = new AuthClient({ authenticators, serverUrl });

    await expect(client.signIn()).rejects.toThrow("I'm a teapot");
    expect(fooAuthenticator.init.mock).toHaveBeenCalledTimes(1);

    document.mock.getter('cookie').fakeReturnValue('');
    // prevent further signing request
    fooAuthenticator.fetchCredential.mock.fake(() =>
      Promise.reject(new Error())
    );

    await expect(client.signIn({ platform: 'foo' })).rejects.toThrow();

    expect(client.platform).toBe('foo');
    expect(fooAuthenticator.init.mock).toHaveBeenCalledTimes(1);
  });

  test('init different platforms', async () => {
    const client = new AuthClient({ authenticators, serverUrl });

    // prevent further signing request
    fooAuthenticator.fetchCredential.mock.fake(() =>
      Promise.reject(new Error())
    );
    barAuthenticator.fetchCredential.mock.fake(() =>
      Promise.reject(new Error())
    );

    await expect(client.signIn()).rejects.toThrow();
    expect(client.platform).toBe('foo');

    expect(fooAuthenticator.init.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      null
    );

    await expect(client.signIn({ platform: 'bar' })).rejects.toThrow();
    expect(client.platform).toBe('bar');

    expect(barAuthenticator.init.mock).toHaveBeenCalledTimes(1);
    expect(barAuthenticator.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/bar',
      null,
      null
    );

    await expect(client.signIn({ platform: 'bar' })).rejects.toThrow();
    expect(client.platform).toBe('bar');

    await expect(client.signIn({ platform: 'foo' })).rejects.toThrow();
    expect(client.platform).toBe('foo');

    expect(fooAuthenticator.init.mock).toHaveBeenCalledTimes(1);
    expect(barAuthenticator.init.mock).toHaveBeenCalledTimes(1);
  });

  test('change platform after signed in', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9,
      exp: SEC_NOW + 9999,
    });

    const client = new AuthClient({ authenticators, serverUrl });

    await client.signIn();
    expect(client.platform).toBe('foo');
    expect(client.isAuthorized).toBe(true);
    expect(client.isAuthorizing).toBe(false);

    // prevent further signing request
    barAuthenticator.fetchCredential.mock.fake(() =>
      Promise.reject(new Error())
    );

    await expect(client.signIn({ platform: 'bar' })).rejects.toThrow();
    expect(client.platform).toBe('bar');
    expect(client.isAuthorized).toBe(false);
    expect(client.isAuthorizing).toBe(false);
  });
});

describe('signing auth flow', () => {
  const authPayload = {
    platform: 'foo',
    data: { foo: 'data' },
    scope: { path: '/' },
    iat: SEC_NOW - 10,
    exp: SEC_NOW + 1000,
    refreshTill: SEC_NOW + 10000,
  };

  const expectedContext = {
    platform: 'foo',
    user: fooUser,
    channel: fooChannel,
    foo: fooData,
    loginAt: new Date(authPayload.iat * 1000),
    expireAt: new Date(authPayload.exp * 1000),
  };

  const token = makeToken(authPayload);

  test('when already signed in', async () => {
    setCookieAuth(authPayload);

    const client = new AuthClient({ authenticators, serverUrl });
    expect(client.isAuthorizing).toBe(false);
    expect(client.isAuthorized).toBe(false);

    await expect(client.signIn()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(client.isAuthorized).toBe(true);
    expect(client.isAuthorizing).toBe(false);

    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('throw if auth rejected on server side', async () => {
    setCookieError({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { path: '/' },
    });

    const client = new AuthClient({ authenticators, serverUrl });
    expect(client.isAuthorizing).toBe(false);
    expect(client.isAuthorized).toBe(false);

    await expect(client.signIn()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(client.isAuthorizing).toBe(false);
    expect(client.isAuthorized).toBe(false);
  });

  it('get credential from authenticator and sign in', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const client = new AuthClient({ authenticators, serverUrl });

    await expect(client.signIn()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(signingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(true);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo'
    );
    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('return the the current auth status if it is already authed or authenticating', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const client = new AuthClient({ authenticators, serverUrl });

    const expectedResult = { token, context: expectedContext };

    const promise1 = client.signIn();
    const promise2 = client.signIn();

    await expect(promise1).resolves.toEqual(expectedResult);
    await expect(promise2).resolves.toEqual(expectedResult);

    await expect(client.signIn()).resolves.toEqual(expectedResult);

    expect(signingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(true);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledTimes(1);
  });

  it('sign again if token in cookie expired', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9999,
      exp: SEC_NOW - 99,
    });

    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const client = new AuthClient({ authenticators, serverUrl });

    await expect(client.signIn()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(signingCall.isDone()).toBe(true);
  });

  it('throw if api respond error', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    const client = new AuthClient({ authenticators, serverUrl });

    await expect(client.signIn()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(false);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthContext.mock).not.toHaveBeenCalled();
  });

  it('throw if authenticator.checkAuthContext() fail', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, {
        platform: 'foo',
        token,
      });

    fooAuthenticator.checkAuthContext.mock.fake(() => ({
      success: false,
      code: 400,
      reason: 'bad data',
    }));

    const client = new AuthClient({ authenticators, serverUrl });

    await expect(client.signIn()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"invalid auth info"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(false);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthenticator.checkAuthContext.mock).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('throw if signOut() during authenticating', async () => {
    serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, {
        platform: 'foo',
        token,
      });

    const client = new AuthClient({ authenticators, serverUrl });

    const promise = client.signIn();
    (Date as Moxy<DateConstructor>).now.mock.fake(() => FAKE_NOW + 50);
    client.signOut();
    (Date as Moxy<DateConstructor>).now.mock.fake(() => FAKE_NOW + 100);

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"signed out during authenticating"`
    );
    expect(client.isAuthorized).toBe(false);
  });
});

describe('auth refreshment and expiry', () => {
  const expireSpy = moxy();
  const refreshSpy = moxy();
  const errorSpy = moxy();

  beforeEach(() => {
    expireSpy.mock.clear();
    refreshSpy.mock.clear();
    errorSpy.mock.clear();
  });

  it('refresh token at "refreshLeadTime" before expiry', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshTill: SEC_NOW + 99999,
    });

    const client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 10,
    });
    client.on('expire', expireSpy);
    client.on('refresh', refreshSpy);
    client.on('error', errorSpy);

    for (let i = 1; i <= 10; i += 1) {
      const { token } = await client.signIn(); // eslint-disable-line no-await-in-loop
      const newPayload = {
        platform: 'foo',
        data: { foo: 'data' },
        scope: { path: '/' },
        iat: SEC_NOW + 990 * i,
        exp: SEC_NOW + 1990 * i,
        refreshTill: SEC_NOW + 99999,
      };
      const newToken = makeToken(newPayload);

      const refreshingCall = serverEntry
        .post('/auth/_refresh', { token })
        .reply(200, { platform: 'foo', token: newToken });

      jest.advanceTimersToNextTimer(1);
      await delayLoops(5); // eslint-disable-line no-await-in-loop

      expect(refreshingCall.isDone()).toBe(true);
      expect(client.isAuthorized).toBe(true);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);

      // eslint-disable-next-line no-await-in-loop
      await expect(client.signIn()).resolves.toEqual({
        token: newToken,
        context: {
          platform: 'foo',
          user: fooUser,
          channel: fooChannel,
          foo: fooData,
          loginAt: new Date(newPayload.iat * 1000),
          expireAt: new Date(newPayload.exp * 1000),
        },
      });
    }

    expect(fooAuthenticator.fetchCredential.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if _refresh api respond error', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshTill: SEC_NOW + 99999,
    });

    const client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 10,
    });
    client.on('expire', expireSpy);
    client.on('refresh', refreshSpy);
    client.on('error', errorSpy);

    const { token, context } = await client.signIn();
    expect(client.isAuthorized).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_refresh', { token })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(true);
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error("I'm a teapot"),
      context
    );
    expect(expireSpy.mock).not.toHaveBeenCalled();

    await expect(client.signIn()).resolves.toEqual({
      token,
      context,
    });

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(context);
    expect(fooAuthenticator.fetchCredential.mock).not.toHaveBeenCalled();
  });

  it('resign instead of refresh if authenticator.shouldResign', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    const client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 10,
    });
    client.on('expire', expireSpy);
    client.on('refresh', refreshSpy);
    client.on('error', errorSpy);

    await client.signIn();
    expect(client.isAuthorized).toBe(true);

    for (let i = 1; i <= 10; i += 1) {
      const newPayload = {
        platform: 'foo',
        data: { foo: 'data' },
        scope: { path: '/' },
        iat: SEC_NOW + 990 * i,
        exp: SEC_NOW + 1990 * i,
      };
      const newToken = makeToken(newPayload);

      const refreshingCall = serverEntry
        .post('/auth/_sign', {
          platform: 'foo',
          credential: { foo: 'credential' },
        })
        .reply(200, { platform: 'foo', token: newToken });

      jest.advanceTimersToNextTimer(1);
      await delayLoops(5); // eslint-disable-line no-await-in-loop

      expect(refreshingCall.isDone()).toBe(true);
      expect(client.isAuthorized).toBe(true);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);
      expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(i);

      // eslint-disable-next-line
      await expect(client.signIn()).resolves.toEqual({
        token: newToken,
        context: {
          platform: 'foo',
          user: fooUser,
          channel: fooChannel,
          foo: fooData,
          loginAt: new Date(newPayload.iat * 1000),
          expireAt: new Date(newPayload.exp * 1000),
        },
      });
    }

    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if authenticator.fetchCredential() resolve not success', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    const client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 10,
    });
    client.on('expire', expireSpy);
    client.on('refresh', refreshSpy);
    client.on('error', errorSpy);

    fooAuthenticator.fetchCredential.mock.fake(() => ({
      success: false,
      code: 404,
      reason: "You don't see me",
    }));

    const { token, context } = await client.signIn();
    expect(client.isAuthorized).toBe(true);

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(client.isAuthorized).toBe(true);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(1);

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error("You don't see me"),
      context
    );
    expect(expireSpy.mock).not.toHaveBeenCalled();

    await expect(client.signIn()).resolves.toEqual({
      token,
      context,
    });

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(context);
    expect(refreshSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if _sign api respond error', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    const client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 10,
    });
    client.on('expire', expireSpy);
    client.on('refresh', refreshSpy);
    client.on('error', errorSpy);

    const { token, context } = await client.signIn();
    expect(client.isAuthorized).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(true);
    expect(fooAuthenticator.fetchCredential.mock).toHaveBeenCalledTimes(1);

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error("I'm a teapot"),
      context
    );
    expect(expireSpy.mock).not.toHaveBeenCalled();

    await expect(client.signIn()).resolves.toEqual({
      token,
      context,
    });

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(context);
    expect(refreshSpy.mock).not.toHaveBeenCalled();
  });

  it('not update auth if signOut() during refreshment', async () => {
    setCookieAuth({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshTill: SEC_NOW + 99999,
    });

    const client = new AuthClient({
      authenticators,
      serverUrl,
      refreshLeadTime: 10,
    });
    client.on('expire', expireSpy);
    client.on('refresh', refreshSpy);
    client.on('error', errorSpy);

    const { token } = await client.signIn();
    expect(client.isAuthorized).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_refresh', { token })
      .delay(10)
      .reply(200, {
        token: makeToken({
          platform: 'foo',
          data: { foo: 'data' },
          scope: { path: '/' },
          iat: SEC_NOW + 990,
          exp: SEC_NOW + 1999,
          refreshTill: SEC_NOW + 99999,
        }),
      });

    (Date as Moxy<DateConstructor>).now.mock.fake(() => SEC_NOW + 980);
    jest.advanceTimersToNextTimer(1);
    (Date as Moxy<DateConstructor>).now.mock.fake(() => SEC_NOW + 985);
    client.signOut();
    await delayLoops();

    expect(refreshingCall.isDone()).toBe(true);
    expect(client.isAuthorized).toBe(false);
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.runAllTimers();
    await delayLoops(5);

    expect(errorSpy.mock).not.toHaveBeenCalled();
    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(fooAuthenticator.fetchCredential.mock).not.toHaveBeenCalled();
  });
});

test('#signOut()', async () => {
  setCookieAuth({
    platform: 'foo',
    data: { foo: 'data' },
    scope: { path: '/' },
    iat: SEC_NOW - 1,
    exp: SEC_NOW + 999,
    refreshTill: SEC_NOW + 99999,
  });

  const client = new AuthClient({ authenticators, serverUrl });
  const expireSpy = moxy();
  const errorSpy = moxy();
  client.on('expire', expireSpy);
  client.on('error', errorSpy);

  await client.signIn();
  expect(client.isAuthorized).toBe(true);

  expect(client.signOut()).toBe(undefined);

  expect(client.isAuthorized).toBe(false);
  expect(expireSpy.mock).not.toHaveBeenCalled();
  expect(errorSpy.mock).not.toHaveBeenCalled();
});
