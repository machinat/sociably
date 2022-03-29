import moxy, { Moxy } from '@moxyjs/moxy';
import { Readable } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import Machinat, {
  StateController,
  MachinatBot,
  MachinatChannel,
} from '@machinat/core';
import HttpOperator from '../../HttpOperator';
import { BasicAuthenticator } from '../BasicAuthenticator';

const state = moxy({
  update: async () => undefined,
  delete: async () => true,
});

const stateController = moxy<StateController>({
  globalState: () => state,
} as never);

const operator = moxy<HttpOperator>({
  getAuth: async () => null,
  issueAuth: async () => '',
  getState: async () => null,
  issueState: async () => '',
  getError: async () => null,
  issueError: async () => '',
  redirect: () => true,
  signToken: () => '__TOKEN_HEAD__.__TOKEN_BODY__.__TOKEN_SIGNATURE__',
  verifyToken: () => ({ data: { foo: 'bar' } }),
  getAuthUrl: (platform, subpath = '') =>
    `https://machinat.io/myApp/auth/${platform}/${subpath}`,
  getRedirectUrl: (subpath = '') =>
    `https://machinat.io/myApp/webview/${subpath}`,
} as never);

const bot = moxy<MachinatBot<MachinatChannel, unknown, unknown>>({
  render: async () => null,
} as never);

const channel = { platform: 'test', uid: 'test.foo.bar' };

const delegateOptions = moxy({
  bot,
  platform: 'test',
  platformName: 'Test',
  platformColor: '#009',
  platformImageUrl: 'http://machinat.test/platform/img/icon.png',
  checkAuthData: () => ({
    ok: true as const,
    data: { foo: 'bar' },
    channel,
  }),
  getChatLink: () => 'https://test.platform.com/foo.bar',
});

const _dateNow = Date.now;
const now = 1647870481457;
beforeAll(() => {
  Date.now = () => now;
});
afterAll(() => {
  Date.now = _dateNow;
});

beforeEach(() => {
  bot.mock.reset();
  operator.mock.reset();
  state.mock.reset();
  stateController.mock.reset();
  delegateOptions.mock.reset();
});

test('.getAuthUrl()', () => {
  const authenticator = new BasicAuthenticator(stateController, operator);

  const loginToken = '__SIGNED_LOGIN_TOKEN__';
  operator.signToken.mock.fakeReturnValue(loginToken);

  expect(
    authenticator.getAuthUrl('test', { foo: 'bar' })
  ).toMatchInlineSnapshot(
    `"https://machinat.io/myApp/auth/test/?login=__SIGNED_LOGIN_TOKEN__"`
  );
  expect(operator.signToken.mock).toHaveBeenCalledWith('test', {
    data: { foo: 'bar' },
  });

  expect(
    authenticator.getAuthUrl('test', { hello: 'world' }, '/foo?bar=baz')
  ).toMatchInlineSnapshot(
    `"https://machinat.io/myApp/auth/test/?login=__SIGNED_LOGIN_TOKEN__"`
  );
  expect(operator.signToken.mock).toHaveBeenCalledWith('test', {
    data: { hello: 'world' },
    redirectUrl: '/foo?bar=baz',
  });
  expect(operator.signToken.mock).toHaveBeenCalledTimes(2);
});

describe('root page', () => {
  const routing = {
    originalPath: '/myApp/auth/test/',
    matchedPath: '/myApp/auth/test/',
    trailingPath: '',
  };
  const authenticator = new BasicAuthenticator(stateController, operator);
  const delegateRequest = authenticator.createRequestDelegator(delegateOptions);

  test('redirect to login page with state', async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/?login=__SIGNED_LOGIN_TOKEN__',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    await delegateRequest(req, res, routing);

    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledWith({
      foo: 'bar',
    });

    expect(operator.issueState.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledWith(res, 'test', {
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
    });

    expect(operator.redirect.mock).toHaveBeenCalledTimes(1);

    operator.verifyToken.mock.fakeReturnValue({
      data: { foo: 'baz' },
      redirectUrl: '/foo/bar/baz',
    });
    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: true,
      channel: { platform: 'test', uid: 'test.foo.baz' },
      data: { foo: 'baz' },
    });

    await delegateRequest(req, res, routing);

    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledTimes(2);
    expect(delegateOptions.checkAuthData.mock).toHaveBeenNthCalledWith(2, {
      foo: 'baz',
    });

    expect(operator.issueState.mock).toHaveBeenCalledTimes(2);
    expect(operator.issueState.mock).toHaveBeenNthCalledWith(2, res, 'test', {
      status: 'login',
      ch: 'test.foo.baz',
      data: { foo: 'baz' },
      redirect: '/foo/bar/baz',
    });

    expect(operator.redirect.mock).toHaveBeenCalledTimes(2);
    expect(operator.redirect.mock).toHaveBeenCalledWith(
      res,
      'https://machinat.io/myApp/auth/test/login'
    );
    expect(operator.verifyToken.mock).toHaveBeenCalledTimes(2);
    expect(operator.verifyToken.mock).toHaveBeenCalledWith(
      'test',
      '__SIGNED_LOGIN_TOKEN__'
    );
    expect(operator.getAuth.mock).toHaveBeenCalledTimes(2);
    expect(operator.getAuth.mock).toHaveBeenCalledWith(req, 'test', {
      acceptRefreshable: true,
    });
    expect(operator.getState.mock).toHaveBeenCalledTimes(2);
    expect(operator.getState.mock).toHaveBeenCalledWith(req, 'test');

    expect(res.setHeader.mock).toHaveBeenCalledWith('X-Robots-Tag', 'none');

    expect(operator.issueError.mock).not.toHaveBeenCalled();
    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
  });

  test('redirect to webview if alredy logged in', async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/?login=__SIGNED_LOGIN_TOKEN__',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getAuth.mock.fake(async () => ({ foo: 'bar' }));

    await delegateRequest(req, res, routing);

    expect(operator.redirect.mock).toHaveBeenCalledTimes(1);
    expect(operator.redirect.mock).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });

    operator.verifyToken.mock.fakeReturnValue({
      data: { foo: 'bar' },
      redirectUrl: '/foo?bar=baz',
    });

    await delegateRequest(req, res, routing);

    expect(operator.redirect.mock).toHaveBeenCalledTimes(2);
    expect(operator.redirect.mock).toHaveBeenNthCalledWith(
      2,
      res,
      '/foo?bar=baz',
      { assertInternal: true }
    );

    expect(delegateOptions.checkAuthData.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
    expect(operator.issueError.mock).not.toHaveBeenCalled();
    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
  });

  test("redirect to login page if it's alredy in later phase", async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/?login=__SIGNED_LOGIN_TOKEN__',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      redirect: '/foo/bar',
    }));

    await delegateRequest(req, res, routing);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: 1647868570539,
      hash: 'AaBbCcDd12345',
      redirect: '/foo/bar',
    }));

    await delegateRequest(req, res, routing);

    expect(operator.redirect.mock).toHaveBeenCalledTimes(2);
    expect(operator.redirect.mock).toHaveBeenCalledWith(
      res,
      'https://machinat.io/myApp/auth/test/login'
    );

    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledTimes(2);
    expect(operator.issueState.mock).not.toHaveBeenCalled();
    expect(operator.issueError.mock).not.toHaveBeenCalled();
    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
  });

  test('reset state if channel has changed', async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/?login=__SIGNED_LOGIN_TOKEN__',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.baz',
      data: { foo: 'baz' },
    }));

    await delegateRequest(req, res, routing);

    expect(operator.issueState.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledWith(res, 'test', {
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
    });

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.baz',
      data: { foo: 'baz' },
      ts: 1647868570539,
      hash: 'AaBbCcDd12345',
    }));

    await delegateRequest(req, res, routing);

    expect(operator.issueState.mock).toHaveBeenCalledTimes(2);
    expect(operator.issueState.mock).toHaveBeenNthCalledWith(2, res, 'test', {
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
    });

    expect(operator.redirect.mock).toHaveBeenCalledTimes(2);
    expect(operator.redirect.mock).toHaveBeenCalledWith(
      res,
      'https://machinat.io/myApp/auth/test/login'
    );

    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledTimes(2);
    expect(operator.issueError.mock).not.toHaveBeenCalled();
    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
  });

  it('respond 400 if no login query param', async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    await delegateRequest(req, res, routing);

    expect(res.writeHead.mock).toHaveBeenCalledWith(400, {
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": 400,
          "reason": "invald login param",
        },
        "platform": "test",
      }
    `);
  });

  it('respond 400 if login query is invalid', async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/?login=__INVALID_LOGIN_TOKEN__',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.verifyToken.mock.fakeReturnValue(null);
    await delegateRequest(req, res, routing);

    expect(operator.verifyToken.mock).toHaveBeenCalledTimes(1);
    expect(operator.verifyToken.mock).toHaveBeenCalledWith(
      'test',
      '__INVALID_LOGIN_TOKEN__'
    );

    expect(res.writeHead.mock).toHaveBeenCalledWith(400, {
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": 400,
          "reason": "invald login param",
        },
        "platform": "test",
      }
    `);
  });

  it('respond error from checkAuthData', async () => {
    const req = moxy<IncomingMessage>({
      url: 'https://machinat.io/myApp/auth/test/?login=__LOGIN_TOKEN__',
    } as never);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: false,
      code: 418,
      reason: "I'm a Teapot",
    });

    await delegateRequest(req, res, routing);

    expect(res.writeHead.mock).toHaveBeenCalledWith(418, {
      'Content-Type': 'application/json',
    });
    expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": 418,
          "reason": "I'm a Teapot",
        },
        "platform": "test",
      }
    `);
  });
});

describe('login page', () => {
  const routing = {
    originalPath: '/myApp/auth/test/',
    matchedPath: '/myApp/auth/test/',
    trailingPath: 'login',
  };
  const req = moxy<IncomingMessage>({
    url: 'https://machinat.io/myApp/auth/test/login',
  } as never);

  test('render login page with state', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
    }));

    await delegateRequest(req, res, routing);

    expect(bot.render.mock).toHaveBeenCalledTimes(1);
    expect(bot.render.mock).toHaveBeenCalledWith(channel, expect.any(Object));

    expect(bot.render.mock.calls[0].args[1]).toMatchInlineSnapshot(
      { props: { code: expect.any(String) } },
      `
      <DefaultCodeMessage
        channel={
          Object {
            "platform": "test",
            "uid": "test.foo.bar",
          }
        }
        code={Any<String>}
      />
    `
    );

    const msgElement = bot.render.mock.calls[0].args[1];
    expect(msgElement.type({ ...msgElement.props, code: 123456 }))
      .toMatchInlineSnapshot(`
      <p>
        Your login code is: 
        123456
      </p>
    `);

    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkAuthData.mock).toHaveBeenCalledWith({
      foo: 'bar',
    });

    expect(operator.signToken.mock).toHaveBeenCalledTimes(1);
    expect(operator.signToken.mock).toHaveBeenCalledWith(
      'test',
      expect.stringMatching(/^test.foo.bar:1647870481457:[0-9]{6}$/),
      { noTimestamp: true }
    );

    expect(operator.issueState.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.writeHead.mock).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/html',
    });
    expect(res.end.mock.calls[0].args[0]).toMatchSnapshot();

    expect(operator.getState.mock).toHaveBeenCalledTimes(1);
    expect(operator.getState.mock).toHaveBeenCalledWith(req, 'test');
    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
    expect(operator.issueError.mock).not.toHaveBeenCalled();

    expect(state.update.mock).not.toHaveBeenCalled();
  });

  test('with customized options', async () => {
    const CodeMessage = ({ code }) => <p>Yo! Check your login code {code}</p>;
    const authenticator = new BasicAuthenticator(stateController, operator, {
      appName: 'My Test App',
      appImageUrl: 'https://machinat.io/myApp/img/icon.png',
      loginCodeDigits: 20,
      codeMessageComponent: CodeMessage,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
    }));

    await delegateRequest(req, res, routing);

    expect(bot.render.mock).toHaveBeenCalledTimes(1);
    expect(bot.render.mock).toHaveBeenCalledWith(channel, expect.any(Object));

    expect(bot.render.mock.calls[0].args[1]).toMatchInlineSnapshot(
      { props: { code: expect.any(String) } },
      `
      <CodeMessage
        channel={
          Object {
            "platform": "test",
            "uid": "test.foo.bar",
          }
        }
        code={Any<String>}
      />
    `
    );

    expect(operator.issueState.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.writeHead.mock).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/html',
    });
    expect(res.end.mock.calls[0].args[0]).toMatchSnapshot();
  });

  test("do not reissue state if it's in verify phase", async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      hash: 'AaBbCcDd12345',
      ts: now - 10000,
    }));

    await delegateRequest(req, res, routing);

    expect(operator.signToken.mock).not.toHaveBeenCalled();
    expect(bot.render.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();

    expect(res.end.mock).toHaveBeenCalledTimes(1);
  });

  test('reissue state if login session expired', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator, {
      loginDuration: 99,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      hash: 'AaBbCcDd12345',
      ts: now - 100000,
    }));

    await delegateRequest(req, res, routing);

    expect(operator.signToken.mock).toHaveBeenCalledTimes(1);
    expect(bot.render.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.end.mock).toHaveBeenCalledTimes(1);
  });

  test('reissue state if login attempt reach limitation', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator, {
      maxLoginAttempt: 10,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    state.update.mock.fake(async () => 10);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      hash: 'AaBbCcDd12345',
      ts: now - 100000,
    }));

    await delegateRequest(req, res, routing);

    expect(operator.signToken.mock).toHaveBeenCalledTimes(1);
    expect(bot.render.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueState.mock).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.end.mock).toHaveBeenCalledTimes(1);

    expect(state.update.mock).toHaveBeenCalledTimes(1);
    expect(state.update.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"test.foo.bar:1647870381457"`
    );
    await expect(state.update.mock.calls[0].result).resolves.toBe(10);
    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"basic_auth_verify_records"`);
  });

  it('redirect with error if no login state', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator, {
      maxLoginAttempt: 10,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    await delegateRequest(req, res, routing);

    expect(operator.signToken.mock).not.toHaveBeenCalled();
    expect(bot.render.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
    expect(res.end.mock).not.toHaveBeenCalled();

    expect(operator.issueError.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueError.mock).toHaveBeenCalledWith(
      res,
      'test',
      401,
      expect.any(String)
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"login session expired"`
    );

    expect(operator.redirect.mock).toHaveBeenCalledTimes(1);
    expect(operator.redirect.mock).toHaveBeenCalledWith(res);
  });

  it('redirect with error if checkAuthData fail', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      redirect: '/foo/bar',
    }));
    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: false,
      code: 418,
      reason: "I'm a Teapot",
    });

    await delegateRequest(req, res, routing);

    expect(operator.signToken.mock).not.toHaveBeenCalled();
    expect(bot.render.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
    expect(res.end.mock).not.toHaveBeenCalled();

    expect(operator.issueError.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueError.mock).toHaveBeenCalledWith(
      res,
      'test',
      418,
      "I'm a Teapot"
    );

    expect(operator.redirect.mock).toHaveBeenCalledTimes(1);
    expect(operator.redirect.mock).toHaveBeenCalledWith(res, '/foo/bar');
  });

  it('redirect with error if fail to send code message', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      redirect: '/foo/bar',
    }));
    bot.render.mock.fake(async () => {
      throw new Error('YOU SHALL NOT PASS');
    });

    await delegateRequest(req, res, routing);

    expect(bot.render.mock).toHaveBeenCalledTimes(1);
    expect(operator.signToken.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
    expect(res.end.mock).not.toHaveBeenCalled();

    expect(operator.issueError.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueError.mock).toHaveBeenCalledWith(
      res,
      'test',
      510,
      expect.any(String)
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"fail to send login code"`
    );

    expect(operator.redirect.mock).toHaveBeenCalledTimes(1);
    expect(operator.redirect.mock).toHaveBeenCalledWith(res, '/foo/bar');
  });
});

describe('verify code api', () => {
  const routing = {
    originalPath: '/myApp/auth/test/',
    matchedPath: '/myApp/auth/test/',
    trailingPath: 'verify',
  };

  const prepareReq = (body): Moxy<IncomingMessage> => {
    const req = moxy(
      new Readable({
        read() {
          this.push(typeof body === 'string' ? body : JSON.stringify(body));
          this.push(null);
        },
      })
    );
    req.mock
      .getter('url')
      .fake(() => 'https://machinat.io/myApp/auth/test/login');
    req.mock.getter('method').fake(() => 'POST');
    return req as never;
  };

  test('verify with ok login code', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const req = prepareReq({ code: 123456 });
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    await delegateRequest(req, res, routing);

    expect(res.writeHead.mock).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end.mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "ok": true,
        "redirectTo": "https://machinat.io/myApp/webview/foo/bar",
        "retryChances": 0,
      }
    `);

    expect(operator.issueAuth.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueAuth.mock).toHaveBeenCalledWith(res, 'test', {
      foo: 'bar',
    });

    expect(operator.signToken.mock).toHaveBeenCalledTimes(1);
    expect(operator.signToken.mock).toHaveBeenCalledWith(
      'test',
      expect.any(String),
      { noTimestamp: true }
    );
    expect(operator.signToken.mock.calls[0].args[1]).toMatchInlineSnapshot(
      `"test.foo.bar:1647870471457:123456"`
    );

    expect(state.update.mock).toHaveBeenCalledTimes(1);
    expect(state.update.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"test.foo.bar:1647870471457"`
    );
    await expect(state.update.mock.calls[0].result).resolves.toBe(undefined);
    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"basic_auth_verify_records"`);

    expect(operator.issueError.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
  });

  test('verify wrong login code', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__WRONG_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    let count;
    state.update.mock.fake(async (key, updator) => {
      if (/^\$/.test(key)) {
        return updator();
      }
      count = updator(count);
      return count;
    });

    for (let i = 1; i <= 6; i += 1) {
      const req = prepareReq({ code: i * 111111 });
      const res = moxy<ServerResponse>(new ServerResponse(req));
      await delegateRequest(req, res, routing); // eslint-disable-line no-await-in-loop

      expect(res.writeHead.mock).toHaveBeenCalledWith(200, {
        'Content-Type': 'application/json',
      });
      expect(res.end.mock).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toEqual({
        ok: false,
        redirectTo: 'https://machinat.io/myApp/webview/foo/bar',
        retryChances: Math.max(5 - i, 0),
      });

      if (i < 5) {
        expect(operator.issueError.mock).not.toHaveBeenCalled();
      } else {
        expect(operator.issueError.mock).toHaveBeenCalledTimes(i - 5 + 1);
        expect(operator.issueError.mock).toHaveBeenCalledWith(
          res,
          'test',
          401,
          expect.any(String)
        );
        expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
          `"invalid login verify code"`
        );
      }
    }

    expect(operator.signToken.mock).toHaveBeenCalledTimes(6);
    expect(operator.signToken.mock).toHaveBeenCalledWith(
      'test',
      expect.any(String),
      { noTimestamp: true }
    );
    expect(operator.signToken.mock.calls.map(({ args }) => args[1]))
      .toMatchInlineSnapshot(`
      Array [
        "test.foo.bar:1647870471457:111111",
        "test.foo.bar:1647870471457:222222",
        "test.foo.bar:1647870471457:333333",
        "test.foo.bar:1647870471457:444444",
        "test.foo.bar:1647870471457:555555",
        "test.foo.bar:1647870471457:666666",
      ]
    `);

    expect(state.update.mock).toHaveBeenCalledTimes(7);
    expect(state.update.mock.calls.map(({ args }) => args[0]))
      .toMatchInlineSnapshot(`
      Array [
        "test.foo.bar:1647870471457",
        "$time_index",
        "test.foo.bar:1647870471457",
        "test.foo.bar:1647870471457",
        "test.foo.bar:1647870471457",
        "test.foo.bar:1647870471457",
        "test.foo.bar:1647870471457",
      ]
    `);
    await expect(
      Promise.all(state.update.mock.calls.map(({ result }) => result))
    ).resolves.toMatchInlineSnapshot(`
            Array [
              1,
              Array [
                Object {
                  "ch": "test.foo.bar",
                  "ts": 1647870471457,
                },
              ],
              2,
              3,
              4,
              5,
              5,
            ]
          `);

    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"basic_auth_verify_records"`);
  });

  test('verify with invalid body', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: '/foo/bar',
    }));

    const req1 = prepareReq("I'm Jason");
    const res1 = moxy<ServerResponse>(new ServerResponse(req1));
    await delegateRequest(req1, res1, routing);

    expect(res1.writeHead.mock).toHaveBeenCalledWith(400, {
      'Content-Type': 'application/json',
    });
    expect(res1.end.mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res1.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": 400,
          "reason": "invalid request",
        },
        "platform": "test",
      }
    `);

    const req2 = prepareReq({ noCode: true });
    const res2 = moxy<ServerResponse>(new ServerResponse(req2));
    await delegateRequest(req2, res2, routing);

    expect(res2.writeHead.mock).toHaveBeenCalledWith(400, {
      'Content-Type': 'application/json',
    });
    expect(res2.end.mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res2.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "error": Object {
          "code": 400,
          "reason": "invalid request",
        },
        "platform": "test",
      }
    `);

    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
    expect(operator.signToken.mock).not.toHaveBeenCalled();
    expect(state.update.mock).not.toHaveBeenCalled();
    expect(operator.issueError.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
  });

  test('verify with invalid state', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    const req1 = prepareReq({ code: 123456 });
    const res1 = moxy<ServerResponse>(new ServerResponse(req1));
    await delegateRequest(req1, res1, routing);

    expect(res1.writeHead.mock).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res1.end.mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res1.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "ok": false,
        "redirectTo": "https://machinat.io/myApp/webview/",
        "retryChances": 0,
      }
    `);

    expect(operator.issueError.mock).toHaveBeenCalledTimes(1);
    expect(operator.issueError.mock).toHaveBeenCalledWith(
      res1,
      'test',
      401,
      expect.any(String)
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"login session expired"`
    );

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      redirect: 'foo/bar',
    }));

    const req2 = prepareReq({ code: 123456 });
    const res2 = moxy<ServerResponse>(new ServerResponse(req2));
    await delegateRequest(req2, res2, routing);

    expect(res2.writeHead.mock).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res2.end.mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res2.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "ok": false,
        "redirectTo": "https://machinat.io/myApp/webview/foo/bar",
        "retryChances": 0,
      }
    `);
    expect(operator.issueError.mock).toHaveBeenCalledTimes(2);
    expect(operator.issueError.mock.calls[1].args[3]).toMatchInlineSnapshot(
      `"login session expired"`
    );

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now - 36000000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    const req3 = prepareReq({ code: 123456 });
    const res3 = moxy<ServerResponse>(new ServerResponse(req3));
    await delegateRequest(req3, res3, routing);

    expect(res3.writeHead.mock).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res3.end.mock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res3.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      Object {
        "ok": false,
        "redirectTo": "https://machinat.io/myApp/webview/foo/bar",
        "retryChances": 0,
      }
    `);
    expect(operator.issueError.mock).toHaveBeenCalledTimes(3);
    expect(operator.issueError.mock.calls[2].args[3]).toMatchInlineSnapshot(
      `"login session expired"`
    );

    expect(operator.issueAuth.mock).not.toHaveBeenCalled();
    expect(operator.signToken.mock).not.toHaveBeenCalled();
    expect(state.update.mock).not.toHaveBeenCalled();
    expect(operator.issueState.mock).not.toHaveBeenCalled();
  });

  test('menaging the records', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator, {
      loginDuration: 777,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    state.update.mock.fake(async (key, updator) => {
      return updator(
        /^\$/.test(key)
          ? [
              { ts: now - 999999, ch: 'test.foo.1' },
              { ts: now - 888888, ch: 'test.foo.2' },
              { ts: now - 777777, ch: 'test.foo.3' },
              { ts: now - 666666, ch: 'test.foo.4' },
              { ts: now - 555555, ch: 'test.foo.5' },
            ]
          : undefined
      );
    });

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    const req1 = prepareReq({ code: 123456 });
    const res1 = moxy<ServerResponse>(new ServerResponse(req1));
    await delegateRequest(req1, res1, routing);

    expect(state.update.mock).toHaveBeenCalledTimes(1);
    expect(state.update.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"test.foo.bar:1647870471457"`
    );
    await expect(state.update.mock.calls[0].result).resolves.toBe(undefined);
    expect(state.delete.mock).not.toHaveBeenCalled();

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo.bar',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__WRONG_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    const req2 = prepareReq({ code: 123456 });
    const res2 = moxy<ServerResponse>(new ServerResponse(req2));
    await delegateRequest(req2, res2, routing);

    expect(state.update.mock).toHaveBeenCalledTimes(3);
    expect(state.update.mock.calls[1].args[0]).toMatchInlineSnapshot(
      `"test.foo.bar:1647870471457"`
    );
    await expect(state.update.mock.calls[1].result).resolves.toBe(1);

    expect(state.update.mock.calls[2].args[0]).toMatchInlineSnapshot(
      `"$time_index"`
    );
    await expect(state.update.mock.calls[2].result).resolves
      .toMatchInlineSnapshot(`
            Array [
              Object {
                "ch": "test.foo.4",
                "ts": 1647869814791,
              },
              Object {
                "ch": "test.foo.5",
                "ts": 1647869925902,
              },
              Object {
                "ch": "test.foo.bar",
                "ts": 1647870471457,
              },
            ]
          `);

    expect(state.delete.mock).toHaveBeenCalledTimes(3);
    expect(state.delete.mock.calls.map(({ args }) => args[0]))
      .toMatchInlineSnapshot(`
      Array [
        "test.foo.1:1647869481458",
        "test.foo.2:1647869592569",
        "test.foo.3:1647869703680",
      ]
    `);
  });
});
