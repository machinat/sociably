import moxy from 'moxy';
import WS from 'ws';
import Socket from '../../socket';
import { connectionScope } from '../../channel';
import Client from '../client';

jest.mock('../../socket');

const delay = t => new Promise(resolve => setTimeout(resolve, t));

beforeEach(() => {
  Socket.mock.reset();
  WS.mock.clear();
});

it('initiate ok', () => {
  const client = new Client({ url: '/hello' }); // eslint-disable-line no-unused-vars

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith('/hello', 'machinat-websocket-v0');

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(
    expect.any(String),
    WS.mock.calls[0].instance
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
  socket.emit(
    'connect',
    { connectionId: '#conn', req, user: { id: 'xxx', name: 'jojo doe' } },
    3
  );

  expect(client.connected).toBe(true);

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  const frame = eventSpy.mock.calls[0].args[0];

  expect(frame.user).toEqual({ id: 'xxx', name: 'jojo doe' });
  expect(frame.event).toEqual({ type: '@connect' });
  expect(frame.client).toBe(client);
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
  const user = { id: 'xxx', jane: 'doe' };

  socket.emit('open');
  socket.emit('connect', {
    connectionId: '#conn',
    user,
  });
  await delay();

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  socket.emit('event', {
    connectionId: '#conn',
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
    channel: connectionScope({
      serverId: '',
      socketId: '',
      id: '#conn',
      user,
      tags: null,
    }),
    user,
    client,
  });
});

it('send event when connected', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.event.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  socket.emit('open');
  socket.emit('connect', {
    connectionId: '#conn',
    user: { id: 'xxx', name: 'jojo doe' },
  });
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
    connectionId: '#conn',
    type: 'attack',
    subtype: 'chicken',
    payload: 'Chicken Attack! A~AA~AAAA~~',
  });
});

it('queue the sendings when not ready and fire after connected', async () => {
  const client = new Client({ url: '/hello' });

  const socket = Socket.mock.calls[0].instance;
  socket.register.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.event.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

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
  socket.emit(
    'connect',
    { connectionId: '#conn', req, user: { id: 'xxx', name: 'john doe' } },
    3
  );

  expect(socket.event.mock).toHaveBeenCalledTimes(2);
  expect(socket.event.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
    type: 'greeting',
    payload: 'hi',
  });
  expect(socket.event.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
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

  socket.emit('connect', {
    connectionId: '#conn',
    user: { id: 'xxx', name: 'jane doe' },
  });

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  socket.emit('disconnect', { connectionId: '#conn', reason: 'See ya!' });

  expect(client.connected).toBe(false);
  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    event: { type: '@disconnect' },
    channel: connectionScope({
      serverId: '',
      socketId: '',
      id: '#conn',
      user: { id: 'xxx', name: 'jane doe' },
      tags: null,
    }),
    user: { id: 'xxx', name: 'jane doe' },
    client,
  });
});

test('#disconnect()', async () => {
  const client = new Client({ url: '/hello' });
  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  socket.emit('connect', { connectionId: '#conn', user: { id: 'xxx' } });

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  expect(client.disconnect('You are chicken attacked!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
    reason: 'You are chicken attacked!',
  });

  expect(client.connected).toBe(false);

  socket.emit('disconnect', { connectionId: '#conn', reason: 'See ya!' });

  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    event: { type: '@disconnect' },
    channel: connectionScope({
      serverId: '',
      socketId: '',
      id: '#conn',
      user: { id: 'xxx' },
      tags: null,
    }),
    user: { id: 'xxx' },
    client,
  });
});

it('emit errer if connect_fail', () => {
  const errorSpy = moxy();
  const client = new Client({ url: '/hello' });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('connect_fail', { connectionId: '#conn', reason: 'FAILED' }, 3);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: connect handshake fail]`
  );
});
