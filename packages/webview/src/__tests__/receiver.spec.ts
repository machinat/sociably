import { EventEmitter } from 'events';
import moxy, { Mock } from '@moxyjs/moxy';
import { ServerAuthorizer } from '@machinat/auth/types';
import type { SocketServerP } from '../interface';
import { WebviewReceiver } from '../receiver';
import { WebviewConnection } from '../channel';

const bot = moxy();

const server = moxy<
  SocketServerP<
    ServerAuthorizer<
      never,
      never,
      {
        platform: 'test';
        user: { platform: 'test'; uid: string };
        channel: { platform: 'test'; uid: string };
        loginAt: Date;
        expireAt: Date;
      }
    >
  >
>(new EventEmitter() as never);

server.id = '_SERVER_ID_';
server.handleUpgrade = (async () => {}) as never;

const popEventMock = new Mock();
const popEventWrapper = moxy((finalHandler) =>
  popEventMock.proxify(finalHandler)
);
const popError = moxy();

const user = { platform: 'test' as const, uid: 'john_doe' };
const authContext = {
  platform: 'test' as const,
  user,
  channel: { platform: 'test' as const, uid: 'doe_family' },
  loginAt: new Date(Date.now() - 1000),
  expireAt: new Date(Date.now() + 9999),
};
const request = {
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
};

beforeEach(() => {
  server.removeAllListeners();
  popEventMock.reset();
  popEventWrapper.mock.reset();
  popError.mock.reset();
});

it('pop events', () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  expect(popEventWrapper.mock).toHaveBeenCalledTimes(1);
  expect(popEventWrapper.mock).toHaveBeenCalledWith(expect.any(Function));

  const connectionInfo = {
    connId: '_CONN_ID_',
    user,
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
      kind: 'connection',
      type: 'connect',
      payload: null,
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
  });

  server.emit(
    'events',
    [{ kind: 'greet', type: 'hello', payload: 'world' }, { type: 'hug' }],
    connectionInfo
  );

  expect(popEventMock).toHaveBeenCalledTimes(3);
  expect(popEventMock).toHaveBeenNthCalledWith(2, {
    platform: 'webview',
    bot,
    event: {
      kind: 'greet',
      type: 'hello',
      payload: 'world',
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
  });
  expect(popEventMock).toHaveBeenNthCalledWith(3, {
    platform: 'webview',
    bot,
    event: {
      kind: 'default',
      type: 'hug',
      payload: undefined,
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
  });

  server.emit('disconnect', { reason: 'bye' }, connectionInfo);
  expect(popEventMock).toHaveBeenCalledTimes(4);
  expect(popEventMock).toHaveBeenNthCalledWith(4, {
    platform: 'webview',
    bot,
    event: {
      kind: 'connection',
      type: 'disconnect',
      payload: { reason: 'bye' },
      user,
      channel: connection,
    },
    metadata: expectedMetadata,
  });

  expect(popError.mock).not.toHaveBeenCalled();
});

it('pop error', () => {
  (() => new WebviewReceiver(bot, server, popEventWrapper, popError))();

  server.emit('error', new Error('BOO!'));

  expect(popError.mock).toHaveBeenCalledTimes(1);
  expect(popError.mock).toHaveBeenCalledWith(new Error('BOO!'));
});