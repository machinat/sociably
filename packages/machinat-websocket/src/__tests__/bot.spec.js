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
import Channel from '../channel';
import { Event } from '../component';
import { WEBSOCKET_NATIVE_TYPE } from '../constant';

jest.mock('machinat-base');
jest.mock('machinat-renderer');
jest.mock('../receiver');
jest.mock('../worker');
jest.mock('../distributor');

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
    expect(new WebSocketBot()).toBeInstanceOf(Emitter);
  });

  it('pass distributor to worker', () => {
  const bot = new WebSocketBot(); // eslint-disable-line
    expect(Worker.mock).toHaveBeenCalledWith(expect.any(Distributor));
  });

  it('assemble core modules', () => {
    const bot = new WebSocketBot();

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
      expect.any(ws.Server),
      expect.any(Distributor),
      bot.options
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

    const bot = new WebSocketBot({ plugins });

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

    const bot = new WebSocketBot();

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

describe('#render(channel, event)', () => {
  it('work', async () => {
    const bot = new WebSocketBot();
    const distributor = Distributor.mock.calls[0].instance;

    distributor.broadcast.mock.fakeReturnValue(['1', '2', '3']);

    const channel = new Channel();
    await expect(
      bot.render(channel, [
        <Event />,
        <Event type="foo" />,
        <Event type="bar" />,
      ])
    ).resolves.toEqual([
      { sockets: ['1', '2', '3'] },
      { sockets: ['1', '2', '3'] },
      { sockets: ['1', '2', '3'] },
    ]);

    expect(distributor.broadcast.mock).toHaveBeenCalledTimes(3);
    expect(distributor.broadcast.mock).toHaveBeenCalledWith({
      uid: channel.uid,
      type: 'default',
    });
    expect(distributor.broadcast.mock).toHaveBeenCalledWith({
      uid: channel.uid,
      type: 'foo',
    });
    expect(distributor.broadcast.mock).toHaveBeenCalledWith({
      uid: channel.uid,
      type: 'bar',
    });
  });
});

describe('#disconnectSocket(channel, socketId, reason)', () => {
  it('work', async () => {
    const bot = new WebSocketBot();
    const distributor = Distributor.mock.calls[0].instance;

    distributor.disconnectSocket.mock.fake(() => Promise.resolve(false));

    const channel = new Channel('foo');
    await expect(bot.disconnectSocket(channel, '1', 'bye')).resolves.toBe(
      false
    );

    distributor.disconnectSocket.mock.fake(() => Promise.resolve(true));
    await expect(bot.disconnectSocket(channel, '2', 'bye')).resolves.toBe(true);

    expect(distributor.disconnectSocket.mock).toHaveBeenCalledTimes(2);
    expect(distributor.disconnectSocket.mock) //
      .toHaveBeenCalledWith(channel.uid, '1', 'bye');
    expect(distributor.disconnectSocket.mock) //
      .toHaveBeenCalledWith(channel.uid, '2', 'bye');
  });
});
