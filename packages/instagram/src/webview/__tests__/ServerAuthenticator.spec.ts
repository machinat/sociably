import { moxy } from '@moxyjs/moxy';
import BasicAuthenticator, {
  AuthDelegatorOptions,
} from '@sociably/auth/basicAuth';
import { MetaApiError } from '@sociably/meta-api';
import InstagramBot from '../../Bot.js';
import InstagramProfiler from '../../Profiler.js';
import InstagramPage from '../../Page.js';
import InstagramUser from '../../User.js';
import InstagramChat from '../../Chat.js';
import UserProfile from '../../UserProfile.js';
import ServerAuthenticator from '../ServerAuthenticator.js';
import { InstagramAuthCredential, InstagramAuthData } from '../types.js';

const bot = moxy<InstagramBot>({ a: 'bot' } as never);

const profileData = {
  id: '43210',
  name: 'John Doe',
  username: 'john.doe.1234',
  profile_pic: 'https://...',
  is_verified_user: false,
  follower_count: 123,
  is_user_follow_business: true,
  is_business_follow_user: false,
};
const profiler = moxy<InstagramProfiler>({
  getUserProfile: async () => new UserProfile(profileData),
} as never);

const requestDelegator = moxy(async () => {});
const loginUrl = `https://sociably.io/foo/auth/instagram?login=__LOGIN_TOKEN__`;

const basicAuthenticator = moxy<BasicAuthenticator>({
  getAuthUrl() {
    return loginUrl;
  },
  createRequestDelegator() {
    return requestDelegator;
  },
} as never);

const pageId = '12345';
const accessToken = '_ACCESS_TOKEN_';
const agentUsername = 'jojodoe123';

const agentSettings = { pageId, accessToken, username: agentUsername };
const agentSettingsAccessor = moxy({
  getAgentSettings: async () => agentSettings,
  getAgentSettingsBatch: async () => [agentSettings],
});

beforeEach(() => {
  profiler.mock.reset();
  requestDelegator.mock.reset();
  basicAuthenticator.mock.reset();
  agentSettingsAccessor.mock.reset();
});

describe('.delegateAuthRequest(req, res, routing)', () => {
  const req = moxy();
  const res = moxy();
  const routing = {
    originalPath: '/auth/instagram/login',
    basePath: '/',
    matchedPath: 'auth/instagram',
    trailingPath: 'login',
  };

  let authenticator: ServerAuthenticator;
  let delegatorOptions: AuthDelegatorOptions<
    InstagramAuthCredential,
    InstagramAuthData,
    InstagramChat
  >;
  beforeEach(() => {
    authenticator = new ServerAuthenticator(
      bot,
      profiler,
      basicAuthenticator,
      agentSettingsAccessor
    );
    delegatorOptions =
      basicAuthenticator.createRequestDelegator.mock.calls[0].args[0];
  });

  test('delegation options', async () => {
    await expect(
      authenticator.delegateAuthRequest(req, res, routing)
    ).resolves.toBe(undefined);

    expect(requestDelegator).toHaveReturnedTimes(1);
    expect(requestDelegator).toHaveBeenCalledWith(req, res, routing);

    expect(basicAuthenticator.createRequestDelegator).toHaveReturnedTimes(1);

    expect(delegatorOptions).toMatchInlineSnapshot(`
      {
        "bot": {
          "a": "bot",
        },
        "checkAuthData": [Function],
        "checkCurrentAuthUsability": [Function],
        "platform": "instagram",
        "platformColor": "#4B69FF",
        "platformImageUrl": "https://sociably.js.org/img/icon/messenger.png",
        "platformName": "Instagram",
        "verifyCredential": [Function],
      }
    `);

    expect(
      delegatorOptions.checkAuthData({
        agent: { page: '12345', name: 'jojodoe123' },
        user: '67890',
        profile: profileData,
      })
    ).toEqual({
      ok: true,
      thread: new InstagramChat('12345', { id: '67890' }),
      data: {
        agent: { page: '12345', name: 'jojodoe123' },
        user: '67890',
        profile: profileData,
      },
      chatLinkUrl: `https://ig.me/m/${'jojodoe123'}`,
    });
  });

  test('options.checkCurrentAuthUsability(credential, data)', () => {
    expect(
      delegatorOptions.checkCurrentAuthUsability(
        { agent: { page: '12345', name: 'jojodoe123' }, user: '67890' },
        { agent: { page: '12345', name: 'jojodoe123' }, user: '67890' }
      )
    ).toEqual({ ok: true });
    expect(
      delegatorOptions.checkCurrentAuthUsability(
        { agent: { page: '11111', name: 'janedoe555' }, user: '67890' },
        { agent: { page: '12345', name: 'jojodoe123' }, user: '67890' }
      )
    ).toEqual({ ok: false });
    expect(
      delegatorOptions.checkCurrentAuthUsability(
        { agent: { page: '12345', name: 'jojodoe123' }, user: '66666' },
        { agent: { page: '12345', name: 'jojodoe123' }, user: '67890' }
      )
    ).toEqual({ ok: false });
  });

  describe('options.verifyCredential', () => {
    it('return ok when verification passed', async () => {
      await expect(
        delegatorOptions.verifyCredential({
          agent: { page: '12345', name: 'jojodoe123' },
          user: '67890',
        })
      ).resolves.toEqual({
        ok: true,
        data: {
          agent: { page: '12345', name: 'jojodoe123' },
          user: '67890',
          profile: profileData,
        },
      });

      expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledTimes(1);
      expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledWith(
        new InstagramPage('12345')
      );

      expect(profiler.getUserProfile).toHaveBeenCalledTimes(1);
      expect(profiler.getUserProfile).toHaveBeenCalledWith(
        new InstagramPage('12345'),
        new InstagramUser('12345', '67890')
      );
    });

    it('fail if fail to find page settings', async () => {
      agentSettingsAccessor.getAgentSettings.mock.fakeResolvedValue(null);
      await expect(
        delegatorOptions.verifyCredential({
          agent: { page: '12345', name: 'jojodoe123' },
          user: '67890',
        })
      ).resolves.toMatchInlineSnapshot(`
        {
          "code": 404,
          "ok": false,
          "reason": "page "12345" not registered",
        }
      `);
    });

    it('fail if fail to get user profile', async () => {
      profiler.getUserProfile.mock.fakeRejectedValue(
        new MetaApiError({
          error: { code: 404, message: 'user not found' } as never,
        })
      );
      await expect(
        delegatorOptions.verifyCredential({
          agent: { page: '12345', name: 'jojodoe123' },
          user: '67890',
        })
      ).resolves.toMatchInlineSnapshot(`
        {
          "code": 404,
          "ok": false,
          "reason": "user "67890" not found or not authorized",
        }
      `);
    });
  });
});

test('.getAuthUrl(id, path)', async () => {
  const user = new InstagramUser('12345', '67890');

  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    agentSettingsAccessor
  );
  await expect(authenticator.getAuthUrl(user)).resolves.toBe(loginUrl);
  await expect(authenticator.getAuthUrl(user, '/foo?bar=baz')).resolves.toBe(
    loginUrl
  );

  expect(basicAuthenticator.getAuthUrl).toHaveBeenCalledTimes(2);
  expect(basicAuthenticator.getAuthUrl).toHaveBeenNthCalledWith(
    1,
    'instagram',
    { agent: { page: '12345', name: 'jojodoe123' }, user: '67890' },
    undefined
  );
  expect(basicAuthenticator.getAuthUrl).toHaveBeenNthCalledWith(
    2,
    'instagram',
    { agent: { page: '12345', name: 'jojodoe123' }, user: '67890' },
    '/foo?bar=baz'
  );
});

test('.verifyCredential() fails anyway', async () => {
  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    agentSettingsAccessor
  );
  await expect(authenticator.verifyCredential()).resolves
    .toMatchInlineSnapshot(`
    {
      "code": 403,
      "ok": false,
      "reason": "should use backend based flow only",
    }
  `);
});

describe('.verifyRefreshment(data)', () => {
  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    agentSettingsAccessor
  );

  test('returns ok when verification passed', async () => {
    await expect(
      authenticator.verifyRefreshment({
        agent: { page: '12345', name: 'jojodoe123' },
        user: '67890',
      })
    ).resolves.toEqual({
      ok: true,
      data: {
        agent: { page: '12345', name: 'jojodoe123' },
        user: '67890',
        profile: profileData,
      },
    });

    expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledTimes(1);
    expect(agentSettingsAccessor.getAgentSettings).toHaveBeenCalledWith(
      new InstagramPage('12345')
    );

    expect(profiler.getUserProfile).toHaveBeenCalledTimes(1);
    expect(profiler.getUserProfile).toHaveBeenCalledWith(
      new InstagramPage('12345'),
      new InstagramUser(pageId, '67890')
    );
  });

  it('fails if page not found', async () => {
    agentSettingsAccessor.getAgentSettings.mock.fakeResolvedValue(null);
    await expect(
      authenticator.verifyRefreshment({
        agent: { page: '54321', name: 'foooo' },
        user: '67890',
      })
    ).resolves.toMatchInlineSnapshot(`
      {
        "code": 404,
        "ok": false,
        "reason": "page "54321" not registered",
      }
    `);
  });
});

test('.checkAuthData(data)', () => {
  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    agentSettingsAccessor
  );

  expect(
    authenticator.checkAuthData({
      agent: { page: '12345', name: 'jojodoe123' },
      user: '67890',
      profile: profileData,
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      pageId,
      channel: new InstagramPage('12345', 'jojodoe123'),
      thread: new InstagramChat('12345', { id: '67890' }),
      user: new InstagramUser('12345', '67890'),
      userProfile: new UserProfile(profileData),
    },
  });

  expect(
    authenticator.checkAuthData({
      agent: { page: '98765', name: 'jojodoe123' },
      user: '43210',
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      pageId: '98765',
      channel: new InstagramPage('98765', 'jojodoe123'),
      thread: new InstagramChat('98765', { id: '43210' }),
      user: new InstagramUser('98765', '43210'),
      userProfile: null,
    },
  });
});
