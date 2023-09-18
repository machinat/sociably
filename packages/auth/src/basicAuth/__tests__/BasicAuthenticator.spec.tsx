import { Readable } from 'stream';
import { IncomingMessage, ServerResponse } from 'http';
import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably, {
  StateController,
  SociablyBot,
  SociablyThread,
} from '@sociably/core';
import HttpOperator from '../../HttpOperator.js';
import { BasicAuthenticator } from '../BasicAuthenticator.js';

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
  verifyToken: () => ({ credential: { foo: 'bar' } }),
  getAuthUrl: (platform, subpath = '') =>
    `https://sociably.io/myApp/auth/${platform}/${subpath}`,
  getRedirectUrl: (subpath = '') =>
    `https://sociably.io/myApp/webview/${subpath}`,
} as never);

const bot = moxy<SociablyBot<SociablyThread, unknown, unknown>>({
  render: async () => null,
} as never);

const thread = {
  $$typeofThread: true as const,
  platform: 'test',
  uid: 'test.foo',
  uniqueIdentifier: { platform: 'test', id: 'foo' },
};

const delegateOptions = moxy({
  bot,
  platform: 'test',
  platformName: 'Test',
  platformColor: '#009',
  platformImageUrl: 'http://sociably.test/platform/img/icon.png',
  checkCurrentAuthUsability: () => ({ ok: true }),
  verifyCredential: async (credential) => ({
    ok: true as const,
    data: { verified: credential },
  }),
  checkAuthData: (data) => ({
    ok: true as const,
    data,
    thread,
    chatLinkUrl: 'https://test.platform.com/foo.bar',
  }),
});

const createReq = (url, header = {}) => {
  const req = moxy(new IncomingMessage({} as never));
  req.mock.getter('url').fakeReturnValue(url);
  req.mock.getter('headers').fakeReturnValue(header);
  return req;
};

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
    authenticator.getAuthUrl('test', { foo: 'bar' }),
  ).toMatchInlineSnapshot(
    `"https://sociably.io/myApp/auth/test/init?login=__SIGNED_LOGIN_TOKEN__"`,
  );
  expect(operator.signToken).toHaveBeenCalledWith('test', {
    credential: { foo: 'bar' },
  });

  expect(
    authenticator.getAuthUrl('test', { hello: 'world' }, '/foo?bar=baz'),
  ).toMatchInlineSnapshot(
    `"https://sociably.io/myApp/auth/test/init?login=__SIGNED_LOGIN_TOKEN__"`,
  );
  expect(operator.signToken).toHaveBeenCalledWith('test', {
    credential: { hello: 'world' },
    redirectUrl: '/foo?bar=baz',
  });
  expect(operator.signToken).toHaveBeenCalledTimes(2);
});

describe('init login flow', () => {
  const routing = {
    originalPath: '/myApp/auth/test/init',
    matchedPath: '/myApp/auth/test/',
    trailingPath: 'init',
  };
  const authenticator = new BasicAuthenticator(stateController, operator);
  const delegateRequest = authenticator.createRequestDelegator(delegateOptions);

  const req = createReq(
    'https://sociably.io/myApp/auth/test/init?login=__SIGNED_LOGIN_TOKEN__',
  );
  const res = moxy<ServerResponse>(new ServerResponse(req));

  test('redirect to login page with state', async () => {
    await delegateRequest(req, res, routing);

    expect(delegateOptions.verifyCredential).toHaveBeenCalledTimes(1);
    expect(delegateOptions.verifyCredential).toHaveBeenCalledWith({
      foo: 'bar',
    });

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkAuthData).toHaveBeenCalledWith({
      verified: { foo: 'bar' },
    });

    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'login',
      ch: 'test.foo',
      data: { verified: { foo: 'bar' } },
    });

    expect(operator.redirect).toHaveBeenCalledTimes(1);

    operator.verifyToken.mock.fakeReturnValue({
      credential: { foo: 'baz' },
      redirectUrl: '/foo/bar/baz',
    });
    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: true,
      thread,
      data: { verified: { foo: 'baz' } },
    });

    await delegateRequest(req, res, routing);

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(2);
    expect(delegateOptions.checkAuthData).toHaveBeenNthCalledWith(2, {
      verified: { foo: 'baz' },
    });

    expect(operator.issueState).toHaveBeenCalledTimes(2);
    expect(operator.issueState).toHaveBeenNthCalledWith(2, res, 'test', {
      status: 'login',
      ch: 'test.foo',
      data: { verified: { foo: 'baz' } },
      redirect: '/foo/bar/baz',
    });

    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.redirect).toHaveBeenCalledWith(
      res,
      'https://sociably.io/myApp/auth/test/login',
    );
    expect(operator.verifyToken).toHaveBeenCalledTimes(2);
    expect(operator.verifyToken).toHaveBeenCalledWith(
      'test',
      '__SIGNED_LOGIN_TOKEN__',
    );
    expect(operator.getAuth).toHaveBeenCalledTimes(2);
    expect(operator.getAuth).toHaveBeenCalledWith(req, 'test', {
      acceptRefreshable: true,
    });
    expect(operator.getState).toHaveBeenCalledTimes(2);
    expect(operator.getState).toHaveBeenCalledWith(req, 'test');

    expect(res.setHeader).toHaveBeenCalledWith('X-Robots-Tag', 'none');

    expect(delegateOptions.checkCurrentAuthUsability).not.toHaveBeenCalled();
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueAuth).not.toHaveBeenCalled();
  });

  test('redirect to webview if alredy logged in', async () => {
    operator.getAuth.mock.fake(async () => ({ foo: 'baz' }));

    await delegateRequest(req, res, routing);

    expect(delegateOptions.checkCurrentAuthUsability).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkCurrentAuthUsability).toHaveBeenCalledWith(
      { foo: 'bar' },
      { foo: 'baz' },
    );

    expect(operator.redirect).toHaveBeenCalledTimes(1);
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });

    operator.verifyToken.mock.fakeReturnValue({
      credential: { foo: 'bae' },
      redirectUrl: '/foo?bar=baz',
    });

    await delegateRequest(req, res, routing);

    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.redirect).toHaveBeenNthCalledWith(2, res, '/foo?bar=baz', {
      assertInternal: true,
    });

    expect(delegateOptions.checkCurrentAuthUsability).toHaveBeenCalledTimes(2);
    expect(delegateOptions.checkCurrentAuthUsability).toHaveBeenCalledWith(
      { foo: 'bae' },
      { foo: 'baz' },
    );

    expect(delegateOptions.verifyCredential).not.toHaveBeenCalled();
    expect(delegateOptions.checkAuthData).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueAuth).not.toHaveBeenCalled();
  });

  test('ignore current auth if options.checkCurrentAuthUsabilty() not ok', async () => {
    operator.getAuth.mock.fake(async () => ({ foo: 'baz' }));
    delegateOptions.checkCurrentAuthUsability.mock.fakeReturnValue({
      ok: false,
    });

    await delegateRequest(req, res, routing);

    expect(delegateOptions.checkCurrentAuthUsability).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkCurrentAuthUsability).toHaveBeenCalledWith(
      { foo: 'bar' },
      { foo: 'baz' },
    );

    expect(delegateOptions.verifyCredential).toHaveBeenCalledTimes(1);
    expect(delegateOptions.verifyCredential).toHaveBeenCalledWith({
      foo: 'bar',
    });

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkAuthData).toHaveBeenCalledWith({
      verified: { foo: 'bar' },
    });

    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'login',
      ch: 'test.foo',
      data: { verified: { foo: 'bar' } },
    });

    expect(operator.redirect).toHaveBeenCalledTimes(1);
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueAuth).not.toHaveBeenCalled();
  });

  test("redirect without issuing state if it's alredy in later phase", async () => {
    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo',
      data: { foo: 'bar' },
      redirect: '/foo/bar',
    }));

    await delegateRequest(req, res, routing);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: 1647868570539,
      hash: 'AaBbCcDd12345',
      redirect: '/foo/bar',
    }));

    await delegateRequest(req, res, routing);

    expect(operator.issueState).not.toHaveBeenCalled();
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueAuth).not.toHaveBeenCalled();

    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.redirect).toHaveBeenCalledWith(
      res,
      'https://sociably.io/myApp/auth/test/login',
    );
    expect(delegateOptions.verifyCredential).toHaveBeenCalledTimes(2);
    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(2);
  });

  test('reset state if thread has changed', async () => {
    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.bar',
      data: { bar: 1 },
    }));

    await delegateRequest(req, res, routing);

    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'login',
      ch: 'test.foo',
      data: { verified: { foo: 'bar' } },
    });

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.baz',
      data: { baz: 2 },
      ts: 1647868570539,
      hash: 'AaBbCcDd12345',
    }));

    await delegateRequest(req, res, routing);

    expect(operator.issueState).toHaveBeenCalledTimes(2);
    expect(operator.issueState).toHaveBeenNthCalledWith(2, res, 'test', {
      status: 'login',
      ch: 'test.foo',
      data: { verified: { foo: 'bar' } },
    });

    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.redirect).toHaveBeenCalledWith(
      res,
      'https://sociably.io/myApp/auth/test/login',
    );

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(2);
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueAuth).not.toHaveBeenCalled();
  });

  test('redirect directly in loose mode', async () => {
    const looseAuthenticator = new BasicAuthenticator(
      stateController,
      operator,
      { mode: 'loose' },
    );

    await looseAuthenticator.createRequestDelegator(delegateOptions)(
      req,
      res,
      routing,
    );

    expect(delegateOptions.verifyCredential).toHaveBeenCalledWith({
      foo: 'bar',
    });
    expect(delegateOptions.checkAuthData).toHaveBeenCalledWith({
      verified: { foo: 'bar' },
    });
    expect(operator.issueAuth).toHaveBeenCalledWith(res, 'test', {
      verified: { foo: 'bar' },
    });
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });

    operator.verifyToken.mock.fake(() => ({
      redirectUrl: '/foo?bar=baz',
      credential: { hello: 'world' },
    }));
    await looseAuthenticator.createRequestDelegator(delegateOptions)(
      req,
      res,
      routing,
    );
    expect(delegateOptions.verifyCredential).toHaveBeenCalledWith({
      hello: 'world',
    });
    expect(delegateOptions.checkAuthData).toHaveBeenCalledWith({
      verified: { hello: 'world' },
    });
    expect(operator.issueAuth).toHaveBeenCalledWith(res, 'test', {
      verified: { hello: 'world' },
    });
    expect(operator.redirect).toHaveBeenNthCalledWith(2, res, '/foo?bar=baz', {
      assertInternal: true,
    });

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(2);
    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.issueAuth).toHaveBeenCalledTimes(2);
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
  });

  it('redirect with error if verifyCredential fail', async () => {
    delegateOptions.verifyCredential.mock.fakeReturnValue({
      ok: false,
      code: 444,
      reason: 'For four fools',
    });
    await authenticator.createRequestDelegator(delegateOptions)(
      req,
      res,
      routing,
    );

    expect(delegateOptions.verifyCredential).toHaveBeenCalledWith({
      foo: 'bar',
    });
    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      444,
      'For four fools',
    );
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });

    operator.verifyToken.mock.fake(() => ({
      redirectUrl: '/foo?bar=baz',
      credential: { hello: 'world' },
    }));
    await authenticator.createRequestDelegator(delegateOptions)(
      req,
      res,
      routing,
    );
    expect(delegateOptions.verifyCredential).toHaveBeenNthCalledWith(2, {
      hello: 'world',
    });
    expect(operator.redirect).toHaveBeenNthCalledWith(2, res, '/foo?bar=baz', {
      assertInternal: true,
    });

    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.issueError).toHaveBeenCalledTimes(2);
    expect(delegateOptions.checkAuthData).not.toHaveBeenCalled();
    expect(operator.issueAuth).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
  });

  it('redirect with error if checkAuthData fail', async () => {
    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: false,
      code: 418,
      reason: "I'm a Teapot",
    });
    await authenticator.createRequestDelegator(delegateOptions)(
      req,
      res,
      routing,
    );

    expect(delegateOptions.checkAuthData).toHaveBeenCalledWith({
      verified: { foo: 'bar' },
    });
    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      418,
      "I'm a Teapot",
    );
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });

    operator.verifyToken.mock.fake(() => ({
      redirectUrl: '/foo?bar=baz',
      data: { hello: 'world' },
    }));
    await authenticator.createRequestDelegator(delegateOptions)(
      req,
      res,
      routing,
    );
    expect(operator.redirect).toHaveBeenNthCalledWith(2, res, '/foo?bar=baz', {
      assertInternal: true,
    });

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(2);
    expect(operator.redirect).toHaveBeenCalledTimes(2);
    expect(operator.issueError).toHaveBeenCalledTimes(2);
    expect(operator.issueAuth).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
  });

  it('respond 400 if no login query param', async () => {
    const invalidReq = createReq('https://sociably.io/myApp/auth/test/');
    await delegateRequest(invalidReq, res, routing);

    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      400,
      expect.any(String),
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"invalid login param"`,
    );
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });
  });

  it('respond 400 if login query is invalid', async () => {
    const invalidReq = createReq(
      'https://sociably.io/myApp/auth/test/?login=__INVALID_LOGIN_TOKEN__',
    );

    operator.verifyToken.mock.fakeReturnValue(null);
    await delegateRequest(invalidReq, res, routing);

    expect(operator.verifyToken).toHaveBeenCalledTimes(1);
    expect(operator.verifyToken).toHaveBeenCalledWith(
      'test',
      '__INVALID_LOGIN_TOKEN__',
    );

    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      400,
      expect.any(String),
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"invalid login param"`,
    );
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });
  });

  it('respond error from checkAuthData', async () => {
    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: false,
      code: 418,
      reason: "I'm a Teapot",
    });

    await delegateRequest(req, res, routing);

    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      418,
      "I'm a Teapot",
    );
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });
  });
});

describe('login page', () => {
  const routing = {
    originalPath: '/myApp/auth/test/',
    matchedPath: '/myApp/auth/test/',
    trailingPath: 'login',
  };
  const req = createReq('https://sociably.io/myApp/auth/test/login', {
    'user-agent':
      'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405',
    'x-client-ip': '222.222.222.222',
  });

  test('render login page with state', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo',
      data: { foo: 'bar' },
    }));

    await delegateRequest(req, res, routing);

    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledWith(thread, expect.any(Object));

    expect(bot.render.mock.calls[0].args[1]).toMatchInlineSnapshot(
      { props: { code: expect.stringMatching(/^[0-9]{6}$/) } },
      `
      <DefaultCodeMessage
        browserName="Safari"
        code={StringMatching /\\^\\[0-9\\]\\{6\\}\\$/}
        deviceModel="iPad"
        deviceType="tablet"
        domain="sociably.io"
        ip="222.222.222.222"
        osName="iOS"
      />
    `,
    );

    const msgElement = bot.render.mock.calls[0].args[1];
    expect(msgElement.type({ ...msgElement.props, code: 123456 }))
      .toMatchInlineSnapshot(`
      <p>
        Your login code is: 
        123456
      </p>
    `);

    expect(delegateOptions.checkAuthData).toHaveBeenCalledTimes(1);
    expect(delegateOptions.checkAuthData).toHaveBeenCalledWith({
      foo: 'bar',
    });

    expect(operator.signToken).toHaveBeenCalledTimes(1);
    expect(operator.signToken).toHaveBeenCalledWith(
      'test',
      expect.stringMatching(/^test.foo:1647870481457:[0-9]{6}$/),
      { noTimestamp: true },
    );

    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'text/html',
    });
    expect(res.end.mock.calls[0].args[0]).toMatchSnapshot();

    expect(operator.getState).toHaveBeenCalledTimes(1);
    expect(operator.getState).toHaveBeenCalledWith(req, 'test');
    expect(operator.issueAuth).not.toHaveBeenCalled();
    expect(operator.issueError).not.toHaveBeenCalled();

    expect(state.update).not.toHaveBeenCalled();
  });

  test('with customized options', async () => {
    const CodeMessage = ({ code }) => <p>Yo! Check your login code {code}</p>;
    const authenticator = new BasicAuthenticator(stateController, operator, {
      appName: 'My Test App',
      appIconUrl: 'https://sociably.io/myApp/img/icon.png',
      loginCodeDigits: 20,
      codeMessageComponent: CodeMessage,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo',
      data: { foo: 'bar' },
    }));

    await delegateRequest(req, res, routing);

    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledWith(thread, expect.any(Object));

    expect(bot.render.mock.calls[0].args[1]).toMatchInlineSnapshot(
      { props: { code: expect.stringMatching(/^[0-9]{20}$/) } },
      `
      <CodeMessage
        browserName="Safari"
        code={StringMatching /\\^\\[0-9\\]\\{20\\}\\$/}
        deviceModel="iPad"
        deviceType="tablet"
        domain="sociably.io"
        ip="222.222.222.222"
        osName="iOS"
      />
    `,
    );

    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.writeHead).toHaveBeenCalledWith(200, {
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
      ch: 'test.foo',
      data: { foo: 'bar' },
      hash: 'AaBbCcDd12345',
      ts: now - 10000,
    }));

    await delegateRequest(req, res, routing);

    expect(operator.signToken).not.toHaveBeenCalled();
    expect(bot.render).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();

    expect(res.end).toHaveBeenCalledTimes(1);
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
      ch: 'test.foo',
      data: { foo: 'bar' },
      hash: 'AaBbCcDd12345',
      ts: now - 100000,
    }));

    await delegateRequest(req, res, routing);

    expect(operator.signToken).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.end).toHaveBeenCalledTimes(1);
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
      ch: 'test.foo',
      data: { foo: 'bar' },
      hash: 'AaBbCcDd12345',
      ts: now - 100000,
    }));

    await delegateRequest(req, res, routing);

    expect(operator.signToken).toHaveBeenCalledTimes(1);
    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledTimes(1);
    expect(operator.issueState).toHaveBeenCalledWith(res, 'test', {
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now,
      hash: '__TOKEN_SIGNATURE__',
    });

    expect(res.end).toHaveBeenCalledTimes(1);

    expect(state.update).toHaveBeenCalledTimes(1);
    expect(state.update.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"test.foo:1647870381457"`,
    );
    await expect(state.update.mock.calls[0].result).resolves.toBe(10);
    expect(
      stateController.globalState.mock.calls[0].args[0],
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

    expect(operator.signToken).not.toHaveBeenCalled();
    expect(bot.render).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();

    expect(operator.issueError).toHaveBeenCalledTimes(1);
    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      401,
      expect.any(String),
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"login session expired"`,
    );

    expect(operator.redirect).toHaveBeenCalledTimes(1);
    expect(operator.redirect).toHaveBeenCalledWith(res, undefined, {
      assertInternal: true,
    });
  });

  it('redirect with error if checkAuthData fail', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo',
      data: { foo: 'bar' },
      redirect: '/foo/bar',
    }));
    delegateOptions.checkAuthData.mock.fakeReturnValue({
      ok: false,
      code: 418,
      reason: "I'm a Teapot",
    });

    await delegateRequest(req, res, routing);

    expect(operator.signToken).not.toHaveBeenCalled();
    expect(bot.render).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();

    expect(operator.issueError).toHaveBeenCalledTimes(1);
    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      418,
      "I'm a Teapot",
    );

    expect(operator.redirect).toHaveBeenCalledTimes(1);
    expect(operator.redirect).toHaveBeenCalledWith(res, '/foo/bar', {
      assertInternal: true,
    });
  });

  it('redirect with error if fail to send code message', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);
    const res = moxy<ServerResponse>(new ServerResponse(req));

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo',
      data: { foo: 'bar' },
      redirect: '/foo/bar',
    }));
    bot.render.mock.fake(async () => {
      throw new Error('YOU SHALL NOT PASS');
    });

    await delegateRequest(req, res, routing);

    expect(bot.render).toHaveBeenCalledTimes(1);
    expect(operator.signToken).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
    expect(res.end).not.toHaveBeenCalled();

    expect(operator.issueError).toHaveBeenCalledTimes(1);
    expect(operator.issueError).toHaveBeenCalledWith(
      res,
      'test',
      510,
      expect.any(String),
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"fail to send login code"`,
    );

    expect(operator.redirect).toHaveBeenCalledTimes(1);
    expect(operator.redirect).toHaveBeenCalledWith(res, '/foo/bar', {
      assertInternal: true,
    });
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
      }),
    );
    req.mock
      .getter('url')
      .fake(() => 'https://sociably.io/myApp/auth/test/login');
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
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    await delegateRequest(req, res, routing);

    expect(res.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      {
        "ok": true,
        "redirectTo": "https://sociably.io/myApp/webview/foo/bar",
        "retryChances": 0,
      }
    `);

    expect(operator.issueAuth).toHaveBeenCalledTimes(1);
    expect(operator.issueAuth).toHaveBeenCalledWith(res, 'test', {
      foo: 'bar',
    });

    expect(operator.signToken).toHaveBeenCalledTimes(1);
    expect(operator.signToken).toHaveBeenCalledWith(
      'test',
      expect.any(String),
      { noTimestamp: true },
    );
    expect(operator.signToken.mock.calls[0].args[1]).toMatchInlineSnapshot(
      `"test.foo:1647870471457:123456"`,
    );

    expect(state.update).toHaveBeenCalledTimes(1);
    expect(state.update.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"test.foo:1647870471457"`,
    );
    await expect(state.update.mock.calls[0].result).resolves.toBe(undefined);
    expect(
      stateController.globalState.mock.calls[0].args[0],
    ).toMatchInlineSnapshot(`"basic_auth_verify_records"`);

    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
  });

  test('verify wrong login code', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo',
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

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'application/json',
      });
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(JSON.parse(res.end.mock.calls[0].args[0])).toEqual({
        ok: false,
        redirectTo: 'https://sociably.io/myApp/webview/foo/bar',
        retryChances: Math.max(5 - i, 0),
      });

      if (i < 5) {
        expect(operator.issueError).not.toHaveBeenCalled();
      } else {
        expect(operator.issueError).toHaveBeenCalledTimes(i - 5 + 1);
        expect(operator.issueError).toHaveBeenCalledWith(
          res,
          'test',
          401,
          expect.any(String),
        );
        expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
          `"invalid login verify code"`,
        );
      }
    }

    expect(operator.signToken).toHaveBeenCalledTimes(6);
    expect(operator.signToken).toHaveBeenCalledWith(
      'test',
      expect.any(String),
      { noTimestamp: true },
    );
    expect(operator.signToken.mock.calls.map(({ args }) => args[1]))
      .toMatchInlineSnapshot(`
      [
        "test.foo:1647870471457:111111",
        "test.foo:1647870471457:222222",
        "test.foo:1647870471457:333333",
        "test.foo:1647870471457:444444",
        "test.foo:1647870471457:555555",
        "test.foo:1647870471457:666666",
      ]
    `);

    expect(state.update).toHaveBeenCalledTimes(7);
    expect(state.update.mock.calls.map(({ args }) => args[0]))
      .toMatchInlineSnapshot(`
      [
        "test.foo:1647870471457",
        "$time_index",
        "test.foo:1647870471457",
        "test.foo:1647870471457",
        "test.foo:1647870471457",
        "test.foo:1647870471457",
        "test.foo:1647870471457",
      ]
    `);
    await expect(
      Promise.all(state.update.mock.calls.map(({ result }) => result)),
    ).resolves.toMatchInlineSnapshot(`
      [
        1,
        [
          {
            "ch": "test.foo",
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
      stateController.globalState.mock.calls[0].args[0],
    ).toMatchInlineSnapshot(`"basic_auth_verify_records"`);
  });

  test('verify with invalid body', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: '/foo/bar',
    }));

    const req1 = prepareReq("I'm Jason");
    const res1 = moxy<ServerResponse>(new ServerResponse(req1));
    await delegateRequest(req1, res1, routing);

    expect(res1.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'application/json',
    });
    expect(res1.end).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res1.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      {
        "error": {
          "code": 400,
          "reason": "invalid request",
        },
        "platform": "test",
      }
    `);

    const req2 = prepareReq({ noCode: true });
    const res2 = moxy<ServerResponse>(new ServerResponse(req2));
    await delegateRequest(req2, res2, routing);

    expect(res2.writeHead).toHaveBeenCalledWith(400, {
      'Content-Type': 'application/json',
    });
    expect(res2.end).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res2.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      {
        "error": {
          "code": 400,
          "reason": "invalid request",
        },
        "platform": "test",
      }
    `);

    expect(operator.issueAuth).not.toHaveBeenCalled();
    expect(operator.signToken).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    expect(operator.issueError).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
  });

  test('verify with invalid state', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator);
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    const req1 = prepareReq({ code: 123456 });
    const res1 = moxy<ServerResponse>(new ServerResponse(req1));
    await delegateRequest(req1, res1, routing);

    expect(res1.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res1.end).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res1.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      {
        "ok": false,
        "redirectTo": "https://sociably.io/myApp/webview/",
        "retryChances": 0,
      }
    `);

    expect(operator.issueError).toHaveBeenCalledTimes(1);
    expect(operator.issueError).toHaveBeenCalledWith(
      res1,
      'test',
      401,
      expect.any(String),
    );
    expect(operator.issueError.mock.calls[0].args[3]).toMatchInlineSnapshot(
      `"login session expired"`,
    );

    operator.getState.mock.fake(async () => ({
      status: 'login',
      ch: 'test.foo',
      data: { foo: 'bar' },
      redirect: 'foo/bar',
    }));

    const req2 = prepareReq({ code: 123456 });
    const res2 = moxy<ServerResponse>(new ServerResponse(req2));
    await delegateRequest(req2, res2, routing);

    expect(res2.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res2.end).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res2.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      {
        "ok": false,
        "redirectTo": "https://sociably.io/myApp/webview/foo/bar",
        "retryChances": 0,
      }
    `);
    expect(operator.issueError).toHaveBeenCalledTimes(2);
    expect(operator.issueError.mock.calls[1].args[3]).toMatchInlineSnapshot(
      `"login session expired"`,
    );

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now - 36000000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    const req3 = prepareReq({ code: 123456 });
    const res3 = moxy<ServerResponse>(new ServerResponse(req3));
    await delegateRequest(req3, res3, routing);

    expect(res3.writeHead).toHaveBeenCalledWith(200, {
      'Content-Type': 'application/json',
    });
    expect(res3.end).toHaveBeenCalledTimes(1);
    expect(JSON.parse(res3.end.mock.calls[0].args[0])).toMatchInlineSnapshot(`
      {
        "ok": false,
        "redirectTo": "https://sociably.io/myApp/webview/foo/bar",
        "retryChances": 0,
      }
    `);
    expect(operator.issueError).toHaveBeenCalledTimes(3);
    expect(operator.issueError.mock.calls[2].args[3]).toMatchInlineSnapshot(
      `"login session expired"`,
    );

    expect(operator.issueAuth).not.toHaveBeenCalled();
    expect(operator.signToken).not.toHaveBeenCalled();
    expect(state.update).not.toHaveBeenCalled();
    expect(operator.issueState).not.toHaveBeenCalled();
  });

  test('menaging the records', async () => {
    const authenticator = new BasicAuthenticator(stateController, operator, {
      loginDuration: 777,
    });
    const delegateRequest =
      authenticator.createRequestDelegator(delegateOptions);

    state.update.mock.fake(async (key, updator) =>
      updator(
        /^\$/.test(key)
          ? [
              { ts: now - 999999, ch: 'test.foo.1' },
              { ts: now - 888888, ch: 'test.foo.2' },
              { ts: now - 777777, ch: 'test.foo.3' },
              { ts: now - 666666, ch: 'test.foo.4' },
              { ts: now - 555555, ch: 'test.foo.5' },
            ]
          : undefined,
      ),
    );

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__TOKEN_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    const req1 = prepareReq({ code: 123456 });
    const res1 = moxy<ServerResponse>(new ServerResponse(req1));
    await delegateRequest(req1, res1, routing);

    expect(state.update).toHaveBeenCalledTimes(1);
    expect(state.update.mock.calls[0].args[0]).toMatchInlineSnapshot(
      `"test.foo:1647870471457"`,
    );
    await expect(state.update.mock.calls[0].result).resolves.toBe(undefined);
    expect(state.delete).not.toHaveBeenCalled();

    operator.getState.mock.fake(async () => ({
      status: 'verify',
      ch: 'test.foo',
      data: { foo: 'bar' },
      ts: now - 10000,
      hash: '__WRONG_SIGNATURE__',
      redirect: 'foo/bar',
    }));

    const req2 = prepareReq({ code: 123456 });
    const res2 = moxy<ServerResponse>(new ServerResponse(req2));
    await delegateRequest(req2, res2, routing);

    expect(state.update).toHaveBeenCalledTimes(3);
    expect(state.update.mock.calls[1].args[0]).toMatchInlineSnapshot(
      `"test.foo:1647870471457"`,
    );
    await expect(state.update.mock.calls[1].result).resolves.toBe(1);

    expect(state.update.mock.calls[2].args[0]).toMatchInlineSnapshot(
      `"$time_index"`,
    );
    await expect(state.update.mock.calls[2].result).resolves
      .toMatchInlineSnapshot(`
      [
        {
          "ch": "test.foo.4",
          "ts": 1647869814791,
        },
        {
          "ch": "test.foo.5",
          "ts": 1647869925902,
        },
        {
          "ch": "test.foo",
          "ts": 1647870471457,
        },
      ]
    `);

    expect(state.delete).toHaveBeenCalledTimes(3);
    expect(state.delete.mock.calls.map(({ args }) => args[0]))
      .toMatchInlineSnapshot(`
      [
        "test.foo.1:1647869481458",
        "test.foo.2:1647869592569",
        "test.foo.3:1647869703680",
      ]
    `);
  });
});
