import url from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import _Ws from 'ws';
import _Socket from '../../socket';
import Connector from '../Connector';

const Socket = _Socket as Moxy<typeof _Socket>;
const Ws = _Ws as Moxy<typeof _Ws>;

const location = url.parse('https://machinat.io/hello');
(global as any).window = { location };

jest.mock('../../socket', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../../socket'))
);

const nextTick = () => new Promise(process.nextTick);

const user = { platform: 'test', uid: 'john_doe' };

const login = moxy(async () => ({
  user,
  credential: { foo: 'bar' },
}));

const marshaler = moxy({
  marshal: (x) => x,
  unmarshal: (x) => x,
});

const connectSpy = moxy();
const eventsSpy = moxy();
const disconnectSpy = moxy();

beforeEach(() => {
  Socket.mock.reset();
  Ws.mock.clear();
  marshaler.mock.reset();
  login.mock.clear();
  connectSpy.mock.clear();
  eventsSpy.mock.clear();
  disconnectSpy.mock.clear();
});

const connId = '#conn';

const openConnection = async () => {
  const connector = new Connector('/websocket', login, marshaler);
  connector.start();
  await nextTick();

  const socket = Socket.mock.calls[0].instance;
  socket.login.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.emit('open', socket);
  await nextTick();
  socket.emit('connect', { connId, seq: 1 }, 2, socket);
  await nextTick();

  return [connector, socket];
};

test('start()', async () => {
  const connector = new Connector('/websocket', login, marshaler);
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

test('use ws: protocol', async () => {
  const connector = new Connector(
    'ws://machinat.io/websocket',
    login,
    marshaler
  );
  connector.start();
  await nextTick();

  expect(Ws.mock).toHaveBeenCalledTimes(1);
  expect(Ws.mock).toHaveBeenCalledWith(
    'ws://machinat.io/websocket',
    'machinat-websocket-v0'
  );

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(Ws.mock.calls[0].instance);
});

it('login with credential from login fn', async () => {
  const connector = new Connector('/websocket', login, marshaler);
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

  socket.emit('connect', { connId, seq: 1 }, 2, socket);
  await nextTick();

  expect(connectSpy.mock).toHaveBeenCalledTimes(1);
  expect(connectSpy.mock).toHaveBeenCalledWith({ connId, user });
});

it('emit "error" if login rejected', async () => {
  const connector = new Connector('/websocket', login, marshaler);
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

it('pop events from server', async () => {
  const [connector, socket] = await openConnection();

  const eventValues = [
    { type: 'start', payload: 'Welcome to Hyrule' },
    {
      category: 'reaction',
      type: 'wasted',
      payload: 'Link is down! Legend over.',
    },
  ];

  connector.on('events', eventsSpy);
  socket.emit('events', { connId, values: eventValues }, 3, socket);

  expect(eventsSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventsSpy.mock).toHaveBeenCalledWith(eventValues, {
    connId,
    user,
  });
});

it('unmarshal payload', async () => {
  const [connector, socket] = await openConnection();
  marshaler.unmarshal.mock.fake((x) => ({ ...x, unmarshaled: true }));

  connector.on('events', eventsSpy);
  socket.emit(
    'events',
    {
      connId,
      values: [
        { type: 'any', payload: { foo: 'bar' } },
        { type: 'any', payload: { foo: 'baz' } },
      ],
    },
    3,
    socket
  );

  expect(eventsSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventsSpy.mock).toHaveBeenCalledWith(
    [
      { type: 'any', payload: { foo: 'bar', unmarshaled: true } },
      { type: 'any', payload: { foo: 'baz', unmarshaled: true } },
    ],
    { connId, user }
  );

  expect(marshaler.unmarshal.mock).toHaveBeenCalledTimes(2);
  expect(marshaler.unmarshal.mock).toHaveBeenCalledWith({ foo: 'bar' });
  expect(marshaler.unmarshal.mock).toHaveBeenCalledWith({ foo: 'baz' });
});

it('send events after connected', async () => {
  const [connector, socket] = await openConnection();

  await expect(
    connector.send([
      { type: 'foo', payload: 1 },
      { type: 'bar', category: 'beer', payload: 2 },
    ])
  ).resolves.toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId,
    values: [
      { type: 'foo', payload: 1 },
      { type: 'bar', category: 'beer', payload: 2 },
    ],
  });

  await expect(connector.send([{ type: 'baz', payload: 3 }])).resolves.toBe(
    undefined
  );
  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId,
    values: [{ type: 'baz', payload: 3 }],
  });
});

it('queue events and dispatch them after connected', async () => {
  const connector = new Connector('wss://machinat.io', login, marshaler);
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

  socket.emit('connect', { connId, seq: 1 }, 2, socket);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId,
    values: [{ type: 'greeting', payload: 'hi' }],
  });
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId,
    values: [{ type: 'greeting', payload: 'how are you' }],
  });

  await promise1;
  await promise2;
  expect(done.mock).toHaveBeenCalledTimes(2);
});

it('marshal payload', async () => {
  const [connector, socket] = await openConnection();
  marshaler.marshal.mock.fake((x) => ({ ...x, marshaled: true }));

  await connector.send([
    { type: 'any', payload: { foo: 'bar' } },
    { type: 'any', payload: { foo: 'baz' } },
  ]);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId,
    values: [
      { type: 'any', payload: { foo: 'bar', marshaled: true } },
      { type: 'any', payload: { foo: 'baz', marshaled: true } },
    ],
  });

  expect(marshaler.marshal.mock).toHaveBeenCalledTimes(2);
  expect(marshaler.marshal.mock).toHaveBeenCalledWith({ foo: 'bar' });
  expect(marshaler.marshal.mock).toHaveBeenCalledWith({ foo: 'baz' });
});

test('disconnect by server', async () => {
  const [connector, socket] = await openConnection();
  connector.on('disconnect', disconnectSpy);

  expect(connector.isConnected()).toBe(true);
  socket.emit('disconnect', { connId, reason: 'See ya!' }, 3, socket);

  expect(connector.isConnected()).toBe(false);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(
    { reason: 'See ya!' },
    { connId, user }
  );
});

test('#disconnect()', async () => {
  const [connector, socket] = await openConnection();
  socket.disconnect.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  connector.on('disconnect', disconnectSpy);

  expect(connector.isConnected()).toBe(true);
  expect(connector.disconnect('Bye!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    connId,
    reason: 'Bye!',
  });

  expect(connector.isConnected()).toBe(false);

  socket.emit('disconnect', { connId, reason: 'Bye!' }, 4, socket);

  expect(disconnectSpy.mock).toHaveBeenCalledWith(
    { reason: 'Bye!' },
    { connId, user }
  );
});
