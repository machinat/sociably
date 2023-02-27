import moxy from '@moxyjs/moxy';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewButton from '../WebviewButton';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrl: () => 'https://sociably.io/foo/auth/telegram',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', () => {
  expect(WebviewButton(authenticator)({ text: 'Foo' })).toMatchInlineSnapshot(`
    <UrlButton
      login={true}
      text="Foo"
      url="https://sociably.io/foo/auth/telegram"
    />
  `);
  expect(
    WebviewButton(authenticator)({
      text: 'Foo',
      botUserName: 'FooBot',
      forwardText: 'Hello World',
      requestWriteAccess: true,
    })
  ).toMatchInlineSnapshot(`
    <UrlButton
      botUserName="FooBot"
      forwardText="Hello World"
      login={true}
      requestWriteAccess={true}
      text="Foo"
      url="https://sociably.io/foo/auth/telegram"
    />
  `);

  authenticator.getAuthUrl.mock.fakeReturnValue(
    'https://sociably.io/foo/auth/telegram?redirectUrl=foo%3Fbar%3Dbaz'
  );
  expect(WebviewButton(authenticator)({ text: 'Foo', page: '/foo?bar=baz' }))
    .toMatchInlineSnapshot(`
    <UrlButton
      login={true}
      text="Foo"
      url="https://sociably.io/foo/auth/telegram?redirectUrl=foo%3Fbar%3Dbaz"
    />
  `);

  expect(authenticator.getAuthUrl).toHaveBeenCalledTimes(3);
  expect(authenticator.getAuthUrl).toHaveBeenNthCalledWith(3, 'foo?bar=baz');
});
