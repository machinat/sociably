import moxy from 'moxy';
import ws from 'ws';
import Machinat from 'machinat';
import Renderer from 'machinat-renderer';
import Queue from 'machinat-queue';
import { Emitter, Engine, Controller } from 'machinat-base';
import WebSocketBot from '../bot';
import Receiver from '../receiver';
import Distributor from '../distributor';
import Worker from '../worker';
import { TopicScopeChannel } from '../channel';
import { Event } from '../component';
import { WEBSOCKET_NATIVE_TYPE } from '../constant';

jest.mock('machinat-base');
jest.mock('machinat-renderer');
jest.mock('../receiver');
jest.mock('../worker');
jest.mock('../distributor');

const authenticator = moxy(async () => ({
  accepted: true,
  user: null,
  context: null,
  expireAt: null,
}));

beforeEach(() => {
  Engine.mock.clear();
  Controller.mock.clear();
  Renderer.mock.clear();

  Receiver.mock.clear();
  Worker.mock.clear();
  Distributor.mock.clear();
});

describe('#constructor(options)', () => {
  it('extends Emitter', () => {
    expect(new WebSocketBot({ authenticator })).toBeInstanceOf(Emitter);
  });

  it('pass distributor to worker', () => {
    const bot = new WebSocketBot({ authenticator }); // eslint-disable-line no-unused-vars
    expect(Worker.mock).toHaveBeenCalledWith(expect.any(Distributor));
  });

  it('assemble core modules', () => {
    const bot = new WebSocketBot({ authenticator });

    expect(bot.engine).toBeInstanceOf(Engine);
    expect(bot.controller).toBeInstanceOf(Controller);
    expect(bot.receiver).toBeInstanceOf(Receiver);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith(
      'websocket',
      WEBSOCKET_NATIVE_TYPE,
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'websocket',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      []
    );

    expect(Controller.mock).toHaveBeenCalledTimes(1);
    expect(Controller.mock).toHaveBeenCalledWith('websocket', bot, []);

    expect(Receiver.mock).toHaveBeenCalledTimes(1);
    expect(Receiver.mock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(ws.Server),
      expect.any(Distributor),
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

    const bot = new WebSocketBot({ authenticator, plugins });

    expect(Engine.mock).toHaveBeenCalledWith(
      'websocket',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      [dispatchMiddleware1, dispatchMiddleware2]
    );

    expect(Controller.mock).toHaveBeenCalledWith('websocket', bot, [
      eventMiddleware1,
      eventMiddleware2,
    ]);
  });

  it('issue event & error', async () => {
    const eventIssuerSpy = moxy(() => Promise.resolve());
    Controller.mock.fake(function FakeController() {
      return { eventIssuerThroughMiddlewares: () => eventIssuerSpy };
    });

    const bot = new WebSocketBot({ authenticator });

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

  test('default verifyUpgrade return true', () => {
    const bot = new WebSocketBot({ authenticator }); // eslint-disable-line no-unused-vars
    expect(Receiver.mock).toHaveBeenCalledTimes(1);
    const verifyUpgrade = Receiver.mock.calls[0].args[4];

    expect(verifyUpgrade({ url: '/', method: 'GET', headers: {} })).toBe(true);
  });

  test('override default verifyUpgrade', () => {
    const verifyUpgrade = moxy(() => false);
    const bot = new WebSocketBot({ authenticator, verifyUpgrade }); // eslint-disable-line no-unused-vars

    expect(Receiver.mock).toHaveBeenCalledTimes(1);
    expect(Receiver.mock.calls[0].args[4]).toBe(verifyUpgrade);
  });

  it('throw if options.authentocator not provided', () => {
    expect(() => new WebSocketBot()).toThrowErrorMatchingInlineSnapshot(
      `"options.authenticator should not be empty"`
    );
    expect(() => new WebSocketBot({})).toThrowErrorMatchingInlineSnapshot(
      `"options.authenticator should not be empty"`
    );
  });

  it('authenticate with option.authentocator', async () => {
    // eslint-disable-next-line no-unused-vars
    const bot = new WebSocketBot({ authenticator });
    expect(Receiver.mock).toHaveBeenCalledTimes(1);
    const authenticate = Receiver.mock.calls[0].args[3];
    const request = { url: 'http://...' };

    const authenticateResult = {
      accepted: true,
      user: { john: 'doe' },
      context: { some: 'auth data' },
      expireAt: new Date(),
    };

    authenticator.mock.fake(async () => authenticateResult);
    await expect(authenticate(request, { foo: 'bar' })).resolves.toEqual(
      authenticateResult
    );

    const failAuthenticateResult = {
      accepted: false,
      reason: 'FAILED',
    };

    authenticator.mock.fake(async () => failAuthenticateResult);
    await expect(authenticate(request, { foo: 'baz' })).resolves.toEqual(
      failAuthenticateResult
    );

    expect(authenticator.mock).toHaveBeenCalledTimes(2);
    expect(authenticator.mock).toHaveBeenCalledWith(request, {
      foo: 'bar',
    });
    expect(authenticator.mock).toHaveBeenCalledWith(request, {
      foo: 'baz',
    });
  });
});

describe('#render(channel, event)', () => {
  it('work', async () => {
    const bot = new WebSocketBot({ authenticator });
    const distributor = Distributor.mock.calls[0].instance;

    const conns = new Array(3).fill(0).map((_, i) => ({
      serverId: '#server',
      socketId: `#socket${i}`,
      id: `#conn${i}`,
    }));

    distributor.send.mock.fakeReturnValue(conns);

    const channel = new TopicScopeChannel('foo');
    await expect(
      bot.render(channel, [
        <Event />,
        <Event type="foo" />,
        <Event type="bar" />,
      ])
    ).resolves.toEqual([
      { connections: conns },
      { connections: conns },
      { connections: conns },
    ]);

    expect(distributor.send.mock).toHaveBeenCalledTimes(3);
    expect(distributor.send.mock).toHaveBeenCalledWith(channel, {
      type: 'default',
    });
    expect(distributor.send.mock).toHaveBeenCalledWith(channel, {
      type: 'foo',
    });
    expect(distributor.send.mock).toHaveBeenCalledWith(channel, {
      type: 'bar',
    });
  });
});

const connection = {
  serverId: '#server',
  socketId: '#socket',
  id: '#conn',
};

describe('#disconnect(channel, socketId, reason)', () => {
  it('work', async () => {
    const bot = new WebSocketBot({ authenticator });
    const distributor = Distributor.mock.calls[0].instance;

    distributor.disconnect.mock.fake(async () => false);

    await expect(bot.disconnect(connection, 'bye')).resolves.toBe(false);

    distributor.disconnect.mock.fake(async () => true);
    await expect(bot.disconnect(connection, 'bye')).resolves.toBe(true);

    expect(distributor.disconnect.mock).toHaveBeenCalledTimes(2);
    expect(distributor.disconnect.mock).toHaveBeenCalledWith(connection, 'bye');
  });
});

describe('#attachTopic(channel, socketId, reason)', () => {
  it('work', async () => {
    const bot = new WebSocketBot({ authenticator });
    const distributor = Distributor.mock.calls[0].instance;

    distributor.attachTopic.mock.fake(async () => false);

    const topic = new TopicScopeChannel('foo', 'bar');
    await expect(bot.attachTopic(connection, topic)).resolves.toBe(false);

    distributor.attachTopic.mock.fake(async () => true);
    await expect(bot.attachTopic(connection, topic)).resolves.toBe(true);

    expect(distributor.attachTopic.mock).toHaveBeenCalledTimes(2);
    expect(distributor.attachTopic.mock).toHaveBeenCalledWith(
      connection,
      topic
    );
  });
});

describe('#detachTopic(channel, socketId, reason)', () => {
  it('work', async () => {
    const bot = new WebSocketBot({ authenticator });
    const distributor = Distributor.mock.calls[0].instance;

    distributor.detachTopic.mock.fake(async () => false);

    const topic = new TopicScopeChannel('foo', 'bar');
    await expect(bot.detachTopic(connection, topic)).resolves.toBe(false);

    distributor.detachTopic.mock.fake(async () => true);
    await expect(bot.detachTopic(connection, topic)).resolves.toBe(true);

    expect(distributor.detachTopic.mock).toHaveBeenCalledTimes(2);
    expect(distributor.detachTopic.mock).toHaveBeenCalledWith(
      connection,
      topic
    );
  });
});
