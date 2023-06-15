import { moxy } from '@moxyjs/moxy';
import TwitterUser from '../../User.js';
import TwitterChat from '../../Chat.js';
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

const rawUserData = {
  id: 9876543210,
  id_str: '9876543210',
  name: 'John Doe',
} as never;

it('.init() do nothing', async () => {
  await expect(authenticator.init()).resolves.toEqual({ forceSignIn: false });
});

it('.fetchCredential() always reject', async () => {
  await expect(authenticator.fetchCredential()).resolves.toMatchInlineSnapshot(`
    {
      "code": 400,
      "ok": false,
      "reason": "should only initiate from backend",
    }
  `);
});

it('.closeWebview() redirect to twitter chat deep link in mobile devices', () => {
  const authContext = {
    platform: 'twitter' as const,
    agentId: '12345',
    channel: new TwitterUser('1234567890'),
    thread: new TwitterChat('1234567890', '9876543210'),
    user: new TwitterUser('9876543210'),
    userProfile: new UserProfile(rawUserData),
    loginAt: new Date(),
    expireAt: new Date(),
  };

  expect(authenticator.closeWebview(null)).toBe(false);
  expect(authenticator.closeWebview(authContext)).toBe(false);
  expect(location.mock.setter('href')).not.toHaveBeenCalled();

  navigator.mock
    .getter('userAgent')
    .fakeReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    );

  expect(authenticator.closeWebview(null)).toBe(false);
  expect(authenticator.closeWebview(authContext)).toBe(true);

  expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
  expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
    `"https://twitter.com/messages/compose?recipient_id=12345"`
  );
});

test('.checkAuthData(data)', () => {
  expect(
    authenticator.checkAuthData({
      agent: '1234567890',
      user: { id: '9876543210', data: rawUserData },
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      agentId: '1234567890',
      channel: new TwitterUser('1234567890'),
      thread: new TwitterChat('1234567890', '9876543210'),
      user: new TwitterUser('9876543210', rawUserData),
      userProfile: new UserProfile(rawUserData),
    },
  });
});
