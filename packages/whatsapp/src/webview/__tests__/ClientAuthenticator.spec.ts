import { moxy } from '@moxyjs/moxy';
import WhatsAppAgent from '../../Agent.js';
import WhatsAppUser from '../../User.js';
import WhatsAppChat from '../../Chat.js';
import UserProfile from '../../UserProfile.js';
import ClientAuthenticator from '../ClientAuthenticator.js';

const location = moxy({});
const navigator = moxy({
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0',
});
const window = { location, navigator };

beforeAll(() => {
  global.window = window as never;
});
afterAll(() => {
  global.window = undefined as never;
});
beforeEach(() => {
  location.mock.reset();
  navigator.mock.reset();
});

const authenticator = new ClientAuthenticator();

test('attributes', () => {
  expect(authenticator.platform).toBe('whatsapp');
  expect(authenticator.marshalTypes).toEqual(
    expect.arrayContaining([
      WhatsAppAgent,
      WhatsAppUser,
      WhatsAppChat,
      UserProfile,
    ])
  );
});

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

describe('.closeWebview()', () => {
  const authContext = {
    platform: 'whatsapp' as const,
    agentNumber: '+1234567890',
    channel: new WhatsAppAgent('1111111111'),
    thread: new WhatsAppChat('1111111111', '9876543210'),
    user: new WhatsAppUser('9876543210'),
    userProfile: null,
    loginAt: new Date(),
    expireAt: new Date(Date.now() + 9999),
  };

  it('redirect to ma.me chat link in mobile devices when login', () => {
    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
      );

    expect(authenticator.closeWebview(null)).toBe(false);
    expect(location.mock.setter('href')).not.toHaveBeenCalled();

    expect(authenticator.closeWebview(authContext)).toBe(true);
    expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
    expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
      `"https://wa.me/1234567890"`
    );
  });

  it('always return false in computer browser', () => {
    navigator.mock
      .getter('userAgent')
      .fakeReturnValue(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X x.y; rv:42.0) Gecko/20100101 Firefox/42.0'
      );

    expect(authenticator.closeWebview(null)).toBe(false);
    expect(authenticator.closeWebview(authContext)).toBe(false);
    expect(location.mock.setter('href')).not.toHaveBeenCalled();
  });
});

test('.checkAuthData(data)', () => {
  expect(
    authenticator.checkAuthData({
      agent: { id: '1111111111', num: '+1234567890' },
      user: '9876543210',
    })
  ).toEqual({
    ok: true,
    contextDetails: {
      agentNumber: '+1234567890',
      channel: new WhatsAppAgent('1111111111'),
      thread: new WhatsAppChat('1111111111', '9876543210'),
      user: new WhatsAppUser('9876543210'),
    },
  });
});
