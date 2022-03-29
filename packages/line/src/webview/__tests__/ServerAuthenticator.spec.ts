import { IncomingMessage, ServerResponse } from 'http';
import { AuthHttpOperator } from '@machinat/auth';
import moxy from '@moxyjs/moxy';
import type { LineBot } from '../../Bot';
import LineChat from '../../Chat';
import LineUser from '../../User';
import LineUserProfile from '../../UserProfile';
import LineApiError from '../../error';
import ServerAuthenticator from '../ServerAuthenticator';
import { LiffContextOs } from '../../constant';

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
    `https://machinat.io/my_app/webview${path ? `/${path}` : ''}`,
} as never);

beforeEach(() => {
  bot.mock.reset();
  httpOperator.mock.reset();
});

describe('.constructor(options)', () => {
  it('ok', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    expect(authenticator.platform).toBe('line');
    expect(authenticator.loginChannelId).toBe('_LOGIN_CHAN_');
  });

  it('throw if loginChannelId is empty', () => {
    expect(
      () => new ServerAuthenticator(bot, httpOperator, {} as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.loginChannelId should not be empty"`
    );
    expect(
      () => new ServerAuthenticator(bot, httpOperator, { loginChannelId: '' })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.loginChannelId should not be empty"`
    );
  });
});

it('.getWebviewUrl(path)', async () => {
  const authenticator = new ServerAuthenticator(bot, httpOperator, {
    loginChannelId: '_LOGIN_CHAN_',
  });
  expect(authenticator.getWebviewUrl()).toMatchInlineSnapshot(
    `"https://machinat.io/my_app/webview?platform=line"`
  );
  expect(authenticator.getWebviewUrl('foo?bar=baz')).toMatchInlineSnapshot(
    `"https://machinat.io/my_app/webview/foo?bar=baz&platform=line"`
  );

  expect(httpOperator.getRedirectUrl.mock).toHaveBeenCalledTimes(2);
  expect(httpOperator.getRedirectUrl.mock).toHaveBeenNthCalledWith(
    2,
    'foo?bar=baz'
  );
});

test('.delegateAuthRequest() respond 403', async () => {
  const authenticator = new ServerAuthenticator(bot, httpOperator, {
    loginChannelId: '_LOGIN_CHAN_',
  });
  const res = moxy(new ServerResponse({} as never));

  await expect(authenticator.delegateAuthRequest(request, res)).resolves.toBe(
    undefined
  );

  expect(res.statusCode).toBe(403);
  expect(res.end.mock).toHaveBeenCalled();
});

describe('.verifyCredential(credential)', () => {
  const credential = {
    accessToken: '_ACCESS_TOKEN_',
    os: 'ios' as const,
    language: 'zh-TW',
    userId: '_USER_ID_',
    groupId: undefined,
    roomId: undefined,
  };

  it('calls line social api to verify access token', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    bot.makeApiCall.mock.fake(async () => ({
      scope: 'profile',
      client_id: '_LOGIN_CHAN_',
      expires_in: 2591659,
    }));

    await expect(authenticator.verifyCredential(credential)).resolves.toEqual({
      ok: true,
      data: {
        provider: '_PROVIDER_ID_',
        channel: '_CHANNEL_ID_',
        client: '_LOGIN_CHAN_',
        os: LiffContextOs.Ios,
        lang: 'zh-TW',
        user: '_USER_ID_',
      },
    });

    expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
      'GET',
      `oauth2/v2.1/verify?access_token=${credential.accessToken}`
    );
  });

  test('verify user is group member if groupId given', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    bot.makeApiCall.mock.fakeOnce(async () => ({
      scope: 'profile',
      client_id: '_LOGIN_CHAN_',
      expires_in: 2591659,
    }));

    bot.makeApiCall.mock.fakeOnce(async () => ({
      userId: '_USER_ID_',
      displayName: 'Jojo Deo',
      pictureUrl: 'http://adventure.com/iran.jpg',
    }));

    await expect(
      authenticator.verifyCredential({ ...credential, groupId: '_GROUP_ID_' })
    ).resolves.toEqual({
      ok: true,
      data: {
        provider: '_PROVIDER_ID_',
        channel: '_CHANNEL_ID_',
        client: '_LOGIN_CHAN_',
        os: LiffContextOs.Ios,
        lang: 'zh-TW',
        user: '_USER_ID_',
        group: '_GROUP_ID_',
        name: 'Jojo Deo',
        pic: 'http://adventure.com/iran.jpg',
      },
    });

    expect(bot.makeApiCall.mock).toHaveBeenNthCalledWith(
      1,
      'GET',
      `oauth2/v2.1/verify?access_token=${credential.accessToken}`
    );

    expect(bot.makeApiCall.mock).toHaveBeenNthCalledWith(
      2,
      'GET',
      'v2/bot/group/_GROUP_ID_/member/_USER_ID_'
    );
  });

  test('verify user is room member if roomId given', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    bot.makeApiCall.mock.fakeOnce(async () => ({
      scope: 'profile',
      client_id: '_LOGIN_CHAN_',
      expires_in: 2591659,
    }));

    bot.makeApiCall.mock.fakeOnce(async () => ({
      userId: '_USER_ID_',
      displayName: 'Jojo Deo',
      pictureUrl: 'http://adventure.com/india.jpg',
    }));

    await expect(
      authenticator.verifyCredential({ ...credential, roomId: '_ROOM_ID_' })
    ).resolves.toEqual({
      ok: true,
      data: {
        provider: '_PROVIDER_ID_',
        channel: '_CHANNEL_ID_',
        client: '_LOGIN_CHAN_',
        os: LiffContextOs.Ios,
        lang: 'zh-TW',
        user: '_USER_ID_',
        room: '_ROOM_ID_',
        name: 'Jojo Deo',
        pic: 'http://adventure.com/india.jpg',
      },
    });

    expect(bot.makeApiCall.mock).toHaveBeenNthCalledWith(
      1,
      'GET',
      `oauth2/v2.1/verify?access_token=${credential.accessToken}`
    );
    expect(bot.makeApiCall.mock).toHaveBeenNthCalledWith(
      2,
      'GET',
      'v2/bot/room/_ROOM_ID_/member/_USER_ID_'
    );
  });

  it('return fail if accessToken is absent', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
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
      loginChannelId: '_LOGIN_CHAN_',
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
      loginChannelId: '_LOGIN_CHAN_',
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
      loginChannelId: '_LOGIN_CHAN_',
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
    client: '_LOGIN_CHAN_',
    os: LiffContextOs.Ios,
    lang: 'zh-TW',
    user: '_USER_ID_',
    group: undefined,
    room: undefined,
    name: undefined,
    pic: undefined,
  };

  it('return ok and original data', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    await expect(authenticator.verifyRefreshment(authData)).resolves.toEqual({
      ok: true,
      data: authData,
    });
  });

  it('return fail if providerId not match', async () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
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
      loginChannelId: '_LOGIN_CHAN_',
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
      loginChannelId: '_LOGIN_CHAN_',
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
    client: '_LOGIN_CHAN_',
    os: LiffContextOs.Web,
    lang: 'en-US',
    user: '_USER_ID_',
    group: undefined,
    room: undefined,
    name: undefined,
    pic: undefined,
  };

  it('resolve private chat', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    expect(authenticator.checkAuthData(authData)).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        channel: new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'),
        profile: null,
        os: 'web',
        language: 'en-US',
      },
    });
  });

  it('resolve group chat', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    expect(
      authenticator.checkAuthData({
        ...authData,
        os: LiffContextOs.Ios,
        lang: 'zh-TW',
        group: '_GROUP_ID_',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        channel: new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'),
        profile: null,
        os: 'ios',
        language: 'zh-TW',
      },
    });
  });

  it('resolve room chat', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    expect(
      authenticator.checkAuthData({
        ...authData,
        os: LiffContextOs.Android,
        lang: 'jp',
        room: '_ROOM_ID_',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        channel: new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'),
        profile: null,
        os: 'android',
        language: 'jp',
      },
    });
  });

  it('resolve profile if profile data proivded', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
    });

    expect(
      authenticator.checkAuthData({
        ...authData,
        os: LiffContextOs.Ios,
        user: '_USER_ID_',
        group: '_GROUP_ID_',
        name: 'Jojo Doe',
        pic: 'http://advanture.com/Egypt.jpg',
      })
    ).toEqual({
      ok: true,
      contextDetails: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_',
        user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
        channel: new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'),
        profile: new LineUserProfile({
          userId: '_USER_ID_',
          displayName: 'Jojo Doe',
          pictureUrl: 'http://advanture.com/Egypt.jpg',
        }),
        os: 'ios',
        language: 'en-US',
      },
    });
  });

  it('fail if id providerId, channelId or clientId not matched', () => {
    const authenticator = new ServerAuthenticator(bot, httpOperator, {
      loginChannelId: '_LOGIN_CHAN_',
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
