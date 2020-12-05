import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Worker from '../worker';
import {
  WebSocketConnection,
  WebSocketUserChannel,
  WebSocketTopicChannel,
} from '../channel';
import { Event } from '../component';
import { WebSocketBot } from '../bot';

jest.mock('@machinat/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/engine'))
);

jest.mock('@machinat/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/renderer'))
);

jest.mock('../worker', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../worker'))
);

const transmitter = moxy({
  start: async () => {},
  stop: async () => {},
  dispatch: async () => null,
  subscribeTopic: async () => false,
  unsubscribeTopic: async () => false,
  disconnect: async () => false,
});

const initScope = moxy();
const dispatchWrapper = moxy((dispatch) => dispatch);

beforeEach(() => {
  transmitter.mock.reset();
  Engine.mock.reset();
  Renderer.mock.reset();
  Worker.mock.reset();
});

describe('#constructor(options)', () => {
  it('pass transmitter to worker', () => {
    const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper); // eslint-disable-line no-unused-vars
    expect(Worker.mock).toHaveBeenCalledWith(transmitter);
  });

  it('assemble core modules', () => {
    const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer.mock).toHaveBeenCalledTimes(1);
    expect(Renderer.mock).toHaveBeenCalledWith(
      'web_socket',
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'web_socket',
      bot,
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );
  });
});

test('#start() start engine and transmitter', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  await bot.start();

  expect(transmitter.start.mock).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.start.mock).toHaveBeenCalledTimes(1);
});

test('#stop() stop engine and transmitter', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  await bot.stop();

  expect(transmitter.stop.mock).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.stop.mock).toHaveBeenCalledTimes(1);
});

describe('#render(channel, events)', () => {
  const message = (
    <>
      foo
      <Event type="foo" />
      <Event type="bar" payload="beer" />
      <Event type="baz" kind="zaq" />
    </>
  );

  const expectedEventValues = [
    { type: 'text', kind: 'message', payload: 'foo' },
    { type: 'foo' },
    { type: 'bar', payload: 'beer' },
    { type: 'baz', kind: 'zaq' },
  ];

  it('send to connection channel', async () => {
    const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
    await bot.start();

    const channel = new WebSocketConnection('#server', `#conn`);
    transmitter.dispatch.mock.fakeReturnValue([channel]);

    const expectedJob = {
      target: channel,
      events: expectedEventValues,
      whitelist: null,
      blacklist: null,
    };

    await expect(bot.render(channel, message)).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections: [channel] }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
    expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
  });

  it('send to user channel', async () => {
    const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
    await bot.start();

    const connections = new Array(3)
      .fill(0)
      .map((_, i) => new WebSocketConnection('#server', `#conn${i}`));

    transmitter.dispatch.mock.fake(async () => connections);

    const channel = new WebSocketUserChannel('jojo.doe');

    const expectedJob = {
      target: channel,
      events: expectedEventValues,
      whitelist: null,
      blacklist: null,
    };

    await expect(bot.render(channel, message)).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
    expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
  });

  it('send to topic channel', async () => {
    const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
    await bot.start();

    const connections = new Array(3)
      .fill(0)
      .map((_, i) => new WebSocketConnection('#server', `#conn${i}`));

    transmitter.dispatch.mock.fake(async () => connections);

    const channel = new WebSocketTopicChannel('foo');

    const expectedJob = {
      target: channel,
      events: [
        { type: 'foo' },
        { type: 'text', kind: 'message', payload: 'foo' },
        { type: 'bar', payload: 'beer' },
        { type: 'baz', kind: 'zaq' },
      ],
      whitelist: null,
      blacklist: null,
    };

    await expect(
      bot.render(
        channel,
        <>
          <Event type="foo" />
          foo
          <Event type="bar" payload="beer" />
          <Event type="baz" kind="zaq" />
        </>
      )
    ).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
    expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
  });
});

test('#send()', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  await bot.start();

  const connection = new WebSocketConnection('#server', `#conn`);
  transmitter.dispatch.mock.fake(async () => [connection]);

  const events = [
    { type: 'foo' },
    { type: 'bar', kind: 'baz', payload: 'beer' },
  ];

  const expectedJob = {
    target: connection,
    events,
    whitelist: null,
    blacklist: null,
  };

  await expect(bot.send(connection, ...events)).resolves.toEqual({
    jobs: [expectedJob],
    results: [{ connections: [connection] }],
    tasks: [{ type: 'dispatch', payload: [expectedJob] }],
  });

  expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
});

test('#sendUser()', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  await bot.start();

  const connections = new Array(3)
    .fill(0)
    .map((_, i) => new WebSocketConnection('#server', `#conn${i}`));
  transmitter.dispatch.mock.fake(async () => connections);

  const user = { platform: 'test', uid: 'jojo.doe' };
  const events = [
    { type: 'foo' },
    { type: 'bar', kind: 'baz', payload: 'beer' },
  ];

  const expectedJob = {
    target: new WebSocketUserChannel(user.uid),
    events,
    whitelist: null,
    blacklist: null,
  };

  await expect(bot.sendUser(user, ...events)).resolves.toEqual({
    jobs: [expectedJob],
    results: [{ connections }],
    tasks: [{ type: 'dispatch', payload: [expectedJob] }],
  });

  expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
});

test('#sendTopic()', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  await bot.start();

  const connections = new Array(3)
    .fill(0)
    .map((_, i) => new WebSocketConnection('#server', `#conn${i}`));
  transmitter.dispatch.mock.fake(async () => connections);

  const topic = 'hello_world';
  const events = [
    { type: 'foo' },
    { type: 'bar', kind: 'baz', payload: 'beer' },
  ];

  const expectedJob = {
    target: new WebSocketTopicChannel(topic),
    events,
    whitelist: null,
    blacklist: null,
  };

  await expect(bot.sendTopic(topic, ...events)).resolves.toEqual({
    jobs: [expectedJob],
    results: [{ connections }],
    tasks: [{ type: 'dispatch', payload: [expectedJob] }],
  });

  expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
});

test('#disconnect(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  const connection = new WebSocketConnection('#server', '#conn');

  transmitter.disconnect.mock.fake(async () => false);

  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(false);

  transmitter.disconnect.mock.fake(async () => true);
  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(true);

  expect(transmitter.disconnect.mock).toHaveBeenCalledTimes(2);
  expect(transmitter.disconnect.mock).toHaveBeenCalledWith(connection, 'bye');
});

test('#subscribeTopic(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  const connection = new WebSocketConnection('#server', '#conn');

  transmitter.subscribeTopic.mock.fake(async () => false);

  const topic = new WebSocketTopicChannel('foo', 'bar');
  await expect(bot.subscribeTopic(connection, topic)).resolves.toBe(false);

  transmitter.subscribeTopic.mock.fake(async () => true);
  await expect(bot.subscribeTopic(connection, topic)).resolves.toBe(true);

  expect(transmitter.subscribeTopic.mock).toHaveBeenCalledTimes(2);
  expect(transmitter.subscribeTopic.mock).toHaveBeenCalledWith(
    connection,
    topic
  );
});

test('#unsubscribeTopic(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  const connection = new WebSocketConnection('#server', '#conn');

  transmitter.unsubscribeTopic.mock.fake(async () => false);

  const topic = new WebSocketTopicChannel('foo', 'bar');
  await expect(bot.unsubscribeTopic(connection, topic)).resolves.toBe(false);

  transmitter.unsubscribeTopic.mock.fake(async () => true);
  await expect(bot.unsubscribeTopic(connection, topic)).resolves.toBe(true);

  expect(transmitter.unsubscribeTopic.mock).toHaveBeenCalledTimes(2);
  expect(transmitter.unsubscribeTopic.mock).toHaveBeenCalledWith(
    connection,
    topic
  );
});
