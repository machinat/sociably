import moxy, { Moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import _Worker from '../worker';
import {
  WebSocketConnection,
  WebSocketUserChannel,
  WebSocketTopicChannel,
} from '../channel';
import { Event } from '../component';
import { WebSocketBot } from '../bot';
import type { WebSocketServer } from '../server';

const Engine = _Engine as Moxy<typeof _Engine>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Worker = _Worker as Moxy<typeof _Worker>;

jest.mock('@sociably/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@sociably/core/engine'))
);

jest.mock('@sociably/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@sociably/core/renderer'))
);

jest.mock('../worker', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../worker'))
);

const server = moxy<WebSocketServer<any, unknown>>({
  id: '_SERVER_ID_',
  start: async () => {},
  stop: async () => {},
  dispatch: async () => null,
  subscribeTopic: async () => false,
  unsubscribeTopic: async () => false,
  disconnect: async () => false,
} as never);

const initScope = moxy();
const dispatchWrapper = moxy((dispatch) => dispatch);

beforeEach(() => {
  server.mock.reset();
  Engine.mock.reset();
  Renderer.mock.reset();
  Worker.mock.reset();
});

describe('#constructor(options)', () => {
  it('pass server to worker', () => {
    (() => new WebSocketBot(server, initScope, dispatchWrapper))();

    expect(Worker).toHaveBeenCalledWith(server);
  });

  it('assemble core modules', () => {
    const bot = new WebSocketBot(server, initScope, dispatchWrapper);

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('websocket', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'websocket',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );
  });
});

test('#start() start engine and server', async () => {
  const bot = new WebSocketBot(server);
  await bot.start();

  expect(server.start).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.start).toHaveBeenCalledTimes(1);
});

test('#stop() stop engine and server', async () => {
  const bot = new WebSocketBot(server);
  await bot.stop();

  expect(server.stop).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.stop).toHaveBeenCalledTimes(1);
});

describe('#render(channel, message)', () => {
  const message = (
    <>
      foo
      <Event type="foo" />
      <Event type="bar" payload="beer" />
      <Event type="baz" category="zaq" />
    </>
  );

  const expectedEventValues = [
    { type: 'text', category: 'message', payload: 'foo' },
    { type: 'foo' },
    { type: 'bar', payload: 'beer' },
    { type: 'baz', category: 'zaq' },
  ];

  it('send to connection channel', async () => {
    const bot = new WebSocketBot(server);
    await bot.start();

    const channel = new WebSocketConnection('#server', `#conn`);
    server.dispatch.mock.fakeReturnValue([channel]);

    const expectedJob = {
      target: channel,
      values: expectedEventValues,
    };

    await expect(bot.render(channel, message)).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections: [channel] }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(server.dispatch).toHaveBeenCalledTimes(1);
    expect(server.dispatch).toHaveBeenCalledWith(expectedJob);
  });

  it('send to user channel', async () => {
    const bot = new WebSocketBot(server);
    await bot.start();

    const connections = new Array(3)
      .fill(0)
      .map((_, i) => new WebSocketConnection('#server', `#conn${i}`));

    server.dispatch.mock.fake(async () => connections);

    const channel = new WebSocketUserChannel('jojo.doe');

    const expectedJob = {
      target: channel,
      values: expectedEventValues,
    };

    await expect(bot.render(channel, message)).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(server.dispatch).toHaveBeenCalledTimes(1);
    expect(server.dispatch).toHaveBeenCalledWith(expectedJob);
  });

  it('send to topic channel', async () => {
    const bot = new WebSocketBot(server);
    await bot.start();

    const connections = new Array(3)
      .fill(0)
      .map((_, i) => new WebSocketConnection('#server', `#conn${i}`));

    server.dispatch.mock.fake(async () => connections);

    const channel = new WebSocketTopicChannel('foo');

    const expectedJob = {
      target: channel,
      values: [
        { type: 'foo' },
        { type: 'text', category: 'message', payload: 'foo' },
        { type: 'bar', payload: 'beer' },
        { type: 'baz', category: 'zaq' },
      ],
    };

    await expect(
      bot.render(
        channel,
        <>
          <Event type="foo" />
          foo
          <Event type="bar" payload="beer" />
          <Event type="baz" category="zaq" />
        </>
      )
    ).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(server.dispatch).toHaveBeenCalledTimes(1);
    expect(server.dispatch).toHaveBeenCalledWith(expectedJob);
  });
});

test('#send()', async () => {
  const bot = new WebSocketBot(server);
  await bot.start();

  const connection = new WebSocketConnection('#server', `#conn`);
  server.dispatch.mock.fake(async () => [connection]);

  await expect(bot.send(connection, { type: 'foo' })).resolves.toEqual({
    connections: [connection],
  });

  const eventValues = [
    { type: 'bar', category: 'black', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(bot.send(connection, eventValues)).resolves.toEqual({
    connections: [connection],
  });

  expect(server.dispatch).toHaveBeenCalledTimes(2);
  expect(server.dispatch).toHaveBeenNthCalledWith(1, {
    target: connection,
    values: [{ type: 'foo' }],
  });
  expect(server.dispatch).toHaveBeenNthCalledWith(2, {
    target: connection,
    values: eventValues,
  });
});

test('#sendUser()', async () => {
  const bot = new WebSocketBot(server);
  await bot.start();

  const connections = [
    new WebSocketConnection('#server1', '#conn2'),
    new WebSocketConnection('#server3', '#conn4'),
  ];
  server.dispatch.mock.fake(async () => connections);

  const user = { platform: 'test', uid: 'jojo.doe' };

  await expect(bot.sendUser(user, { type: 'foo' })).resolves.toEqual({
    connections,
  });

  const eventValues = [
    { type: 'bar', category: 'light', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(bot.sendUser(user, eventValues)).resolves.toEqual({
    connections,
  });

  expect(server.dispatch).toHaveBeenCalledTimes(2);
  expect(server.dispatch).toHaveBeenNthCalledWith(1, {
    target: new WebSocketUserChannel(user.uid),
    values: [{ type: 'foo' }],
  });
  expect(server.dispatch).toHaveBeenNthCalledWith(2, {
    target: new WebSocketUserChannel(user.uid),
    values: eventValues,
  });
});

test('#sendTopic()', async () => {
  const bot = new WebSocketBot(server);
  await bot.start();

  const connections = [
    new WebSocketConnection('#server1', '#conn2'),
    new WebSocketConnection('#server3', '#conn4'),
  ];
  server.dispatch.mock.fake(async () => connections);

  const topic = 'hello_world';

  await expect(bot.sendTopic(topic, { type: 'foo' })).resolves.toEqual({
    connections,
  });

  const eventValues = [
    { type: 'bar', category: 'light', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(bot.sendTopic(topic, eventValues)).resolves.toEqual({
    connections,
  });

  expect(server.dispatch).toHaveBeenCalledTimes(2);
  expect(server.dispatch).toHaveBeenNthCalledWith(1, {
    target: new WebSocketTopicChannel(topic),
    values: [{ type: 'foo' }],
  });
  expect(server.dispatch).toHaveBeenNthCalledWith(2, {
    target: new WebSocketTopicChannel(topic),
    values: eventValues,
  });
});

test('#disconnect(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(server);
  const connection = new WebSocketConnection('#server', '#conn');

  server.disconnect.mock.fake(async () => false);

  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(false);

  server.disconnect.mock.fake(async () => true);
  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(true);

  expect(server.disconnect).toHaveBeenCalledTimes(2);
  expect(server.disconnect).toHaveBeenCalledWith(connection, 'bye');
});

test('#subscribeTopic(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(server);
  const connection = new WebSocketConnection('#server', '#conn');

  server.subscribeTopic.mock.fake(async () => false);

  await expect(bot.subscribeTopic(connection, 'foo')).resolves.toBe(false);

  server.subscribeTopic.mock.fake(async () => true);
  await expect(bot.subscribeTopic(connection, 'foo')).resolves.toBe(true);

  expect(server.subscribeTopic).toHaveBeenCalledTimes(2);
  expect(server.subscribeTopic).toHaveBeenCalledWith(connection, 'foo');
});

test('#unsubscribeTopic(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(server);
  const connection = new WebSocketConnection('#server', '#conn');

  server.unsubscribeTopic.mock.fake(async () => false);

  await expect(bot.unsubscribeTopic(connection, 'foo')).resolves.toBe(false);

  server.unsubscribeTopic.mock.fake(async () => true);
  await expect(bot.unsubscribeTopic(connection, 'foo')).resolves.toBe(true);

  expect(server.unsubscribeTopic).toHaveBeenCalledTimes(2);
  expect(server.unsubscribeTopic).toHaveBeenCalledWith(connection, 'foo');
});
