import { moxy } from '@moxyjs/moxy';
import InstagramPage from '../../Page.js';
import InstagramUser from '../../User.js';
import InstagramChat from '../../Chat.js';
import UserProfile from '../../UserProfile.js';
import ClientAuthenticator from '../ClientAuthenticator.js';

const location = moxy({});
const navigator = moxy({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
});
const window = { location, navigator };

beforeAll(() => {
  global.window = window as any;
});
afterAll(() => {
  global.window = undefined as any;
});
beforeEach(() => {
  location.mock.reset();
  navigator.mock.reset();
});

const authenticator = new ClientAuthenticator();

test('.init() do nothing', async () => {
  await expect(authenticator.init()).resolves.toEqual({ forceSignIn: false });
});

test('.fetchCredential() always reject', async () => {
  await expect(authenticator.fetchCredential()).resolves.toMatchInlineSnapshot(`
    {
      "code": 400,
      "ok": false,
      "reason": "should only initiate from backend",
    }
  `);
});

describe('.closeWebview()', () => {
  const authContext = {
    platform: 'instagram' as const,
    pageId: '12345',
    agentUsername: 'jojodoe123',
    channel: new InstagramPage('12345', 'jojodoe123'),
    thread: new InstagramChat('12345', { id: '67890' }),
    user: new InstagramUser('12345', '67890'),
    userProfile: null,
    loginAt: new Date(),
    expireAt: new Date(Date.now() + 9999),
  };

  it('go to ig.me link in mobile devices', () => {
    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
      );
    expect(authenticator.closeWebview(authContext)).toBe(true);
    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
      `"https://ig.me/m/jojodoe123"`
    );
  });

  it('return false if no auth context available yet', () => {
    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
      );
    expect(authenticator.closeWebview(null)).toBe(false);
    expect(location.mock.setter('href')).not.toHaveBeenCalled();
  });

  it('return false in desktop devices', () => {
    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0'
      );
    expect(authenticator.closeWebview(authContext)).toBe(false);
    expect(location.mock.setter('href')).not.toHaveBeenCalled();
  });
});

test('.checkAuthData(data)', () => {
  expect(
    authenticator.checkAuthData({
      agent: { page: '12345', name: 'jojodoe123' },
      user: '67890',
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      pageId: '12345',
      agentUsername: 'jojodoe123',
      channel: new InstagramPage('12345', 'jojodoe123'),
      thread: new InstagramChat('12345', { id: '67890' }),
      user: new InstagramUser('12345', '67890'),
      userProfile: null,
    },
  });

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
  expect(
    authenticator.checkAuthData({
      agent: { page: '98765', name: 'janedoe123' },
      user: '43210',
      profile: profileData,
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      pageId: '98765',
      agentUsername: 'janedoe123',
      channel: new InstagramPage('98765', 'janedoe123'),
      thread: new InstagramChat('98765', { id: '43210' }),
      user: new InstagramUser('98765', '43210'),
      userProfile: new UserProfile(profileData),
    },
  });
});
