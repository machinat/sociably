import moxy from 'moxy';
import { Controller, Engine, BaseBot } from 'machinat-base';
import WebhookReceiver from 'machinat-webhook';
import MessengerBot from '../bot';
import MessengerClient from '../client';

beforeEach(() => {
  BaseBot.mock.clear();
});

it('throw if accessToken not given', () => {
  const options = {
    appSecret: '_SECRET_',
    verifyToken: '_VERIFIY_TOKEN_',
  };

  expect(() => new MessengerBot(options)).toThrowErrorMatchingInlineSnapshot(
    `"should provide accessToken to send messenge"`
  );
});

it('throw if appSecret not given', () => {
  const options = {
    accessToken: '_ACCESS_TOKEN_',
    verifyToken: '_VERIFIY_TOKEN_',
  };

  expect(() => new MessengerBot(options)).toThrowErrorMatchingInlineSnapshot(
    `"should provide appSecret if shouldValidateRequest set to true"`
  );
});

it('is ok to have appSecret empty if shouldValidateRequest set to false', () => {
  const options = {
    accessToken: '_ACCESS_TOKEN_',
    verifyToken: '_VERIFIY_TOKEN_',
    shouldValidateRequest: false,
  };

  expect(() => new MessengerBot(options)).not.toThrow();
});

it('throw if verifyToken not given', () => {
  const options = {
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
  };

  expect(() => new MessengerBot(options)).toThrowErrorMatchingInlineSnapshot(
    `"should provide verifyToken if shouldVerifyWebhook set to true"`
  );
});

it('is ok to have verifyToken empty if shouldVerifyWebhook set to false', () => {
  const options = {
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
    shouldVerifyWebhook: false,
  };

  expect(() => new MessengerBot(options)).not.toThrow();
});

it('has receiver, controller, engine and client', () => {
  const bot = new MessengerBot({
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
    verifyToken: '_VERIFIY_TOKEN_',
  });

  expect(bot.controller).toBeInstanceOf(Controller);
  expect(bot.engine).toBeInstanceOf(Engine);
  expect(bot.client).toBeInstanceOf(MessengerClient);
  expect(bot.receiver).toBeInstanceOf(WebhookReceiver);
});

it('pass controller, engine and plugins to BaseBot', () => {
  const plugins = [moxy(() => ({})), moxy(() => ({})), moxy(() => ({}))];

  const bot = new MessengerBot({
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
    verifyToken: '_VERIFIY_TOKEN_',
    plugins,
  });

  expect(BaseBot.mock).toHaveBeenCalledTimes(1);
  expect(BaseBot.mock).toHaveBeenCalledWith(
    bot.controller,
    bot.engine,
    plugins
  );

  expect(plugins[0].mock).toHaveBeenCalled();
  expect(plugins[1].mock).toHaveBeenCalled();
  expect(plugins[2].mock).toHaveBeenCalled();
});

it('set default options', () => {
  const options = {
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
    verifyToken: '_VERIFIY_TOKEN_',
  };

  expect(new MessengerBot(options).options).toMatchInlineSnapshot(`
Object {
  "accessToken": "_ACCESS_TOKEN_",
  "appSecret": "_SECRET_",
  "consumeInterval": undefined,
  "respondTimeout": 5000,
  "shouldValidateRequest": true,
  "shouldVerifyWebhook": true,
  "verifyToken": "_VERIFIY_TOKEN_",
}
`);
});

it('covers default options', () => {
  const options = {
    appSecret: '_SECRET_',
    accessToken: '_ACCESS_TOKEN_',
    shouldValidateRequest: true,
    shouldVerifyWebhook: true,
    verifyToken: '_VERIFIY_TOKEN_',
    respondTimeout: 9999,
    consumeInterval: 10000,
  };

  expect(new MessengerBot(options).options).toEqual(options);
});
