import { ServerResponse } from 'http';
import nock from 'nock';
import moxy from 'moxy';
import { LineUser } from '../../user';
import ServerAuthProvider from '../server';

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
    expect(provider.options).toEqual({
      channelId: '_LINE_CHANNEL_ID_',
    });
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

describe('#handleAuthRequest(req, res)', () => {
  it('respond 403', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });
    const res = moxy(new ServerResponse({}));

    await expect(provider.handleAuthRequest(request, res)).resolves.toBe(
      undefined
    );

    expect(res.statusCode).toBe(403);
    expect(res.end.mock).toHaveBeenCalled();
  });
});

const authData = {
  os: 'ios',
  language: 'zh-TW',
  version: 'v2.1',
  isInClient: true,
  idLoggedIn: true,
  accessToken: '_ACCESS_TOKEN_',
  profile: {
    userId: '_USER_ID_',
    displayName: 'John',
    pictureUrl: 'https://example.com/abcdefghijklmn',
    statusMessage: 'Hello, LINE!',
  },
  loginTime: 1573530545840,
};

describe('#verifyAuthData(data)', () => {
  it('verify token by getting profile from line api', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    const changedProfile = {
      userId: '_USER_ID_',
      displayName: 'Jojo',
      pictureUrl: 'https://example.com/abcdefghijklmn',
      statusMessage: 'Hello, DIO!',
    };

    const scope = nock('https://api.line.me')
      .get('/v2/profile')
      .reply(200, changedProfile);

    await expect(provider.verifyAuthData({ data: authData })).resolves.toEqual({
      channel: null,
      user: new LineUser('_LINE_CHANNEL_ID_', '_USER_ID_'),
      loginAt: new Date(1573530545840),
      data: { ...authData, profile: changedProfile },
    });

    expect(scope.isDone()).toBe(true);
  });

  it('throw if accessToken is absent', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });
    await expect(
      provider.verifyAuthData({})
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Empty accessToken received"`
    );
  });

  it('throw if line api respond error', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    const scope = nock('https://api.line.me')
      .get('/v2/profile')
      .reply(401, { message: 'The access token expired' });

    await expect(
      provider.verifyAuthData({ data: authData })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"The access token expired"`);

    expect(scope.isDone()).toBe(true);
  });
});

describe('#refineAuthData(data)', () => {
  it('resolve context according to auth data', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    await expect(provider.refineAuthData({ data: authData })).resolves.toEqual({
      channel: null,
      user: new LineUser('_LINE_CHANNEL_ID_', '_USER_ID_'),
      loginAt: new Date(1573530545840),
      data: authData,
    });
  });

  it('resolve null if profile is empty', async () => {
    const provider = new ServerAuthProvider({ channelId: '_LINE_CHANNEL_ID_' });

    await expect(provider.refineAuthData({ data: {} })).resolves.toBe(null);
  });
});
