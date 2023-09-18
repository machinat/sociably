import moxy from '@moxyjs/moxy';
import WhatsAppChat from '../../Chat.js';
import ServerAuthenticator from '../ServerAuthenticator.js';
import WebviewButtonParam from '../WebviewButtonParam.js';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrlPostfix: () => '/foo/auth/whatsapp?login=__LOGIN_TOKEN__',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButtonParam', () => {
  expect(
    WebviewButtonParam(
      authenticator,
      new WhatsAppChat('1234567890', '9876543210'),
    )({}),
  ).toMatchInlineSnapshot(`
    <UrlButtonParam
      urlPostfix="/foo/auth/whatsapp?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButtonParam(
      authenticator,
      new WhatsAppChat('1234567890', '9876543210'),
    )({ page: '/foo?bar=baz' }),
  ).toMatchInlineSnapshot(`
    <UrlButtonParam
      urlPostfix="/foo/auth/whatsapp?login=__LOGIN_TOKEN__"
    />
  `);

  expect(
    WebviewButtonParam(
      authenticator,
      new WhatsAppChat('1234567890', '9876543210'),
    )({ page: '/foo?bar=baz', index: 1 }),
  ).toMatchInlineSnapshot(`
    <UrlButtonParam
      index={1}
      urlPostfix="/foo/auth/whatsapp?login=__LOGIN_TOKEN__"
    />
  `);

  expect(authenticator.getAuthUrlPostfix).toHaveBeenCalledTimes(3);
  expect(authenticator.getAuthUrlPostfix).toHaveBeenCalledWith(
    new WhatsAppChat('1234567890', '9876543210'),
    undefined,
  );
  expect(authenticator.getAuthUrlPostfix).toHaveBeenNthCalledWith(
    2,
    new WhatsAppChat('1234567890', '9876543210'),
    'foo?bar=baz',
  );
});

test('throw if thread is not a WhatsAppChat', () => {
  expect(() =>
    WebviewButtonParam(authenticator, null)({}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"WebviewButtonParam can only be used in WhatsAppChat"`,
  );
  expect(() =>
    WebviewButtonParam(authenticator, null)({ page: '/foo' }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"WebviewButtonParam can only be used in WhatsAppChat"`,
  );
  const wrongThread = {
    platform: 'test',
    uid: 'test.foo',
    uniqueIdentifier: { platform: 'test', id: 'foo' },
  };
  expect(() =>
    WebviewButtonParam(authenticator, wrongThread)({}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"WebviewButtonParam can only be used in WhatsAppChat"`,
  );

  expect(authenticator.getAuthUrlPostfix).not.toHaveBeenCalled();
});
