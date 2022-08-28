import moxy from '@moxyjs/moxy';
import BasicAuthenticator from '@sociably/auth/basicAuth';
import WhatsAppUser from '../../User';
import WhatsAppChat from '../../Chat';
import WhatsAppBot from '../../Bot';
import ServerAuthenticator from '../ServerAuthenticator';

const bot = moxy<WhatsAppBot>({
  businessNumber: '1234567890',
} as never);

const requestDelegator = moxy(async () => {});
const loginUrl = `https://sociably.io/foo/auth/whatsapp?login=__LOGIN_TOKEN__`;

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
    originalPath: '/auth/whatsapp/login',
    matchedPath: '/auth/whatsapp',
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
        "businessNumber": "1234567890",
      },
      "checkAuthData": [Function],
      "getChatLink": [Function],
      "platform": "whatsapp",
      "platformColor": "#31BA45",
      "platformImageUrl": "https://sociably.js.org/img/icon/whatsapp.png",
      "platformName": "WhatsApp",
    }
  `);

  expect(delegatorOptions.getChatLink(new WhatsAppChat('12345', '67890'))).toBe(
    'https://wa.me/1234567890'
  );

  expect(
    delegatorOptions.checkAuthData({
      business: '1234567890',
      customer: '9876543210',
    })
  ).toEqual({
    ok: true,
    channel: new WhatsAppChat('1234567890', '9876543210'),
    data: { business: '1234567890', customer: '9876543210' },
  });
  expect(delegatorOptions.checkAuthData({ agent: '54321', id: '67890' }))
    .toMatchInlineSnapshot(`
    Object {
      "code": 400,
      "ok": false,
      "reason": "business number not match",
    }
  `);
});

test('.getAuthUrlSuffix(id, path)', () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  const expectedSuffix = '/foo/auth/whatsapp?login=__LOGIN_TOKEN__';
  expect(authenticator.getAuthUrlSuffix('9876543210')).toBe(expectedSuffix);
  expect(authenticator.getAuthUrlSuffix('9876543210', '/foo?bar=baz')).toBe(
    expectedSuffix
  );

  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenCalledTimes(2);
  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenNthCalledWith(
    1,
    'whatsapp',
    { business: '1234567890', customer: '9876543210' },
    undefined
  );
  expect(basicAuthenticator.getAuthUrl.mock).toHaveBeenNthCalledWith(
    2,
    'whatsapp',
    { business: '1234567890', customer: '9876543210' },
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
    authenticator.verifyRefreshment({
      business: '1234567890',
      customer: '9876543210',
    })
  ).resolves.toEqual({
    ok: true,
    data: { business: '1234567890', customer: '9876543210' },
  });

  await expect(
    authenticator.verifyRefreshment({
      business: '1111111111',
      customer: '9876543210',
    })
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "business number not match",
          }
        `);
});

test('.checkAuthData(data)', () => {
  const authenticator = new ServerAuthenticator(bot, basicAuthenticator);
  expect(
    authenticator.checkAuthData({
      business: '1234567890',
      customer: '9876543210',
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      businessNumber: '1234567890',
      channel: new WhatsAppChat('1234567890', '9876543210'),
      user: new WhatsAppUser('9876543210'),
    },
  });

  expect(
    authenticator.checkAuthData({
      business: '1111111111',
      customer: '9876543210',
    })
  ).toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "business number not match",
          }
        `);
});
