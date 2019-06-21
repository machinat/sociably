import moxy from 'moxy';
import WS from 'ws';
import Socket from '../../socket';
import Channel from '../../channel';
import Client from '../client';

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

it('register to server when socket open', async () => {
  const eventSpy = moxy();
  const client = new Client({ url: '/hello', register: { type: 'test' } });
  client.onEvent(eventSpy);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.register.mock).not.toHaveBeenCalled();

  socket.emit('open');

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  expect(socket.register.mock).toHaveBeenCalledWith({ type: 'test' });

  expect(client.connected).toBe(false);

  const req = await socket.register.mock.calls[0].result;
  socket.emit('connect', { uid, req, info }, 3);

  expect(client.connected).toBe(true);
  expect(client.channel).toEqual(new Channel('foo', 'bar', 'baz'));
  expect(client.connectionInfo).toEqual(info);

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    event: { type: '@connect' },
    channel: new Channel('foo', 'bar', 'baz'),
    connectionInfo: info,
    client,
  });
});

it('register with {type: "default"} if empty in options', async () => {
  const eventSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.onEvent(eventSpy);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.register.mock).not.toHaveBeenCalled();

  socket.emit('open');

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  expect(socket.register.mock).toHaveBeenCalledWith({ type: 'default' });
});

it('emit error if register rejected when socket is already open', async () => {
  const errorSpy = moxy();
  const client = new Client({ url: '/hello', register: { type: 'test' } });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.register.mock.fake(() => Promise.resolve(3));

  socket.emit('open');
  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  await delay();

  socket.emit('reject', { req: 3, reason: 'you are fired' }, 5);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: you are fired]`
  );
});

it('emit event when received', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;

  socket.emit('open');
  socket.emit('connect', { uid, info });
  await delay();

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  socket.emit('event', {
    uid,
    type: 'reaction',
    subtype: 'wasted',
    payload: 'Link is down! Legend over.',
  });

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    event: {
      type: 'reaction',
      subtype: 'wasted',
      payload: 'Link is down! Legend over.',
    },
    channel: new Channel('foo', 'bar', 'baz'),
    connectionInfo: info,
    client,
  });
});

it('send event when connected', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.event.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  socket.emit('open');
  socket.emit('connect', { uid, info });
  await delay();

  await expect(
    client.send({
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

it('queue the sendings when not ready and fire after connected', async () => {
  const client = new Client({ url: '/hello' });

  const socket = Socket.mock.calls[0].instance;
  socket.register.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus
  socket.event.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  const done = moxy();
  const promise1 = client.send({ type: 'greeting', payload: 'hi' }).then(done);
  const promise2 = client
    .send({ type: 'greeting', payload: 'how are you' })
    .then(done);

  await delay(5);
  expect(done.mock).not.toHaveBeenCalled();
  expect(socket.event.mock).not.toHaveBeenCalled();

  socket.emit('open');

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

  socket.emit('connect', { uid, info });

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  socket.emit('disconnect', { uid, reason: 'See ya!' });

  expect(client.connected).toBe(false);
  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    event: { type: '@disconnect' },
    channel: new Channel('foo', 'bar', 'baz'),
    connectionInfo: info,
    client,
  });
});

test('disconnect by #close()', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  socket.emit('connect', { uid, info });

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  expect(client.close('You are chickened!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    uid,
    reason: 'You are chickened!',
  });

  expect(client.connected).toBe(false);

  socket.emit('disconnect', { uid, reason: 'See ya!' });

  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    event: { type: '@disconnect' },
    channel: new Channel('foo', 'bar', 'baz'),
    connectionInfo: info,
    client,
  });
});

it('emit errer if connect_fail', () => {
  const errorSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('connect_fail', { uid, reason: 'FAILED' }, 3);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: connect handshake fail]`
  );
});
