import nock from 'nock';
import moxy from 'moxy';
import Machinat from 'machinat';
import { Emitter, Engine, Controller } from 'machinat-base';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';
import WebhookReceiver from 'machinat-webhook-receiver';
import LineBot from '../bot';
import LineWorker from '../worker';
import { LINE_NATIVE_TYPE, ENTRY_GETTER } from '../constant';

jest.mock('machinat-base');
jest.mock('machinat-renderer');
jest.mock('machinat-webhook-receiver');

nock.disableNetConnect();

const Foo = moxy((node, _, path) => [
  {
    type: 'unit',
    value: node.props,
    node,
    path,
  },
]);
Foo.$$native = LINE_NATIVE_TYPE;

const Bar = moxy((node, _, path) => [
  {
    type: 'unit',
    value: {
      ...node.props,
      [ENTRY_GETTER]: () => ({ method: 'POST', path: 'bar' }),
    },
    node,
    path,
  },
]);
Bar.$$native = LINE_NATIVE_TYPE;

const Baz = moxy((node, _, path) => [
  {
    type: 'unit',
    value: { [ENTRY_GETTER]: () => ({ method: 'POST', path: 'baz' }) },
    node,
    path,
  },
]);
Baz.$$native = LINE_NATIVE_TYPE;

const msgs = [
  <Foo id={0} />,
  <Foo id={1} />,
  <Foo id={2} />,
  <Foo id={3} />,
  <Foo id={4} />,
  <Foo id={5} />,
  <Foo id={6} />,
  <Bar id={7} />,
  <Foo id={8} />,
  <Baz id={9} />,
];

const pathSpy = moxy(() => true);
const bodySpy = moxy(() => true);

const accessToken = '__ACCESS_TOKEN__';
let lineAPI;
beforeEach(() => {
  Renderer.mock.reset();
  Engine.mock.reset();
  Controller.mock.reset();
  WebhookReceiver.mock.reset();

  lineAPI = nock('https://api.line.me', {
    reqheaders: {
      'content-type': 'application/json',
      authorization: 'Bearer __ACCESS_TOKEN__',
    },
  });

  pathSpy.mock.clear();
  bodySpy.mock.clear();
});

describe('#constructor(options)', () => {
  it('extends MachinatEmitter', () => {
    expect(
      new LineBot({
        accessToken,
        channelId: '_my_bot_',
        channelSecret: '_SECRET_',
      })
    ).toBeInstanceOf(Emitter);
  });

  it('throws if accessToken not given', () => {
    expect(() => new LineBot()).toThrowErrorMatchingInlineSnapshot(
      `"should provide accessToken to send messenge"`
    );
  });

  it('throws if shouldValidateRequest but channelSecret not given', () => {
    expect(
      () =>
        new LineBot({
          accessToken,
          channelId: '_my_bot_',
          shouldValidateRequest: true,
        })
    ).toThrowErrorMatchingInlineSnapshot(
      `"should provide channelSecret if shouldValidateRequest set to true"`
    );
  });

  it('is ok to have channelSecret empty if shouldValidateRequest set to false', () => {
    expect(
      () =>
        new LineBot({
          accessToken,
          channelId: '_my_bot_',
          shouldValidateRequest: false,
        })
    ).not.toThrow();
  });

  it('sets default options', () => {
    expect(
      new LineBot({
        accessToken,
        channelId: '_my_bot_',
        channelSecret: '_SECRET_',
      }).options
    ).toMatchInlineSnapshot(`
      Object {
        "accessToken": "__ACCESS_TOKEN__",
        "channelId": "_my_bot_",
        "channelSecret": "_SECRET_",
        "connectionCapicity": 100,
        "shouldValidateRequest": true,
      }
    `);
  });

  it('covers default options', () => {
    const options = {
      accessToken,
      channelId: '_my_bot_',
      shouldValidateRequest: false,
      channelSecret: '_SECRET_',
      connectionCapicity: 9999,
      useReplyAPI: true,
    };
    expect(new LineBot(options).options).toEqual(options);
  });

  it('assemble core modules', () => {
    const bot = new LineBot({
      accessToken,
      channelId: '_my_bot_',
      channelSecret: '_SECRET_',
    });

    expect(bot.engine).toBeInstanceOf(Engine);
    expect(bot.controller).toBeInstanceOf(Controller);
    expect(bot.receiver).toBeInstanceOf(WebhookReceiver);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith(
      'line',
      LINE_NATIVE_TYPE,
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'line',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(LineWorker),
      []
    );

    expect(Controller.mock).toHaveBeenCalledTimes(1);
    expect(Controller.mock).toHaveBeenCalledWith('line', bot, []);

    expect(WebhookReceiver.mock).toHaveBeenCalledTimes(1);
    expect(WebhookReceiver.mock).toHaveBeenCalledWith(expect.any(Function));
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

    const bot = new LineBot({
      accessToken,
      channelId: '_my_bot_',
      channelSecret: '_SECRET_',
      plugins,
    });

    expect(Engine.mock).toHaveBeenCalledWith(
      'line',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(LineWorker),
      [dispatchMiddleware1, dispatchMiddleware2]
    );

    expect(Controller.mock).toHaveBeenCalledWith('line', bot, [
      eventMiddleware1,
      eventMiddleware2,
    ]);
  });

  it('issue event & error', async () => {
    const eventIssuerSpy = moxy(() => Promise.resolve());
    Controller.mock.fake(function FakeController() {
      return { eventIssuerThroughMiddlewares: () => eventIssuerSpy };
    });

    const bot = new LineBot({
      accessToken,
      channelId: '_my_bot_',
      channelSecret: '_SECRET_',
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

describe('#send(token, node, options)', () => {
  it('works', async () => {
    const bot = new LineBot({
      accessToken,
      channelId: '_my_bot_',
      channelSecret: '_SECRET_',
      useReplyAPI: false,
    });

    const apiScope = lineAPI
      .post(pathSpy, bodySpy)
      .times(5)
      .reply(200, '{}');

    const results = await bot.send('john doe', msgs);

    expect(results).toEqual([{}, {}, {}, {}, {}]);
    expect(apiScope.isDone()).toBe(true);

    expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
      '/v2/bot/message/push',
      '/v2/bot/message/push',
      '/bar',
      '/v2/bot/message/push',
      '/baz',
    ]);

    expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchSnapshot();
  });

  it('works with replyToken', async () => {
    const bot = new LineBot({
      accessToken,
      channelId: '_my_bot_',
      channelSecret: '_SECRET_',
      useReplyAPI: true,
    });

    const apiScope = lineAPI.post(pathSpy, bodySpy).reply(200, '{}');

    const results = await bot.send('john doe', msgs.slice(0, 5), {
      replyToken: '__REPLY_TOKEN__',
    });

    expect(results).toEqual([{}]);
    expect(apiScope.isDone()).toBe(true);

    expect(pathSpy.mock.calls[0].args[0]).toEqual('/v2/bot/message/reply');
    expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchSnapshot();
  });

  it('throw if messages length more than 5 when using replyToken', () => {
    const bot = new LineBot({
      accessToken,
      channelId: '_my_bot_',
      channelSecret: '_SECRET_',
      useReplyAPI: true,
    });

    expect(
      bot.send('john doe', [0, 1, 2, 3, 4, 5], {
        replyToken: '__REPLY_TOKEN__',
      })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"can not send more than 5 messages with a replyToken"`
    );
  });
});

test('#multicast(targets, node) works', async () => {
  const bot = new LineBot({
    accessToken,
    channelId: '_my_bot_',
    channelSecret: '_SECRET_',
  });

  const apiScope = lineAPI
    .post(pathSpy, bodySpy)
    .times(2)
    .reply(200, '{}');

  const results = await bot.multicast(
    ['john', 'wick', 'dog'],
    msgs.slice(0, 7)
  );

  expect(results).toEqual([{}, {}]);
  expect(apiScope.isDone()).toBe(true);

  expect(pathSpy.mock.calls.map(c => c.args[0])).toEqual([
    '/v2/bot/message/multicast',
    '/v2/bot/message/multicast',
  ]);

  expect(bodySpy.mock.calls.map(c => c.args[0])).toMatchSnapshot();
});
