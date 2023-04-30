import { EventEmitter } from 'events';
import moxy, { Mock } from '@moxyjs/moxy';
import { ServerAuthenticator } from '@sociably/auth';
import type { WebviewSocketServer } from '../interface';
import { WebviewReceiver } from '../Receiver';
import WebviewConnection from '../Connection';
import { WebviewBot } from '../Bot';

const bot = moxy<WebviewBot>({
  render: async () => ({ jobs: [], results: [], tasks: [] }),
} as never);

const authUser = {
  platform: 'test' as const,
  uid: 'test.john_doe',
  uniqueIdentifier: { platform: 'test', id: 'john_doe' },
};
const authThread = {
  platform: 'test' as const,
  uid: 'test.me.john_doe',
  uniqueIdentifier: { platform: 'test', scopeId: 'me', id: 'john_doe' },
};
const authContext = {
  platform: 'test' as const,
  channel: null,
  user: authUser,
  thread: authThread,
  loginAt: new Date(Date.now() - 1000),
  expireAt: new Date(Date.now() + 9999),
};

const server = moxy<
  WebviewSocketServer<
    ServerAuthenticator<
      never,
      never,
      {
        platform: 'test';
        channel: null;
        user: null | typeof authUser;
        thread: null | typeof authThread;
        loginAt: Date;
        expireAt: Date;
      }
    >
  >
>(
  Object.assign(new EventEmitter(), {
    subscribeTopic: async () => true,
  }) as never
);

server.id = '_SERVER_ID_';
server.handleUpgrade = (async () => {}) as never;

const popEventMock = new Mock();
const popEventWrapper = moxy((finalHandler) =>
  popEventMock.proxify(finalHandler)
);
const popError = moxy();

const request = {
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
};

beforeEach(() => {
  server.removeAllListeners();
  server.mock.reset();
  popEventMock.reset();
  popEventWrapper.mock.reset();
  popError.mock.reset();
});

it('pop events', () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  expect(popEventWrapper).toHaveBeenCalledTimes(1);
  expect(popEventWrapper).toHaveBeenCalledWith(expect.any(Function));

  const connectionInfo = {
    connId: '_CONN_ID_',
    user: authUser,
    request,
    authContext,
    expireAt: authContext.expireAt,
  };

  server.emit('connect', connectionInfo);

  const connection = new WebviewConnection(server.id, '_CONN_ID_');
  const expectedMetadata = {
    source: 'websocket',
    auth: authContext,
    request,
    connection,
  };

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(popEventMock).toHaveBeenCalledWith({
    platform: 'webview',
    bot,
    event: {
      category: 'connection',
      type: 'connect',
      payload: null,
      channel: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  server.emit(
    'events',
    [{ category: 'greet', type: 'hello', payload: 'world' }, { type: 'hug' }],
    connectionInfo
  );

  expect(popEventMock).toHaveBeenCalledTimes(3);
  expect(popEventMock).toHaveBeenNthCalledWith(2, {
    platform: 'webview',
    bot,
    event: {
      category: 'greet',
      type: 'hello',
      payload: 'world',
      channel: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });
  expect(popEventMock).toHaveBeenNthCalledWith(3, {
    platform: 'webview',
    bot,
    event: {
      category: 'default',
      type: 'hug',
      payload: undefined,
      channel: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  server.emit('disconnect', { reason: 'bye' }, connectionInfo);
  expect(popEventMock).toHaveBeenCalledTimes(4);
  expect(popEventMock).toHaveBeenNthCalledWith(4, {
    platform: 'webview',
    bot,
    event: {
      category: 'connection',
      type: 'disconnect',
      payload: { reason: 'bye' },
      channel: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  expect(popError).not.toHaveBeenCalled();
});

it('register auth user topic if authContext.user is present', () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  server.emit('connect', {
    connId: '_CONN_ID_',
    user: authUser,
    request,
    authContext: {
      platform: 'test',
      channel: null,
      user: authUser,
      thread: null,
      loginAt: new Date(Date.now() - 1000),
      expireAt: new Date(Date.now() + 9999),
    },
    expireAt: authContext.expireAt,
  });

  expect(server.subscribeTopic).toHaveBeenCalledTimes(1);
  expect(server.subscribeTopic.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      WebviewConnection {
        "id": "_CONN_ID_",
        "platform": "webview",
        "serverId": "_SERVER_ID_",
        "type": "connection",
      },
      "$user:test.john_doe",
    ]
  `);
});

it('register auth thread topic if authContext.thread is present', () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  server.emit('connect', {
    connId: '_CONN_ID_',
    user: authUser,
    request,
    authContext: {
      platform: 'test',
      channel: null,
      user: null,
      thread: authThread,
      loginAt: new Date(Date.now() - 1000),
      expireAt: new Date(Date.now() + 9999),
    },
    expireAt: authContext.expireAt,
  });

  expect(server.subscribeTopic).toHaveBeenCalledTimes(1);
  expect(server.subscribeTopic.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      WebviewConnection {
        "id": "_CONN_ID_",
        "platform": "webview",
        "serverId": "_SERVER_ID_",
        "type": "connection",
      },
      "$thread:test.me.john_doe",
    ]
  `);
});

test('reply(message) sugar', async () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  server.emit('connect', {
    connId: '_CONN_ID_',
    user: authUser,
    request,
    authContext,
    expireAt: authContext.expireAt,
  });

  expect(popEventMock).toHaveBeenCalledTimes(1);
  const { reply, event } = popEventMock.calls[0].args[0];
  await expect(reply('hello world')).resolves.toMatchInlineSnapshot(`
          Object {
            "jobs": Array [],
            "results": Array [],
            "tasks": Array [],
          }
        `);

  expect(bot.render).toHaveBeenCalledTimes(1);
  expect(bot.render).toHaveBeenCalledWith(event.thread, 'hello world');
});

it('pop error', () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  server.emit('error', new Error('BOO!'));

  expect(popError).toHaveBeenCalledTimes(1);
  expect(popError).toHaveBeenCalledWith(new Error('BOO!'));
});
