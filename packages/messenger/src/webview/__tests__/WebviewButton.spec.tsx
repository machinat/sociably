import moxy from '@moxyjs/moxy';
import MessengerChat from '../../Chat';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewButton from '../WebviewButton';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrl: () =>
    'https://machinat.io/foo/auth/twitter?login=__LOGIN_TOKEN__',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', () => {
  expect(
    WebviewButton(
      authenticator,
      new MessengerChat('12345', '67890')
    )({ title: 'Foo' })
  ).toMatchInlineSnapshot(`
    <UrlButton
      title="Foo"
      url="https://machinat.io/foo/auth/twitter?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButton(
      authenticator,
      new MessengerChat('12345', '67890')
    )({ title: 'Foo', webviewHeightRatio: 'compact', hideShareButton: true })
  ).toMatchInlineSnapshot(`
    <UrlButton
      hideShareButton={true}
      title="Foo"
      url="https://machinat.io/foo/auth/twitter?login=__LOGIN_TOKEN__"
      webviewHeightRatio="compact"
    />
  `);

  expect(
    WebviewButton(
      authenticator,
      new MessengerChat('12345', '67890')
    )({ title: 'Foo', page: '/foo?bar=baz' })
  ).toMatchInlineSnapshot(`
    <UrlButton
      title="Foo"
      url="https://machinat.io/foo/auth/twitter?login=__LOGIN_TOKEN__"
    />
  `);

  expect(authenticator.getAuthUrl.mock).toHaveBeenCalledTimes(3);
  expect(authenticator.getAuthUrl.mock).toHaveBeenCalledWith(
    '67890',
    undefined
  );
  expect(authenticator.getAuthUrl.mock).toHaveBeenNthCalledWith(
    3,
    '67890',
    'foo?bar=baz'
  );
});

test('rendering to null if channel is not a MessengerChat', () => {
  expect(WebviewButton(authenticator, null)({ title: 'Foo' })).toBe(null);
  expect(
    WebviewButton(authenticator, null)({ title: 'Foo', page: '/foo' })
  ).toBe(null);
  expect(
    WebviewButton(authenticator, { platform: 'test', uid: 'test.foo' })({
      title: 'Foo',
    })
  ).toBe(null);

  expect(authenticator.getAuthUrl.mock).not.toHaveBeenCalled();
});
