import moxy from 'moxy';
import nock from 'nock';
import Machinat from 'machinat';
import Renderer from 'machinat-renderer';
import BaseBot from 'machinat-base/src/bot';
import WebhookReceiver from 'machinat-webhook-receiver';
import MessengerBot from '../bot';
import MessengerWorker from '../worker';
import { Image, Dialog, QuickReply } from '../component';
import { makeResponse } from './utils';

jest.mock('machinat-base/src/bot');

nock.disableNetConnect();

const message = (
  <Dialog quickReplies={<QuickReply title="Hi!" />}>
    Hello
    <b>World!</b>
    <Image src="https://machinat.com/greeting.png" />
  </Dialog>
);

let graphAPI;
const bodySpy = moxy(() => true);

beforeEach(() => {
  BaseBot.mock.clear();
  graphAPI = nock('https://graph.facebook.com').post('/v3.1/', bodySpy);
  bodySpy.mock.clear();
});

afterEach(() => {
  nock.cleanAll();
});

it('extends BaseBot', () => {
  const bot = new MessengerBot({
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
    verifyToken: '_VERIFIY_TOKEN_',
  });

  expect(bot).toBeInstanceOf(BaseBot);
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

it('have plugins initiated', () => {
  const plugins = [moxy(() => ({})), moxy(() => ({})), moxy(() => ({}))];

  const bot = new MessengerBot({
    accessToken: '_ACCESS_TOKEN_',
    appSecret: '_SECRET_',
    verifyToken: '_VERIFIY_TOKEN_',
    plugins,
  });

  expect(bot.plugins).toBe(plugins);

  expect(BaseBot.mock).toHaveBeenCalledTimes(1);
  expect(BaseBot.mock).toHaveBeenCalledWith(
    'messenger',
    expect.any(WebhookReceiver),
    expect.any(Renderer),
    expect.any(MessengerWorker),
    plugins
  );
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

describe('#send(message, options)', () => {
  let scope;
  beforeEach(() => {
    scope = graphAPI.reply(
      200,
      JSON.stringify([
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
        makeResponse(200, { message_id: 'xxx', recipient_id: 'xxx' }),
      ])
    );
  });

  it('resolves null if message is empty', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.send('john', empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('works', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
      plugins: [
        () => ({
          dispatchMiddleware: next => frame => next(frame),
        }),
      ],
    });

    await expect(bot.send('john', message)).resolves.toEqual([
      { code: 200, body: { message_id: 'xxx', recipient_id: 'xxx' } },
      { code: 200, body: { message_id: 'xxx', recipient_id: 'xxx' } },
      { code: 200, body: { message_id: 'xxx', recipient_id: 'xxx' } },
    ]);

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(scope.isDone()).toBe(true);
  });

  it('works with options', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    await expect(
      bot.send('john', message, {
        messagingType: 'TAG',
        tag: 'TRANSPORTATION_UPDATE',
        notificationType: 'SILENT_PUSH',
        personaId: 'billy17',
      })
    ).resolves.toEqual([
      { code: 200, body: { message_id: 'xxx', recipient_id: 'xxx' } },
      { code: 200, body: { message_id: 'xxx', recipient_id: 'xxx' } },
      { code: 200, body: { message_id: 'xxx', recipient_id: 'xxx' } },
    ]);

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(scope.isDone()).toBe(true);
  });
});

describe('#createMessageCreative(message)', async () => {
  it('resolves null if message is empty', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.createMessageCreative(empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('works', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const scope = graphAPI.reply(
      200,
      JSON.stringify([makeResponse(200, { message_creative_id: 938461089 })])
    );

    await expect(bot.createMessageCreative('john', message)).resolves.toEqual({
      code: 200,
      body: { message_creative_id: 938461089 },
    });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(scope.isDone()).toBe(true);
  });
});

describe('#broadcastMessage(creativeId, options)', () => {
  let scope;
  beforeEach(() => {
    scope = graphAPI.reply(
      200,
      JSON.stringify([makeResponse(200, { broadcast_id: 827 })])
    );
  });

  it('works', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    await expect(bot.broadcastMessage(938461089)).resolves.toEqual({
      code: 200,
      body: { broadcast_id: 827 },
    });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(scope.isDone()).toBe(true);
  });

  it('works with options', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    await expect(
      bot.broadcastMessage(938461089, {
        customLabelId: 1712444532121303,
        notificationType: 'SILENT_PUSH',
        personaId: 'billy18',
      })
    ).resolves.toEqual({ code: 200, body: { broadcast_id: 827 } });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(scope.isDone()).toBe(true);
  });
});

describe('#createCustomLabel(name)', () => {
  it('works', async () => {
    const bot = new MessengerBot({
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const scope = graphAPI.reply(
      200,
      JSON.stringify([makeResponse(200, { id: 1712444532121303 })])
    );

    await expect(bot.createCustomLabel('foo')).resolves.toEqual({
      code: 200,
      body: { id: 1712444532121303 },
    });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchSnapshot();

    expect(scope.isDone()).toBe(true);
  });
});
