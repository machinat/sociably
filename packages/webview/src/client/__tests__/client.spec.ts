import { parse as parseUrl } from 'url';
import moxy, { Moxy } from '@moxyjs/moxy';
import { BaseMarshaler as _BaseMarshaler } from '@machinat/core/base/Marshaler';
import _Connector from '@machinat/websocket/client/Connector';
import _AuthClient from '@machinat/auth/client';
import { WebviewConnection } from '../../channel';
import { AnyClientAuthorizer } from '../../types';
import Client from '../client';

const Connector = _Connector as Moxy<typeof _Connector>;
const AuthClient = _AuthClient as Moxy<typeof _AuthClient>;
const BaseMarshaler = _BaseMarshaler as Moxy<typeof _BaseMarshaler>;

jest.mock('@machinat/websocket/client/Connector', () => {
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

jest.mock('@machinat/auth/client', () => {
  const _moxy = jest.requireActual('@moxyjs/moxy').default;
  return {
    __esModule: true,
    default: _moxy(function FakeConnector() {
      return _moxy({
        bootstrap: async () => {},
        auth: async () => ({ context: {}, token: '_TOKEN_' }),
        getAuthContext: () => ({ platform: 'test' /* ... */ }),
      });
    }),
  };
});

jest.mock('@machinat/core/base/Marshaler', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .default(jest.requireActual('@machinat/core/base/Marshaler'))
);

const location = moxy(parseUrl('https://machinat.com/hello'));
(global as any).window = { location };

const testAuthorizer = moxy<AnyClientAuthorizer>({
  platform: 'test' /* ... */,
} as never);
const anotherAuthorizer = moxy<AnyClientAuthorizer>({
  platform: 'another' /* ... */,
} as never);

const user = { platform: 'test', uid: 'jane_doe' };
const authContext = {
  platform: 'test',
  user,
  channel: { platform: 'test', uid: 'doe_family' },
  loginAt: new Date(),
  expireAt: new Date(Date.now() + 9999),
};
const eventSpy = moxy();

beforeEach(() => {
  Connector.mock.reset();
  AuthClient.mock.reset();
  BaseMarshaler.mock.reset();
  location.mock.reset();
  eventSpy.mock.clear();
});

it('start connector and auth client', async () => {
  const client = new Client({
    platform: 'test',
    authApiUrl: '/my_auth',
    authorizers: [testAuthorizer, anotherAuthorizer],
    webSocketUrl: '/my_websocket',
  });
  client.onEvent(eventSpy);

  expect(client.isConnected).toBe(false);
  expect(client.user).toBe(null);
  expect(client.channel).toBe(null);

  expect(Connector.mock).toHaveBeenCalledTimes(1);
  expect(Connector.mock).toHaveBeenCalledWith(
    'wss://machinat.com/my_websocket',
    expect.any(Function),
    expect.any(BaseMarshaler)
  );

  const connector = Connector.mock.calls[0].instance;
  expect(connector.start.mock).toHaveBeenCalledTimes(1);

  expect(AuthClient.mock).toHaveBeenCalledTimes(1);
  expect(AuthClient.mock).toHaveBeenCalledWith({
    platform: 'test',
    apiUrl: '/my_auth',
    authorizers: [testAuthorizer, anotherAuthorizer],
  });

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

  connector.emit('connect', { connId: '#conn', user });
  connector.isConnected.mock.fake(() => true);

  expect(eventSpy.mock).toHaveBeenCalledWith(
    {
      category: 'connection',
      type: 'connect',
      payload: null,
      user,
      channel: new WebviewConnection('*', '#conn'),
    },
    authContext
  );

  expect(client.isConnected).toBe(true);
  expect(client.user).toEqual(user);
  expect(client.channel).toEqual(new WebviewConnection('*', '#conn'));
});

test('websocket url', async () => {
  (() =>
    new Client({
      authorizers: [testAuthorizer],
      webSocketUrl: 'ws://machinat.io/foo_socket',
    }))();

  expect(Connector.mock).toHaveBeenCalledTimes(1);
  expect(Connector.mock).toHaveBeenCalledWith(
    'ws://machinat.io/foo_socket',
    expect.any(Function),
    expect.any(BaseMarshaler)
  );

  (() => new Client({ authorizers: [testAuthorizer] }))();

  expect(Connector.mock).toHaveBeenCalledTimes(2);
  expect(Connector.mock).toHaveBeenCalledWith(
    'wss://machinat.com/websocket',
    expect.any(Function),
    expect.any(BaseMarshaler)
  );
});

it('use marshalTypes of authorizers', () => {
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
  testAuthorizer.mock.getter('marshalTypes').fake(() => [FooType]);
  anotherAuthorizer.mock.getter('marshalTypes').fake(() => [BarType]);

  (() =>
    new Client({
      authorizers: [testAuthorizer, anotherAuthorizer],
    }))();

  expect(BaseMarshaler.mock).toHaveBeenCalledTimes(1);
  expect(BaseMarshaler.mock).toHaveBeenCalledWith([FooType, BarType]);

  expect(Connector.mock.calls[0].args[2]).toBe(
    BaseMarshaler.mock.calls[0].instance
  );
});

it('login with auth client', async () => {
  (() => new Client({ authorizers: [testAuthorizer] }))();

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.auth.mock.fake(async () => ({
    token: '_TOKEN_',
    context: authContext,
  }));

  const loginFn = Connector.mock.calls[0].args[1];
  await expect(loginFn()).resolves.toEqual({
    user,
    credential: '_TOKEN_',
  });

  expect(authClient.auth.mock).toHaveBeenCalledTimes(1);
});

it('emit "event" when dispatched events received', async () => {
  const client = new Client({ authorizers: [testAuthorizer] });
  client.onEvent(eventSpy);

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

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

  expect(eventSpy.mock).toHaveBeenCalledTimes(3);
  // 'connect' event is the first call
  expect(eventSpy.mock).toHaveBeenNthCalledWith(
    2,
    {
      category: 'default',
      type: 'start',
      payload: 'Welcome to Hyrule',
      user,
      channel: new WebviewConnection('*', '#conn'),
    },
    authContext
  );
  expect(eventSpy.mock).toHaveBeenNthCalledWith(
    3,
    {
      category: 'reaction',
      type: 'wasted',
      payload: 'Link is down! Legend over.',
      user,
      channel: new WebviewConnection('*', '#conn'),
    },
    authContext
  );

  connector.emit(
    'events',
    [{ type: 'resurrect', payload: 'Hero never die!' }],
    { connId: '#conn', user }
  );

  expect(eventSpy.mock).toHaveBeenCalledTimes(4);
  expect(eventSpy.mock).toHaveBeenCalledWith(
    {
      category: 'default',
      type: 'resurrect',
      payload: 'Hero never die!',
      user,
      channel: new WebviewConnection('*', '#conn'),
    },
    authContext
  );
});

it('send events', async () => {
  const client = new Client({ authorizers: [testAuthorizer] });
  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  await expect(
    client.send([
      { type: 'foo', payload: 1 },
      { type: 'bar', category: 'beer', payload: 2 },
    ])
  ).resolves.toBe(undefined);

  expect(connector.send.mock).toHaveBeenCalledTimes(1);
  expect(connector.send.mock).toHaveBeenCalledWith([
    { type: 'foo', payload: 1 },
    { type: 'bar', category: 'beer', payload: 2 },
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
  const client = new Client({ authorizers: [testAuthorizer] });
  client.onEvent(eventSpy);

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  expect(client.user).toEqual(user);
  expect(client.channel).toEqual(new WebviewConnection('*', '#conn'));

  connector.emit(
    'disconnect',
    { reason: 'See ya!' },
    { connId: '#conn', user }
  );

  expect(eventSpy.mock).toHaveBeenLastCalledWith(
    {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'See ya!' },
      user,
      channel: new WebviewConnection('*', '#conn'),
    },
    authContext
  );

  expect(client.user).toEqual(user);
  expect(client.channel).toBe(null);
});

test('#disconnect()', async () => {
  const client = new Client({ authorizers: [testAuthorizer] });
  client.onEvent(eventSpy);

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  expect(client.user).toEqual(user);
  expect(client.channel).toEqual(new WebviewConnection('*', '#conn'));

  expect(client.disconnect('Bye!')).toBe(undefined);

  expect(connector.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(connector.disconnect.mock).toHaveBeenCalledWith('Bye!');

  connector.emit('disconnect', { reason: 'Bye!' }, { connId: '#conn', user });
  expect(eventSpy.mock).toHaveBeenLastCalledWith(
    {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'Bye!' },
      user,
      channel: new WebviewConnection('*', '#conn'),
    },
    authContext
  );

  expect(client.user).toEqual(user);
  expect(client.channel).toBe(null);
});
