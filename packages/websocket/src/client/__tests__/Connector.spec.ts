import url from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import _Ws from 'ws';
import _Socket from '../../socket';
import Connector from '../Connector';

const Socket = _Socket as Moxy<typeof _Socket>;
const Ws = _Ws as Moxy<typeof _Ws>;

const location = url.parse('https://machinat.com/hello');
global.window = { location } as never;

jest.mock('../../socket', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../../socket'))
);

const nextTick = () => new Promise(process.nextTick);

const user = { platform: 'test', uid: 'john_doe' };

const login = moxy(async () => ({
  user,
  credential: { foo: 'bar' },
}));

const connectSpy = moxy();
const eventsSpy = moxy();
const disconnectSpy = moxy();

beforeEach(() => {
  Socket.mock.reset();
  Ws.mock.clear();
  login.mock.clear();
  connectSpy.mock.clear();
  eventsSpy.mock.clear();
  disconnectSpy.mock.clear();
});

test('start()', async () => {
  const connector = new Connector('wss://machinat.io/websocket', login);
  connector.start();
  await nextTick();

  expect(Ws.mock).toHaveBeenCalledTimes(1);
  expect(Ws.mock).toHaveBeenCalledWith(
    'wss://machinat.io/websocket',
    'machinat-websocket-v0'
  );

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(Ws.mock.calls[0].instance);
});

it('login with credential from login fn', async () => {
  const connector = new Connector('wss://machinat.io', login);
  connector.on('connect', connectSpy);
  connector.start();
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

  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);
  await nextTick();

  expect(connectSpy.mock).toHaveBeenCalledTimes(1);
  expect(connectSpy.mock).toHaveBeenCalledWith({ connId: '#conn', user });
});

it('emit "error" if login rejected', async () => {
  const connector = new Connector('wss://machinat.io', login);
  const errorSpy = moxy();
  connector.on('error', errorSpy);

  connector.start();
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
  const connector = new Connector('wss://machinat.io', login);
  connector.start();
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  const eventValues = [
    { type: 'start', payload: 'Welcome to Hyrule' },
    {
      kind: 'reaction',
      type: 'wasted',
      payload: 'Link is down! Legend over.',
    },
  ];

  connector.on('events', eventsSpy);
  socket.emit(
    'events',
    {
      connId: '#conn',
      values: eventValues,
    },
    3,
    socket
  );

  expect(eventsSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventsSpy.mock).toHaveBeenCalledWith(eventValues, {
    connId: '#conn',
    user,
  });
});

it('send events when already connected', async () => {
  const connector = new Connector('wss://machinat.io', login);
  connector.start();
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  await expect(
    connector.send([
      { type: 'foo', payload: 1 },
      { type: 'bar', kind: 'beer', payload: 2 },
    ])
  ).resolves.toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    values: [
      { type: 'foo', payload: 1 },
      { type: 'bar', kind: 'beer', payload: 2 },
    ],
  });

  await expect(connector.send([{ type: 'baz', payload: 3 }])).resolves.toBe(
    undefined
  );
  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    values: [{ type: 'baz', payload: 3 }],
  });
});

it('queue events when not ready and fire them after connected', async () => {
  const connector = new Connector('wss://machinat.io', login);
  connector.start();
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.login.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  const done = moxy();
  const promise1 = connector
    .send([{ type: 'greeting', payload: 'hi' }])
    .then(done);
  const promise2 = connector
    .send([{ type: 'greeting', payload: 'how are you' }])
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
    values: [{ type: 'greeting', payload: 'hi' }],
  });
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    values: [{ type: 'greeting', payload: 'how are you' }],
  });

  await promise1;
  await promise2;
  expect(done.mock).toHaveBeenCalledTimes(2);
});

test('disconnect by server', async () => {
  const connector = new Connector('wss://machinat.io', login);
  connector.start();
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  connector.on('disconnect', disconnectSpy);

  expect(connector.isConnected()).toBe(true);
  socket.emit('disconnect', { connId: '#conn', reason: 'See ya!' }, 3, socket);

  expect(connector.isConnected()).toBe(false);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(
    { reason: 'See ya!' },
    { connId: '#conn', user }
  );
});

test('#disconnect()', async () => {
  const connector = new Connector('wss://machinat.io', login);
  connector.start();
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId: '#conn', seq: 1 }, 2, socket);

  connector.on('disconnect', disconnectSpy);

  expect(connector.isConnected()).toBe(true);
  expect(connector.disconnect('Bye!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    connId: '#conn',
    reason: 'Bye!',
  });

  expect(connector.isConnected()).toBe(false);

  socket.emit('disconnect', { connId: '#conn', reason: 'Bye!' }, 4, socket);

  expect(disconnectSpy.mock).toHaveBeenCalledWith(
    { reason: 'Bye!' },
    { connId: '#conn', user }
  );
});
