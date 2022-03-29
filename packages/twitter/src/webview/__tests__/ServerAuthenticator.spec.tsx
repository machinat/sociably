import moxy from '@moxyjs/moxy';
import BasicAuthenticator from '@machinat/auth/basicAuth';
import TwitterUser from '../../User';
import TwitterChat from '../../Chat';
import TwitterBot from '../../Bot';
import ServerAuthenticator from '../ServerAuthenticator';

const bot = moxy<TwitterBot>({
  agentId: '12345',
} as never);

const requestDelegator = moxy(async () => {});
const loginUrl = `https://machinat.io/MyApp/auth/twitter?login=__LOGIN_TOKEN__`;

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
    originalPath: '/auth/twitter/login',
    matchedPath: '/auth/twitter',
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
        "agentId": "12345",
      },
      "checkAuthData": [Function],
      "getChatLink": [Function],
      "platform": "twitter",
      "platformColor": "#1D9BF0",
      "platformImageUrl": "https://machinat.com/img/icon/twitter.png",
      "platformName": "Twitter",
    }
  `);

  expect(
    delegatorOptions.getChatLink(new TwitterChat('12345', '67890'))
  ).toMatchInlineSnapshot(
    `"https://twitter.com/messages/compose?recipient_id=12345"`
  );

  expect(
    delegatorOptions.checkAuthData({ agent: '12345', id: '67890' })
  ).toEqual({
    ok: true,
    channel: new TwitterChat('12345', '67890'),
    data: { agent: '12345', id: '67890' },
  });
  expect(delegatorOptions.checkAuthData({ agent: '54321', id: '67890' }))
    .toMatchInlineSnapshot(`
    Object {
      "code": 400,
      "ok": false,
      "reason": "agent not match",
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
    'twitter',
    { agent: '12345', id: '67890' },
    undefined
  );
  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenNthCalledWith(
    2,
    'twitter',
    { agent: '12345', id: '67890' },
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
    authenticator.verifyRefreshment({ agent: '12345', id: '67890' })
  ).resolves.toEqual({ ok: true, data: { agent: '12345', id: '67890' } });

  await expect(authenticator.verifyRefreshment({ agent: '54321', id: '67890' }))
    .resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "agent not match",
          }
        `);
});

test('.checkAuthData(data)', () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  expect(authenticator.checkAuthData({ agent: '12345', id: '67890' })).toEqual({
    ok: true,
    contextDetails: {
      agentId: '12345',
      channel: new TwitterChat('12345', '67890'),
      user: new TwitterUser('67890'),
    },
  });

  expect(authenticator.checkAuthData({ agent: '54321', id: '67890' }))
    .toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "agent not match",
          }
        `);
});
