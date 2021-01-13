import url from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import nock from 'nock';
import fetch from 'node-fetch';
import jsonwebtoken from 'jsonwebtoken';
import type { AnyClientAuthorizer } from '../../types';
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

const setBackendAuthed = (payload) => {
  const token = makeToken(payload);
  document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_token=${token}`);
};

const setBackendErrored = (payload) => {
  const errorEncoded = jsonwebtoken.sign(payload, '__SECRET__');
  document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_error=${errorEncoded}`);
};

const fooUser = { platform: 'foo', uid: 'john_doe' };
const fooChannel = { platform: 'foo', uid: 'foo.channel' };
const fooData = 'foo.data';

const fooAuthorizer = moxy<AnyClientAuthorizer>({
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
  async supplementContext() {
    return {
      user: fooUser,
      channel: fooChannel,
      foo: fooData,
    };
  },
});

const barAuthorizer = moxy<AnyClientAuthorizer>({
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
  async supplementContext() {
    return {
      user: { platform: 'bar', uid: 'jojo_doe' },
      channel: { platform: 'bar', uid: 'bar.channel' },
      bar: 'bar.data',
    };
  },
});

const authorizers = [fooAuthorizer, barAuthorizer];
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
  fooAuthorizer.mock.reset();
  barAuthorizer.mock.reset();
  location.mock.reset();
  document.mock.reset();
});

afterEach(() => {
  jest.clearAllTimers();
});

describe('#constructor(options)', () => {
  test('basic props', () => {
    let controller = new AuthClient({ authorizers, serverUrl });
    expect(controller.authorizers).toEqual(authorizers);
    expect(controller.serverUrl).toBe('/auth');
    expect(controller.refreshLeadTime).toBe(300);
    expect(controller.platform).toBe('foo');
    expect(controller.isAuthorizing).toBe(true);

    controller = new AuthClient({
      authorizers,
      serverUrl,
      platform: 'bar',
      refreshLeadTime: 999,
    });
    expect(controller.refreshLeadTime).toBe(999);

    expect(controller.platform).toBe('bar');
    expect(controller.isAuthorizing).toBe(true);
  });

  it('throw if provider is empty', () => {
    expect(
      () =>
        new AuthClient({ authorizers: undefined as never, serverUrl: '/auth' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authorizers must not be empty"`
    );
    expect(
      () => new AuthClient({ authorizers: [], serverUrl: '/auth' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authorizers must not be empty"`
    );
  });

  it('throw if serverUrl is empty', () => {
    expect(
      () => new AuthClient({ authorizers, serverUrl: undefined as never })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.serverUrl must not be empty"`
    );
  });
});

describe('bootstraping', () => {
  it('call provider.init() of the corresonded platform', async () => {
    const controller = new AuthClient({ authorizers, serverUrl });

    expect(controller.platform).toBe('foo');
    expect(controller.isAuthorizing).toBe(true);

    expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      null
    );

    await delayLoops();
    expect(controller.platform).toBe('foo');
    expect(controller.isAuthorizing).toBe(false);
    expect(controller.isAuthorized).toBe(false);
  });

  test.each`
    param        | query        | cookieAuthed | cookieErrored | expectedPlatform
    ${undefined} | ${undefined} | ${'foo'}     | ${undefined}  | ${'foo'}
    ${undefined} | ${'foo'}     | ${undefined} | ${undefined}  | ${'foo'}
    ${'foo'}     | ${undefined} | ${undefined} | ${undefined}  | ${'foo'}
    ${undefined} | ${'bar'}     | ${'foo'}     | ${undefined}  | ${'bar'}
    ${'bar'}     | ${'foo'}     | ${'foo'}     | ${undefined}  | ${'bar'}
    ${'bar'}     | ${'foo'}     | ${undefined} | ${undefined}  | ${'bar'}
    ${undefined} | ${undefined} | ${undefined} | ${'foo'}      | ${'foo'}
    ${undefined} | ${'bar'}     | ${undefined} | ${'foo'}      | ${'bar'}
    ${'bar'}     | ${undefined} | ${undefined} | ${'foo'}      | ${'bar'}
  `(
    'platform choosing priority',
    async ({ param, query, cookieAuthed, cookieErrored, expectedPlatform }) => {
      location.mock
        .getter('search')
        .fake(() => (query ? `?platform=${query}` : ''));

      if (cookieAuthed) {
        setBackendAuthed({
          platform: cookieAuthed,
          data: { [cookieAuthed]: '__DATA__' },
          scope: { path: '/' },
          iat: SEC_NOW - 9,
          exp: SEC_NOW + 9999,
        });
      }
      if (cookieErrored) {
        setBackendErrored({
          platform: cookieErrored,
          error: { code: 418, reason: "I'm a teapot" },
          scope: { path: '/' },
        });
      }

      const controller = new AuthClient({
        platform: param,
        authorizers,
        serverUrl: '/auth',
      });

      expect(controller.platform).toBe(expectedPlatform);
      expect(controller.isAuthorizing).toBe(true);
      expect(controller.isAuthorized).toBe(false);

      if (expectedPlatform === 'foo') {
        expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);
        expect(fooAuthorizer.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/foo',
          cookieAuthed === 'foo' ? { foo: '__DATA__' } : null,
          cookieErrored === 'foo' ? { code: 418, reason: "I'm a teapot" } : null
        );
      } else if (expectedPlatform === 'bar') {
        expect(barAuthorizer.init.mock).toHaveBeenCalledTimes(1);
        expect(barAuthorizer.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/bar',
          cookieAuthed === 'bar' ? { bar: '__DATA__' } : null,
          cookieErrored === 'bar' ? { code: 418, reason: "I'm a teapot" } : null
        );
      }

      try {
        await controller.auth();
      } catch {
        // test the #auth() behavior later
      }
    }
  );

  it('remove error from cookie once retrieved', async () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { domain: 'machinat.io', path: '/entry' },
    });

    const controller = new AuthClient({ authorizers, serverUrl });

    expect(document.mock.setter('cookie')).toHaveBeenCalledTimes(1);
    expect(
      document.mock.setter('cookie').calls[0].args[0]
    ).toMatchInlineSnapshot(
      `"machinat_auth_error=; Domain=machinat.io; Path=/entry; Expires=Thu, 01 Jan 1970 00:00:00 GMT"`
    );

    await expect(controller.auth()).rejects.toThrow("I'm a teapot");
  });

  it('emit error if authorizer.init() reject', async () => {
    const controller = new AuthClient({
      platform: 'baz',
      authorizers,
      serverUrl,
    });
    const errorSpy = moxy();
    controller.on('error', errorSpy);

    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error('unknown platform "baz"'),
      null
    );
  });

  test('no platform specified or paltform unknown', async () => {
    location.mock.getter('search').fakeReturnValue('');

    const controller = new AuthClient({ authorizers, serverUrl });
    const errorSpy = moxy();
    controller.on('error', errorSpy);

    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error('no platform specified'),
      null
    );

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"no platform specified"`
    );

    await expect(
      controller.auth('baz')
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"unknown platform \\"baz\\""`
    );

    expect(controller.platform).toBe(undefined);

    expect(errorSpy.mock).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock).toHaveBeenNthCalledWith(
      2,
      new Error('unknown platform "baz"'),
      null
    );
  });

  it('do not reinit the same platform again', async () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { path: '/' },
    });

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });
    expect(controller.isAuthorizing).toBe(true);

    await expect(controller.auth()).rejects.toThrow("I'm a teapot");
    expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);

    await expect(controller.auth()).rejects.toThrow();

    expect(controller.platform).toBe('foo');
    expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);
  });

  it('can reinit with another platform specified', async () => {
    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });
    expect(controller.isAuthorizing).toBe(true);
    expect(controller.platform).toBe('foo');

    await expect(controller.auth()).rejects.toThrow();

    await expect(controller.auth('bar')).rejects.toThrow();
    expect(controller.platform).toBe('bar');

    await expect(controller.auth('bar')).rejects.toThrow();
    expect(controller.platform).toBe('bar');

    await expect(controller.auth('foo')).rejects.toThrow();
    expect(controller.platform).toBe('foo');

    expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      null
    );

    expect(barAuthorizer.init.mock).toHaveBeenCalledTimes(1);
    expect(barAuthorizer.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/bar',
      null,
      null
    );
  });

  it('sign out if already signed in when platform changed', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9,
      exp: SEC_NOW + 9999,
    });

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });
    expect(controller.isAuthorizing).toBe(true);

    await controller.auth();
    expect(controller.platform).toBe('foo');
    expect(controller.isAuthorized).toBe(true);
    expect(controller.isAuthorizing).toBe(false);

    await expect(controller.auth('bar')).rejects.toThrow();
    expect(controller.platform).toBe('bar');
    expect(controller.isAuthorized).toBe(false);
    expect(controller.isAuthorizing).toBe(false);
  });
});

describe('signing auth', () => {
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

  test('already authorized on server side', async () => {
    setBackendAuthed(authPayload);

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });
    expect(controller.isAuthorizing).toBe(true);
    expect(controller.isAuthorized).toBe(false);

    await expect(controller.auth()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(controller.isAuthorized).toBe(true);
    expect(controller.isAuthorizing).toBe(false);

    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledWith({
      foo: 'data',
    });
  });

  it('throw if auth rejected on server side', async () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { path: '/' },
    });

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });
    expect(controller.isAuthorizing).toBe(true);
    expect(controller.isAuthorized).toBe(false);

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(controller.isAuthorizing).toBe(false);
    expect(controller.isAuthorized).toBe(false);
  });

  it('get credential from provider and sign in', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });

    await expect(controller.auth()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(true);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo'
    );
    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledWith({
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

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });

    const expectedResult = { token, context: expectedContext };

    const promise1 = controller.auth();
    const promise2 = controller.auth();

    await expect(promise1).resolves.toEqual(expectedResult);
    await expect(promise2).resolves.toEqual(expectedResult);

    await expect(controller.auth()).resolves.toEqual(expectedResult);

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(true);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledTimes(1);
  });

  it('sign again if token in cookie expired', async () => {
    setBackendAuthed({
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

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });

    await expect(controller.auth()).resolves.toEqual({
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

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(false);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.supplementContext.mock).not.toHaveBeenCalled();
  });

  it('throw if provider.supplementContext() resolve null', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, {
        platform: 'foo',
        token,
      });

    fooAuthorizer.supplementContext.mock.fake(() => null);

    const controller = new AuthClient({
      platform: 'foo',
      authorizers,
      serverUrl,
    });

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"invalid auth info"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(false);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.supplementContext.mock).toHaveBeenCalledWith({
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

    const controller = new AuthClient({ authorizers, serverUrl });

    const promise = controller.auth();
    (Date as Moxy<DateConstructor>).now.mock.fake(() => FAKE_NOW + 50);
    controller.signOut();
    (Date as Moxy<DateConstructor>).now.mock.fake(() => FAKE_NOW + 100);

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"signed out during authenticating"`
    );
    expect(controller.isAuthorized).toBe(false);
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
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshTill: SEC_NOW + 99999,
    });

    const controller = new AuthClient({
      authorizers,
      serverUrl,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);

    for (let i = 1; i <= 10; i += 1) {
      const { token } = await controller.auth(); // eslint-disable-line no-await-in-loop
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
      expect(controller.isAuthorized).toBe(true);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);

      // eslint-disable-next-line no-await-in-loop
      await expect(controller.auth()).resolves.toEqual({
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

    expect(fooAuthorizer.fetchCredential.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if _refresh api respond error', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshTill: SEC_NOW + 99999,
    });

    const controller = new AuthClient({
      authorizers,
      serverUrl,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);

    const { token, context } = await controller.auth();
    expect(controller.isAuthorized).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_refresh', { token })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(true);
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error("I'm a teapot"),
      context
    );
    expect(expireSpy.mock).not.toHaveBeenCalled();

    await expect(controller.auth()).resolves.toEqual({
      token,
      context,
    });

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(context);
    expect(fooAuthorizer.fetchCredential.mock).not.toHaveBeenCalled();
  });

  it('resign instead of refresh if provider.shouldResign', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    const controller = new AuthClient({
      authorizers,
      serverUrl,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);

    await controller.auth();
    expect(controller.isAuthorized).toBe(true);

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
      expect(controller.isAuthorized).toBe(true);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);
      expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(i);

      // eslint-disable-next-line
      await expect(controller.auth()).resolves.toEqual({
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

  it('emit error if provider.fetchCredential() resolve not success', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    const controller = new AuthClient({
      authorizers,
      serverUrl,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);

    fooAuthorizer.fetchCredential.mock.fake(() => ({
      success: false,
      code: 404,
      reason: "You don't see me",
    }));

    const { token, context } = await controller.auth();
    expect(controller.isAuthorized).toBe(true);

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(controller.isAuthorized).toBe(true);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error("You don't see me"),
      context
    );
    expect(expireSpy.mock).not.toHaveBeenCalled();

    await expect(controller.auth()).resolves.toEqual({
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
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    const controller = new AuthClient({
      authorizers,
      serverUrl,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);

    const { token, context } = await controller.auth();
    expect(controller.isAuthorized).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(true);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error("I'm a teapot"),
      context
    );
    expect(expireSpy.mock).not.toHaveBeenCalled();

    await expect(controller.auth()).resolves.toEqual({
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
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshTill: SEC_NOW + 99999,
    });

    const controller = new AuthClient({
      authorizers,
      serverUrl,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);

    const { token } = await controller.auth();
    expect(controller.isAuthorized).toBe(true);

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
    controller.signOut();
    await delayLoops();

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthorized).toBe(false);
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.runAllTimers();
    await delayLoops(5);

    expect(errorSpy.mock).not.toHaveBeenCalled();
    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(fooAuthorizer.fetchCredential.mock).not.toHaveBeenCalled();
  });
});

test('#signOut()', async () => {
  setBackendAuthed({
    platform: 'foo',
    data: { foo: 'data' },
    scope: { path: '/' },
    iat: SEC_NOW - 1,
    exp: SEC_NOW + 999,
    refreshTill: SEC_NOW + 99999,
  });

  const controller = new AuthClient({ authorizers, serverUrl });
  const expireSpy = moxy();
  const errorSpy = moxy();
  controller.on('expire', expireSpy);
  controller.on('error', errorSpy);

  await controller.auth();
  expect(controller.isAuthorized).toBe(true);

  expect(controller.signOut()).toBe(undefined);

  expect(controller.isAuthorized).toBe(false);
  expect(expireSpy.mock).not.toHaveBeenCalled();
  expect(errorSpy.mock).not.toHaveBeenCalled();
});
