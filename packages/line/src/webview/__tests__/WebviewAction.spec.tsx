import moxy from '@moxyjs/moxy';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewAction from '../WebviewAction';

const authenticator = moxy<ServerAuthenticator>({
  getWebviewUrl: () => `https://machinat.io/MyApp/webview?platform=line`,
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', () => {
  expect(WebviewAction(authenticator)({ label: 'Foo' })).toMatchInlineSnapshot(`
    <UriAction
      label="Foo"
      uri="https://machinat.io/MyApp/webview?platform=line"
    />
  `);

  authenticator.getWebviewUrl.mock.fakeReturnValue(
    `https://machinat.io/MyApp/webview/foo?bar=baz&platform=line`
  );
  expect(WebviewAction(authenticator)({ label: 'Foo', page: '/foo?bar=baz' }))
    .toMatchInlineSnapshot(`
    <UriAction
      label="Foo"
      uri="https://machinat.io/MyApp/webview/foo?bar=baz&platform=line"
    />
  `);

  expect(authenticator.getWebviewUrl.mock).toHaveBeenCalledTimes(2);
  expect(authenticator.getWebviewUrl.mock).toHaveBeenNthCalledWith(
    2,
    'foo?bar=baz'
  );
});
