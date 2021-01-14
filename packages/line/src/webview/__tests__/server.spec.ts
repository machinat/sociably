import { IncomingMessage, ServerResponse } from 'http';
import moxy from '@moxyjs/moxy';
import type { LineBot } from '../../bot';
import LineChat from '../../channel';
import LineUser from '../../user';
import { LineUserProfile } from '../../profiler';
import LineApiError from '../../error';
import { LineServerAuthorizer as ServerAuthorizer } from '../server';

const request = ({
  url: '/foo/auth/line',
  type: 'GET',
  headers: {},
} as unknown) as IncomingMessage;

const bot = moxy<LineBot>({
  providerId: '_PROVIDER_ID_',
  channelId: '_CHANNEL_ID_',
  async makeApiCall() {
    return {};
  },
} as never);

beforeEach(() => {
  bot.mock.reset();
});

describe('#constructor(options)', () => {
  it('ok', () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    expect(authorizer.platform).toBe('line');
    expect(authorizer.liffChannelIds).toEqual([
      '_LOGIN_CHAN_1_',
      '_LOGIN_CHAN_2_',
    ]);
  });

  it('throw if liffChannelIds is empty', () => {
    expect(
      () => new ServerAuthorizer(bot, {} as never)
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffChannelIds should not be empty"`
    );
    expect(
      () => new ServerAuthorizer(bot, { liffChannelIds: [] })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffChannelIds should not be empty"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });
    const res = moxy(new ServerResponse({} as never));

    await expect(authorizer.delegateAuthRequest(request, res)).resolves.toBe(
      undefined
    );

    expect(res.statusCode).toBe(403);
    expect(res.end.mock).toHaveBeenCalled();
  });
});

describe('#verifyCredential(credential)', () => {
  const credential = {
    accessToken: '_ACCESS_TOKEN_',
    os: 'ios' as const,
    language: 'zh-TW',
    userId: '_USER_ID_',
    groupId: undefined,
    roomId: undefined,
  };

  it('calls line social api to verify access token', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    bot.makeApiCall.mock.fake(async () => ({
      scope: 'profile',
      client_id: '_LOGIN_CHAN_2_',
      expires_in: 2591659,
    }));

    await expect(authorizer.verifyCredential(credential)).resolves.toEqual({
      success: true,
      data: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_2_',
        os: 'ios',
        language: 'zh-TW',
        userId: '_USER_ID_',
      },
    });

    expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
      'GET',
      `oauth2/v2.1/verify?access_token=${credential.accessToken}`
    );
  });

  test('verify user is group member if groupId given', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    bot.makeApiCall.mock.fakeOnce(async () => ({
      scope: 'profile',
      client_id: '_LOGIN_CHAN_2_',
      expires_in: 2591659,
    }));

    bot.makeApiCall.mock.fakeOnce(async () => ({
      userId: '_USER_ID_',
      displayName: 'Jojo Deo',
      pictureUrl: 'http://adventure.com/iran.jpg',
    }));

    await expect(
      authorizer.verifyCredential({ ...credential, groupId: '_GROUP_ID_' })
    ).resolves.toEqual({
      success: true,
      data: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_2_',
        os: 'ios',
        language: 'zh-TW',
        userId: '_USER_ID_',
        groupId: '_GROUP_ID_',
        name: 'Jojo Deo',
        picture: 'http://adventure.com/iran.jpg',
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
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    bot.makeApiCall.mock.fakeOnce(async () => ({
      scope: 'profile',
      client_id: '_LOGIN_CHAN_2_',
      expires_in: 2591659,
    }));

    bot.makeApiCall.mock.fakeOnce(async () => ({
      userId: '_USER_ID_',
      displayName: 'Jojo Deo',
      pictureUrl: 'http://adventure.com/india.jpg',
    }));

    await expect(
      authorizer.verifyCredential({ ...credential, roomId: '_ROOM_ID_' })
    ).resolves.toEqual({
      success: true,
      data: {
        providerId: '_PROVIDER_ID_',
        channelId: '_CHANNEL_ID_',
        clientId: '_LOGIN_CHAN_2_',
        os: 'ios',
        language: 'zh-TW',
        userId: '_USER_ID_',
        roomId: '_ROOM_ID_',
        name: 'Jojo Deo',
        picture: 'http://adventure.com/india.jpg',
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
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });
    await expect(authorizer.verifyCredential({} as never)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "Empty accessToken received",
              "success": false,
            }
          `);
  });

  it('return fail if token verify api respond error', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
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

    await expect(authorizer.verifyCredential(credential as never)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid_request: The access token expired",
              "success": false,
            }
          `);
  });

  it('return fail if client_id from token not in options.liffChannelIds', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    bot.makeApiCall.mock.fake(async () => ({
      scope: 'profile',
      client_id: '_SOME_OTHER_UNKNOWN_CHANNEL_',
      expires_in: 2591659,
    }));

    await expect(authorizer.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "token is from unknown client",
              "success": false,
            }
          `);
  });

  it('throw if unknown error happen', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    bot.makeApiCall.mock.fake(async () => {
      throw new Error('connection error');
    });

    await expect(authorizer.verifyCredential(credential)).rejects.toThrow(
      new Error('connection error')
    );
  });
});

describe('#verifyRefreshment()', () => {
  const authData = {
    providerId: '_PROVIDER_ID_',
    channelId: '_CHANNEL_ID_',
    clientId: '_CLIENT_ID_',
    os: 'ios' as const,
    language: 'zh-TW',
    userId: '_USER_ID_',
    groupId: undefined,
    roomId: undefined,
    name: undefined,
    picture: undefined,
  };

  it('return success and original data', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(authorizer.verifyRefreshment(authData)).resolves.toEqual({
      success: true,
      data: authData,
    });
  });

  it('return fail if providerId not match', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.verifyRefreshment({
        ...authData,
        providerId: '_WORNG_PROVIDER_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid providerId",
              "success": false,
            }
          `);
  });

  it('return fail if channelId not match', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.verifyRefreshment({
        ...authData,
        channelId: '_WORNG_CHANNEL_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid channelId",
              "success": false,
            }
          `);
  });

  it('return fail if clientId not valid', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.verifyRefreshment({
        ...authData,
        clientId: '_WORNG_CLIENT_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "invalid clientId",
              "success": false,
            }
          `);
  });
});

describe('#supplementContext(data)', () => {
  const authData = {
    providerId: '_PROVIDER_ID_',
    channelId: '_CHANNEL_ID_',
    clientId: '_CLIENT_ID_',
    os: 'web' as const,
    language: 'en-US',
    userId: '_USER_ID_',
    groupId: undefined,
    roomId: undefined,
    name: undefined,
    picture: undefined,
  };

  it('resolve utou chat', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(authorizer.supplementContext(authData)).resolves.toEqual({
      providerId: '_PROVIDER_ID_',
      channelId: '_CHANNEL_ID_',
      clientId: '_CLIENT_ID_',
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_'),
      profile: null,
      os: 'web',
      language: 'en-US',
    });
  });

  it('resolve group chat', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.supplementContext({
        ...authData,
        os: 'ios',
        language: 'zh-TW',
        groupId: '_GROUP_ID_',
      })
    ).resolves.toEqual({
      providerId: '_PROVIDER_ID_',
      channelId: '_CHANNEL_ID_',
      clientId: '_CLIENT_ID_',
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'),
      profile: null,
      os: 'ios',
      language: 'zh-TW',
    });
  });

  it('resolve room chat', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.supplementContext({
        ...authData,
        os: 'android',
        language: 'jp',
        roomId: '_ROOM_ID_',
      })
    ).resolves.toEqual({
      providerId: '_PROVIDER_ID_',
      channelId: '_CHANNEL_ID_',
      clientId: '_CLIENT_ID_',
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_CHANNEL_ID_', 'room', '_ROOM_ID_'),
      profile: null,
      os: 'android',
      language: 'jp',
    });
  });

  it('resolve profile if profile data proivded', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.supplementContext({
        ...authData,
        os: 'ios',
        userId: '_USER_ID_',
        groupId: '_GROUP_ID_',
        name: 'Jojo Doe',
        picture: 'http://advanture.com/Egypt.jpg',
      })
    ).resolves.toEqual({
      providerId: '_PROVIDER_ID_',
      channelId: '_CHANNEL_ID_',
      clientId: '_CLIENT_ID_',
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_CHANNEL_ID_', 'group', '_GROUP_ID_'),
      profile: new LineUserProfile({
        userId: '_USER_ID_',
        displayName: 'Jojo Doe',
        pictureUrl: 'http://advanture.com/Egypt.jpg',
      }),
      os: 'ios',
      language: 'en-US',
    });
  });

  it('return null id providerId, channelId or clientId not matched', async () => {
    const authorizer = new ServerAuthorizer(bot, {
      liffChannelIds: ['_CLIENT_ID_'],
    });

    await expect(
      authorizer.supplementContext({
        ...authData,
        providerId: '_WRONG_PROVIDER_',
      })
    ).resolves.toBe(null);

    await expect(
      authorizer.supplementContext({
        ...authData,
        channelId: '_WRONG_CHANNEL_',
      })
    ).resolves.toBe(null);

    await expect(
      authorizer.supplementContext({
        ...authData,
        clientId: '_WRONG_CLIENT_',
      })
    ).resolves.toBe(null);
  });
});
