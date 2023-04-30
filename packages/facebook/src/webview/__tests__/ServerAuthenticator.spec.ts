import moxy from '@moxyjs/moxy';
import BasicAuthenticator, {
  AuthDelegatorOptions,
} from '@sociably/auth/basicAuth';
import { MetaApiError } from '@sociably/meta-api';
import FacebookBot from '../../Bot';
import FacebookProfiler from '../../Profiler';
import FacebookPage from '../../Page';
import FacebookUser from '../../User';
import FacebookChat from '../../Chat';
import UserProfile from '../../UserProfile';
import ServerAuthenticator from '../ServerAuthenticator';
import { FacebookAuthCredential, FacebookAuthData } from '../types';
import { FacebookThread } from '../../types';

const bot = moxy<FacebookBot>({
  pageId: '12345',
} as never);

const profileData = {
  id: '67890',
  name: 'Jphn Doe',
  first_name: 'John',
  last_name: 'Doe',
  profile_pic: 'https://...',
};
const profiler = moxy<FacebookProfiler>({
  getUserProfile: async () => new UserProfile(profileData),
} as never);

const requestDelegator = moxy(async () => {});
const loginUrl = `https://sociably.io/foo/auth/facebook?login=__LOGIN_TOKEN__`;

const basicAuthenticator = moxy<BasicAuthenticator>({
  getAuthUrl() {
    return loginUrl;
  },
  createRequestDelegator() {
    return requestDelegator;
  },
} as never);

const pageSettings = { pageId: '12345', accessToken: '_ACCESS_TOKEN_' };
const pageSettingsAccessor = moxy({
  getChannelSettings: async () => pageSettings,
  getChannelSettingsBatch: async () => [pageSettings],
  listAllChannelSettings: async () => [pageSettings],
});

beforeEach(() => {
  profiler.mock.reset();
  requestDelegator.mock.reset();
  basicAuthenticator.mock.reset();
  pageSettingsAccessor.mock.reset();
});

describe('.delegateAuthRequest(req, res, routing)', () => {
  const req = moxy();
  const res = moxy();
  const routing = {
    originalPath: '/auth/facebook/login',
    matchedPath: '/auth/facebook',
    trailingPath: 'login',
  };

  let authenticator: ServerAuthenticator;
  let delegatorOptions: AuthDelegatorOptions<
    FacebookAuthCredential,
    FacebookAuthData,
    FacebookThread
  >;
  beforeEach(() => {
    authenticator = new ServerAuthenticator(
      bot,
      profiler,
      basicAuthenticator,
      pageSettingsAccessor
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
          Object {
            "bot": Object {
              "pageId": "12345",
            },
            "checkAuthData": [Function],
            "getChatLink": [Function],
            "platform": "facebook",
            "platformColor": "#4B69FF",
            "platformImageUrl": "https://sociably.js.org/img/icon/messenger.png",
            "platformName": "Facebook",
            "verifyCredential": [Function],
          }
      `);

    expect(
      delegatorOptions.getChatLink(new FacebookChat('12345', { id: '67890' }), {
        page: '12345',
        user: '67890',
      })
    ).toBe('https://m.me/12345');

    expect(
      delegatorOptions.checkAuthData({
        page: '12345',
        user: '67890',
        profile: profileData,
      })
    ).toEqual({
      ok: true,
      thread: new FacebookChat('12345', { id: '67890' }),
      data: { page: '12345', user: '67890', profile: profileData },
    });
  });

  describe('options.verifyCredential', () => {
    it('return ok when verification passed', async () => {
      await expect(
        delegatorOptions.verifyCredential({ page: '12345', user: '67890' })
      ).resolves.toEqual({
        ok: true,
        data: { page: '12345', user: '67890', profile: profileData },
      });

      expect(pageSettingsAccessor.getChannelSettings).toHaveBeenCalledTimes(1);
      expect(pageSettingsAccessor.getChannelSettings).toHaveBeenCalledWith(
        new FacebookPage('12345')
      );

      expect(profiler.getUserProfile).toHaveBeenCalledTimes(1);
      expect(profiler.getUserProfile).toHaveBeenCalledWith(
        new FacebookPage('12345'),
        new FacebookUser('12345', '67890')
      );
    });

    it('fail if fail to find page settings', async () => {
      pageSettingsAccessor.getChannelSettings.mock.fakeResolvedValue(null);
      await expect(
        delegatorOptions.verifyCredential({ page: '12345', user: '67890' })
      ).resolves.toMatchInlineSnapshot(`
              Object {
                "code": 404,
                "ok": false,
                "reason": "page \\"12345\\" not registered",
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
        delegatorOptions.verifyCredential({ page: '12345', user: '67890' })
      ).resolves.toMatchInlineSnapshot(`
              Object {
                "code": 404,
                "ok": false,
                "reason": "user \\"67890\\" not found or not authorized",
              }
            `);
    });
  });
});

test('.getAuthUrl(id, path)', () => {
  const user = new FacebookUser('12345', '67890');

  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    pageSettingsAccessor
  );
  expect(authenticator.getAuthUrl(user)).toBe(loginUrl);
  expect(authenticator.getAuthUrl(user, '/foo?bar=baz')).toBe(loginUrl);

  expect(basicAuthenticator.getAuthUrl).toHaveBeenCalledTimes(2);
  expect(basicAuthenticator.getAuthUrl).toHaveBeenNthCalledWith(
    1,
    'facebook',
    { page: '12345', user: '67890' },
    undefined
  );
  expect(basicAuthenticator.getAuthUrl).toHaveBeenNthCalledWith(
    2,
    'facebook',
    { page: '12345', user: '67890' },
    '/foo?bar=baz'
  );
});

test('.verifyCredential() fails anyway', async () => {
  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    pageSettingsAccessor
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

describe('.verifyRefreshment(data)', () => {
  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    pageSettingsAccessor
  );

  test('returns ok when verification passed', async () => {
    await expect(
      authenticator.verifyRefreshment({ page: '12345', user: '67890' })
    ).resolves.toEqual({
      ok: true,
      data: { page: '12345', user: '67890', profile: profileData },
    });

    expect(pageSettingsAccessor.getChannelSettings).toHaveBeenCalledTimes(1);
    expect(pageSettingsAccessor.getChannelSettings).toHaveBeenCalledWith(
      new FacebookPage('12345')
    );

    expect(profiler.getUserProfile).toHaveBeenCalledTimes(1);
    expect(profiler.getUserProfile).toHaveBeenCalledWith(
      new FacebookPage('12345'),
      new FacebookUser('12345', '67890')
    );
  });

  it('fails if page not found', async () => {
    pageSettingsAccessor.getChannelSettings.mock.fakeResolvedValue(null);
    await expect(
      authenticator.verifyRefreshment({ page: '54321', user: '67890' })
    ).resolves.toMatchInlineSnapshot(`
            Object {
              "code": 404,
              "ok": false,
              "reason": "page \\"54321\\" not registered",
            }
          `);
  });
});

test('.checkAuthData(data)', () => {
  const authenticator = new ServerAuthenticator(
    bot,
    profiler,
    basicAuthenticator,
    pageSettingsAccessor
  );

  expect(
    authenticator.checkAuthData({
      page: '12345',
      user: '67890',
      profile: profileData,
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      pageId: '12345',
      channel: new FacebookPage('12345'),
      thread: new FacebookChat('12345', { id: '67890' }),
      user: new FacebookUser('12345', '67890'),
      userProfile: new UserProfile(profileData),
    },
  });

  expect(authenticator.checkAuthData({ page: '98765', user: '43210' })).toEqual(
    {
      ok: true,
      contextDetails: {
        pageId: '98765',
        channel: new FacebookPage('98765'),
        thread: new FacebookChat('98765', { id: '43210' }),
        user: new FacebookUser('98765', '43210'),
        userProfile: null,
      },
    }
  );
});
