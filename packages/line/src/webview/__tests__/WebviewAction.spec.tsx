import { moxy } from '@moxyjs/moxy';
import ServerAuthenticator from '../ServerAuthenticator.js';
import WebviewAction from '../WebviewAction.js';
import LineChat from '../../Chat.js';

const authenticator = moxy<ServerAuthenticator>({
  getLiffUrl: () => `https://liff.line.me/1234567890-AaBbCcDd/`,
} as never);

beforeEach(() => {
  authenticator.mock.reset();
});

test('rendering to UrlButton', async () => {
  const chat = new LineChat('_CHANNEL_ID_', 'user', '_USER_ID_');

  await expect(WebviewAction(authenticator, chat)({ label: 'Foo' })).resolves
    .toMatchInlineSnapshot(`
    <UriAction
      label="Foo"
      uri="https://liff.line.me/1234567890-AaBbCcDd/"
    />
  `);

  authenticator.getLiffUrl.mock.fakeReturnValue(
    `https://liff.line.me/1234567890-AaBbCcDd/foo?bar=baz`
  );
  await expect(
    WebviewAction(authenticator, chat)({ label: 'Foo', page: '/foo?bar=baz' })
  ).resolves.toMatchInlineSnapshot(`
    <UriAction
      label="Foo"
      uri="https://liff.line.me/1234567890-AaBbCcDd/foo?bar=baz"
    />
  `);

  expect(authenticator.getLiffUrl).toHaveBeenCalledTimes(2);
  expect(authenticator.getLiffUrl).toHaveBeenNthCalledWith(
    1,
    chat.channel,
    undefined,
    chat
  );
  expect(authenticator.getLiffUrl).toHaveBeenNthCalledWith(
    2,
    chat.channel,
    '/foo?bar=baz',
    chat
  );
});
