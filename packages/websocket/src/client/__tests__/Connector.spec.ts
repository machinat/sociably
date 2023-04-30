import url from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import _Ws from 'ws';
import _Socket from '../../Socket';
import Connector from '../Connector';

const Socket = _Socket as Moxy<typeof _Socket>;
const Ws = _Ws as Moxy<typeof _Ws>;

const location = url.parse('https://sociably.io/hello');
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
  connector.connect();
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

test('.connect()', async () => {
  const connector = new Connector('/websocket', login, marshaler);
  connector.connect();
  await nextTick();

  expect(Ws).toHaveBeenCalledTimes(1);
  expect(Ws).toHaveBeenCalledWith(
    'wss://sociably.io/websocket',
    'sociably-websocket-v0'
  );

  expect(Socket).toHaveBeenCalledTimes(1);
  expect(Socket).toHaveBeenCalledWith(Ws.mock.calls[0].instance);
});

test('use ws: protocol', async () => {
  const connector = new Connector(
    'ws://sociably.io/websocket',
    login,
    marshaler
  );
  connector.connect();
  await nextTick();

  expect(Ws).toHaveBeenCalledTimes(1);
  expect(Ws).toHaveBeenCalledWith(
    'ws://sociably.io/websocket',
    'sociably-websocket-v0'
  );

  expect(Socket).toHaveBeenCalledTimes(1);
  expect(Socket).toHaveBeenCalledWith(Ws.mock.calls[0].instance);
});

it('login with credential from login fn', async () => {
  const connector = new Connector('/websocket', login, marshaler);
  connector.on('connect', connectSpy);
  connector.connect();
  await nextTick();

  expect(login).toHaveBeenCalledTimes(1);
  expect(login).toHaveBeenCalledWith(/* empty */);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.login).not.toHaveBeenCalled();
  socket.emit('open', socket);
  await nextTick();

  expect(socket.login).toHaveBeenCalledTimes(1);
  expect(socket.login).toHaveBeenCalledWith({
    credential: { foo: 'bar' },
  });

  socket.emit('connect', { connId, seq: 1 }, 2, socket);
  await nextTick();

  expect(connectSpy).toHaveBeenCalledTimes(1);
  expect(connectSpy).toHaveBeenCalledWith({ connId, user });
});

it('emit "error" if login rejected', async () => {
  const connector = new Connector('/websocket', login, marshaler);
  const errorSpy = moxy();
  connector.on('error', errorSpy);

  connector.connect();
  await nextTick();
  const socket = Socket.mock.calls[0].instance;

  socket.emit('open', socket);
  await nextTick();

  expect(socket.login).toHaveBeenCalledTimes(1);
  await nextTick();

  socket.emit('reject', { seq: 1, reason: 'you shall not pass' }, 2);

  expect(errorSpy).toHaveBeenCalledTimes(1);
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

  expect(eventsSpy).toHaveBeenCalledTimes(1);
  expect(eventsSpy).toHaveBeenCalledWith(eventValues, {
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

  expect(eventsSpy).toHaveBeenCalledTimes(1);
  expect(eventsSpy).toHaveBeenCalledWith(
    [
      { type: 'any', payload: { foo: 'bar', unmarshaled: true } },
      { type: 'any', payload: { foo: 'baz', unmarshaled: true } },
    ],
    { connId, user }
  );

  expect(marshaler.unmarshal).toHaveBeenCalledTimes(2);
  expect(marshaler.unmarshal).toHaveBeenCalledWith({ foo: 'bar' });
  expect(marshaler.unmarshal).toHaveBeenCalledWith({ foo: 'baz' });
});

it('send events after connected', async () => {
  const [connector, socket] = await openConnection();

  await expect(
    connector.send([
      { type: 'foo', payload: 1 },
      { type: 'bar', category: 'beer', payload: 2 },
    ])
  ).resolves.toBe(undefined);

  expect(socket.dispatch).toHaveBeenCalledTimes(1);
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId,
    values: [
      { type: 'foo', payload: 1 },
      { type: 'bar', category: 'beer', payload: 2 },
    ],
  });

  await expect(connector.send([{ type: 'baz', payload: 3 }])).resolves.toBe(
    undefined
  );
  expect(socket.dispatch).toHaveBeenCalledTimes(2);
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId,
    values: [{ type: 'baz', payload: 3 }],
  });
});

it('queue events and dispatch them after connected', async () => {
  const connector = new Connector('wss://sociably.io', login, marshaler);
  connector.connect();
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
  expect(done).not.toHaveBeenCalled();
  expect(socket.dispatch).not.toHaveBeenCalled();

  socket.emit('open', socket);
  await nextTick();

  socket.emit('connect', { connId, seq: 1 }, 2, socket);

  expect(socket.dispatch).toHaveBeenCalledTimes(2);
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId,
    values: [{ type: 'greeting', payload: 'hi' }],
  });
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId,
    values: [{ type: 'greeting', payload: 'how are you' }],
  });

  await promise1;
  await promise2;
  expect(done).toHaveBeenCalledTimes(2);
});

it('marshal payload', async () => {
  const [connector, socket] = await openConnection();
  marshaler.marshal.mock.fake((x) => ({ ...x, marshaled: true }));

  await connector.send([
    { type: 'any', payload: { foo: 'bar' } },
    { type: 'any', payload: { foo: 'baz' } },
  ]);

  expect(socket.dispatch).toHaveBeenCalledTimes(1);
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId,
    values: [
      { type: 'any', payload: { foo: 'bar', marshaled: true } },
      { type: 'any', payload: { foo: 'baz', marshaled: true } },
    ],
  });

  expect(marshaler.marshal).toHaveBeenCalledTimes(2);
  expect(marshaler.marshal).toHaveBeenCalledWith({ foo: 'bar' });
  expect(marshaler.marshal).toHaveBeenCalledWith({ foo: 'baz' });
});

test('disconnect by server', async () => {
  const [connector, socket] = await openConnection();
  connector.on('disconnect', disconnectSpy);

  expect(connector.isConnected()).toBe(true);
  socket.emit('disconnect', { connId, reason: 'See ya!' }, 3, socket);

  expect(connector.isConnected()).toBe(false);
  expect(disconnectSpy).toHaveBeenCalledWith(
    { reason: 'See ya!' },
    { connId, user }
  );
});

test('.close()', async () => {
  const [connector, socket] = await openConnection();
  connector.on('disconnect', disconnectSpy);

  expect(connector.isConnected()).toBe(true);
  expect(connector.close(4567, 'Bye!')).toBe(undefined);
  expect(connector.isClosed).toBe(true);

  expect(socket.close).toHaveBeenCalledTimes(1);
  expect(socket.close).toHaveBeenCalledWith(4567, 'Bye!');

  expect(connector.isConnected()).toBe(false);

  socket.emit('disconnect', { connId, reason: 'Bye!' }, 4, socket);
  expect(disconnectSpy).toHaveBeenCalledWith(
    { reason: 'Bye!' },
    { connId, user }
  );
});

test('throw when sending event after closed', async () => {
  const [connector, socket] = await openConnection();
  connector.on('disconnect', disconnectSpy);

  connector.close(4567, 'Bye!');

  await expect(
    connector.send([{ type: 'foo', payload: 'bar' }])
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"socket is already closed"`);

  expect(socket.dispatch).not.toHaveBeenCalled();
});

test('reconnect behavior at initial connect', async () => {
  jest.useFakeTimers();

  const connector = new Connector('/websocket', login, marshaler);
  const errorSpy = moxy();
  connector.on('error', errorSpy);

  connector.connect();

  for (let i = 0; i < 20; i += 1) {
    await nextTick(); // eslint-disable-line no-await-in-loop
    expect(login).toHaveBeenCalledTimes(i + 1);

    const socket = Socket.mock.calls[i].instance;
    socket.emit('error', new Error('boom'), socket);
    await nextTick(); // eslint-disable-line no-await-in-loop

    expect(errorSpy).toHaveBeenCalledTimes(i + 1);
    jest.advanceTimersByTime(i * 5000);
  }

  connector.close();
  jest.advanceTimersByTime(999999);
  expect(Socket).toHaveBeenCalledTimes(20);

  jest.useRealTimers();
});

test('reconnect behavior after being close', async () => {
  jest.useFakeTimers();

  const [connector, initialSocket] = await openConnection();
  const errorSpy = moxy();
  connector.on('error', errorSpy);

  expect(login).toHaveBeenCalledTimes(1);
  initialSocket.emit('close');

  for (let i = 0; i < 20; i += 1) {
    await nextTick(); // eslint-disable-line no-await-in-loop
    expect(login).toHaveBeenCalledTimes(i + 2);

    const socket = Socket.mock.calls[i + 1].instance;
    socket.emit('error', new Error('boom'), socket);
    await nextTick(); // eslint-disable-line no-await-in-loop

    expect(errorSpy).toHaveBeenCalledTimes(i + 1);
    jest.advanceTimersByTime(i * 5000);
  }

  connector.close();
  jest.advanceTimersByTime(999999);
  expect(Socket).toHaveBeenCalledTimes(21);

  jest.useRealTimers();
});
