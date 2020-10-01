import url from 'url';
import moxy from '@moxyjs/moxy';
import nock from 'nock';
import fetch from 'node-fetch';
import jsonwebtoken from 'jsonwebtoken';
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

global.location = moxy(url.parse('https://machinat.io/app?platform=foo'));
global.document = moxy({ cookie: '' });
global.fetch = fetch;

global.window = { location: global.location, document: global.location, fetch };

const makeToken = (payload) =>
  jsonwebtoken.sign(payload, '__SECRET__').split('.').slice(0, 2).join('.');

const setBackendAuthed = (payload) => {
  const token = makeToken(payload);
  global.document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_token=${token}`);
};

const setBackendErrored = (payload) => {
  const errorEncoded = jsonwebtoken.sign(payload, '__SECRET__');
  global.document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_error=${errorEncoded}`);
};

const fooAuthorizer = moxy({
  platform: 'foo',
  shouldResign: true,
  async init() {
    return undefined;
  },
  async fetchCredential() {
    return {
      success: true,
      credential: { foo: 'credential' },
    };
  },
  async refineAuth() {
    return { user: { id: 'foo' }, channel: { id: 'foo' } };
  },
});

const barAuthorizer = moxy({
  platform: 'bar',
  shouldResign: false,
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
  async refineAuth() {
    return { user: { id: 'bar' }, channel: { id: 'bar' } };
  },
});

const authorizers = [fooAuthorizer, barAuthorizer];
const serverURL = '/auth';

const _DateNow = Date.now;
const FAKE_NOW = 1570000000000;
const SEC_NOW = FAKE_NOW / 1000;
Date.now = moxy(() => FAKE_NOW);

beforeEach(() => {
  Date.now.mock.reset();
  fooAuthorizer.mock.reset();
  barAuthorizer.mock.reset();
  global.location.mock.reset();
  global.document.mock.reset();
});

jest.useFakeTimers();

afterEach(() => {
  jest.clearAllTimers();
});

afterAll(() => {
  Date.now = _DateNow;
});

describe('#constructor(options)', () => {
  test('basic props', () => {
    let controller = new AuthClient({ authorizers, serverURL });
    expect(controller.authorizers).toEqual(authorizers);
    expect(controller.serverURL).toBe('/auth');
    expect(controller.refreshLeadTime).toBe(300);

    controller = new AuthClient({
      authorizers,
      serverURL: '/auth',
      refreshLeadTime: 999,
    });
    expect(controller.refreshLeadTime).toBe(999);

    expect(controller.platform).toBe(undefined);
    expect(controller.isInitiating).toBe(false);
  });

  it('throw if provider is empty', () => {
    expect(
      () => new AuthClient({ serverURL: '/auth' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authorizers must not be empty"`
    );
    expect(
      () => new AuthClient({ authorizers: [], serverURL: '/auth' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authorizers must not be empty"`
    );
  });

  it('throw if serverURL is empty', () => {
    expect(
      () => new AuthClient({ authorizers })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.serverURL must not be empty"`
    );
  });
});

describe('#init()', () => {
  it('call provider.bootstrap() of the corresonded platform', async () => {
    const controller = new AuthClient({ authorizers, serverURL });

    controller.bootstrap();

    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(true);
    expect(controller.isInitiated('foo')).toBe(false);

    expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      null
    );

    await delayLoops();
    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated('foo')).toBe(true);
  });

  test.each`
    param        | query        | authed       | errored      | toInit
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
    'platform choosing priority',
    async ({ param, query, authed, errored, toInit }) => {
      global.location.mock
        .getter('search')
        .fake(() => (query ? `?platform=${query}` : ''));

      if (authed) {
        setBackendAuthed({
          platform: authed,
          data: { [authed]: 'data' },
          scope: { path: '/' },
          iat: SEC_NOW - 9,
          exp: SEC_NOW + 9999,
        });
      }
      if (errored) {
        setBackendErrored({
          platform: errored,
          error: { code: 418, reason: "I'm a teapot" },
          scope: { path: '/' },
        });
      }

      const controller = new AuthClient({
        authorizers,
        serverURL: '/auth',
      });

      expect(controller.isInitiated(toInit)).toBe(false);
      controller.bootstrap(param);

      expect(controller.platform).toBe(toInit);
      expect(controller.isInitiating).toBe(true);

      await delayLoops();

      if (toInit === 'foo') {
        expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);
        expect(fooAuthorizer.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/foo',
          authed === 'foo' ? { foo: 'data' } : null,
          errored === 'foo' ? { code: 418, reason: "I'm a teapot" } : null
        );
      } else if (toInit === 'bar') {
        expect(barAuthorizer.init.mock).toHaveBeenCalledTimes(1);
        expect(barAuthorizer.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/bar',
          authed === 'bar' ? { bar: 'data' } : null,
          errored === 'bar' ? { code: 418, reason: "I'm a teapot" } : null
        );
      }

      expect(controller.platform).toBe(toInit);
      expect(controller.isInitiating).toBe(false);
      expect(controller.isInitiated(toInit)).toBe(true);
    }
  );

  it('remove error from cookie once retrieved', () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { domain: 'machinat.io', path: '/entry' },
    });

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap();

    expect(global.document.mock.setter('cookie')).toHaveBeenCalledTimes(1);
    expect(
      global.document.mock.setter('cookie').calls[0].args[0]
    ).toMatchInlineSnapshot(
      `"machinat_auth_error=; Domain=machinat.io; Path=/entry; Expires=Thu, 01 Jan 1970 00:00:00 GMT"`
    );
  });

  it('emit error if provider.bootstrap() reject', async () => {
    const controller = new AuthClient({ authorizers, serverURL });
    const errorSpy = moxy();
    controller.on('error', errorSpy);
    controller.bootstrap('baz');

    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error('unknown platform "baz"'),
      null
    );
  });

  it('emit error if no platform specified or paltform unknown', async () => {
    const controller = new AuthClient({ authorizers, serverURL });
    const errorSpy = moxy();
    controller.on('error', errorSpy);

    global.location.mock.getter('search').fakeReturnValue('');

    controller.bootstrap();
    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error('no platform specified'),
      null
    );

    controller.bootstrap('baz');
    expect(controller.platform).toBe(undefined);

    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock).toHaveBeenCalledWith(
      new Error('unknown platform "baz"'),
      null
    );
  });

  it('ignore reinit the same platform again', async () => {
    const controller = new AuthClient({ authorizers, serverURL });

    controller.bootstrap('foo');
    controller.bootstrap('foo');
    await delayLoops();
    controller.bootstrap('foo');
    await delayLoops();

    expect(fooAuthorizer.init.mock).toHaveBeenCalledTimes(1);

    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated('foo')).toBe(true);
  });

  it('can reinit with another platform specified', async () => {
    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');
    expect(controller.platform).toBe('foo');

    controller.bootstrap('bar');
    expect(controller.platform).toBe('bar');
    expect(controller.isInitiating).toBe(true);
    expect(controller.isInitiated('bar')).toBe(false);

    await delayLoops();
    expect(controller.platform).toBe('bar');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated('bar')).toBe(true);

    controller.bootstrap('foo');
    await delayLoops();
    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated('foo')).toBe(true);

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

  it('sign out if already signed in', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9,
      exp: SEC_NOW + 9999,
    });

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    controller.bootstrap('bar');
    expect(controller.isAuthed).toBe(false);
  });
});

describe('#auth()', () => {
  const authPayload = {
    platform: 'foo',
    data: { foo: 'data' },
    scope: { path: '/' },
    iat: SEC_NOW - 10,
    exp: SEC_NOW + 1000,
    refreshLimit: SEC_NOW + 10000,
  };

  const expectedContext = {
    platform: 'foo',
    user: { id: 'foo' },
    channel: { id: 'foo' },
    data: { foo: 'data' },
    loginAt: new Date(authPayload.iat * 1000),
    expireAt: new Date(authPayload.exp * 1000),
  };

  const token = makeToken(authPayload);

  test('auth flow already finished in server side', async () => {
    setBackendAuthed(authPayload);

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

    await expect(controller.auth()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(controller.isInitiated('foo')).toBe(true);
    expect(controller.isAuthed).toBe(true);

    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('throw if error in server side auth flow happen', async () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, reason: "I'm a teapot" },
      scope: { path: '/' },
    });

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(controller.isInitiated('foo')).toBe(true);
    expect(controller.isAuthed).toBe(false);
  });

  it('get credential from provider and sign in', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

    await expect(controller.auth()).resolves.toEqual({
      token,
      context: expectedContext,
    });

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo'
    );
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('return the the current auth status if it is already authed or authenticating', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

    const expectedResult = { token, context: expectedContext };

    const promise1 = controller.auth();
    const promise2 = controller.auth();

    await expect(promise1).resolves.toEqual(expectedResult);
    await expect(promise2).resolves.toEqual(expectedResult);

    await expect(controller.auth()).resolves.toEqual(expectedResult);

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
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

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

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

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(false);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw if controller not initiated', async () => {
    const controller = new AuthClient({ authorizers, serverURL });

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"controller not boostrapped"`
    );
    expect(controller.isAuthed).toBe(false);
  });

  it('throw if provider.refineAuth() resolve null', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, {
        platform: 'foo',
        token,
      });

    fooAuthorizer.refineAuth.mock.fake(() => null);

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap('foo');

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"invalid auth info"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(false);
    expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooAuthorizer.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
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

    const controller = new AuthClient({ authorizers, serverURL });
    controller.bootstrap();

    const promise = controller.auth();
    Date.now.mock.fake(() => FAKE_NOW + 50);
    controller.signOut();
    Date.now.mock.fake(() => FAKE_NOW + 100);

    await expect(promise).rejects.toThrowErrorMatchingInlineSnapshot(
      `"signed out during authenticating"`
    );
    expect(controller.isAuthed).toBe(false);
  });
});

describe('auth refreshment and expiry', () => {
  let controller;
  const expireSpy = moxy();
  const refreshSpy = moxy();
  const errorSpy = moxy();

  beforeEach(() => {
    expireSpy.mock.clear();
    refreshSpy.mock.clear();
    errorSpy.mock.clear();

    controller = new AuthClient({
      authorizers,
      serverURL,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);
  });

  it('refresh token at "refreshLeadTime" before expiry', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshLimit: SEC_NOW + 99999,
    });
    controller.bootstrap();

    for (let i = 1; i <= 10; i += 1) {
      const { token } = await controller.auth(); // eslint-disable-line no-await-in-loop
      const newPayload = {
        platform: 'foo',
        data: { foo: 'data' },
        scope: { path: '/' },
        iat: SEC_NOW + 990 * i,
        exp: SEC_NOW + 1990 * i,
        refreshLimit: SEC_NOW + 99999,
      };
      const newToken = makeToken(newPayload);

      const refreshingCall = serverEntry
        .post('/auth/_refresh', { token })
        .reply(200, { platform: 'foo', token: newToken });

      jest.advanceTimersToNextTimer(1);
      await delayLoops(5); // eslint-disable-line no-await-in-loop

      expect(refreshingCall.isDone()).toBe(true);
      expect(controller.isAuthed).toBe(true);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);

      // eslint-disable-next-line no-await-in-loop
      await expect(controller.auth()).resolves.toEqual({
        token: newToken,
        context: {
          platform: 'foo',
          user: { id: 'foo' },
          channel: { id: 'foo' },
          data: { foo: 'data' },
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
      refreshLimit: SEC_NOW + 99999,
    });

    controller.bootstrap();
    const { token, context } = await controller.auth();
    expect(controller.isAuthed).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_refresh', { token })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
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

    controller.bootstrap();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

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
      expect(controller.isAuthed).toBe(true);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);
      expect(fooAuthorizer.fetchCredential.mock).toHaveBeenCalledTimes(i);

      // eslint-disable-next-line
      await expect(controller.auth()).resolves.toEqual({
        token: newToken,
        context: {
          platform: 'foo',
          user: { id: 'foo' },
          channel: { id: 'foo' },
          data: { foo: 'data' },
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

    fooAuthorizer.fetchCredential.mock.fake(() => ({
      success: false,
      code: 404,
      reason: "You don't see me",
    }));

    controller.bootstrap();
    const { token, context } = await controller.auth();
    expect(controller.isAuthed).toBe(true);

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(controller.isAuthed).toBe(true);
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

    controller.bootstrap();
    const { token, context } = await controller.auth();
    expect(controller.isAuthed).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(418, { error: { code: 418, reason: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
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

  it('expire if not refreshable when provider.shouldResign is false', async () => {
    fooAuthorizer.mock.getter('shouldResign').fakeReturnValue(false);

    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    controller.bootstrap();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);
    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(fooAuthorizer.fetchCredential.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(controller.isAuthed).toBe(false);
  });

  it('not update auth if signOut() during refreshment', async () => {
    setBackendAuthed({
      platform: 'foo',
      data: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshLimit: SEC_NOW + 99999,
    });

    controller.bootstrap();
    const { token } = await controller.auth();
    expect(controller.isAuthed).toBe(true);

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
          refreshLimit: SEC_NOW + 99999,
        }),
      });

    Date.now.mock.fake(() => SEC_NOW + 980);
    jest.advanceTimersToNextTimer(1);
    Date.now.mock.fake(() => SEC_NOW + 985);
    controller.signOut();
    await delayLoops();

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(false);
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
    refreshLimit: SEC_NOW + 99999,
  });

  const controller = new AuthClient({ authorizers, serverURL });
  const expireSpy = moxy();
  const errorSpy = moxy();
  controller.on('expire', expireSpy);
  controller.on('error', errorSpy);

  controller.bootstrap();
  await controller.auth();
  expect(controller.isAuthed).toBe(true);

  expect(controller.signOut()).toBe(undefined);

  expect(controller.isAuthed).toBe(false);
  expect(expireSpy.mock).not.toHaveBeenCalled();
  expect(errorSpy.mock).not.toHaveBeenCalled();
});
