import { ServerResponse } from 'http';
import nock from 'nock';
import moxy from 'moxy';
import LineChannel from '../../channel';
import LineUser from '../../user';
import ServerAuthorizer from '../server';

nock.disableNetConnect();

const liffContext = {
  type: 'utou',
  utouId:
    'UU29e6eb36812f484fd275d41b5af4e760926c516d8c9faa35…b1e8de8fbb6ecb263ee8724e48118565e3368d39778fe648d',
  userId: 'U70e153189a29f1188b045366285346bc',
  viewType: 'full',
  accessTokenHash: 'ArIXhlwQMAZyW7SDHm7L2g',
  availability: {
    shareTargetPicker: {
      permission: true,
      minVer: '10.3.0',
    },
  },
};

const request = {
  url: '/foo/auth/line',
  type: 'GET',
  headers: {},
};

describe('#constructor(options)', () => {
  it('ok', () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    expect(authorizer.platform).toBe('line');
    expect(authorizer.liffChannelIds).toEqual([
      '_LOGIN_CHAN_1_',
      '_LOGIN_CHAN_2_',
    ]);
  });

  it('throw if liffChannelIds is empty', () => {
    expect(() => new ServerAuthorizer({})).toThrowErrorMatchingInlineSnapshot(
      `"options.liffChannelIds should not be empty"`
    );
    expect(
      () => new ServerAuthorizer({ liffChannelIds: [] })
    ).toThrowErrorMatchingInlineSnapshot(
      `"options.liffChannelIds should not be empty"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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
    os: 'ios',
    language: 'zh-TW',
    context: liffContext,
    accessToken: '_ACCESS_TOKEN_',
  };

  const verifyAPI = nock('https://api.line.me')
    .get('/oauth2/v2.1/verify')
    .query({ access_token: credential.accessToken });

  it('calls line social api to verify the access token', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    const verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_LOGIN_CHAN_2_',
      expires_in: 2591659,
    });

    await expect(authorizer.verifyCredential(credential)).resolves.toEqual({
      success: true,
      refreshable: false,
      data: {
        os: 'ios',
        language: 'zh-TW',
        context: liffContext,
      },
    });

    expect(verifyScope.isDone()).toBe(true);
  });

  test('verify with botChannelId in auth data', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_'],
    });

    verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_LOGIN_CHAN_',
      expires_in: 2591659,
    });

    await expect(
      authorizer.verifyCredential({
        ...credential,
        botChannelId: '_BOT_CHANNEL_ID_',
      })
    ).resolves.toEqual({
      success: true,
      refreshable: false,
      data: {
        botChannelId: '_BOT_CHANNEL_ID_',
        os: 'ios',
        language: 'zh-TW',
        context: liffContext,
      },
    });
  });

  it('return unaccepted if accessToken is absent', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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

  it('return unaccepted if token verify api respond error', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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

  it('return unaccepted if client_id from token not in options.liffChannelIds', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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

  it('return unaccepted if botChannelId in credential not matched', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    await expect(
      authorizer.verifyCredential({
        ...credential,
        botChannelId: '_ANOTHER_BOT_ID_',
      })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "botChannelId not match",
              "success": false,
            }
          `);
  });

  it('throw if profile api respond error', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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
  it('return unaccepted anyway', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
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
  it('return channel and user according to auth data', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        context: {
          ...liffContext,
          type: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
        },
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      authorizedChannel: new LineChannel(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        'utou',
        '_UTOU_ID_'
      ),
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        context: {
          ...liffContext,
          type: 'external',
          userId: '_USER_ID_',
        },
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      authorizedChannel: null,
    });
  });

  it('return utob channel if botChannelId exist in data', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        botChannelId: '_BOT_CHANNEL_ID_',
        context: {
          ...liffContext,
          type: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
        },
      })
    ).resolves.toEqual({
      user: new LineUser('_PROVIDER_ID_', '_USER_ID_'),
      authorizedChannel: new LineChannel(
        '_PROVIDER_ID_',
        '_BOT_CHANNEL_ID_',
        'utob',
        '_USER_ID_'
      ),
    });
  });

  it('return null if botChannelId in data not match', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });

    await expect(
      authorizer.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        botChannelId: '_SOME_OTHER_BOT_CHANNEL_ID_',
        context: {
          ...liffContext,
          type: 'utou',
          utouId: '_UTOU_ID_',
          userId: '_USER_ID_',
        },
      })
    ).resolves.toBe(null);
  });

  it('return null if context is empty', async () => {
    const authorizer = new ServerAuthorizer({
      providerId: '_PROVIDER_ID_',
      botChannelId: '_BOT_CHANNEL_ID_',
      liffChannelIds: ['_LOGIN_CHAN_1_', '_LOGIN_CHAN_2_'],
    });
    await expect(
      authorizer.refineAuth({ os: 'ios', language: 'zh-TW' })
    ).resolves.toBe(null);
  });
});
