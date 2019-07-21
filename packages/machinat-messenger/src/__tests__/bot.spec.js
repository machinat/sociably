import moxy from 'moxy';
import nock from 'nock';
import Machinat from 'machinat';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';
import { Emitter, Engine, Controller } from 'machinat-base';
import WebhookReceiver from 'machinat-webhook-receiver';
import MessengerBot from '../bot';
import MessengerWorker from '../worker';
import { Image, Dialog, QuickReply } from '../component';
import { MESSENGER_NATIVE_TYPE } from '../constant';
import { makeResponse } from './utils';

jest.mock('machinat-base');
jest.mock('machinat-renderer');
jest.mock('machinat-webhook-receiver');

nock.disableNetConnect();

const message = (
  <Dialog quickReplies={<QuickReply title="Hi!" />}>
    Hello
    <b>World!</b>
    <Image url="https://machinat.com/greeting.png" />
  </Dialog>
);

let graphAPI;
const bodySpy = moxy(() => true);

beforeEach(() => {
  Renderer.mock.clear();
  Engine.mock.clear();
  Controller.mock.clear();
  WebhookReceiver.mock.clear();

  graphAPI = nock('https://graph.facebook.com').post('/v3.3/', bodySpy);
  bodySpy.mock.clear();
});

afterEach(() => {
  nock.cleanAll();
});

describe('#constructor(options)', () => {
  it('extends Emitter', () => {
    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    expect(bot).toBeInstanceOf(Emitter);
  });

  it('throw if accessToken not given', () => {
    expect(
      () =>
        new MessengerBot({
          pageId: '_PAGE_ID_',
          appSecret: '_SECRET_',
          verifyToken: '_VERIFIY_TOKEN_',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"should provide accessToken to send messages"`
    );
  });

  it('throw if pageId not given', () => {
    expect(
      () =>
        new MessengerBot({
          accessToken: '_ACCESS_TOKEN_',
          appSecret: '_SECRET_',
          verifyToken: '_VERIFIY_TOKEN_',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"should provide pageId as the identification of resources"`
    );
  });

  it('throw if appSecret not given', () => {
    expect(
      () =>
        new MessengerBot({
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          verifyToken: '_VERIFIY_TOKEN_',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"should provide appSecret if shouldValidateRequest set to true"`
    );
  });

  it('is ok to have appSecret empty if shouldValidateRequest set to false', () => {
    expect(
      () =>
        new MessengerBot({
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          verifyToken: '_VERIFIY_TOKEN_',
          shouldValidateRequest: false,
        })
    ).not.toThrow();
  });

  it('throw if verifyToken not given', () => {
    expect(
      () =>
        new MessengerBot({
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          appSecret: '_SECRET_',
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"should provide verifyToken if shouldVerifyWebhook set to true"`
    );
  });

  it('is ok to have verifyToken empty if shouldVerifyWebhook set to false', () => {
    expect(
      () =>
        new MessengerBot({
          pageId: '_PAGE_ID_',
          accessToken: '_ACCESS_TOKEN_',
          appSecret: '_SECRET_',
          shouldVerifyWebhook: false,
        })
    ).not.toThrow();
  });

  it('set default options', () => {
    expect(
      new MessengerBot({
        pageId: '_PAGE_ID_',
        accessToken: '_ACCESS_TOKEN_',
        appSecret: '_SECRET_',
        verifyToken: '_VERIFIY_TOKEN_',
      }).options
    ).toMatchInlineSnapshot(`
            Object {
              "accessToken": "_ACCESS_TOKEN_",
              "appSecret": "_SECRET_",
              "pageId": "_PAGE_ID_",
              "respondTimeout": 5000,
              "shouldValidateRequest": true,
              "shouldVerifyWebhook": true,
              "verifyToken": "_VERIFIY_TOKEN_",
            }
        `);
  });

  it('covers default options', () => {
    const options = {
      pageId: '_PAGE_ID_',
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

  it('assemble core modules', () => {
    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    expect(bot.engine).toBeInstanceOf(Engine);
    expect(bot.controller).toBeInstanceOf(Controller);
    expect(bot.receiver).toBeInstanceOf(WebhookReceiver);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith(
      'messenger',
      MESSENGER_NATIVE_TYPE,
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'messenger',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(MessengerWorker),
      []
    );

    expect(Controller.mock).toHaveBeenCalledTimes(1);
    expect(Controller.mock).toHaveBeenCalledWith('messenger', bot, []);

    expect(WebhookReceiver.mock).toHaveBeenCalledTimes(1);
    expect(WebhookReceiver.mock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function)
    );
  });

  it('pass middlewares from plugins to controller and engine', () => {
    const eventMiddleware1 = () => () => {};
    const eventMiddleware2 = () => () => {};
    const dispatchMiddleware1 = () => () => {};
    const dispatchMiddleware2 = () => () => {};
    const plugins = [
      moxy(() => ({
        dispatchMiddleware: dispatchMiddleware1,
      })),
      moxy(() => ({
        eventMiddleware: eventMiddleware1,
      })),
      moxy(() => ({
        dispatchMiddleware: dispatchMiddleware2,
        eventMiddleware: eventMiddleware2,
      })),
    ];

    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
      plugins,
    });

    expect(Engine.mock).toHaveBeenCalledWith(
      'messenger',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(MessengerWorker),
      [dispatchMiddleware1, dispatchMiddleware2]
    );

    expect(Controller.mock).toHaveBeenCalledWith('messenger', bot, [
      eventMiddleware1,
      eventMiddleware2,
    ]);
  });

  it('issue event & error', async () => {
    const eventIssuerSpy = moxy(() => Promise.resolve());
    Controller.mock.fake(function FakeController() {
      return { eventIssuerThroughMiddlewares: () => eventIssuerSpy };
    });

    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const eventListener = moxy();
    const errorListener = moxy();
    bot.onEvent(eventListener);
    bot.onError(errorListener);

    expect(bot.receiver.bindIssuer.mock).toHaveBeenCalledTimes(1);
    expect(
      bot.controller.eventIssuerThroughMiddlewares.mock
    ).toHaveBeenCalledTimes(1);
    const finalPublisher =
      bot.controller.eventIssuerThroughMiddlewares.mock.calls[0].args[0];

    const channel = { super: 'slam' };
    const event = { a: 'phonecall' };
    const metadata = { champ: 'Johnnnnn Ceeeena!' };
    const frame = { channel, event, metadata };

    expect(finalPublisher(frame)).toBe(undefined);

    expect(eventListener.mock).toHaveBeenCalledTimes(1);
    expect(eventListener.mock).toHaveBeenCalledWith(frame);

    const [issueEvent, issueError] = bot.receiver.bindIssuer.mock.calls[0].args;

    await expect(issueEvent(channel, event, metadata)).resolves.toBe(undefined);
    expect(eventIssuerSpy.mock).toHaveBeenCalledTimes(1);
    expect(eventIssuerSpy.mock).toHaveBeenCalledWith(channel, event, metadata);

    expect(issueError(new Error('NO'))).toBe(undefined);
    expect(errorListener.mock).toHaveBeenCalledTimes(1);
    expect(errorListener.mock).toHaveBeenCalledWith(new Error('NO'));
  });
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
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      // eslint-disable-next-line no-await-in-loop
      await expect(bot.send('john', empty)).resolves.toBe(null);
    }
  });

  it('works', async () => {
    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
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
      pageId: '_PAGE_ID_',
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

describe('#createAttachment(message)', () => {
  it('resolves null if message is empty', async () => {
    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const empties = [undefined, null, [], <></>];
    for (const empty of empties) {
      await expect(bot.createAttachment(empty)).resolves.toBe(null); // eslint-disable-line no-await-in-loop
    }
  });

  it('works', async () => {
    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const scope = graphAPI.reply(
      200,
      JSON.stringify([makeResponse(200, { attachment_id: 401759795 })])
    );

    await expect(
      bot.createAttachment(
        <Image sharable url="https://machinat.com/trollface.png" />
      )
    ).resolves.toEqual({
      code: 200,
      body: { attachment_id: 401759795 },
    });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchInlineSnapshot(`
                  Array [
                    Object {
                      "body": "message=%7B%22attachment%22%3A%7B%22type%22%3A%22image%22%2C%22payload%22%3A%7B%22url%22%3A%22https%3A%2F%2Fmachinat.com%2Ftrollface.png%22%7D%7D%7D",
                      "method": "POST",
                      "omit_response_on_success": false,
                      "relative_url": "me/message_attachments",
                    },
                  ]
            `);

    expect(scope.isDone()).toBe(true);
  });
});

describe('#createMessageCreative(message)', () => {
  it('resolves null if message is empty', async () => {
    const bot = new MessengerBot({
      pageId: '_PAGE_ID_',
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
      pageId: '_PAGE_ID_',
      accessToken: '_ACCESS_TOKEN_',
      appSecret: '_SECRET_',
      verifyToken: '_VERIFIY_TOKEN_',
    });

    const scope = graphAPI.reply(
      200,
      JSON.stringify([makeResponse(200, { message_creative_id: 938461089 })])
    );

    await expect(bot.createMessageCreative(message)).resolves.toEqual({
      code: 200,
      body: { message_creative_id: 938461089 },
    });

    expect(bodySpy.mock).toHaveBeenCalledTimes(1);
    const body = bodySpy.mock.calls[0].args[0];

    expect(body).toMatchSnapshot({ batch: expect.any(String) });
    expect(JSON.parse(body.batch)).toMatchInlineSnapshot(`
      Array [
        Object {
          "body": "messages=%5B%7B%22text%22%3A%22Hello%22%7D%2C%7B%22text%22%3A%22*World!*%22%7D%2C%7B%22attachment%22%3A%7B%22type%22%3A%22image%22%2C%22payload%22%3A%7B%22url%22%3A%22https%3A%2F%2Fmachinat.com%2Fgreeting.png%22%7D%7D%2C%22quick_replies%22%3A%5B%7B%22content_type%22%3A%22text%22%2C%22title%22%3A%22Hi!%22%7D%5D%7D%5D",
          "method": "POST",
          "omit_response_on_success": false,
          "relative_url": "me/message_creatives",
        },
      ]
    `);

    expect(scope.isDone()).toBe(true);
  });
});
