import moxy from '@moxyjs/moxy';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import FacebookUser from '../../User';
import FacebookChat from '../../Chat';
import FacebookBot from '../../Bot';
import ServerAuthenticator from '../ServerAuthenticator';

const bot = moxy<FacebookBot>({
  pageId: '12345',
} as never);

const requestDelegator = moxy(async () => {});
const loginUrl = `https://sociably.io/foo/auth/facebook?login=__LOGIN_TOKEN__`;

const basicAuthenticator = moxy<BasicAuthenticator>({
  getAuthUrl() {
    return loginUrl;
  },
  createRequestDelegator() {
    return requestDelegator;
  },
} as never);

beforeEach(() => {
  requestDelegator.mock.reset();
  basicAuthenticator.mock.reset();
});

test('.delegateAuthRequest(req, res, routing)', async () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  const req = moxy();
  const res = moxy();
  const routing = {
    originalPath: '/auth/facebook/login',
    matchedPath: '/auth/facebook',
    trailingPath: 'login',
  };

  await expect(
    authenticator.delegateAuthRequest(req, res, routing)
  ).resolves.toBe(undefined);

  expect(requestDelegator.mock).toHaveReturnedTimes(1);
  expect(requestDelegator.mock).toHaveBeenCalledWith(req, res, routing);

  expect(basicAuthenticator.createRequestDelegator.mock).toHaveReturnedTimes(1);

  const delegatorOptions =
    basicAuthenticator.createRequestDelegator.mock.calls[0].args[0];
  expect(delegatorOptions).toMatchInlineSnapshot(`
    Object {
      "bot": Object {
        "pageId": "12345",
      },
      "checkAuthData": [Function],
      "getChatLink": [Function],
      "platform": "facebook",
      "platformColor": "#4B69FF",
      "platformImageUrl": "https://sociably.js.org/img/icon/messenger.png",
      "platformName": "Facebook",
    }
  `);

  expect(
    delegatorOptions.getChatLink(new FacebookChat('12345', { id: '67890' }))
  ).toBe('https://m.me/12345');

  expect(
    delegatorOptions.checkAuthData({ page: '12345', id: '67890' })
  ).toEqual({
    ok: true,
    channel: new FacebookChat('12345', { id: '67890' }),
    data: { page: '12345', id: '67890' },
  });
  expect(delegatorOptions.checkAuthData({ agent: '54321', id: '67890' }))
    .toMatchInlineSnapshot(`
    Object {
      "code": 400,
      "ok": false,
      "reason": "page not match",
    }
  `);
});

test('.getAuthUrl(id, path)', () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  expect(authenticator.getAuthUrl('67890')).toBe(loginUrl);
  expect(authenticator.getAuthUrl('67890', '/foo?bar=baz')).toBe(loginUrl);

  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenCalledTimes(2);
  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenNthCalledWith(
    1,
    'facebook',
    { page: '12345', id: '67890' },
    undefined
  );
  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenNthCalledWith(
    2,
    'facebook',
    { page: '12345', id: '67890' },
    '/foo?bar=baz'
  );
});

test('.verifyCredential() fails anyway', async () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  await expect(authenticator.verifyCredential()).resolves
    .toMatchInlineSnapshot(`
          Object {
            "code": 403,
            "ok": false,
            "reason": "should use backend based flow only",
          }
        `);
});

test('.verifyRefreshment(data)', async () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  await expect(
    authenticator.verifyRefreshment({ page: '12345', id: '67890' })
  ).resolves.toEqual({
    ok: true,
    data: { page: '12345', id: '67890' },
  });

  await expect(authenticator.verifyRefreshment({ page: '54321', id: '67890' }))
    .resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "page not match",
          }
        `);
});

test('.checkAuthData(data)', () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  expect(authenticator.checkAuthData({ page: '12345', id: '67890' })).toEqual({
    ok: true,
    contextDetails: {
      pageId: '12345',
      channel: new FacebookChat('12345', { id: '67890' }),
      user: new FacebookUser('12345', '67890'),
    },
  });

  expect(authenticator.checkAuthData({ page: '54321', id: '67890' }))
    .toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "page not match",
          }
        `);
});
