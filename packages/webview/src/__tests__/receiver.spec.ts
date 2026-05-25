import { EventEmitter } from 'events';
import moxy, { Mock } from '@moxyjs/moxy';
import type { PopEventWrapper } from '@sociably/core';
import { ServerAuthenticator } from '@sociably/auth';
import type { AnyServerAuthenticator } from '@sociably/auth';
import type { EventValue, WebviewEventContext } from '../types.js';
import type { WebviewSocketServer } from '../interface.js';
import { WebviewReceiver } from '../Receiver.js';
import WebviewConnection from '../Connection.js';
import { WebviewSender } from '../Sender.js';

const sender = moxy<WebviewSender>({
  render: async () => ({ jobs: [], results: [], tasks: [] }),
} as never);

const authUser = {
  $$typeofUser: true as const,
  platform: 'test' as const,
  uid: 'test.john_doe',
};
const authThread = {
  $$typeofThread: true as const,
  platform: 'test' as const,
  uid: 'test.me.john_doe',
};
const authContext = {
  platform: 'test' as const,
  agent: null,
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
        agent: null;
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
  }) as never,
);

server.id = '_SERVER_ID_';
server.handleUpgrade = (async () => {}) as never;

const popEventMock = new Mock();
const popEventWrapper = moxy<
  PopEventWrapper<WebviewEventContext<AnyServerAuthenticator, EventValue>, null>
>((finalHandler) => popEventMock.proxify(finalHandler));
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
  (() => new WebviewReceiver(sender, server, popEventWrapper, popError))();

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
    sender,
    event: {
      kind: 'connection',
      type: 'connect',
      payload: null,
      agent: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  server.emit(
    'events',
    [{ kind: 'greet', type: 'hello', payload: 'world' }, { type: 'hug' }],
    connectionInfo,
  );

  expect(popEventMock).toHaveBeenCalledTimes(3);
  expect(popEventMock).toHaveBeenNthCalledWith(2, {
    platform: 'webview',
    sender,
    event: {
      kind: 'greet',
      type: 'hello',
      payload: 'world',
      agent: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });
  expect(popEventMock).toHaveBeenNthCalledWith(3, {
    platform: 'webview',
    sender,
    event: {
      kind: 'default',
      type: 'hug',
      payload: undefined,
      agent: null,
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
    sender,
    event: {
      kind: 'connection',
      type: 'disconnect',
      payload: { reason: 'bye' },
      agent: null,
      user: authUser,
      thread: connection,
    },
    metadata: expectedMetadata,
    reply: expect.any(Function),
  });

  expect(popError).not.toHaveBeenCalled();
});

it('register auth user topic if authContext.user is present', () => {
  (() => new WebviewReceiver(sender, server, popEventWrapper, popError))();

  server.emit('connect', {
    connId: '_CONN_ID_',
    user: authUser,
    request,
    authContext: {
      platform: 'test',
      agent: null,
      user: authUser,
      thread: null,
      loginAt: new Date(Date.now() - 1000),
      expireAt: new Date(Date.now() + 9999),
    },
    expireAt: authContext.expireAt,
  });

  expect(server.subscribeTopic).toHaveBeenCalledTimes(1);
  expect(server.subscribeTopic.mock.calls[0].args).toMatchInlineSnapshot(`
    [
      WebviewConnection {
        "$$typeofThread": true,
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
  (() => new WebviewReceiver(sender, server, popEventWrapper, popError))();

  server.emit('connect', {
    connId: '_CONN_ID_',
    user: authUser,
    request,
    authContext: {
      platform: 'test',
      agent: null,
      user: null,
      thread: authThread,
      loginAt: new Date(Date.now() - 1000),
      expireAt: new Date(Date.now() + 9999),
    },
    expireAt: authContext.expireAt,
  });

  expect(server.subscribeTopic).toHaveBeenCalledTimes(1);
  expect(server.subscribeTopic.mock.calls[0].args).toMatchInlineSnapshot(`
    [
      WebviewConnection {
        "$$typeofThread": true,
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
  (() => new WebviewReceiver(sender, server, popEventWrapper, popError))();

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
    {
      "jobs": [],
      "results": [],
      "tasks": [],
    }
  `);

  expect(sender.render).toHaveBeenCalledTimes(1);
  expect(sender.render).toHaveBeenCalledWith(event.thread, 'hello world');
});

it('pop error', () => {
  (() => new WebviewReceiver(sender, server, popEventWrapper, popError))();

  server.emit('error', new Error('BOO!'));

  expect(popError).toHaveBeenCalledTimes(1);
  expect(popError).toHaveBeenCalledWith(new Error('BOO!'));
});
