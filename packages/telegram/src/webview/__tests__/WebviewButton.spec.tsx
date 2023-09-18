import moxy from '@moxyjs/moxy';
import ServerAuthenticator from '../ServerAuthenticator.js';
import TelegramChat from '../../Chat.js';
import TelegramUser from '../../User.js';
import WebviewButton from '../WebviewButton.js';

const authenticator = moxy<ServerAuthenticator>({
  getAuthUrl: () => 'https://sociably.io/foo/auth/telegram',
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

it('render to UrlButton', () => {
  expect(
    WebviewButton(
      authenticator,
      new TelegramChat(12345, 67890),
    )({ text: 'Foo' }),
  ).toMatchInlineSnapshot(`
    <UrlButton
      login={true}
      text="Foo"
      url="https://sociably.io/foo/auth/telegram"
    />
  `);
  expect(
    WebviewButton(
      authenticator,
      new TelegramChat(12345, 67890),
    )({
      text: 'Foo',
      botUserName: 'FooBot',
      forwardText: 'Hello World',
      requestWriteAccess: true,
    }),
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
    'https://sociably.io/foo/auth/telegram?redirectUrl=foo%3Fbar%3Dbaz',
  );
  expect(
    WebviewButton(
      authenticator,
      new TelegramChat(12345, 67890),
    )({ text: 'Foo', page: '/foo?bar=baz' }),
  ).toMatchInlineSnapshot(`
    <UrlButton
      login={true}
      text="Foo"
      url="https://sociably.io/foo/auth/telegram?redirectUrl=foo%3Fbar%3Dbaz"
    />
  `);

  expect(authenticator.getAuthUrl).toHaveBeenCalledTimes(3);
  expect(authenticator.getAuthUrl).toHaveBeenNthCalledWith(
    1,
    12345,
    67890,
    undefined,
  );
  expect(authenticator.getAuthUrl).toHaveBeenNthCalledWith(
    3,
    12345,
    67890,
    'foo?bar=baz',
  );
});

it('throw error if RenderingTarget is not TelegramChat', () => {
  expect(() =>
    WebviewButton(authenticator, null)({ text: 'Foo' }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"WebviewButton can only be used in TelegramChat"`,
  );
  expect(() =>
    WebviewButton(
      authenticator,
      new TelegramUser(12345, true),
    )({ text: 'Foo' }),
  ).toThrowErrorMatchingInlineSnapshot(
    `"WebviewButton can only be used in TelegramChat"`,
  );
});
