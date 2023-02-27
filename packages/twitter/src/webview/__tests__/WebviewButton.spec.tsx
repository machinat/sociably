import moxy from '@moxyjs/moxy';
import TwitterChat from '../../Chat';
import TweetTarget from '../../TweetTarget';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewButton from '../WebviewButton';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrl: () =>
    'https://sociably.io/foo/auth/twitter?login=__LOGIN_TOKEN__',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', () => {
  expect(
    WebviewButton(
      authenticator,
      new TwitterChat('12345', '67890')
    )({ label: 'Foo' })
  ).toMatchInlineSnapshot(`
    <UrlButton
      label="Foo"
      url="https://sociably.io/foo/auth/twitter?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButton(
      authenticator,
      new TwitterChat('12345', '67890')
    )({ label: 'Foo', page: '/foo?bar=baz' })
  ).toMatchInlineSnapshot(`
    <UrlButton
      label="Foo"
      url="https://sociably.io/foo/auth/twitter?login=__LOGIN_TOKEN__"
    />
  `);

  expect(authenticator.getAuthUrl).toHaveBeenCalledTimes(2);
  expect(authenticator.getAuthUrl).toHaveBeenNthCalledWith(
    1,
    '67890',
    undefined
  );
  expect(authenticator.getAuthUrl).toHaveBeenNthCalledWith(
    2,
    '67890',
    'foo?bar=baz'
  );
});

test('rendering to null if channel is not a TwitterChat', () => {
  expect(WebviewButton(authenticator, null)({ label: 'Foo' })).toBe(null);
  expect(
    WebviewButton(authenticator, null)({ label: 'Foo', page: '/foo' })
  ).toBe(null);
  expect(
    WebviewButton(authenticator, new TweetTarget('12345'))({ label: 'Foo' })
  ).toBe(null);

  expect(authenticator.getAuthUrl).not.toHaveBeenCalled();
});
