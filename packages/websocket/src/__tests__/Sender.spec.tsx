import moxy, { Moxy } from '@moxyjs/moxy';
import Queue from '@sociably/core/queue';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import _Worker from '../Worker.js';
import WebSocketConnection from '../Connection.js';
import { Event } from '../component.js';
import { WebSocketSender } from '../Sender.js';
import type { WebSocketServer } from '../Server.js';

const Engine = _Engine as Moxy<typeof _Engine>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Worker = _Worker as Moxy<typeof _Worker>;

jest.mock('@sociably/core/engine', () =>
  moxy(jest.requireActual('@sociably/core/engine')),
);
jest.mock('@sociably/core/renderer', () =>
  moxy(jest.requireActual('@sociably/core/renderer')),
);
jest.mock('../Worker.js', () => moxy(jest.requireActual('../Worker.js')));

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
    (() => new WebSocketSender(server, initScope, dispatchWrapper))();

    expect(Worker).toHaveBeenCalledWith(server);
  });

  it('assemble core modules', () => {
    const sender = new WebSocketSender(server, initScope, dispatchWrapper);

    expect(sender.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('websocket', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'websocket',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper,
    );
  });
});

test('#start() start engine and server', async () => {
  const sender = new WebSocketSender(server);
  await sender.start();

  expect(server.start).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.start).toHaveBeenCalledTimes(1);
});

test('#stop() stop engine and server', async () => {
  const sender = new WebSocketSender(server);
  await sender.stop();

  expect(server.stop).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.stop).toHaveBeenCalledTimes(1);
});

describe('#render(thread, message)', () => {
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

  it('send to connection thread', async () => {
    const sender = new WebSocketSender(server);
    await sender.start();

    const thread = new WebSocketConnection('#server', `#conn`);
    server.dispatch.mock.fakeReturnValue([thread]);

    const expectedJob = {
      target: thread,
      values: expectedEventValues,
    };

    await expect(sender.render(thread, message)).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections: [thread] }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(server.dispatch).toHaveBeenCalledTimes(1);
    expect(server.dispatch).toHaveBeenCalledWith(expectedJob);
  });
});

test('#send()', async () => {
  const sender = new WebSocketSender(server);
  await sender.start();

  const connection = new WebSocketConnection('#server', `#conn`);
  server.dispatch.mock.fake(async () => [connection]);

  await expect(sender.send(connection, { type: 'foo' })).resolves.toEqual({
    connections: [connection],
  });

  const eventValues = [
    { type: 'bar', kind: 'black', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(sender.send(connection, eventValues)).resolves.toEqual({
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

test('#sendTopic()', async () => {
  const sender = new WebSocketSender(server);
  await sender.start();

  const connections = [
    new WebSocketConnection('#server1', '#conn2'),
    new WebSocketConnection('#server3', '#conn4'),
  ];
  server.dispatch.mock.fake(async () => connections);

  const topicKey = 'hello_world';

  await expect(sender.sendTopic(topicKey, { type: 'foo' })).resolves.toEqual({
    connections,
  });

  const eventValues = [
    { type: 'bar', kind: 'light', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(sender.sendTopic(topicKey, eventValues)).resolves.toEqual({
    connections,
  });

  expect(server.dispatch).toHaveBeenCalledTimes(2);
  expect(server.dispatch).toHaveBeenNthCalledWith(1, {
    target: { type: 'topic', key: topicKey },
    values: [{ type: 'foo' }],
  });
  expect(server.dispatch).toHaveBeenNthCalledWith(2, {
    target: { type: 'topic', key: topicKey },
    values: eventValues,
  });
});

test('#disconnect(thread, socketId, reason)', async () => {
  const sender = new WebSocketSender(server);
  const connection = new WebSocketConnection('#server', '#conn');

  server.disconnect.mock.fake(async () => false);

  await expect(sender.disconnect(connection, 'bye')).resolves.toBe(false);

  server.disconnect.mock.fake(async () => true);
  await expect(sender.disconnect(connection, 'bye')).resolves.toBe(true);

  expect(server.disconnect).toHaveBeenCalledTimes(2);
  expect(server.disconnect).toHaveBeenCalledWith(connection, 'bye');
});

test('#subscribeTopic(thread, socketId, reason)', async () => {
  const sender = new WebSocketSender(server);
  const connection = new WebSocketConnection('#server', '#conn');

  server.subscribeTopic.mock.fake(async () => false);

  await expect(sender.subscribeTopic(connection, 'foo')).resolves.toBe(false);

  server.subscribeTopic.mock.fake(async () => true);
  await expect(sender.subscribeTopic(connection, 'foo')).resolves.toBe(true);

  expect(server.subscribeTopic).toHaveBeenCalledTimes(2);
  expect(server.subscribeTopic).toHaveBeenCalledWith(connection, 'foo');
});

test('#unsubscribeTopic(thread, socketId, reason)', async () => {
  const sender = new WebSocketSender(server);
  const connection = new WebSocketConnection('#server', '#conn');

  server.unsubscribeTopic.mock.fake(async () => false);

  await expect(sender.unsubscribeTopic(connection, 'foo')).resolves.toBe(false);

  server.unsubscribeTopic.mock.fake(async () => true);
  await expect(sender.unsubscribeTopic(connection, 'foo')).resolves.toBe(true);

  expect(server.unsubscribeTopic).toHaveBeenCalledTimes(2);
  expect(server.unsubscribeTopic).toHaveBeenCalledWith(connection, 'foo');
});
