import moxy from '@moxyjs/moxy';
import WhatsAppChat from '../../Chat';
import ServerAuthenticator from '../ServerAuthenticator';
import WebviewButtonParam from '../WebviewButtonParam';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrlSuffix: () => '/foo/auth/whatsapp?login=__LOGIN_TOKEN__',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButtonParam', () => {
  expect(
    WebviewButtonParam(
      authenticator,
      new WhatsAppChat('1234567890', '9876543210')
    )({})
  ).toMatchInlineSnapshot(`
    <UrlButtonParam
      urlSuffix="/foo/auth/whatsapp?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButtonParam(
      authenticator,
      new WhatsAppChat('1234567890', '9876543210')
    )({ page: '/foo?bar=baz' })
  ).toMatchInlineSnapshot(`
    <UrlButtonParam
      urlSuffix="/foo/auth/whatsapp?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButtonParam(
      authenticator,
      new WhatsAppChat('1234567890', '9876543210')
    )({ page: '/foo?bar=baz', index: 1 })
  ).toMatchInlineSnapshot(`
    <UrlButtonParam
      index={1}
      urlSuffix="/foo/auth/whatsapp?login=__LOGIN_TOKEN__"
    />
  `);

  expect(authenticator.getAuthUrlSuffix.mock).toHaveBeenCalledTimes(3);
  expect(authenticator.getAuthUrlSuffix.mock).toHaveBeenCalledWith(
    '9876543210',
    undefined
  );
  expect(authenticator.getAuthUrlSuffix.mock).toHaveBeenNthCalledWith(
    2,
    '9876543210',
    'foo?bar=baz'
  );
});

test('rendering to null if channel is not a WhatsAppChat', () => {
  expect(WebviewButtonParam(authenticator, null)({})).toBe(null);
  expect(WebviewButtonParam(authenticator, null)({ page: '/foo' })).toBe(null);
  expect(
    WebviewButtonParam(authenticator, { platform: 'test', uid: 'test.foo' })({})
  ).toBe(null);

  expect(authenticator.getAuthUrlSuffix.mock).not.toHaveBeenCalled();
});
