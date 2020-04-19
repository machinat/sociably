import moxy, { Mock } from 'moxy';
import Machinat from '@machinat/core';
import Engine from '@machinat/core/engine';
import Renderer from '@machinat/core/renderer';
import Queue from '@machinat/core/queue';
import Worker from '../worker';
import { ConnectionChannel, UserChannel, TopicChannel } from '../channel';
import { Event } from '../component';
import WebSocketBot from '../bot';

jest.mock('@machinat/core/engine', () =>
  jest
    .requireActual('moxy')
    .default(jest.requireActual('@machinat/core/engine'), {
      mockNewInstance: true,
      includeProps: ['default', 'start', 'stop'],
    })
);

jest.mock('@machinat/core/renderer', () =>
  jest
    .requireActual('moxy')
    .default(jest.requireActual('@machinat/core/renderer'), {
      includeProps: ['default'],
    })
);

jest.mock('../worker', () =>
  jest.requireActual('moxy').default(jest.requireActual('../worker'), {
    includeProps: ['default'],
  })
);

const transmitter = moxy({
  start: async () => {},
  stop: async () => {},
  dispatch: async () => null,
  attachTopic: async () => false,
  detachTopic: async () => false,
  disconnect: async () => false,
});

const initScope = moxy();
const dispatchWrapper = moxy(dispatch => dispatch);

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
      'websocket',
      expect.any(Function)
    );

    expect(Engine.mock).toHaveBeenCalledTimes(1);
    expect(Engine.mock).toHaveBeenCalledWith(
      'websocket',
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
      <Event />
      <Event type="bar" payload="beer" />
      <Event type="baz" subtype="zaq" />
    </>
  );

  const expectedEventValues = [
    { type: 'message', subtype: 'text', payload: 'foo' },
    { type: 'default' },
    { type: 'bar', payload: 'beer' },
    { type: 'baz', subtype: 'zaq' },
  ];

  it('send to connection channel', async () => {
    const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
    await bot.start();

    const channel = new ConnectionChannel('#server', `#conn`);
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
      .map((_, i) => new ConnectionChannel('#server', `#conn${i}`));

    transmitter.dispatch.mock.fake(async () => connections);

    const channel = new UserChannel({ platform: 'test', uid: 'jojo.doe' });

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
      .map((_, i) => new ConnectionChannel('#server', `#conn${i}`));

    transmitter.dispatch.mock.fake(async () => connections);

    const channel = new TopicChannel('foo');

    const expectedJob = {
      target: channel,
      events: [
        { type: 'default' },
        { type: 'message', subtype: 'text', payload: 'foo' },
        { type: 'bar', payload: 'beer' },
        { type: 'baz', subtype: 'zaq' },
      ],
      whitelist: null,
      blacklist: null,
    };

    await expect(
      bot.render(
        channel,
        <>
          <Event />
          foo
          <Event type="bar" payload="beer" />
          <Event type="baz" subtype="zaq" />
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

test('#sendUser()', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  await bot.start();

  const connections = new Array(3)
    .fill(0)
    .map((_, i) => new ConnectionChannel('#server', `#conn${i}`));
  transmitter.dispatch.mock.fake(async () => connections);

  const user = { platform: 'test', uid: 'jojo.doe' };
  const events = [
    { type: 'foo' },
    { type: 'bar', subtype: 'baz', payload: 'beer' },
  ];

  const expectedJob = {
    target: new UserChannel(user),
    events,
    whitelist: null,
    blacklist: null,
  };

  await expect(bot.sendUser(user, events)).resolves.toEqual({
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
    .map((_, i) => new ConnectionChannel('#server', `#conn${i}`));
  transmitter.dispatch.mock.fake(async () => connections);

  const topic = 'hello_world';
  const events = [
    { type: 'foo' },
    { type: 'bar', subtype: 'baz', payload: 'beer' },
  ];

  const expectedJob = {
    target: new TopicChannel(topic),
    events,
    whitelist: null,
    blacklist: null,
  };

  await expect(bot.sendTopic(topic, events)).resolves.toEqual({
    jobs: [expectedJob],
    results: [{ connections }],
    tasks: [{ type: 'dispatch', payload: [expectedJob] }],
  });

  expect(transmitter.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(transmitter.dispatch.mock).toHaveBeenCalledWith(expectedJob);
});

test('#disconnect(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  const connection = new ConnectionChannel('#server', '#conn');

  transmitter.disconnect.mock.fake(async () => false);

  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(false);

  transmitter.disconnect.mock.fake(async () => true);
  await expect(bot.disconnect(connection, 'bye')).resolves.toBe(true);

  expect(transmitter.disconnect.mock).toHaveBeenCalledTimes(2);
  expect(transmitter.disconnect.mock).toHaveBeenCalledWith(connection, 'bye');
});

test('#attachTopic(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  const connection = new ConnectionChannel('#server', '#conn');

  transmitter.attachTopic.mock.fake(async () => false);

  const topic = new TopicChannel('foo', 'bar');
  await expect(bot.attachTopic(connection, topic)).resolves.toBe(false);

  transmitter.attachTopic.mock.fake(async () => true);
  await expect(bot.attachTopic(connection, topic)).resolves.toBe(true);

  expect(transmitter.attachTopic.mock).toHaveBeenCalledTimes(2);
  expect(transmitter.attachTopic.mock).toHaveBeenCalledWith(connection, topic);
});

test('#detachTopic(channel, socketId, reason)', async () => {
  const bot = new WebSocketBot(transmitter, initScope, dispatchWrapper);
  const connection = new ConnectionChannel('#server', '#conn');

  transmitter.detachTopic.mock.fake(async () => false);

  const topic = new TopicChannel('foo', 'bar');
  await expect(bot.detachTopic(connection, topic)).resolves.toBe(false);

  transmitter.detachTopic.mock.fake(async () => true);
  await expect(bot.detachTopic(connection, topic)).resolves.toBe(true);

  expect(transmitter.detachTopic.mock).toHaveBeenCalledTimes(2);
  expect(transmitter.detachTopic.mock).toHaveBeenCalledWith(connection, topic);
});
