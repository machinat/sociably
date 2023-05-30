import { moxy, Moxy } from '@moxyjs/moxy';
import Sociably, { SociablyUser, SociablyThread } from '@sociably/core';
import Queue from '@sociably/core/queue';
import type { AnyServerAuthenticator } from '@sociably/auth';
import _Engine from '@sociably/core/engine';
import _Renderer from '@sociably/core/renderer';
import { WebSocketWorker } from '@sociably/websocket';
import WebviewConnection from '../Connection.js';
import { Event } from '../component.js';
import { WebviewSocketServer } from '../interface.js';
import { WebviewBot } from '../Bot.js';

const Worker = WebSocketWorker as Moxy<typeof WebSocketWorker>;
const Renderer = _Renderer as Moxy<typeof _Renderer>;
const Engine = _Engine as Moxy<typeof _Engine>;

jest.mock('@sociably/core/engine', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .moxy(jest.requireActual('@sociably/core/engine'))
);
jest.mock('@sociably/core/renderer', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .moxy(jest.requireActual('@sociably/core/renderer'))
);
jest.mock('@sociably/websocket', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .moxy(jest.requireActual('@sociably/websocket'))
);

const server = moxy<WebviewSocketServer<AnyServerAuthenticator>>({
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
    (() => new WebviewBot(server, initScope, dispatchWrapper))();

    expect(Worker).toHaveBeenCalledWith(server);
  });

  it('assemble core modules', () => {
    const bot = new WebviewBot(server, initScope, dispatchWrapper);

    expect(bot.engine).toBeInstanceOf(Engine);

    expect(Renderer).toHaveBeenCalledTimes(1);
    expect(Renderer).toHaveBeenCalledWith('webview', expect.any(Function));

    expect(Engine).toHaveBeenCalledTimes(1);
    expect(Engine).toHaveBeenCalledWith(
      'webview',
      expect.any(Renderer),
      expect.any(Queue),
      expect.any(Worker),
      initScope,
      dispatchWrapper
    );
  });
});

test('#start() start engine and server', async () => {
  const bot = new WebviewBot(server);
  await bot.start();

  expect(server.start).toHaveBeenCalledTimes(1);

  const engine = Engine.mock.calls[0].instance;
  expect(engine.start).toHaveBeenCalledTimes(1);
});

test('#stop() stop engine and server', async () => {
  const bot = new WebviewBot(server);
  await bot.stop();

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
      <Event type="baz" category="zaq" />
    </>
  );

  const expectedEventValues = [
    { type: 'text', category: 'message', payload: 'foo' },
    { type: 'foo' },
    { type: 'bar', payload: 'beer' },
    { type: 'baz', category: 'zaq' },
  ];

  it('send to connection thread', async () => {
    const bot = new WebviewBot(server);
    await bot.start();

    const thread = new WebviewConnection('#server', `#conn`);
    server.dispatch.mock.fakeReturnValue([thread]);

    const expectedJob = {
      target: thread,
      values: expectedEventValues,
    };

    await expect(bot.render(thread, message)).resolves.toEqual({
      jobs: [expectedJob],
      results: [{ connections: [thread] }],
      tasks: [{ type: 'dispatch', payload: [expectedJob] }],
    });

    expect(server.dispatch).toHaveBeenCalledTimes(1);
    expect(server.dispatch).toHaveBeenCalledWith(expectedJob);
  });
});

test('#send()', async () => {
  const bot = new WebviewBot(server);
  await bot.start();

  const connection = new WebviewConnection('#server', `#conn`);
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
  const bot = new WebviewBot(server);
  await bot.start();

  const connections = [
    new WebviewConnection('#server1', '#conn2'),
    new WebviewConnection('#server3', '#conn4'),
  ];
  server.dispatch.mock.fake(async () => connections);

  const user: SociablyUser = {
    $$typeofUser: true,
    platform: 'test',
    uid: 'test.jojo_doe',
    uniqueIdentifier: { $$typeof: ['user'], platform: 'test', id: 'jojo_doe' },
  };

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
  expect(server.dispatch.mock.calls[0].args[0]).toMatchInlineSnapshot(`
    {
      "target": {
        "key": "$user:test.jojo_doe",
        "type": "topic",
      },
      "values": [
        {
          "type": "foo",
        },
      ],
    }
  `);
  expect(server.dispatch.mock.calls[1].args[0]).toMatchInlineSnapshot(`
    {
      "target": {
        "key": "$user:test.jojo_doe",
        "type": "topic",
      },
      "values": [
        {
          "category": "light",
          "payload": "🍺",
          "type": "bar",
        },
        {
          "payload": "🍻",
          "type": "baz",
        },
      ],
    }
  `);
});

test('#sendThread()', async () => {
  const bot = new WebviewBot(server);
  await bot.start();

  const connections = [
    new WebviewConnection('#server1', '#conn2'),
    new WebviewConnection('#server3', '#conn4'),
  ];
  server.dispatch.mock.fake(async () => connections);

  const thread: SociablyThread = {
    $$typeofThread: true,
    platform: 'test',
    uid: 'test.me.jojo_doe',
    uniqueIdentifier: {
      $$typeof: ['thread'],
      platform: 'test',
      id: 'me.jojo_doe',
    },
  };

  await expect(bot.sendThread(thread, { type: 'foo' })).resolves.toEqual({
    connections,
  });

  const eventValues = [
    { type: 'bar', category: 'light', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(bot.sendThread(thread, eventValues)).resolves.toEqual({
    connections,
  });

  expect(server.dispatch).toHaveBeenCalledTimes(2);
  expect(server.dispatch.mock.calls[0].args[0]).toMatchInlineSnapshot(`
    {
      "target": {
        "key": "$thread:test.me.jojo_doe",
        "type": "topic",
      },
      "values": [
        {
          "type": "foo",
        },
      ],
    }
  `);
  expect(server.dispatch.mock.calls[1].args[0]).toMatchInlineSnapshot(`
    {
      "target": {
        "key": "$thread:test.me.jojo_doe",
        "type": "topic",
      },
      "values": [
        {
          "category": "light",
          "payload": "🍺",
          "type": "bar",
        },
        {
          "payload": "🍻",
          "type": "baz",
        },
      ],
    }
  `);
});

test('#sendTopic()', async () => {
  const bot = new WebviewBot(server);
  await bot.start();

  const connections = [
    new WebviewConnection('#server1', '#conn2'),
    new WebviewConnection('#server3', '#conn4'),
  ];
  server.dispatch.mock.fake(async () => connections);

  const topicKey = 'hello_world';

  await expect(bot.sendTopic(topicKey, { type: 'foo' })).resolves.toEqual({
    connections,
  });

  const eventValues = [
    { type: 'bar', category: 'light', payload: '🍺' },
    { type: 'baz', payload: '🍻' },
  ];

  await expect(bot.sendTopic(topicKey, eventValues)).resolves.toEqual({
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
  const bot = new WebviewBot(server);
  const connection = new WebviewConnection('#server', '#conn');

  server.disconnect.mock.fake(async () => false);

  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(false);

  server.disconnect.mock.fake(async () => true);
  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(true);

  expect(server.disconnect).toHaveBeenCalledTimes(2);
  expect(server.disconnect).toHaveBeenCalledWith(connection, 'bye');
});

test('#subscribeTopic(thread, socketId, reason)', async () => {
  const bot = new WebviewBot(server);
  const connection = new WebviewConnection('#server', '#conn');

  server.subscribeTopic.mock.fake(async () => false);

  await expect(bot.subscribeTopic(connection, 'foo')).resolves.toBe(false);

  server.subscribeTopic.mock.fake(async () => true);
  await expect(bot.subscribeTopic(connection, 'foo')).resolves.toBe(true);

  expect(server.subscribeTopic).toHaveBeenCalledTimes(2);
  expect(server.subscribeTopic).toHaveBeenCalledWith(connection, 'foo');
});

test('#unsubscribeTopic(thread, socketId, reason)', async () => {
  const bot = new WebviewBot(server);
  const connection = new WebviewConnection('#server', '#conn');

  server.unsubscribeTopic.mock.fake(async () => false);

  await expect(bot.unsubscribeTopic(connection, 'foo')).resolves.toBe(false);

  server.unsubscribeTopic.mock.fake(async () => true);
  await expect(bot.unsubscribeTopic(connection, 'foo')).resolves.toBe(true);

  expect(server.unsubscribeTopic).toHaveBeenCalledTimes(2);
  expect(server.unsubscribeTopic).toHaveBeenCalledWith(connection, 'foo');
});
