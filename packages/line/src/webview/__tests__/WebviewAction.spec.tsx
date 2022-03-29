import moxy from '@moxyjs/moxy';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewAction from '../WebviewAction';

const authenticator = moxy<ServerAuthenticator>({
  getLiffUrl: () => `https://liff.line.me/1234567890-AaBbCcDd/`,
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', () => {
  expect(WebviewAction(authenticator)({ label: 'Foo' })).toMatchInlineSnapshot(`
    <UriAction
      label="Foo"
      uri="https://liff.line.me/1234567890-AaBbCcDd/"
    />
  `);

  authenticator.getLiffUrl.mock.fakeReturnValue(
    `https://liff.line.me/1234567890-AaBbCcDd/foo?bar=baz`
  );
  expect(WebviewAction(authenticator)({ label: 'Foo', page: '/foo?bar=baz' }))
    .toMatchInlineSnapshot(`
    <UriAction
      label="Foo"
      uri="https://liff.line.me/1234567890-AaBbCcDd/foo?bar=baz"
    />
  `);

  expect(authenticator.getLiffUrl.mock).toHaveBeenCalledTimes(2);
  expect(authenticator.getLiffUrl.mock).toHaveBeenNthCalledWith(
    2,
    '/foo?bar=baz'
  );
});
