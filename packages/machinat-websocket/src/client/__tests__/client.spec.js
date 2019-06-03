import moxy from 'moxy';
import WS from 'ws';
import Socket from '../../socket';
import Channel from '../../channel';
import Client from '../client';
import Connection from '../connection';

jest.mock('../../socket');

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const uid = 'websocket:foo:bar:baz';
const info = { hello: 'world' };

beforeEach(() => {
  Socket.mock.reset();
  WS.mock.clear();
});

it('initiate ok', () => {
  const client = new Client({ url: '/hello' }); // eslint-disable-line no-unused-vars

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith('/hello', 'machinat-websocket-v0');

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock.calls[0].args[0]).toBe(
    WS.mock.calls[0].instance,
    expect.any(String),
    undefined
  );
});

it('emit open when socket open', () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;

  const openSpy = moxy();
  client.on('open', openSpy);

  socket.emit('open');

  expect(openSpy.mock).toHaveBeenCalledTimes(1);
});

it('emit close when socket close', () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;

  const closeSpy = moxy();
  client.on('close', closeSpy);

  socket.emit('close');

  expect(closeSpy.mock).toHaveBeenCalledTimes(1);
});

it('register to server and setup connection when conneted', async () => {
  const clientConnectSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.on('connect', clientConnectSpy);

  const socket = Socket.mock.calls[0].instance;

  const connection = client.register({ type: 'test' });
  expect(connection).toBeInstanceOf(Connection);
  expect(connection.isReady).toBe(false);
  expect(connection.info).toBe(undefined);

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  expect(socket.register.mock).toHaveBeenCalledWith({ type: 'test' });

  const connEventSpy = moxy();
  connection.onEvent(connEventSpy);

  const req = await socket.register.mock.calls[0].result;
  socket.emit('connect', { uid, req, info }, 3);

  expect(clientConnectSpy.mock).not.toHaveBeenCalled();

  expect(connection.isReady).toBe(true);
  expect(connection.channel).toEqual(new Channel('foo', 'bar', 'baz'));
  expect(connection.info).toEqual(info);

  expect(connEventSpy.mock).toHaveBeenCalledTimes(1);
  expect(connEventSpy.mock).toHaveBeenCalledWith(
    { type: '@connect' },
    new Channel('foo', 'bar', 'baz'),
    info
  );
});

it('emit error if register rejected when socket is already open', async () => {
  const errorSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.on('error', errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.readyState.mock.fake(() => WS.OPEN);
  socket.register.mock.fake(() => Promise.resolve(3));

  client.register({ type: 'test' });
  expect(socket.register.mock).toHaveBeenCalledTimes(1);

  await delay();

  socket.emit('reject', { req: 3, reason: 'you are fired' }, 5);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: you are fired]`
  );
});

it('queue register and fire when socket open', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.readyState.mock.fake(() => WS.CONNETING);

  const connection = client.register({ type: 'test' });
  expect(connection).toBeInstanceOf(Connection);

  expect(socket.register.mock).not.toHaveBeenCalled();

  socket.emit('open');

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  expect(socket.register.mock).toHaveBeenCalledWith({ type: 'test' });
});

it('emit error if register rejected after opened', async () => {
  const errorSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.on('error', errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.readyState.mock.fake(() => WS.CONNETING);

  socket.register.mock.fake(() => Promise.resolve(3));
  client.register({ type: 'test' });

  await delay();
  socket.emit('open');

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  await delay();

  socket.emit('reject', { req: 3, reason: 'you are fired' }, 5);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: you are fired]`
  );
});

it('is attached with connect event when not registered by client', () => {
  const connectSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.on('connect', connectSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.event.mock.fake(() => ++socket._seq); // eslint-disable-line no-plusplus
  socket.disconnect.mock.fake(() => ++socket._seq); // eslint-disable-line no-plusplus
  socket.emit('connect', { uid, info });

  expect(connectSpy.mock).toHaveBeenCalledTimes(1);

  const [connection] = connectSpy.mock.calls[0].args;

  expect(connection).toBeInstanceOf(Connection);
  expect(connection.isReady).toBe(true);
  expect(connection.info).toEqual(info);
  expect(connection.channel).toEqual(new Channel('foo', 'bar', 'baz'));
});

test('connection receiving event', () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;

  const connectSpy = moxy();
  client.on('connect', connectSpy);
  socket.emit('connect', {
    uid,
    info,
  });
  const [connection] = connectSpy.mock.calls[0].args;

  const connectionEventSpy = moxy();
  connection.onEvent(connectionEventSpy);

  socket.emit('event', {
    uid,
    type: 'reaction',
    subtype: 'wasted',
    payload: 'Link is down! Legend over.',
  });

  expect(connectionEventSpy.mock).toHaveBeenCalledTimes(1);
  expect(connectionEventSpy.mock).toHaveBeenCalledWith(
    {
      type: 'reaction',
      subtype: 'wasted',
      payload: 'Link is down! Legend over.',
    },
    new Channel('foo', 'bar', 'baz'),
    info
  );
});

test('connection sending when ready', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.event.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  const connectSpy = moxy();
  client.on('connect', connectSpy);
  socket.emit('connect', { uid, info });
  const [connection] = connectSpy.mock.calls[0].args;

  await expect(
    connection.send({
      type: 'attack',
      subtype: 'chicken',
      payload: 'Chicken Attack! A~AA~AAAA~~',
    })
  ).resolves.toBe(undefined);

  expect(socket.event.mock).toHaveBeenCalledTimes(1);
  expect(socket.event.mock).toHaveBeenCalledWith({
    uid,
    type: 'attack',
    subtype: 'chicken',
    payload: 'Chicken Attack! A~AA~AAAA~~',
  });
});

test('connection queue the sendings when not ready and fire after connected', async () => {
  const clientConnectSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.on('connect', clientConnectSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.event.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  const connection = client.register({ type: 'test' });
  const done = moxy();
  const promise1 = connection
    .send({ type: 'greeting', payload: 'hi' })
    .then(done);
  const promise2 = connection
    .send({ type: 'greeting', payload: 'how are you' })
    .then(done);

  await delay(5);
  expect(done.mock).not.toHaveBeenCalled();
  expect(socket.event.mock).not.toHaveBeenCalled();

  const req = await socket.register.mock.calls[0].result;
  socket.emit('connect', { uid, req, info }, 3);

  expect(socket.event.mock).toHaveBeenCalledTimes(2);
  expect(socket.event.mock).toHaveBeenCalledWith({
    uid,
    type: 'greeting',
    payload: 'hi',
  });
  expect(socket.event.mock).toHaveBeenCalledWith({
    uid,
    type: 'greeting',
    payload: 'how are you',
  });

  await promise1;
  await promise2;
  expect(done.mock).toHaveBeenCalledTimes(2);
});

test('disconnect by server', () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;

  const connectSpy = moxy();
  client.on('connect', connectSpy);
  socket.emit('connect', { uid, info });

  const connEventSpy = moxy();
  const [connection] = connectSpy.mock.calls[0].args;
  connection.onEvent(connEventSpy);

  expect(connection.isReady).toBe(true);
  socket.emit('disconnect', { uid, reason: 'See ya!' });

  expect(connection.isReady).toBe(false);
  expect(connEventSpy.mock).toHaveBeenCalledTimes(1);
  expect(connEventSpy.mock).toHaveBeenCalledWith(
    { type: '@disconnect' },
    new Channel('foo', 'bar', 'baz'),
    info
  );
});

test('disconnect by connection.disconnect()', () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  const connectSpy = moxy();
  client.on('connect', connectSpy);
  socket.emit('connect', { uid, info });

  const connEventSpy = moxy();
  const [connection] = connectSpy.mock.calls[0].args;
  connection.onEvent(connEventSpy);

  expect(connection.isReady).toBe(true);
  expect(connection.disconnect('You are chickened!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    uid,
    reason: 'You are chickened!',
  });

  expect(connection.isReady).toBe(false);
  expect(connEventSpy.mock).not.toHaveBeenCalled();

  socket.emit('disconnect', { uid, reason: 'See ya!' });

  expect(connEventSpy.mock).toHaveBeenCalledTimes(1);
  expect(connEventSpy.mock).toHaveBeenCalledWith(
    { type: '@disconnect' },
    new Channel('foo', 'bar', 'baz'),
    info
  );
});

it('emit errer if connect_fail', () => {
  const errorSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.on('error', errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('connect_fail', { uid, reason: 'FAILED' }, 3);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: connect handshake fail]`
  );
});
