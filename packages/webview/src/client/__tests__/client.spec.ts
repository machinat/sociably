import { parse as parseUrl } from 'url';
import { moxy, Moxy } from '@moxyjs/moxy';
import { BaseMarshaler as _BaseMarshaler } from '@sociably/core/base/Marshaler';
import { Connector as _Connector } from '@sociably/websocket/client';
import _AuthClient from '@sociably/auth/client';
import WebviewConnection from '../../Connection.js';
import { AnyClientAuthenticator } from '../../types.js';
import Client from '../Client.js';

const Connector = _Connector as Moxy<typeof _Connector>;
const AuthClient = _AuthClient as Moxy<typeof _AuthClient>;
const BaseMarshaler = _BaseMarshaler as Moxy<typeof _BaseMarshaler>;

jest.mock('@sociably/websocket/client/Connector', () => {
  const _moxy = jest.requireActual('@moxyjs/moxy').moxy;
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

jest.mock('@sociably/auth/client', () => {
  const _moxy = jest.requireActual('@moxyjs/moxy').moxy;
  return {
    __esModule: true,
    default: _moxy(function FakeAuthClient({ authenticators }) {
      return _moxy({
        bootstrap: async () => {},
        signIn: async () => ({ context: {}, token: '_TOKEN_' }),
        getAuthContext: () => ({ platform: 'test' /* ... */ }),
        getAuthenticator: () =>
          authenticators.find(({ platform }) => platform === 'test'),
      });
    }),
  };
});
jest.mock('@sociably/core/base/Marshaler', () =>
  jest
    .requireActual('@moxyjs/moxy')
    .moxy(jest.requireActual('@sociably/core/base/Marshaler'))
);

const location = moxy(parseUrl('https://sociably.io/hello'));
(global as any).window = { location };

const testAuthenticator = moxy<AnyClientAuthenticator>({
  platform: 'test',
  closeWebview: () => true,
  /* ... */
} as never);
const anotherAuthenticator = moxy<AnyClientAuthenticator>({
  platform: 'another',
  closeWebview: () => true,
  /* ... */
} as never);

const user = { platform: 'test', uid: 'jane_doe' };
const authContext = {
  platform: 'test',
  channel: null,
  user,
  thread: { platform: 'test', uid: 'doe_family' },
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
  testAuthenticator.mock.reset();
  anotherAuthenticator.mock.reset();
});

it('start connector and auth client', async () => {
  const client = new Client({
    platform: 'test',
    authApiUrl: '/my_auth',
    authPlatforms: [testAuthenticator, anotherAuthenticator],
    webSocketUrl: '/my_websocket',
  });
  client.onEvent(eventSpy);

  expect(client.isConnected).toBe(false);
  expect(client.isMockupMode).toBe(false);
  expect(client.user).toBe(null);
  expect(client.thread).toBe(null);

  expect(Connector).toHaveBeenCalledTimes(1);
  expect(Connector).toHaveBeenCalledWith(
    '/my_websocket',
    expect.any(Function),
    expect.any(BaseMarshaler)
  );

  const connector = Connector.mock.calls[0].instance;
  expect(connector.connect).toHaveBeenCalledTimes(1);

  expect(AuthClient).toHaveBeenCalledTimes(1);
  expect(AuthClient).toHaveBeenCalledWith({
    serverUrl: '/my_auth',
    authenticators: [testAuthenticator, anotherAuthenticator],
  });

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

  const login = Connector.mock.calls[0].args[1];
  await login();

  expect(authClient.signIn).toHaveBeenCalled();
  expect(authClient.signIn).toHaveBeenCalledWith({ platform: 'test' });

  connector.emit('connect', { connId: '#conn', user });
  connector.isConnected.mock.fake(() => true);

  expect(eventSpy).toHaveBeenCalledWith({
    event: {
      category: 'connection',
      type: 'connect',
      payload: null,
      channel: null,
      user,
      thread: new WebviewConnection('*', '#conn'),
    },
    auth: authContext,
    authenticator: testAuthenticator,
  });

  expect(client.isConnected).toBe(true);
  expect(client.user).toEqual(user);
  expect(client.thread).toEqual(new WebviewConnection('*', '#conn'));
});

test('mockupMode', async () => {
  const client = new Client({
    platform: 'test',
    authApiUrl: '/my_auth',
    authPlatforms: [testAuthenticator, anotherAuthenticator],
    webSocketUrl: '/my_websocket',
    mockupMode: true,
  });
  client.onEvent(eventSpy);

  expect(client.isMockupMode).toBe(true);
  expect(client.isConnected).toBe(false);
  expect(client.user).toBe(null);
  expect(client.thread).toBe(null);

  const connector = Connector.mock.calls[0].instance;
  expect(connector.connect).not.toHaveBeenCalled();

  const authClient = AuthClient.mock.calls[0].instance;
  expect(authClient.getAuthContext).not.toHaveBeenCalled();

  expect(eventSpy).not.toHaveBeenCalled();
});

test('websocket url', async () => {
  (() =>
    new Client({
      authPlatforms: [testAuthenticator],
      webSocketUrl: 'ws://sociably.io/foo_socket',
    }))();

  expect(Connector).toHaveBeenCalledTimes(1);
  expect(Connector).toHaveBeenCalledWith(
    'ws://sociably.io/foo_socket',
    expect.any(Function),
    expect.any(BaseMarshaler)
  );

  (() => new Client({ authPlatforms: [testAuthenticator] }))();

  expect(Connector).toHaveBeenCalledTimes(2);
  expect(Connector).toHaveBeenCalledWith(
    '/websocket',
    expect.any(Function),
    expect.any(BaseMarshaler)
  );
});

it('use marshalTypes of authPlatforms', () => {
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
  testAuthenticator.mock.getter('marshalTypes').fake(() => [FooType]);
  anotherAuthenticator.mock.getter('marshalTypes').fake(() => [BarType]);

  (() =>
    new Client({
      authPlatforms: [testAuthenticator, anotherAuthenticator],
    }))();

  expect(BaseMarshaler).toHaveBeenCalledTimes(1);
  expect(BaseMarshaler).toHaveBeenCalledWith([FooType, BarType]);

  expect(Connector.mock.calls[0].args[2]).toBe(
    BaseMarshaler.mock.calls[0].instance
  );
});

it('login with auth client', async () => {
  (() => new Client({ authPlatforms: [testAuthenticator] }))();

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.signIn.mock.fake(async () => ({
    token: '_TOKEN_',
    context: authContext,
  }));

  const loginFn = Connector.mock.calls[0].args[1];
  await expect(loginFn()).resolves.toEqual({
    user,
    credential: '_TOKEN_',
  });

  expect(authClient.signIn).toHaveBeenCalled();
  expect(authClient.signIn).toHaveBeenCalledWith({});
});

it('emit "event" when dispatched events received', async () => {
  const client = new Client({ authPlatforms: [testAuthenticator] });
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

  expect(eventSpy).toHaveBeenCalledTimes(3);
  // 'connect' event is the first call
  expect(eventSpy).toHaveBeenNthCalledWith(2, {
    event: {
      category: 'default',
      type: 'start',
      payload: 'Welcome to Hyrule',
      channel: null,
      user,
      thread: new WebviewConnection('*', '#conn'),
    },
    auth: authContext,
    authenticator: testAuthenticator,
  });
  expect(eventSpy).toHaveBeenNthCalledWith(3, {
    event: {
      category: 'reaction',
      type: 'wasted',
      payload: 'Link is down! Legend over.',
      channel: null,
      user,
      thread: new WebviewConnection('*', '#conn'),
    },
    auth: authContext,
    authenticator: testAuthenticator,
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
      channel: null,
      user,
      thread: new WebviewConnection('*', '#conn'),
    },
    auth: authContext,
    authenticator: testAuthenticator,
  });
});

it('send events', async () => {
  const client = new Client({ authPlatforms: [testAuthenticator] });
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
  const client = new Client({ authPlatforms: [testAuthenticator] });
  client.onEvent(eventSpy);

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  expect(client.user).toEqual(user);
  expect(client.thread).toEqual(new WebviewConnection('*', '#conn'));

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
      channel: null,
      user,
      thread: new WebviewConnection('*', '#conn'),
    },
    auth: authContext,
    authenticator: testAuthenticator,
  });

  expect(client.user).toEqual(user);
  expect(client.thread).toBe(null);
});

test('.close()', async () => {
  const client = new Client({ authPlatforms: [testAuthenticator] });
  client.onEvent(eventSpy);

  const authClient = AuthClient.mock.calls[0].instance;
  authClient.getAuthContext.mock.fake(() => authContext);

  const connector = Connector.mock.calls[0].instance;
  connector.emit('connect', { connId: '#conn', user });

  expect(client.user).toEqual(user);
  expect(client.thread).toEqual(new WebviewConnection('*', '#conn'));

  expect(client.close(4567, 'Bye!')).toBe(undefined);

  expect(connector.close).toHaveBeenCalledTimes(1);
  expect(connector.close).toHaveBeenCalledWith(4567, 'Bye!');

  connector.emit('disconnect', { reason: 'Bye!' }, { connId: '#conn', user });
  expect(eventSpy).toHaveBeenLastCalledWith({
    event: {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'Bye!' },
      channel: null,
      user,
      thread: new WebviewConnection('*', '#conn'),
    },
    auth: authContext,
    authenticator: testAuthenticator,
  });

  expect(client.user).toEqual(user);
  expect(client.thread).toBe(null);
});

test('.closeWebview()', async () => {
  const client = new Client({ authPlatforms: [testAuthenticator] });
  expect(client.closeWebview()).toBe(true);
  expect(testAuthenticator.closeWebview).toHaveBeenCalledTimes(1);

  testAuthenticator.closeWebview.mock.fakeReturnValue(false);
  expect(client.closeWebview()).toBe(false);
  expect(testAuthenticator.closeWebview).toHaveBeenCalledTimes(2);
});
