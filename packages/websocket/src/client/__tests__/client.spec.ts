import { parse as parseUrl } from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import { BaseMarshaler as _BaseMarshaler } from '@sociably/core/base/Marshaler';
import _Connector from '../Connector';
import { WebSocketConnection } from '../../thread';
import Client from '../client';

const Connector = _Connector as Moxy<typeof _Connector>;
const BaseMarshaler = _BaseMarshaler as Moxy<typeof _BaseMarshaler>;

jest.mock('@sociably/core/base/Marshaler', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@sociably/core/base/Marshaler'))
);

jest.mock('../Connector', () => {
  const _moxy = jest.requireActual('@moxyjs/moxy').default;
  const _EventEmitter = jest.requireActual('events').EventEmitter;
  return {
    __esModule: true,
    default: _moxy(function FakeConnector() {
      return _moxy(
        Object.assign(new _EventEmitter(), {
          connect: () => {},
          send: async () => {},
          close: () => {},
          isConnected: () => false,
        })
      );
    }),
  };
});

const location = moxy(parseUrl('https://sociably.io/hello'));
(global as any).window = { location } as never;

const user = { platform: 'test', uid: 'john_doe' };
const login = moxy(async () => ({
  user,
  credential: { foo: 'bar' },
}));
const eventSpy = moxy();

beforeEach(() => {
  Connector.mock.reset();
  BaseMarshaler.mock.reset();
  location.mock.reset();
  login.mock.clear();
  eventSpy.mock.clear();
});

it('start connector', async () => {
  const client = new Client({ login });
  client.onEvent(eventSpy);

  expect(client.isConnected).toBe(false);
  expect(client.user).toBe(null);
  expect(client.thread).toBe(null);

  expect(Connector).toHaveBeenCalledTimes(1);
  expect(Connector).toHaveBeenCalledWith('/', login, expect.any(BaseMarshaler));

  const connector = Connector.mock.calls[0].instance;
  expect(connector.connect).toHaveBeenCalledTimes(1);

  connector.emit('connect', { connId: '#conn', user });
  connector.isConnected.mock.fake(() => true);

  expect(eventSpy).toHaveBeenCalledTimes(1);
  expect(eventSpy).toHaveBeenCalledWith({
    event: {
      category: 'connection',
      type: 'connect',
      payload: null,
      user,
      thread: new WebSocketConnection('*', '#conn'),
    },
  });

  expect(client.isConnected).toBe(true);
  expect(client.user).toEqual(user);
  expect(client.thread).toEqual(new WebSocketConnection('*', '#conn'));
});

test('specify url', async () => {
  (() => new Client({ url: 'ws://sociably.io/websocket', login }))();

  expect(Connector).toHaveBeenCalledTimes(1);
  expect(Connector).toHaveBeenCalledWith(
    'ws://sociably.io/websocket',
    login,
    expect.any(BaseMarshaler)
  );

  (() => new Client({ url: '/foo/websocket/server', login }))();

  expect(Connector).toHaveBeenCalledTimes(2);
  expect(Connector).toHaveBeenCalledWith(
    '/foo/websocket/server',
    login,
    expect.any(BaseMarshaler)
  );
});

test('default login function', async () => {
  (() => new Client())();

  const defaultLogin = Connector.mock.calls[0].args[1];
  await expect(defaultLogin()).resolves.toEqual({
    user: null,
    credential: null,
  });
});

it('use options.marshalTypes to initiate marshaler', () => {
  const FooType = {
    typeName: 'Foo',
    fromJSONValue: () => ({
      foo: true,
      typeName: () => 'Foo',
      toJSONValue: () => 'FOO',
    }),
  };
  const BarType = {
    typeName: 'Bar',
    fromJSONValue: () => ({
      bar: true,
      typeName: () => 'Bar',
      toJSONValue: () => 'BAR',
    }),
  };
  (() => new Client({ marshalTypes: [FooType, BarType] }))();

  expect(BaseMarshaler).toHaveBeenCalledTimes(1);
  expect(BaseMarshaler).toHaveBeenCalledWith([FooType, BarType]);

  expect(Connector.mock.calls[0].args[2]).toBe(
    BaseMarshaler.mock.calls[0].instance
  );
});

it('emit "event" when dispatched events received', async () => {
  const client = new Client({ login });
  client.onEvent(eventSpy);

  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  connector.emit(
    'events',
    [
      { type: 'start', payload: 'Welcome to Hyrule' },
      {
        category: 'reaction',
        type: 'wasted',
        payload: 'Link is down! Legend over.',
      },
    ],
    { connId: '#conn', user }
  );

  expect(eventSpy).toHaveBeenCalledTimes(3);
  // 'connect' event is the first call
  expect(eventSpy).toHaveBeenNthCalledWith(2, {
    event: {
      category: 'default',
      type: 'start',
      payload: 'Welcome to Hyrule',
      user,
      thread: new WebSocketConnection('*', '#conn'),
    },
  });
  expect(eventSpy).toHaveBeenNthCalledWith(3, {
    event: {
      category: 'reaction',
      type: 'wasted',
      payload: 'Link is down! Legend over.',
      user,
      thread: new WebSocketConnection('*', '#conn'),
    },
  });

  connector.emit(
    'events',
    [{ type: 'resurrect', payload: 'Hero never die!' }],
    { connId: '#conn', user }
  );

  expect(eventSpy).toHaveBeenCalledTimes(4);
  expect(eventSpy).toHaveBeenCalledWith({
    event: {
      category: 'default',
      type: 'resurrect',
      payload: 'Hero never die!',
      user,
      thread: new WebSocketConnection('*', '#conn'),
    },
  });
});

it('send events', async () => {
  const client = new Client({ login });
  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  await expect(
    client.send([
      { type: 'foo', payload: 1 },
      { type: 'bar', category: 'beer', payload: 2 },
    ])
  ).resolves.toBe(undefined);

  expect(connector.send).toHaveBeenCalledTimes(1);
  expect(connector.send).toHaveBeenCalledWith([
    { type: 'foo', payload: 1 },
    { type: 'bar', category: 'beer', payload: 2 },
  ]);

  await expect(client.send({ type: 'baz', payload: 3 })).resolves.toBe(
    undefined
  );
  expect(connector.send).toHaveBeenCalledTimes(2);
  expect(connector.send).toHaveBeenCalledWith([{ type: 'baz', payload: 3 }]);
});

test('disconnected by server', async () => {
  const client = new Client({ login });
  const connector = Connector.mock.calls[0].instance;

  connector.emit('connect', { connId: '#conn', user });
  client.onEvent(eventSpy);

  expect(client.user).toEqual(user);
  expect(client.thread).toEqual(new WebSocketConnection('*', '#conn'));

  connector.emit(
    'disconnect',
    { reason: 'See ya!' },
    { connId: '#conn', user }
  );

  expect(eventSpy).toHaveBeenLastCalledWith({
    event: {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'See ya!' },
      user,
      thread: new WebSocketConnection('*', '#conn'),
    },
  });

  expect(client.user).toEqual(user);
  expect(client.thread).toBe(null);
});

test('.close()', async () => {
  const client = new Client({ login });
  const connector = Connector.mock.calls[0].instance;

  connector.emit('connect', { connId: '#conn', user });
  client.onEvent(eventSpy);

  expect(client.user).toEqual(user);
  expect(client.thread).toEqual(new WebSocketConnection('*', '#conn'));

  expect(client.close(4567, 'Bye!')).toBe(undefined);

  expect(connector.close).toHaveBeenCalledTimes(1);
  expect(connector.close).toHaveBeenCalledWith(4567, 'Bye!');

  connector.emit('disconnect', { reason: 'Bye!' }, { connId: '#conn', user });
  expect(eventSpy).toHaveBeenLastCalledWith({
    event: {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'Bye!' },
      user,
      thread: new WebSocketConnection('*', '#conn'),
    },
  });

  expect(client.user).toEqual(user);
  expect(client.thread).toBe(null);
});
