import { parse as parseUrl } from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import _Connector from '../Connector';
import { WebSocketConnection } from '../../channel';
import Client from '../client';

const Connector = _Connector as Moxy<typeof _Connector>;

jest.mock('../Connector', () => {
  const _moxy = jest.requireActual('@moxyjs/moxy').default;
  const _EventEmitter = jest.requireActual('events').EventEmitter;
  return {
    __esModule: true,
    default: _moxy(function FakeConnector() {
      return _moxy(
        Object.assign(new _EventEmitter(), {
          start: async () => {},
          send: async () => {},
          disconnect: () => {},
          isConnected: () => false,
        })
      );
    }),
  };
});

const location = moxy(parseUrl('https://machinat.com/hello'));
global.window = { location } as never;

const user = { platform: 'test', uid: 'john_doe' };
const login = moxy(async () => ({
  user,
  credential: { foo: 'bar' },
}));
const eventSpy = moxy();

beforeEach(() => {
  Connector.mock.reset();
  location.mock.reset();
  login.mock.clear();
  eventSpy.mock.clear();
});

it('start connector', async () => {
  const client = new Client({ login });
  client.onEvent(eventSpy);

  expect(client.isConnected).toBe(false);
  expect(client.user).toBe(null);
  expect(client.channel).toBe(null);

  expect(Connector.mock).toHaveBeenCalledTimes(1);
  expect(Connector.mock).toHaveBeenCalledWith('wss://machinat.com/', login);

  const connector = Connector.mock.calls[0].instance;
  expect(connector.start.mock).toHaveBeenCalledTimes(1);

  connector.emit('connect', { connId: '#conn', user });
  connector.isConnected.mock.fake(() => true);

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    kind: 'connection',
    type: 'connect',
    payload: null,
    user,
    channel: new WebSocketConnection('*', '#conn'),
  });

  expect(client.isConnected).toBe(true);
  expect(client.user).toEqual(user);
  expect(client.channel).toEqual(new WebSocketConnection('*', '#conn'));
});

test('specify url', async () => {
  (() => new Client({ url: 'ws://machinat.io/websocket', login }))();

  expect(Connector.mock).toHaveBeenCalledTimes(1);
  expect(Connector.mock).toHaveBeenCalledWith(
    'ws://machinat.io/websocket',
    login
  );

  (() => new Client({ url: '/foo/websocket/server', login }))();

  expect(Connector.mock).toHaveBeenCalledTimes(2);
  expect(Connector.mock).toHaveBeenCalledWith(
    'wss://machinat.com/foo/websocket/server',
    login
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
        kind: 'reaction',
        type: 'wasted',
        payload: 'Link is down! Legend over.',
      },
    ],
    { connId: '#conn', user }
  );

  expect(eventSpy.mock).toHaveBeenCalledTimes(3);
  // 'connect' event is the first call
  expect(eventSpy.mock).toHaveBeenNthCalledWith(2, {
    kind: 'default',
    type: 'start',
    payload: 'Welcome to Hyrule',
    user,
    channel: new WebSocketConnection('*', '#conn'),
  });
  expect(eventSpy.mock).toHaveBeenNthCalledWith(3, {
    kind: 'reaction',
    type: 'wasted',
    payload: 'Link is down! Legend over.',
    user,
    channel: new WebSocketConnection('*', '#conn'),
  });

  connector.emit(
    'events',
    [{ type: 'resurrect', payload: 'Hero never die!' }],
    { connId: '#conn', user }
  );

  expect(eventSpy.mock).toHaveBeenCalledTimes(4);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    kind: 'default',
    type: 'resurrect',
    payload: 'Hero never die!',
    user,
    channel: new WebSocketConnection('*', '#conn'),
  });
});

it('send events', async () => {
  const client = new Client({ login });
  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  await expect(
    client.send([
      { type: 'foo', payload: 1 },
      { type: 'bar', kind: 'beer', payload: 2 },
    ])
  ).resolves.toBe(undefined);

  expect(connector.send.mock).toHaveBeenCalledTimes(1);
  expect(connector.send.mock).toHaveBeenCalledWith([
    { type: 'foo', payload: 1 },
    { type: 'bar', kind: 'beer', payload: 2 },
  ]);

  await expect(client.send({ type: 'baz', payload: 3 })).resolves.toBe(
    undefined
  );
  expect(connector.send.mock).toHaveBeenCalledTimes(2);
  expect(connector.send.mock).toHaveBeenCalledWith([
    { type: 'baz', payload: 3 },
  ]);
});

test('disconnected by server', async () => {
  const client = new Client({ login });
  const connector = Connector.mock.calls[0].instance;

  connector.emit('connect', { connId: '#conn', user });
  client.onEvent(eventSpy);

  expect(client.user).toEqual(user);
  expect(client.channel).toEqual(new WebSocketConnection('*', '#conn'));

  connector.emit(
    'disconnect',
    { reason: 'See ya!' },
    { connId: '#conn', user }
  );

  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    kind: 'connection',
    type: 'disconnect',
    payload: { reason: 'See ya!' },
    user,
    channel: new WebSocketConnection('*', '#conn'),
  });

  expect(client.user).toEqual(user);
  expect(client.channel).toBe(null);
});

test('#disconnect()', async () => {
  const client = new Client({ login });
  const connector = Connector.mock.calls[0].instance;

  connector.emit('connect', { connId: '#conn', user });
  client.onEvent(eventSpy);

  expect(client.user).toEqual(user);
  expect(client.channel).toEqual(new WebSocketConnection('*', '#conn'));

  expect(client.disconnect('Bye!')).toBe(undefined);

  expect(connector.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(connector.disconnect.mock).toHaveBeenCalledWith('Bye!');

  connector.emit('disconnect', { reason: 'Bye!' }, { connId: '#conn', user });
  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    kind: 'connection',
    type: 'disconnect',
    payload: { reason: 'Bye!' },
    user,
    channel: new WebSocketConnection('*', '#conn'),
  });

  expect(client.user).toEqual(user);
  expect(client.channel).toBe(null);
});