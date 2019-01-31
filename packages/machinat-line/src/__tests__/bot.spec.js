import { WebhookConnector } from 'machinat-base';
import LineBot from '../bot';
import Client from '../client';

it('throws if accessToken not given', () => {
  expect(() => new LineBot()).toThrowErrorMatchingInlineSnapshot(
    `"should provide accessToken to send messenge"`
  );
});

it('throws if shouldValidateRequest but channelSecret not given', () => {
  expect(
    () => new LineBot({ accessToken: '_TOKEN_', shouldValidateRequest: true })
  ).toThrowErrorMatchingInlineSnapshot(
    `"should provide channelSecret if shouldValidateRequest set to true"`
  );
});

it('is ok to have channelSecret empty if shouldValidateRequest set to false', () => {
  expect(
    () => new LineBot({ accessToken: '_TOKEN_', shouldValidateRequest: false })
  ).not.toThrow();
});

it('creates client and connector', () => {
  const bot = new LineBot({
    accessToken: '_TOKEN_',
    channelSecret: '_SECRET_',
  });

  expect(bot.client).toBeInstanceOf(Client);
  expect(bot.connector).toBeInstanceOf(WebhookConnector);
});

it('sets default options', () => {
  expect(
    new LineBot({ accessToken: '_TOKEN_', channelSecret: '_SECRET_' }).options
  ).toMatchInlineSnapshot(`
Object {
  "accessToken": "_TOKEN_",
  "channelSecret": "_SECRET_",
  "connectionCapicity": 100,
  "shouldValidateRequest": true,
  "useReplyAPI": false,
}
`);
});

it('covers default options', () => {
  const options = {
    accessToken: '_TOKEN_',
    shouldValidateRequest: false,
    channelSecret: '_SECRET_',
    connectionCapicity: 9999,
    useReplyAPI: true,
  };
  expect(new LineBot(options).options).toEqual(options);
});
