import { ServerResponse } from 'http';
import nock from 'nock';
import moxy from '@moxyjs/moxy';
import LineChat from '../../channel';
import LineUser from '../../user';
import { LineServerAuthorizer } from '../server';

nock.disableNetConnect();

const request = {
  url: '/foo/auth/line',
  type: 'GET',
  headers: {},
};

describe('#constructor(options)', () => {
  it('ok', () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
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
      () => new LineServerAuthorizer({})
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffChannelIds should not be empty"`
    );
    expect(
      () => new LineServerAuthorizer({ liffChannelIds: [] })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffChannelIds should not be empty"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });
    const res = moxy(new ServerResponse({}));

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
    data: {
      userToBot: true,
      os: 'ios',
      language: 'zh-TW',
      contextType: 'utou',
      utouId: '_UTOU_ID_',
      userId: '_USER_ID_',
    },
  };

  const verifyAPI = nock('https://api.line.me')
    .get('/oauth2/v2.1/verify')
    .query({ access_token: credential.accessToken });

  it('calls line social api to verify the access token', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    let verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_LOGIN_CHAN_2_',
      expires_in: 2591659,
    });

    await expect(authorizer.verifyCredential(credential)).resolves.toEqual({
      success: true,
      refreshable: false,
      data: {
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: true,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      },
    });

    expect(verifyScope.isDone()).toBe(true);

    verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_LOGIN_CHAN_1_',
      expires_in: 2591659,
    });

    await expect(
      authorizer.verifyCredential({
        accessToken: '_ACCESS_TOKEN_',
        data: {
          userToBot: false,
          os: 'ios',
          language: 'zh-TW',
          contextType: 'group',
          groupId: '_GROUP_ID_',
          userId: '_USER_ID_',
        },
      })
    ).resolves.toEqual({
      success: true,
      refreshable: false,
      data: {
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      },
    });

    expect(verifyScope.isDone()).toBe(true);
  });

  it('return fail if accessToken is absent', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });
    await expect(authorizer.verifyCredential({})).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "Empty accessToken received",
              "success": false,
            }
          `);
  });

  it('return fail if token verify api respond error', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    const verifyScope = verifyAPI.reply(400, {
      error: 'invalid_request',
      error_description: 'The access token expired',
    });

    await expect(authorizer.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "The access token expired",
              "success": false,
            }
          `);

    expect(verifyScope.isDone()).toBe(true);
  });

  it('return fail if client_id from token not in options.liffChannelIds', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    const verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_SOME_OTHER_UNKNOWN_CHANNEL_',
      expires_in: 2591659,
    });

    await expect(authorizer.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "unknown client_id of the access token",
              "success": false,
            }
          `);

    expect(verifyScope.isDone()).toBe(true);
  });

  it('throw if profile api respond error', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    const verifyScope = verifyAPI.reply(400, {
      error: 'invalid_request',
      error_description: 'access token expired',
    });

    await expect(authorizer.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "access token expired",
              "success": false,
            }
          `);

    expect(verifyScope.isDone()).toBe(true);
  });
});

describe('#verifyRefreshment()', () => {
  it('return fail anyway', async () => {
    const authorizer = new LineServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      channelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    await expect(authorizer.verifyRefreshment({})).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 403,
              "reason": "should resign only",
              "success": false,
            }
          `);
  });
});

describe('#refineAuth(data)', () => {
  const authorizer = new LineServerAuthorizer({
    providerId: '_PROVIDER_ID_',
    channelId: '_BOT_CHANNEL_ID_',
    liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
  });

  it('resolve utou chat', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'utou', '_UTOU_ID_'),
    });
  });

  it('resolve group chat', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'group', '_GROUP_ID_'),
    });
  });

  it('resolve room chat', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'room',
        roomId: '_ROOM_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'room', '_ROOM_ID_'),
    });
  });

  it('resolve channel as null if contextType is external or none', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'web',
        language: 'zh-TW',
        contextType: 'external',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: null,
    });

    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        contextType: 'none',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: null,
    });
  });

  it('return user channel if userToBot is true in data', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: true,
        os: 'ios',
        language: 'zh-TW',
        botChannel: '_BOT_CHANNEL_ID_',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'user', '_USER_ID_'),
    });

    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: true,
        os: 'web',
        language: 'zh-TW',
        botChannel: '_BOT_CHANNEL_ID_',
        contextType: 'external',
        userId: '_USER_ID_',
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      channel: new LineChat('_BOT_CHANNEL_ID_', 'user', '_USER_ID_'),
    });
  });

  it('return null if channelId or providerId in data does not match', async () => {
    await expect(
      authorizer.refineAuth({
        providerId: '_INVALID_PROVIDER_ID_',
        channelId: '_BOT_CHANNEL_ID_',
        userToBot: true,
        os: 'ios',
        language: 'zh-TW',
        botChannel: '_SOME_OTHER_BOT_CHANNEL_ID_',
        contextType: 'utou',
        utouId: '_UTOU_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toBe(null);

    await expect(
      authorizer.refineAuth({
        providerId: '_PROVIDER_ID_',
        channelId: '_INVALID_CHANNEL_ID_',
        userToBot: false,
        os: 'ios',
        language: 'zh-TW',
        botChannel: '_SOME_OTHER_BOT_CHANNEL_ID_',
        contextType: 'group',
        groupId: '_GROUP_ID_',
        userId: '_USER_ID_',
      })
    ).resolves.toBe(null);
  });
});
