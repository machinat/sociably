import url from 'url';
import moxy from '@moxyjs/moxy';
import WS from 'ws';
import Socket from '../../socket';
import { WebSocketConnection } from '../../channel';
import Client from '../client';

const location = url.parse('https://machinat.com/hello');
global.window = { location };

jest.mock('../../socket', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../../socket'))
);

const nextTick = () => new Promise(process.nextTick);

const user = { john: 'doe' };

const login = moxy(async () => ({
  user,
  credential: { foo: 'bar' },
}));

const expectedChannel = new WebSocketConnection('*', '#conn');
const eventSpy = moxy();

beforeEach(() => {
  Socket.mock.reset();
  WS.mock.clear();
  login.mock.clear();
  eventSpy.mock.clear();
});

it('initiate ok', async () => {
  const client = new Client({ login }); // eslint-disable-line no-unused-vars
  await nextTick();

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith(
    'wss://machinat.com/',
    'machinat-websocket-v0'
  );

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(
    expect.any(String),
    WS.mock.calls[0].instance,
    null
  );
});

test('specify url', async () => {
  // eslint-disable-next-line no-unused-vars
  const client = new Client({
    url: 'ws://machinat.io/websocket',
    login,
  });
  await nextTick();

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith(
    'ws://machinat.io/websocket',
    'machinat-websocket-v0'
  );

  const client2 = new Client({ url: '/foo/websocket/server', login }); // eslint-disable-line no-unused-vars
  await nextTick();

  expect(WS.mock).toHaveBeenCalledTimes(2);
  expect(WS.mock).toHaveBeenCalledWith(
    'wss://machinat.com/foo/websocket/server',
    'machinat-websocket-v0'
  );
});

test('login with no options.login', async () => {
  const client = new Client();
  client.onEvent(eventSpy);
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  expect(socket.login.mock).not.toHaveBeenCalled();

  expect(client.user).toBe(null);

  socket.emit('open', socket);
  await nextTick();

  expect(socket.login.mock).toHaveBeenCalledTimes(1);
  expect(socket.login.mock).toHaveBeenCalledWith({
    credential: null,
  });
  expect(client.user).toEqual(null);

  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);
  await nextTick();

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    kind: 'connection',
    type: 'connect',
    user: null,
    channel: expectedChannel,
  });

  expect(client.channel).toEqual(expectedChannel);
});

it('login with credential from options.login()', async () => {
  const client = new Client({ login });
  client.onEvent(eventSpy);
  await nextTick();

  expect(login.mock).toHaveBeenCalledTimes(1);
  expect(login.mock).toHaveBeenCalledWith(/* empty */);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.login.mock).not.toHaveBeenCalled();
  socket.emit('open', socket);
  await nextTick();

  expect(socket.login.mock).toHaveBeenCalledTimes(1);
  expect(socket.login.mock).toHaveBeenCalledWith({
    credential: { foo: 'bar' },
  });

  expect(client.user).toEqual({ john: 'doe' });
  expect(client.channel).toBe(null);

  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);
  await nextTick();

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    kind: 'connection',
    type: 'connect',
    user,
    channel: expectedChannel,
  });

  expect(client.channel).toEqual(new WebSocketConnection('*', '#conn'));
});

it('emit "error" if login rejected', async () => {
  const client = new Client({ login });
  const errorSpy = moxy();
  client.onError(errorSpy);
  await nextTick();

  const socket = Socket.mock.calls[0].instance;

  socket.emit('open', socket);
  await nextTick();

  expect(socket.login.mock).toHaveBeenCalledTimes(1);
  await nextTick();

  socket.emit('reject', { seq: 1, reason: 'you shall not pass' }, 2);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[SocketError: you shall not pass]`
  );
});

it('emit "event" when dispatched events received', async () => {
  const client = new Client({ login });
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  client.onEvent(eventSpy);
  socket.emit(
    'dispatch',
    {
      connId: '#conn',
      events: [
        { type: 'start', payload: 'Welcome to Hyrule' },
        {
          kind: 'reaction',
          type: 'wasted',
          payload: 'Link is down! Legend over.',
        },
      ],
    },
    3,
    socket
  );

  expect(eventSpy.mock).toHaveBeenCalledTimes(2);
  expect(eventSpy.mock).toHaveBeenNthCalledWith(1, {
    kind: 'default',
    type: 'start',
    payload: 'Welcome to Hyrule',
    user,
    channel: expectedChannel,
  });
  expect(eventSpy.mock).toHaveBeenNthCalledWith(2, {
    kind: 'reaction',
    type: 'wasted',
    payload: 'Link is down! Legend over.',
    user,
    channel: expectedChannel,
  });

  socket.emit(
    'dispatch',
    {
      connId: '#conn',
      events: [{ type: 'resurrect', payload: 'Hero never die!' }],
    },
    4,
    socket
  );

  expect(eventSpy.mock).toHaveBeenCalledTimes(3);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    kind: 'default',
    type: 'resurrect',
    payload: 'Hero never die!',
    user,
    channel: expectedChannel,
  });
});

it('send events when already connected', async () => {
  const client = new Client({ login });
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  await expect(
    client.send(
      { type: 'foo', payload: 1 },
      { type: 'bar', kind: 'beer', payload: 2 }
    )
  ).resolves.toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [
      { type: 'foo', payload: 1 },
      { type: 'bar', kind: 'beer', payload: 2 },
    ],
  });

  await expect(client.send({ type: 'baz', payload: 3 })).resolves.toBe(
    undefined
  );
  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [{ type: 'baz', payload: 3 }],
  });
});

it('queue events when not ready and fire them after connected', async () => {
  const client = new Client({ login });
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.login.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  const done = moxy();
  const promise1 = client.send({ type: 'greeting', payload: 'hi' }).then(done);
  const promise2 = client
    .send({ type: 'greeting', payload: 'how are you' })
    .then(done);

  await nextTick();
  expect(done.mock).not.toHaveBeenCalled();
  expect(socket.dispatch.mock).not.toHaveBeenCalled();

  socket.emit('open', socket);
  await nextTick();

  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [{ type: 'greeting', payload: 'hi' }],
  });
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [{ type: 'greeting', payload: 'how are you' }],
  });

  await promise1;
  await promise2;
  expect(done.mock).toHaveBeenCalledTimes(2);
});

test('disconnect by server', async () => {
  const client = new Client({ login });
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  socket.emit('disconnect', { connId: '#conn', reason: 'See ya!' }, 3, socket);

  expect(client.connected).toBe(false);
  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    kind: 'connection',
    type: 'disconnect',
    user,
    channel: expectedChannel,
  });
});

test('#disconnect()', async () => {
  const client = new Client({ login });
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  expect(client.disconnect('Bye!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    connId: '#conn',
    reason: 'Bye!',
  });

  expect(client.connected).toBe(false);

  socket.emit('disconnect', { connId: '#conn', reason: 'Bye!' }, 4, socket);

  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    kind: 'connection',
    type: 'disconnect',
    user,
    channel: expectedChannel,
  });
});
