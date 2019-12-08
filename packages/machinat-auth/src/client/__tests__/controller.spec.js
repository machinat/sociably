import url from 'url';
import moxy from 'moxy';
import nock from 'nock';
import fetch from 'node-fetch';
import jsonwebtoken from 'jsonwebtoken';
import AuthClientController from '../controller';

const _resolveAfterLoops = (resolve, n) => {
  if (n === 0) {
    resolve();
  } else {
    setImmediate(_resolveAfterLoops, resolve, n - 1);
  }
};
const delayLoops = (n = 1) =>
  new Promise(resolve => _resolveAfterLoops(resolve, n));

nock.disableNetConnect();
const serverEntry = nock('https://machinat.io');

global.location = moxy(url.parse('https://machinat.io/app?platform=foo'));
global.document = moxy({ cookie: '' });
global.fetch = fetch;

const makeToken = payload =>
  jsonwebtoken
    .sign(payload, '__SECRET__')
    .split('.')
    .slice(0, 2)
    .join('.');

const setBackendAuthed = payload => {
  const token = makeToken(payload);
  global.document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_token=${token}`);
};

const setBackendErrored = payload => {
  const errorEncoded = jsonwebtoken.sign(payload, '__SECRET__');
  global.document.mock
    .getter('cookie')
    .fakeReturnValue(`machinat_auth_error=${errorEncoded}`);
};

const fooProvider = moxy({
  platform: 'foo',
  shouldResign: true,
  async init() {
    return undefined;
  },
  async startAuthFlow() {
    return {
      accepted: true,
      credential: { foo: 'credential' },
    };
  },
  async refineAuth() {
    return { user: { id: 'foo' }, channel: { id: 'foo' } };
  },
});

const barProvider = moxy({
  platform: 'bar',
  shouldResign: false,
  async init() {
    return undefined;
  },
  async startAuthFlow() {
    return {
      accepted: false,
      code: 418,
      message: "I'm drunk",
    };
  },
  async refineAuth() {
    return { user: { id: 'bar' }, channel: { id: 'bar' } };
  },
});

const providers = [fooProvider, barProvider];
const authEntry = '/auth';

const _DateNow = Date.now;
const FAKE_NOW = 1570000000000;
const SEC_NOW = FAKE_NOW / 1000;
Date.now = moxy(() => FAKE_NOW);

beforeEach(() => {
  Date.now.mock.reset();
  fooProvider.mock.reset();
  barProvider.mock.reset();
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
  it('has basic props', () => {
    let controller = new AuthClientController({ providers, authEntry });
    expect(controller.providers).toEqual(providers);
    expect(controller.authEntry).toBe('/auth');
    expect(controller.refreshLeadTime).toBe(300);

    controller = new AuthClientController({
      providers,
      authEntry: '/auth',
      refreshLeadTime: 999,
    });
    expect(controller.refreshLeadTime).toBe(999);

    expect(controller.platform).toBe(undefined);
    expect(controller.isInitiated).toBe(false);
    expect(controller.isInitiating).toBe(false);
    expect(controller.authContext).toBe(null);
    expect(controller.getToken()).toBe(undefined);
  });

  it('throw if provider is empty', () => {
    expect(
      () => new AuthClientController({ authEntry: '/auth' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.providers must not be empty"`
    );
    expect(
      () => new AuthClientController({ providers: [], authEntry: '/auth' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.providers must not be empty"`
    );
  });

  it('throw if authEntry is empty', () => {
    expect(
      () => new AuthClientController({ providers })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.authEntry must not be empty"`
    );
  });
});

describe('#init()', () => {
  it('call provider.init() of the corresonded platform', async () => {
    const controller = new AuthClientController({ providers, authEntry });

    controller.init();

    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(true);
    expect(controller.isInitiated).toBe(false);
    expect(controller.authContext).toBe(null);
    expect(controller.getToken()).toBe(undefined);

    expect(fooProvider.init.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      null
    );

    await delayLoops();
    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated).toBe(true);
    expect(controller.authContext).toBe(null);
    expect(controller.getToken()).toBe(undefined);
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
    'platform choosing priority and data or error arg from backend flow',
    async ({ param, query, authed, errored, toInit }) => {
      global.location.mock
        .getter('search')
        .fake(() => (query ? `?platform=${query}` : ''));

      if (authed) {
        setBackendAuthed({
          platform: authed,
          auth: { [authed]: 'data' },
          scope: { path: '/' },
          iat: SEC_NOW - 9,
          exp: SEC_NOW + 9999,
        });
      }
      if (errored) {
        setBackendErrored({
          platform: errored,
          error: { code: 418, message: "I'm a teapot" },
          scope: { path: '/' },
        });
      }

      const controller = new AuthClientController({
        providers,
        authEntry: '/auth',
      });
      controller.init(param);

      expect(controller.platform).toBe(toInit);
      expect(controller.isInitiating).toBe(true);
      expect(controller.isInitiated).toBe(false);
      expect(controller.authContext).toBe(null);
      expect(controller.getToken()).toBe(undefined);

      await delayLoops();

      if (toInit === 'foo') {
        expect(fooProvider.init.mock).toHaveBeenCalledTimes(1);
        expect(fooProvider.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/foo',
          authed === 'foo' ? { foo: 'data' } : null,
          errored === 'foo' ? new Error("I'm a teapot") : null
        );
      } else if (toInit === 'bar') {
        expect(barProvider.init.mock).toHaveBeenCalledTimes(1);
        expect(barProvider.init.mock).toHaveBeenCalledWith(
          'https://machinat.io/auth/bar',
          authed === 'bar' ? { bar: 'data' } : null,
          errored === 'bar' ? new Error("I'm a teapot") : null
        );
      }

      expect(controller.platform).toBe(toInit);
      expect(controller.isInitiating).toBe(false);
      expect(controller.isInitiated).toBe(true);
      expect(controller.authContext).toBe(null);
      expect(controller.getToken()).toBe(undefined);
    }
  );

  it('remove error from cookie once retrieved', () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, message: "I'm a teapot" },
      scope: { domain: 'machinat.io', path: '/entry' },
    });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init();

    expect(global.document.mock.setter('cookie')).toHaveBeenCalledTimes(1);
    expect(
      global.document.mock.setter('cookie').calls[0].args[0]
    ).toMatchInlineSnapshot(
      `"machinat_auth_error=; Domain=machinat.io; Path=/entry; Expires=Thu, 01 Jan 1970 00:00:00 GMT"`
    );
  });

  it('emit error if provider.init() reject', async () => {
    const controller = new AuthClientController({ providers, authEntry });
    const errorSpy = moxy();
    controller.on('error', errorSpy);
    controller.init('baz');

    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `[Error: unknown platform "baz"]`
    );
  });

  it('emit error if no platform specified or paltform unknown', async () => {
    const controller = new AuthClientController({ providers, authEntry });
    const errorSpy = moxy();
    controller.on('error', errorSpy);

    global.location.mock.getter('search').fakeReturnValue('');

    controller.init();
    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `[Error: no platform specified]`
    );

    controller.init('baz');
    expect(controller.platform).toBe(undefined);

    await delayLoops();
    expect(errorSpy.mock).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock.calls[1].args[0]).toMatchInlineSnapshot(
      `[Error: unknown platform "baz"]`
    );
  });

  it('ignore reinit the same platform again', async () => {
    const controller = new AuthClientController({ providers, authEntry });

    controller.init('foo');
    controller.init('foo');
    await delayLoops();
    controller.init('foo');
    await delayLoops();

    expect(fooProvider.init.mock).toHaveBeenCalledTimes(1);

    expect(controller.platform).toBe('foo');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated).toBe(true);
  });

  it('can reinit with another platform specified', async () => {
    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');
    expect(controller.platform).toBe('foo');

    controller.init('bar');
    expect(controller.platform).toBe('bar');
    expect(controller.isInitiating).toBe(true);
    expect(controller.isInitiated).toBe(false);

    await delayLoops();
    expect(controller.platform).toBe('bar');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated).toBe(true);

    controller.init('foo');
    expect(controller.platform).toBe('bar');
    expect(controller.isInitiating).toBe(false);
    expect(controller.isInitiated).toBe(true);

    expect(fooProvider.init.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo',
      null,
      null
    );

    expect(barProvider.init.mock).toHaveBeenCalledTimes(1);
    expect(barProvider.init.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/bar',
      null,
      null
    );
  });

  it('sign out if already signed in', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9,
      exp: SEC_NOW + 9999,
    });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    controller.init('bar');
    expect(controller.isAuthed).toBe(false);
  });
});

describe('#auth()', () => {
  test('already signed in within backend flow', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9,
      exp: SEC_NOW + 9999,
    });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');

    const expectedCtx = {
      platform: 'foo',
      user: { id: 'foo' },
      channel: { id: 'foo' },
      data: { foo: 'data' },
      loginAt: new Date(FAKE_NOW - 9000),
      expireAt: new Date(FAKE_NOW + 9999000),
    };

    await expect(controller.auth()).resolves.toEqual(expectedCtx);
    expect(controller.isInitiated).toBe(true);
    expect(controller.isAuthed).toBe(true);
    expect(controller.authContext).toEqual(expectedCtx);
    expect(controller.getToken()).toMatchInlineSnapshot(
      `"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJzY29wZSI6eyJwYXRoIjoiLyJ9LCJpYXQiOjE1Njk5OTk5OTEsImV4cCI6MTU3MDAwOTk5OX0"`
    );
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('throw if error in backend flow happen', async () => {
    setBackendErrored({
      platform: 'foo',
      error: { code: 418, message: "I'm a teapot" },
      scope: { path: '/' },
    });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(controller.isInitiated).toBe(true);
    expect(controller.isAuthed).toBe(false);
    expect(controller.authContext).toBe(null);
    expect(controller.getToken()).toBe(undefined);
  });

  it('get credential from provider and sign in', async () => {
    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwODY0MDAsInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAxODAwfQ';
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');

    await expect(controller.auth()).resolves.toMatchInlineSnapshot(`
            Object {
              "channel": Object {
                "id": "foo",
              },
              "data": Object {
                "foo": "data",
              },
              "expireAt": 2019-10-02T07:36:40.000Z,
              "loginAt": 2019-10-02T07:06:40.000Z,
              "platform": "foo",
              "user": Object {
                "id": "foo",
              },
            }
          `);

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
    expect(controller.getToken()).toBe(token);
    expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledWith(
      'https://machinat.io/auth/foo'
    );
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('sign again if token in cookie expired', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 9999,
      exp: SEC_NOW - 99,
    });

    const token =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwODY0MDAsInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAxODAwfQ';
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, { platform: 'foo', token });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');

    await expect(controller.auth()).resolves.toMatchInlineSnapshot(`
            Object {
              "channel": Object {
                "id": "foo",
              },
              "data": Object {
                "foo": "data",
              },
              "expireAt": 2019-10-02T07:36:40.000Z,
              "loginAt": 2019-10-02T07:06:40.000Z,
              "platform": "foo",
              "user": Object {
                "id": "foo",
              },
            }
          `);
    expect(controller.getToken()).toBe(token);
    expect(signingCall.isDone()).toBe(true);
  });

  it('throw if api respond error', async () => {
    const signingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(418, { error: { code: 418, message: "I'm a teapot" } });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"I'm a teapot"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(false);
    expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).not.toHaveBeenCalled();
  });

  it('throw if controller not initiated', async () => {
    const controller = new AuthClientController({ providers, authEntry });

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"controller not initiated"`
    );
    expect(controller.isInitiated).toBe(false);
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
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwODY0MDAsInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAxODAwfQ',
      });

    fooProvider.refineAuth.mock.fake(() => null);

    const controller = new AuthClientController({ providers, authEntry });
    controller.init('foo');

    await expect(controller.auth()).rejects.toThrowErrorMatchingInlineSnapshot(
      `"invalid auth info"`
    );

    expect(signingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(false);
    expect(controller.getToken()).toBe(undefined);
    expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledTimes(1);
    expect(fooProvider.refineAuth.mock).toHaveBeenCalledWith({ foo: 'data' });
  });

  it('throw if signOut() during authenticating', async () => {
    serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(200, {
        platform: 'foo',
        token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwbGF0Zm9ybSI6ImZvbyIsImF1dGgiOnsiZm9vIjoiZGF0YSJ9LCJyZWZyZXNoTGltaXQiOjE1NzAwODY0MDAsInNjb3BlIjp7InBhdGgiOiIvIn0sImlhdCI6MTU3MDAwMDAwMCwiZXhwIjoxNTcwMDAxODAwfQ',
      });

    const controller = new AuthClientController({ providers, authEntry });
    controller.init();

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

    controller = new AuthClientController({
      providers,
      authEntry,
      refreshLeadTime: 10,
    });
    controller.on('expire', expireSpy);
    controller.on('refresh', refreshSpy);
    controller.on('error', errorSpy);
  });

  it('refresh token at "refreshLeadTime" before expiry', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshLimit: SEC_NOW + 99999,
    });

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    for (let i = 1; i <= 10; i += 1) {
      const token = controller.getToken();
      const newToken = makeToken({
        platform: 'foo',
        auth: { foo: 'data' },
        scope: { path: '/' },
        iat: SEC_NOW + 990 * i,
        exp: SEC_NOW + 1990 * i,
        refreshLimit: SEC_NOW + 99999,
      });

      const refreshingCall = serverEntry
        .post('/auth/_refresh', { token })
        .reply(200, { platform: 'foo', token: newToken });

      jest.advanceTimersToNextTimer(1);
      await delayLoops(5); // eslint-disable-line no-await-in-loop

      expect(refreshingCall.isDone()).toBe(true);
      expect(controller.isAuthed).toBe(true);
      expect(controller.getToken()).toBe(newToken);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);
    }

    expect(fooProvider.startAuthFlow.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if _refresh api respond error', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshLimit: SEC_NOW + 99999,
    });

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);
    const initialCtx = controller.authContext;

    const token = controller.getToken();

    const refreshingCall = serverEntry
      .post('/auth/_refresh', { token })
      .reply(418, { error: { code: 418, message: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);

    const error = errorSpy.mock.calls[0].args[0];
    expect(error).toMatchInlineSnapshot(`[Error: I'm a teapot]`);
    expect(error.code).toBe(418);
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(initialCtx);
    expect(fooProvider.startAuthFlow.mock).not.toHaveBeenCalled();
  });

  it('resign when not refreshable if provider.shouldResign', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    for (let i = 1; i <= 10; i += 1) {
      const newToken = makeToken({
        platform: 'foo',
        auth: { foo: 'data' },
        scope: { path: '/' },
        iat: SEC_NOW + 990 * i,
        exp: SEC_NOW + 1990 * i,
      });

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
      expect(controller.getToken()).toBe(newToken);
      expect(refreshSpy.mock).toHaveBeenCalledTimes(i);
      expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledTimes(i);
    }

    expect(expireSpy.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if provider.startAuthFlow() resolve unaccepted', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    fooProvider.startAuthFlow.mock.fake(() => ({
      accepted: false,
      code: 404,
      message: "You don't see me",
    }));

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);
    const initialCtx = controller.authContext;

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(controller.isAuthed).toBe(true);
    expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);

    const error = errorSpy.mock.calls[0].args[0];
    expect(error).toMatchInlineSnapshot(`[Error: You don't see me]`);
    expect(error.code).toBe(404);
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(initialCtx);
    expect(refreshSpy.mock).not.toHaveBeenCalled();
  });

  it('emit error if _sign api respond error', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);
    const initialCtx = controller.authContext;

    const refreshingCall = serverEntry
      .post('/auth/_sign', {
        platform: 'foo',
        credential: { foo: 'credential' },
      })
      .reply(418, { error: { code: 418, message: "I'm a teapot" } });

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);

    expect(refreshingCall.isDone()).toBe(true);
    expect(controller.isAuthed).toBe(true);
    expect(fooProvider.startAuthFlow.mock).toHaveBeenCalledTimes(1);
    expect(errorSpy.mock).toHaveBeenCalledTimes(1);

    const error = errorSpy.mock.calls[0].args[0];
    expect(error).toMatchInlineSnapshot(`[Error: I'm a teapot]`);
    expect(error.code).toBe(418);
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(expireSpy.mock).toHaveBeenCalledWith(initialCtx);
    expect(refreshSpy.mock).not.toHaveBeenCalled();
  });

  it('let it expire when not refreshable if not provider.shouldResign', async () => {
    fooProvider.mock.getter('shouldResign').fakeReturnValue(false);

    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
    });

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    jest.advanceTimersToNextTimer(1);
    await delayLoops(5);
    expect(refreshSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).not.toHaveBeenCalled();

    jest.advanceTimersToNextTimer(1);
    await delayLoops();

    expect(fooProvider.startAuthFlow.mock).not.toHaveBeenCalled();
    expect(errorSpy.mock).not.toHaveBeenCalled();
    expect(expireSpy.mock).toHaveBeenCalledTimes(1);
    expect(controller.isAuthed).toBe(false);
    expect(controller.getToken()).toBe(undefined);
  });

  it.only('not update auth if signOut() during refreshment', async () => {
    setBackendAuthed({
      platform: 'foo',
      auth: { foo: 'data' },
      scope: { path: '/' },
      iat: SEC_NOW - 1,
      exp: SEC_NOW + 999,
      refreshLimit: SEC_NOW + 99999,
    });

    controller.init();
    await controller.auth();
    expect(controller.isAuthed).toBe(true);

    const refreshingCall = serverEntry
      .post('/auth/_refresh', { token: controller.getToken() })
      .delay(10)
      .reply(200, {
        token: makeToken({
          platform: 'foo',
          auth: { foo: 'data' },
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
    expect(fooProvider.startAuthFlow.mock).not.toHaveBeenCalled();
  });
});

test('#signOut()', async () => {
  setBackendAuthed({
    platform: 'foo',
    auth: { foo: 'data' },
    scope: { path: '/' },
    iat: SEC_NOW - 1,
    exp: SEC_NOW + 999,
    refreshLimit: SEC_NOW + 99999,
  });

  const controller = new AuthClientController({ providers, authEntry });
  const expireSpy = moxy();
  const errorSpy = moxy();
  controller.on('expire', expireSpy);
  controller.on('error', errorSpy);

  controller.init();
  await controller.auth();
  expect(controller.isAuthed).toBe(true);

  expect(controller.signOut()).toBe(undefined);

  expect(controller.isAuthed).toBe(false);
  expect(controller.getToken()).toBe(undefined);
  expect(expireSpy.mock).not.toHaveBeenCalled();
  expect(errorSpy.mock).not.toHaveBeenCalled();
});
