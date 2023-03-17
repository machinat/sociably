import moxy from '@moxyjs/moxy';
import FacebookChat from '../../Chat';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewButton from '../WebviewButton';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrl: () =>
    'https://sociably.io/foo/auth/facebook?login=__LOGIN_TOKEN__',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', () => {
  expect(
    WebviewButton(
      authenticator,
      new FacebookChat('12345', { id: '67890' })
    )({ title: 'Foo' })
  ).toMatchInlineSnapshot(`
    <UrlButton
      title="Foo"
      url="https://sociably.io/foo/auth/facebook?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButton(
      authenticator,
      new FacebookChat('12345', { id: '67890' })
    )({ title: 'Foo', webviewHeightRatio: 'compact', hideShareButton: true })
  ).toMatchInlineSnapshot(`
    <UrlButton
      hideShareButton={true}
      title="Foo"
      url="https://sociably.io/foo/auth/facebook?login=__LOGIN_TOKEN__"
      webviewHeightRatio="compact"
    />
  `);

  expect(
    WebviewButton(
      authenticator,
      new FacebookChat('12345', { id: '67890' })
    )({ title: 'Foo', page: '/foo?bar=baz' })
  ).toMatchInlineSnapshot(`
    <UrlButton
      title="Foo"
      url="https://sociably.io/foo/auth/facebook?login=__LOGIN_TOKEN__"
    />
  `);

  expect(authenticator.getAuthUrl).toHaveBeenCalledTimes(3);
  expect(authenticator.getAuthUrl).toHaveBeenCalledWith('67890', undefined);
  expect(authenticator.getAuthUrl).toHaveBeenNthCalledWith(
    3,
    '67890',
    'foo?bar=baz'
  );
});

test('rendering to null if thread is not a FacebookChat', () => {
  expect(WebviewButton(authenticator, null)({ title: 'Foo' })).toBe(null);
  expect(
    WebviewButton(authenticator, null)({ title: 'Foo', page: '/foo' })
  ).toBe(null);
  expect(
    WebviewButton(authenticator, { platform: 'test', uid: 'test.foo' })({
      title: 'Foo',
    })
  ).toBe(null);

  expect(authenticator.getAuthUrl).not.toHaveBeenCalled();
});
