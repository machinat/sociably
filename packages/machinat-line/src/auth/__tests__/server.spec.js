import { ServerResponse } from 'http';
import nock from 'nock';
import moxy from 'moxy';
import { LineUser } from '../../user';
import ServerAuthProvider from '../server';

nock.disableNetConnect();

const request = {
  url: '/foo/auth/line',
  type: 'GET',
  headers: {},
};

describe('#constructor(options)', () => {
  it('ok', () => {
    const provider = new ServerAuthProvider({
      channelId: '_LINE_CHANNEL_ID_',
    });

    expect(provider.platform).toBe('line');
    expect(provider.channelId).toBe('_LINE_CHANNEL_ID_');
  });

  it('throw if channl id is empty', () => {
    expect(() => new ServerAuthProvider()).toThrowErrorMatchingInlineSnapshot(
      `"options.channelId must not be empty"`
    );
    expect(() => new ServerAuthProvider({})).toThrowErrorMatchingInlineSnapshot(
      `"options.channelId must not be empty"`
    );
  });
});

describe('#delegateAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });
    const res = moxy(new ServerResponse({}));

    await expect(provider.delegateAuthRequest(request, res)).resolves.toBe(
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
    version: 'v2.1',
    isInClient: true,
    accessToken: '_ACCESS_TOKEN_',
  };

  const verifyAPI = nock('https://api.line.me')
    .get('/oauth2/v2.1/verify')
    .query({ access_token: credential.accessToken });
  const profileAPI = nock('https://api.line.me').get('/v2/profile');

  it('verify token and get profile by calling line api', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    const profile = {
      userId: '_USER_ID_',
      displayName: 'John',
      pictureUrl: 'https://example.com/abcdefghijklmn',
      statusMessage: 'Hello, LINE!',
    };

    const verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_LINE_CHANNEL_ID_',
      expires_in: 2591659,
    });
    const profileScope = profileAPI.reply(200, profile);

    await expect(provider.verifyCredential(credential)).resolves.toEqual({
      success: true,
      refreshable: false,
      data: {
        os: 'ios',
        language: 'zh-TW',
        version: 'v2.1',
        isInClient: true,
        profile,
      },
    });

    expect(verifyScope.isDone()).toBe(true);
    expect(profileScope.isDone()).toBe(true);
  });

  it('return unaccepted if accessToken is absent', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });
    await expect(provider.verifyCredential({})).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "Empty accessToken received",
              "success": false,
            }
          `);
  });

  it('return unaccepted if token verify api respond error', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    const verifyScope = verifyAPI.reply(400, {
      error: 'invalid_request',
      error_description: 'The access token expired',
    });

    await expect(provider.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "The access token expired",
              "success": false,
            }
          `);

    expect(verifyScope.isDone()).toBe(true);
  });

  it('return unaccepted if client_id of token not match', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    const verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_SOME_OTHER_UNKNOWN_CHANNEL_',
      expires_in: 2591659,
    });

    await expect(provider.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 400,
              "reason": "client_id not match",
              "success": false,
            }
          `);

    expect(verifyScope.isDone()).toBe(true);
  });

  it('throw if profile api respond error', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    const verifyScope = verifyAPI.reply(200, {
      scope: 'profile',
      client_id: '_LINE_CHANNEL_ID_',
      expires_in: 2591659,
    });
    const profileScope = profileAPI.reply(401, {
      message: 'The access token expired',
    });

    await expect(provider.verifyCredential(credential)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "code": 401,
              "reason": "The access token expired",
              "success": false,
            }
          `);

    expect(verifyScope.isDone()).toBe(true);
    expect(profileScope.isDone()).toBe(true);
  });
});

describe('#verifyRefreshment()', () => {
  it('return unaccepted anyway', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    await expect(provider.verifyRefreshment({})).resolves
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
  it('resolve context according to auth data', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    await expect(
      provider.refineAuth({
        os: 'ios',
        language: 'zh-TW',
        version: 'v2.1',
        isInClient: true,
        accessToken: '_ACCESS_TOKEN_',
        profile: {
          userId: '_USER_ID_',
          displayName: 'John',
          pictureUrl: 'https://example.com/abcdefghijklmn',
          statusMessage: 'Hello, LINE!',
        },
      })
    ).resolves.toEqual({
      user: new LineUser('_USER_ID_'),
      authorizedChannel: null,
    });
  });

  it('resolve null if profile is empty', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    await expect(provider.refineAuth({ data: {} })).resolves.toBe(null);
  });
});
