import moxy from '@moxyjs/moxy';
import TwitterUser from '../../User';
import TwitterChat from '../../Chat';
import ClientAuthenticator from '../ClientAuthenticator';

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

const authenticator = new ClientAuthenticator({ agentId: '12345' });

it('.init() do nothing', async () => {
  await expect(authenticator.init()).resolves.toBe(undefined);
});

it('.fetchCredential() always reject', async () => {
  await expect(authenticator.fetchCredential()).resolves.toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "should only initiate from backend",
          }
        `);
});

it('.closeWebview() redirect to twitter chat deep link in mobile devices', () => {
  expect(authenticator.closeWebview()).toBe(false);
  expect(location.mock.setter('href')).not.toHaveBeenCalled();

  navigator.mock
    .getter('userAgent')
    .fakeReturnValue(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1'
    );
  expect(authenticator.closeWebview()).toBe(true);
  expect(location.mock.setter('href')).toHaveBeenCalledTimes(1);
  expect(location.mock.setter('href').calls[0].args[0]).toMatchInlineSnapshot(
    `"https://twitter.com/messages/compose?recipient_id=12345"`
  );
});

test('.checkAuthData(data)', () => {
  expect(authenticator.checkAuthData({ agent: '12345', id: '67890' })).toEqual({
    ok: true,
    contextDetails: {
      agentId: '12345',
      thread: new TwitterChat('12345', '67890'),
      user: new TwitterUser('67890'),
    },
  });

  expect(authenticator.checkAuthData({ agent: '54321', id: '67890' }))
    .toMatchInlineSnapshot(`
          Object {
            "code": 400,
            "ok": false,
            "reason": "agent not match",
          }
        `);
});
