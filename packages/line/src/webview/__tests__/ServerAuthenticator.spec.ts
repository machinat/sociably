import { IncomingMessage, ServerResponse } from 'http';
import { AuthHttpOperator } from '@sociably/auth';
import moxy from '@moxyjs/moxy';
import type { LineBot } from '../../Bot';
import LineChat from '../../Chat';
import LineUser from '../../User';
import LineApiError from '../../error';
import ServerAuthenticator from '../ServerAuthenticator';
import { LiffOs, LiffReferer } from '../../constant';

const request = {
  url: '/my_app/auth/line',
  type: 'GET',
  headers: {},
} as unknown as IncomingMessage;

const bot = moxy<LineBot>({
  providerId: '_PROVIDER_ID_',
  channelId: '_CHANNEL_ID_',
  async makeApiCall() {
    return {};
  },
} as never);

const httpOperator = moxy<AuthHttpOperator>({
  getRedirectUrl: (path) =>
    `https://sociably.io/my_app/webview${path ? `/${path}` : ''}`,
} as never);

const liffId = '1234567890-AaBbCcDd';

beforeEach(() => {
  bot.mock.reset();
  httpOperator.mock.reset();
});

describe('.constructor(options)', () => {
  it('ok', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    expect(authenticator.platform).toBe('line');
    expect(authenticator.loginChannelId).toBe('1234567890');
  });

  it('throw if liffId is empty', () => {
    expect(
      () => new ServerAuthenticator(bot, httpOperator, {} as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffId should not be empty"`
    );
    expect(
      () => new ServerAuthenticator(bot, httpOperator, { liffId: '' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffId should not be empty"`
    );
  });
});

it('.getLiffUrl(path)', async () => {
  const authenticator = new ServerAuthenticator(bot, httpOperator, {
    liffId,
  });
  expect(authenticator.getLiffUrl()).toMatchInlineSnapshot(
    `"https://liff.line.me/1234567890-AaBbCcDd"`
  );
  expect(authenticator.getLiffUrl('foo?bar=baz')).toMatchInlineSnapshot(
    `"https://liff.line.me/1234567890-AaBbCcDd/foo?bar=baz"`
  );
});

test('.delegateAuthRequest() respond 403', async () => {
  const authenticator = new ServerAuthenticator(bot, httpOperator, {
    liffId,
  });
  const res = moxy(new ServerResponse({} as never));

  await expect(authenticator.delegateAuthRequest(request, res)).resolves.toBe(
    undefined
  );

  expect(res.statusCode).toBe(403);
  expect(res.end).toHaveBeenCalled();
});

describe('.verifyCredential(credential)', () => {
  const credential = {
    accessToken: '_ACCESS_TOKEN_',
    refererType: 'utou' as const,
    os: 'ios' as const,
    language: 'zh-TW',
    userId: '_USER_ID_',
  };

  it('calls line social api to verify access token', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    bot.makeApiCall.mock.fake(async () => ({
      scope: 'profile',
      client_id: '1234567890',
      expires_in: 2591659,
    }));

    await expect(authenticator.verifyCredential(credential)).resolves.toEqual({
      ok: true,
      data: {
        provider: '_PROVIDER_ID_',
        channel: '_CHANNEL_ID_',
        client: '1234567890',
        ref: LiffReferer.Utou,
        os: LiffOs.Ios,
        lang: 'zh-TW',
        user: '_USER_ID_',
      },
    });

    expect(bot.makeApiCall).toHaveBeenCalledWith(
      'GET',
      `oauth2/v2.1/verify?access_token=${credential.accessToken}`
    );
  });

  it('return fail if accessToken is absent', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });
    await expect(authenticator.verifyCredential({} as never)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "ok": false,
              "reason": "Empty accessToken received",
            }
          `);
  });

  it('return fail if token verify api respond error', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    bot.makeApiCall.mock.fake(async () => {
      throw new LineApiError({
        code: 400,
        headers: {},
        body: {
          error: 'invalid_request',
          error_description: 'The access token expired',
        },
      });
    });

    await expect(authenticator.verifyCredential(credential as never)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "ok": false,
              "reason": "invalid_request: The access token expired",
            }
          `);
  });

  it('return fail if client_id not match options.loginChannelId', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    bot.makeApiCall.mock.fake(async () => ({
      scope: 'profile',
      client_id: '_SOME_OTHER_UNKNOWN_CHANNEL_',
      expires_in: 2591659,
    }));

    await expect(authenticator.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "ok": false,
              "reason": "token is from unknown client",
            }
          `);
  });

  it('throw if unknown error happen', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    bot.makeApiCall.mock.fake(async () => {
      throw new Error('connection error');
    });

    await expect(authenticator.verifyCredential(credential)).rejects.toThrow(
      new Error('connection error')
    );
  });
});

describe('.verifyRefreshment()', () => {
  const authData = {
    provider: '_PROVIDER_ID_',
    channel: '_CHANNEL_ID_',
    client: '1234567890',
    ref: LiffReferer.Utou,
    os: LiffOs.Ios,
    lang: 'zh-TW',
    user: '_USER_ID_',
  };

  it('return ok and original data', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    await expect(authenticator.verifyRefreshment(authData)).resolves.toEqual({
      ok: true,
      data: authData,
    });
  });

  it('return fail if providerId not match', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    await expect(
      authenticator.verifyRefreshment({
        ...authData,
        provider: '_WORNG_PROVIDER_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "ok": false,
              "reason": "provider not match",
            }
          `);
  });

  it('return fail if channelId not match', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    await expect(
      authenticator.verifyRefreshment({
        ...authData,
        channel: '_WORNG_CHANNEL_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "ok": false,
              "reason": "channel not match",
            }
          `);
  });

  it('return fail if clientId not valid', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    await expect(
      authenticator.verifyRefreshment({
        ...authData,
        client: '_WORNG_CLIENT_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "ok": false,
              "reason": "client not match",
            }
          `);
  });
});

describe('.checkAuthData(data)', () => {
  const authData = {
    provider: '_PROVIDER_ID_',
    channel: '_CHANNEL_ID_',
    client: '1234567890',
    ref: LiffReferer.Utou,
    os: LiffOs.Web,
    lang: 'en-US',
    user: '_USER_ID_',
  };

  it('resolve private chat', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    expect(authenticator.checkAuthData(authData)).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'),
        refererType: 'utou',
        os: 'web',
        language: 'en-US',
      },
    });
  });

  it('resolve group chat', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    expect(
      authenticator.checkAuthData({
        ...authData,
        ref: LiffReferer.Group,
        os: LiffOs.Ios,
        lang: 'zh-TW',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: null,
        refererType: 'group',
        os: 'ios',
        language: 'zh-TW',
      },
    });
  });

  it('resolve room chat', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    expect(
      authenticator.checkAuthData({
        ...authData,
        ref: LiffReferer.Room,
        os: LiffOs.Android,
        lang: 'jp',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        clientId: '1234567890',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        thread: null,
        refererType: 'room',
        os: 'android',
        language: 'jp',
      },
    });
  });

  it('fail if id providerId, channelId or clientId not matched', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      liffId,
    });

    expect(
      authenticator.checkAuthData({
        ...authData,
        provider: '_WRONG_PROVIDER_',
      })
    ).toMatchInlineSnapshot(`
      Object {
        "code": 400,
        "ok": false,
        "reason": "provider not match",
      }
    `);

    expect(
      authenticator.checkAuthData({
        ...authData,
        channel: '_WRONG_CHANNEL_',
      })
    ).toMatchInlineSnapshot(`
      Object {
        "code": 400,
        "ok": false,
        "reason": "channel not match",
      }
    `);

    expect(
      authenticator.checkAuthData({
        ...authData,
        client: '_WRONG_CLIENT_',
      })
    ).toMatchInlineSnapshot(`
      Object {
        "code": 400,
        "ok": false,
        "reason": "client not match",
      }
    `);
  });
});
