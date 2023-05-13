import moxy from '@moxyjs/moxy';
import BasicAuthenticator, {
  AuthDelegatorOptions,
} from '@sociably/auth/basicAuth';
import WhatsAppUser from '../../User';
import WhatsAppChat from '../../Chat';
import WhatsAppBot from '../../Bot';
import ServerAuthenticator from '../ServerAuthenticator';
import WhatsAppAgent from '../../Agent';
import { WhatsAppAuthCrendential, WhatsAppAuthData } from '../types';

const bot = moxy<WhatsAppBot>({ platform: 'whatsapp', a: 'bot' } as never);

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

const agentSettings = {
  accountId: '1111111111',
  numberId: '2222222222',
  phoneNumber: '+1234567890',
};
const agentSettingsAccessor = moxy({
  getAgentSettings: async () => agentSettings,
  getAgentSettingsBatch: async () => [agentSettings],
});

beforeEach(() => {
  requestDelegator.mock.reset();
  basicAuthenticator.mock.reset();
  agentSettingsAccessor.mock.reset();
});

describe('.delegateAuthRequest(req, res, routing)', () => {
  it('proxy to basic delegator handler', async () => {
    const authenticator = new ServerAuthenticator(
      bot,
      basicAuthenticator,
      agentSettingsAccessor
    );
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

    expect(requestDelegator).toHaveReturnedTimes(1);
    expect(requestDelegator).toHaveBeenCalledWith(req, res, routing);

    expect(basicAuthenticator.createRequestDelegator).toHaveReturnedTimes(1);
  });

  test('delegation options', async () => {
    // eslint-disable-next-line no-new
    new ServerAuthenticator(bot, basicAuthenticator, agentSettingsAccessor);

    const delegatorOptions: AuthDelegatorOptions<
      WhatsAppAuthCrendential,
      WhatsAppAuthData,
      WhatsAppChat
    > = basicAuthenticator.createRequestDelegator.mock.calls[0].args[0];
    expect(delegatorOptions).toMatchInlineSnapshot(`
          Object {
            "bot": Object {
              "a": "bot",
              "platform": "whatsapp",
            },
            "checkAuthData": [Function],
            "getChatLink": [Function],
            "platform": "whatsapp",
            "platformColor": "#31BA45",
            "platformImageUrl": "https://sociably.js.org/img/icon/whatsapp.png",
            "platformName": "WhatsApp",
            "verifyCredential": [Function],
          }
      `);

    const authData = {
      account: '2222222222',
      agent: { id: '1111111111', num: '+1234567890' },
      user: '9876543210',
    };
    expect(
      delegatorOptions.getChatLink(
        new WhatsAppChat('1111111111', '9876543210'),
        authData
      )
    ).toBe('https://wa.me/1234567890');

    expect(delegatorOptions.checkAuthData(authData)).toEqual({
      ok: true,
      thread: new WhatsAppChat('1111111111', '9876543210'),
      data: authData,
    });
  });

  test('options.verifyCrecential', async () => {
    // eslint-disable-next-line no-new
    new ServerAuthenticator(bot, basicAuthenticator, agentSettingsAccessor);

    const {
      verifyCredential,
    }: AuthDelegatorOptions<
      WhatsAppAuthCrendential,
      WhatsAppAuthData,
      WhatsAppChat
    > = basicAuthenticator.createRequestDelegator.mock.calls[0].args[0];

    await expect(
      verifyCredential({ agent: '2222222222', user: '9876543210' })
    ).resolves.toEqual({
      ok: true,
      data: {
        account: '1111111111',
        agent: { id: '2222222222', num: '+1234567890' },
        user: '9876543210',
      },
    });

    agentSettingsAccessor.getAgentSettings.mock.fakeResolvedValue(null);

    await expect(verifyCredential({ agent: '3333333333', user: '9876543210' }))
      .resolves.toMatchInlineSnapshot(`
            Object {
              "code": 404,
              "ok": false,
              "reason": "agent number \\"3333333333\\" not registered",
            }
          `);
  });
});

test('.getAuthUrlPostfix(id, path)', () => {
  const authenticator = new ServerAuthenticator(
    bot,
    basicAuthenticator,
    agentSettingsAccessor
  );
  const expectedSuffix = '/foo/auth/whatsapp?login=__LOGIN_TOKEN__';
  expect(
    authenticator.getAuthUrlPostfix(
      new WhatsAppChat('1111111111', '9876543210')
    )
  ).toBe(expectedSuffix);
  expect(
    authenticator.getAuthUrlPostfix(
      new WhatsAppChat('1111111111', '9876543210'),
      '/foo?bar=baz'
    )
  ).toBe(expectedSuffix);

  expect(basicAuthenticator.getAuthUrl).toHaveBeenCalledTimes(2);
  expect(basicAuthenticator.getAuthUrl).toHaveBeenNthCalledWith(
    1,
    'whatsapp',
    { agent: '1111111111', user: '9876543210' },
    undefined
  );
  expect(basicAuthenticator.getAuthUrl).toHaveBeenNthCalledWith(
    2,
    'whatsapp',
    { agent: '1111111111', user: '9876543210' },
    '/foo?bar=baz'
  );
});

test('.verifyCredential() fails anyway', async () => {
  const authenticator = new ServerAuthenticator(
    bot,
    basicAuthenticator,
    agentSettingsAccessor
  );
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
  const authenticator = new ServerAuthenticator(
    bot,
    basicAuthenticator,
    agentSettingsAccessor
  );
  await expect(
    authenticator.verifyRefreshment({
      account: '1111111111',
      agent: { id: '2222222222', num: '+1234567890' },
      user: '9876543210',
    })
  ).resolves.toEqual({
    ok: true,
    data: {
      account: '1111111111',
      agent: { id: '2222222222', num: '+1234567890' },
      user: '9876543210',
    },
  });

  agentSettingsAccessor.getAgentSettings.mock.fakeResolvedValue(null);
  await expect(
    authenticator.verifyRefreshment({
      account: '1111111111',
      agent: { id: '2222222222', num: '+1234567890' },
      user: '9876543210',
    })
  ).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 404,
            "ok": false,
            "reason": "agent number \\"2222222222\\" not registered",
          }
        `);
});

test('.checkAuthData(data)', () => {
  const authenticator = new ServerAuthenticator(
    bot,
    basicAuthenticator,
    agentSettingsAccessor
  );
  expect(
    authenticator.checkAuthData({
      account: '2222222222',
      agent: { id: '1111111111', num: '+1234567890' },
      user: '9876543210',
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      businessAccountId: '2222222222',
      agentNumber: '+1234567890',
      channel: new WhatsAppAgent('1111111111'),
      thread: new WhatsAppChat('1111111111', '9876543210'),
      user: new WhatsAppUser('9876543210'),
    },
  });
});
