import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import moxy, { Moxy } from '@moxyjs/moxy';
import Ws from 'ws';
import { WebSocketServer } from '../server';
import _Socket from '../socket';
import { LocalOnlyBroker } from '../broker/LocalOnlyBroker';

jest.mock('../socket', () =>
  jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../socket'))
);

const Socket = _Socket as Moxy<typeof _Socket>;
type Socket = Moxy<_Socket>;

const nextTick = () => new Promise(process.nextTick);

const ws = new Ws(''); // mocked in __mocks__
const wsServer = moxy<Ws.Server>({
  handleUpgrade(req, skt, head, callback) {
    callback(ws);
  },
} as never);

const verifyLogin = moxy(async () => ({
  success: true as const,
  user: null,
  authContext: null,
}));
const verifyUpgrade = moxy(() => true);

const req = moxy<IncomingMessage>({
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
  connection: { encrypted: false },
} as never);

const netSocket = moxy<NetSocket>({
  write() {},
  destroy() {},
} as never);

const head = Buffer.from('_');

const expectedReqInfo = {
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
};

const broker = moxy(new LocalOnlyBroker());

const connectSpy = moxy();
const eventsSpy = moxy();
const disconnectSpy = moxy();
const errorSpy = moxy();

const serverId = '_SERVER_ID_';
let testServer: WebSocketServer<null, null>;

beforeEach(async () => {
  testServer = new WebSocketServer(
    serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin
  );
  testServer.on('connect', connectSpy);
  testServer.on('disconnect', disconnectSpy);
  testServer.on('events', eventsSpy);
  testServer.on('error', errorSpy);

  Socket.mock.clear();
  broker.mock.reset();

  wsServer.mock.clear();
  ws.removeAllListeners();

  netSocket.mock.clear();
  req.mock.reset();

  connectSpy.mock.clear();
  eventsSpy.mock.clear();
  disconnectSpy.mock.clear();
  errorSpy.mock.clear();

  verifyLogin.mock.reset();
  verifyUpgrade.mock.reset();
});

async function openConnection(server, existedSocket?: Socket) {
  let socket = existedSocket;
  if (!socket) {
    await server.handleUpgrade(req, netSocket, head);
    const newSocketCalls = Socket.mock.calls;
    socket = newSocketCalls[newSocketCalls.length - 1].instance as Socket;
    socket.connect.mock.fake(async () => 1);
  }

  socket.emit('login', { credential: 'FOO' }, 0, socket);
  await nextTick();

  const connectCalls = socket.connect.mock.calls;
  const { connId } = connectCalls[connectCalls.length - 1].args[0];
  await nextTick();
  socket.emit('connect', { connId }, 2, socket);
  await nextTick();

  return [
    socket,
    {
      type: 'connection' as const,
      serverId: server.id,
      id: connId,
    },
  ] as const;
}

it('handle sockets and connections lifecycle', async () => {
  await testServer.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith(expectedReqInfo);

  expect(wsServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(wsServer.handleUpgrade.mock) //
    .toHaveBeenCalledWith(req, netSocket, head, expect.any(Function));

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(ws, {
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
  });

  verifyLogin.mock.fake(async () => ({
    success: true,
    user: { john: 'doe' },
    authContext: { rookie: true },
  }));

  const socket: Socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  const credential = { type: 'some_auth', hello: 'login' };
  socket.emit('login', { credential }, 0, socket);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(1);
  expect(verifyLogin.mock).toHaveBeenCalledWith(expectedReqInfo, credential);

  expect(socket.connect.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).toHaveBeenCalledWith({
    connId: expect.any(String),
    seq: 0,
  });

  expect(connectSpy.mock).not.toHaveBeenCalled();

  const { connId } = socket.connect.mock.calls[0].args[0];
  socket.emit('connect', { connId }, 2, socket);
  await nextTick();

  const expectedConnInfo = {
    connId: expect.any(String),
    user: { john: 'doe' },
    request: expectedReqInfo,
    authContext: { rookie: true },
    expireAt: null,
  };

  expect(connectSpy.mock).toHaveBeenCalledTimes(1);
  expect(connectSpy.mock).toHaveBeenCalledWith(expectedConnInfo);

  let eventValues: any = [
    { type: 'greeting', kind: 'french', payload: 'bonjour' },
  ];
  socket.emit('events', { connId, values: eventValues }, 4, socket);

  expect(eventsSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventsSpy.mock).toHaveBeenCalledWith(eventValues, expectedConnInfo);

  eventValues = [
    { type: 'foo', payload: 'hello' },
    { type: 'bar', payload: 'world' },
  ];
  socket.emit('events', { connId, values: eventValues }, 5, socket);

  expect(eventsSpy.mock).toHaveBeenCalledTimes(2);
  expect(eventsSpy.mock).toHaveBeenCalledWith(eventValues, expectedConnInfo);

  socket.emit('disconnect', { connId, reason: 'bye' }, 7, socket);
  await nextTick();

  expect(disconnectSpy.mock).toHaveBeenCalledTimes(1);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(
    { reason: 'bye' },
    expectedConnInfo
  );

  socket.emit('close', 666, 'bye', socket);
  await nextTick();
});

test('multi sockets and connections', async () => {
  await testServer.handleUpgrade(req, netSocket, head);
  await testServer.handleUpgrade(req, netSocket, head);

  expect(wsServer.handleUpgrade.mock).toHaveBeenCalledTimes(2);
  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(2);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith(expectedReqInfo);

  expect(Socket.mock).toHaveBeenCalledTimes(2);
  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => 1);
  socket2.connect.mock.fake(async () => 1);

  expect(verifyLogin.mock).not.toHaveBeenCalled();
  socket1.emit('login', { credential: { hi: 1 } }, 0, socket1);

  expect(verifyLogin.mock).toHaveBeenCalledTimes(1);
  verifyLogin.mock.fake(async () => ({
    success: true,
    user: { john: 'doe' },
    authContext: 'foo',
  }));

  socket1.emit('login', { credential: { hi: 2 } }, 2, socket1);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(2);
  verifyLogin.mock.fake(async () => ({
    success: true,
    user: { jojo: 'doe' },
    authContext: 'bar',
  }));

  socket2.emit('login', { credential: { hi: 3 } }, 2, socket2);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(3);
  for (let i = 1; i <= 3; i += 1) {
    expect(verifyLogin.mock).toHaveBeenNthCalledWith(i, expectedReqInfo, {
      hi: i,
    });
  }

  expect(eventsSpy.mock).not.toHaveBeenCalled();

  expect(socket1.connect.mock).toHaveBeenCalledTimes(2);
  expect(socket2.connect.mock).toHaveBeenCalledTimes(1);

  const anoymousConn = {
    type: 'connection',
    serverId,
    id: socket1.connect.mock.calls[0].args[0].connId,
  };
  const anoymousConnInfo = {
    connId: anoymousConn.id,
    user: null,
    request: expectedReqInfo,
    authContext: null,
    expireAt: null,
  };

  const johnConn = {
    type: 'connection',
    serverId,
    id: socket1.connect.mock.calls[1].args[0].connId,
  };
  const johnConnInfo = {
    connId: johnConn.id,
    user: { john: 'doe' },
    request: expectedReqInfo,
    authContext: 'foo',
    expireAt: null,
  };

  const jojoConn = {
    type: 'connection',
    serverId,
    id: socket2.connect.mock.calls[0].args[0].connId,
  };
  const jojoConnInfo = {
    connId: jojoConn.id,
    user: { jojo: 'doe' },
    request: expectedReqInfo,
    authContext: 'bar',
    expireAt: null,
  };

  socket1.emit('connect', { connId: anoymousConn.id }, 4, socket1);
  socket1.emit('connect', { connId: johnConn.id }, 5, socket1);
  socket2.emit('connect', { connId: jojoConn.id }, 3, socket2);
  await nextTick();

  expect(connectSpy.mock).toHaveBeenCalledTimes(3);
  expect(connectSpy.mock).toHaveBeenNthCalledWith(1, anoymousConnInfo);
  expect(connectSpy.mock).toHaveBeenNthCalledWith(2, johnConnInfo);
  expect(connectSpy.mock).toHaveBeenNthCalledWith(3, jojoConnInfo);

  socket1.emit(
    'events',
    {
      connId: anoymousConn.id,
      values: [{ type: 'a', payload: 0 }],
    },
    7,
    socket1
  );
  socket1.emit(
    'events',
    {
      connId: johnConn.id,
      values: [
        { type: 'b', payload: 1 },
        { type: 'c', payload: 2 },
      ],
    },
    9,
    socket1
  );
  socket2.emit(
    'events',
    {
      connId: jojoConn.id,
      values: [
        { type: 'd', payload: 3 },
        { type: 'e', payload: 4 },
      ],
    },
    5,
    socket2
  );

  expect(eventsSpy.mock).toHaveBeenCalledTimes(3);
  expect(eventsSpy.mock).toHaveBeenNthCalledWith(
    1,
    [{ type: 'a', payload: 0 }],
    anoymousConnInfo
  );
  expect(eventsSpy.mock).toHaveBeenNthCalledWith(
    2,
    [
      { type: 'b', payload: 1 },
      { type: 'c', payload: 2 },
    ],
    johnConnInfo
  );
  expect(eventsSpy.mock).toHaveBeenNthCalledWith(
    3,
    [
      { type: 'd', payload: 3 },
      { type: 'e', payload: 4 },
    ],
    jojoConnInfo
  );

  socket1.emit(
    'disconnect',
    { connId: anoymousConn.id, reason: 'bye0' },
    6,
    socket1
  );
  socket1.emit(
    'disconnect',
    { connId: johnConn.id, reason: 'bye1' },
    7,
    socket1
  );
  socket2.emit(
    'disconnect',
    { connId: jojoConn.id, reason: 'bye2' },
    4,
    socket2
  );
  await nextTick();

  expect(disconnectSpy.mock).toHaveBeenCalledTimes(3);
  expect(disconnectSpy.mock).toHaveBeenNthCalledWith(
    1,
    { reason: 'bye0' },
    anoymousConnInfo
  );
  expect(disconnectSpy.mock).toHaveBeenNthCalledWith(
    2,
    { reason: 'bye1' },
    johnConnInfo
  );
  expect(disconnectSpy.mock).toHaveBeenNthCalledWith(
    3,
    { reason: 'bye2' },
    jojoConnInfo
  );

  socket1.emit('close', 666, 'bye', socket1);
  socket2.emit('close', 666, 'bye', socket2);
  await nextTick();
});

it('generate uniq connection id', async () => {
  const ids = new Set();

  await testServer.handleUpgrade(req, netSocket, head);
  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  for (let i = 0; i < 500; i += 1) {
    socket.emit('login', { credential: { hello: 'socket' } }, 1, socket);
    await nextTick(); // eslint-disable-line no-await-in-loop

    expect(socket.connect.mock).toHaveBeenCalledTimes(i + 1);
    const { connId } = socket.connect.mock.calls[i].args[0];

    expect(ids.has(connId)).toBe(false);
    ids.add(connId);

    ws.removeAllListeners();
  }
});

it('respond 404 if verifyUpgrade fn return false', async () => {
  verifyUpgrade.mock.fakeReturnValue(false);
  await testServer.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith(expectedReqInfo);

  expect(wsServer.handleUpgrade.mock).not.toHaveBeenCalled();
  expect(Socket.mock).not.toHaveBeenCalled();

  expect(netSocket.write.mock).toHaveBeenCalledTimes(1);
  expect(netSocket.write.mock.calls[0].args[0]).toMatchInlineSnapshot(`
                "HTTP/1.1 400 Bad Request
                Connection: close
                Content-Type: text/html
                Content-Length: 11

                Bad Request"
        `);

  expect(netSocket.destroy.mock).toHaveBeenCalledTimes(1);
});

it('reject sign in if verifyLogin resolve not success', async () => {
  await testServer.handleUpgrade(req, netSocket, head);

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  verifyLogin.mock.fake(async () => ({
    success: false,
    code: 401,
    reason: 'no no no',
  }));

  socket.emit('login', { credential: { hello: 'login' } }, 11, socket);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).not.toHaveBeenCalled();
  expect(socket.reject.mock).toHaveBeenCalledTimes(1);
  expect(socket.reject.mock).toHaveBeenCalledWith({
    seq: 11,
    reason: 'no no no',
  });
});

it('reject sign in if verifyLogin thrown', async () => {
  await testServer.handleUpgrade(req, netSocket, head);

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});
  verifyLogin.mock.fake(async () => {
    throw new Error('noooooo');
  });

  socket.emit('login', { credential: { hello: 'login' } }, 11, socket);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).not.toHaveBeenCalled();
  expect(socket.reject.mock).toHaveBeenCalledTimes(1);
  expect(socket.reject.mock).toHaveBeenCalledWith({
    seq: 11,
    reason: 'noooooo',
  });
});

it('emit socket error', async () => {
  await testServer.handleUpgrade(req, netSocket, head);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('error', new Error("It's Bat Man!"));

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock).toHaveBeenCalledWith(new Error("It's Bat Man!"));
});

test('ping socket per heartbeatInterval', async () => {
  jest.useFakeTimers();

  const serverWithOptions = new WebSocketServer(
    serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin,
    { heartbeatInterval: 100 }
  );

  await serverWithOptions.handleUpgrade(req, netSocket, head);
  await serverWithOptions.handleUpgrade(req, netSocket, head);

  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => 1);

  // test socket1 with connection
  await openConnection(testServer, socket1);

  jest.advanceTimersByTime(100);

  expect(socket1.ping.mock).toHaveBeenCalledTimes(1);
  expect(socket2.ping.mock).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(100);

  expect(socket1.ping.mock).toHaveBeenCalledTimes(2);
  expect(socket2.ping.mock).toHaveBeenCalledTimes(2);

  jest.advanceTimersByTime(100);

  expect(socket1.ping.mock).toHaveBeenCalledTimes(3);
  expect(socket2.ping.mock).toHaveBeenCalledTimes(3);

  jest.useRealTimers();
});

describe('subscribeTopic() and unsubscribeTopic()', () => {
  it('return boolean indicate whether connection is connected', async () => {
    const [socket, conn] = await openConnection(testServer);

    await expect(testServer.subscribeTopic(conn, 'foo')).resolves.toBe(true);
    await expect(testServer.subscribeTopic(conn, 'bar')).resolves.toBe(true);

    await expect(testServer.unsubscribeTopic(conn, 'foo')).resolves.toBe(true);
    await expect(testServer.unsubscribeTopic(conn, 'bar')).resolves.toBe(true);

    socket.disconnect.mock.fake(() => 5);
    await testServer.disconnect(conn);

    await expect(testServer.subscribeTopic(conn, 'foo')).resolves.toBe(false);
    await expect(testServer.unsubscribeTopic(conn, 'foo')).resolves.toBe(false);
  });

  it('delegate to broker if socket is not local', async () => {
    const remoteConn = { serverId: '_REMOTE_SERVER_', id: '_CONN_ID_' };

    broker.subscribeTopicRemote.mock.fake(async () => true);
    await expect(testServer.subscribeTopic(remoteConn, 'foo')).resolves.toBe(
      true
    );
    expect(broker.subscribeTopicRemote.mock).toHaveBeenCalledTimes(1);

    broker.subscribeTopicRemote.mock.fake(async () => false);
    await expect(testServer.subscribeTopic(remoteConn, 'foo')).resolves.toBe(
      false
    );
    expect(broker.subscribeTopicRemote.mock).toHaveBeenCalledTimes(2);

    broker.unsubscribeTopicRemote.mock.fake(async () => true);
    await expect(testServer.unsubscribeTopic(remoteConn, 'foo')).resolves.toBe(
      true
    );
    expect(broker.unsubscribeTopicRemote.mock).toHaveBeenCalledTimes(1);

    broker.unsubscribeTopicRemote.mock.fake(async () => false);
    await expect(testServer.unsubscribeTopic(remoteConn, 'foo')).resolves.toBe(
      false
    );
    expect(broker.unsubscribeTopicRemote.mock).toHaveBeenCalledTimes(2);
  });
});

describe('disconnect()', () => {
  it('return whether a connected connection is disconnected', async () => {
    const [socket, conn] = await openConnection(testServer);

    socket.disconnect.mock.fake(async () => 0);

    await expect(testServer.disconnect(conn, 'bye')).resolves.toBe(true);
    await expect(testServer.disconnect(conn, 'bye')).resolves.toBe(false);
  });

  it('delegate to borker if connection is on remote', async () => {
    const remoteConn = {
      serverId: '#remote',
      id: '#conn_remote',
    };

    await expect(testServer.disconnect(remoteConn, 'bye')).resolves.toBe(false);

    broker.disconnectRemote.mock.fake(async () => true);
    await expect(testServer.disconnect(remoteConn, 'bye')).resolves.toBe(true);

    expect(broker.disconnectRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.disconnectRemote.mock).toHaveBeenCalledWith(remoteConn);
  });
});

describe('dispatch()', () => {
  it('dispatch events to local connection target', async () => {
    const [socket, conn1] = await openConnection(testServer);
    const [, conn2] = await openConnection(testServer, socket);

    socket.dispatch.mock.fake(async () => 5);

    await expect(
      testServer.dispatch({
        target: conn1,
        values: [{ type: 'foo', kind: 'bar', payload: 1 }],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }]);
    await expect(
      testServer.dispatch({
        target: conn2,
        values: [
          { type: 'foo', kind: 'bar', payload: 2 },
          { type: 'foo', kind: 'baz', payload: 3 },
        ],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }]);

    expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      values: [{ type: 'foo', kind: 'bar', payload: 1 }],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      values: [
        { type: 'foo', kind: 'bar', payload: 2 },
        { type: 'foo', kind: 'baz', payload: 3 },
      ],
    });
  });

  it('dispatch events to remote connection target', async () => {
    const eventValues = [
      { type: 'greet', payload: 'hello' },
      { type: 'message', kind: 'text', payload: 'world' },
    ];

    const remoteTarget = {
      type: 'connection' as const,
      serverId: '_REMOTE_SERVER_',
      id: '_CONN_ID_',
    };

    await expect(
      testServer.dispatch({
        target: remoteTarget,
        values: eventValues,
      })
    ).resolves.toEqual([]);

    broker.dispatchRemote.mock.fake(async () => [
      { serverId: '_REMOTE_SERVER_', id: '_CONN_ID_' },
    ]);
    await expect(
      testServer.dispatch({ target: remoteTarget, values: eventValues })
    ).resolves.toEqual([{ serverId: '_REMOTE_SERVER_', id: '_CONN_ID_' }]);

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: remoteTarget,
      values: eventValues,
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: remoteTarget,
      values: eventValues,
    });
  });

  it('broadcast to topic', async () => {
    const [socket, conn1] = await openConnection(testServer);
    const [, conn2] = await openConnection(testServer, socket);

    const remoteConn1 = {
      serverId: '_REMOTE_SERVER_',
      id: '_CONN_1_',
    };
    const remoteConn2 = {
      serverId: '_REMOTE_SERVER_',
      id: '_CONN_2_',
    };

    testServer.subscribeTopic(conn1, 'foo');
    testServer.subscribeTopic(conn2, 'bar');
    testServer.subscribeTopic(conn1, 'baz');

    socket.dispatch.mock.fake(async () => 5);

    await expect(
      testServer.dispatch({
        target: { type: 'topic', name: 'foo' },
        values: [{ type: 'greet', payload: 'good morning' }],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn1]);
    await expect(
      testServer.dispatch({
        target: { type: 'topic', name: 'bar' },
        values: [{ type: 'greet', payload: 'good afternoon' }],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }, remoteConn1]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn1, remoteConn2]);
    await expect(
      testServer.dispatch({
        target: { type: 'topic', name: 'baz' },
        values: [{ type: 'greet', payload: 'good evening' }],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }, remoteConn1, remoteConn2]);

    expect(socket.dispatch.mock).toHaveBeenCalledTimes(3);
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      values: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      values: [{ type: 'greet', payload: 'good afternoon' }],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(3, {
      connId: conn1.id,
      values: [{ type: 'greet', payload: 'good evening' }],
    });

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(3);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: { type: 'topic', name: 'foo' },
      values: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: { type: 'topic', name: 'bar' },
      values: [{ type: 'greet', payload: 'good afternoon' }],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(3, {
      target: { type: 'topic', name: 'baz' },
      values: [{ type: 'greet', payload: 'good evening' }],
    });
  });

  it('broadcast to user', async () => {
    verifyLogin.mock.fake(() => ({
      success: true,
      user: { platform: 'test', uid: 'john_doe' },
      authContext: 'foo',
    }));
    const [socket, conn1] = await openConnection(testServer);

    verifyLogin.mock.fake(() => ({
      success: true,
      user: { platform: 'test', uid: 'jane_doe' },
      authContext: 'bar',
    }));
    const [, conn2] = await openConnection(testServer, socket);

    const remoteConn = {
      serverId: '_REMOTE_SERVER_',
      id: '_CONN_ID_',
    };

    const event = { type: 'greet', payload: 'good morning' };

    socket.dispatch.mock.fake(async () => 5);

    await expect(
      testServer.dispatch({
        target: { type: 'user', userUid: 'john_doe' },
        values: [event],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }]);

    await expect(
      testServer.dispatch({
        target: { type: 'user', userUid: 'jojo_doe' },
        values: [event],
      })
    ).resolves.toEqual([]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn]);
    await expect(
      testServer.dispatch({
        target: { type: 'user', userUid: 'jane_doe' },
        values: [event],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }, remoteConn]);

    await expect(
      testServer.dispatch({
        target: { type: 'user', userUid: 'jojo_doe' },
        values: [event],
      })
    ).resolves.toEqual([remoteConn]);

    expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      values: [event],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      values: [event],
    });

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(4);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: { type: 'user', userUid: 'john_doe' },
      values: [event],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: { type: 'user', userUid: 'jojo_doe' },
      values: [event],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(3, {
      target: { type: 'user', userUid: 'jane_doe' },
      values: [event],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(4, {
      target: { type: 'user', userUid: 'jojo_doe' },
      values: [event],
    });
  });

  it('emit error when socket level error happen', async () => {
    const [socket, conn1] = await openConnection(testServer);
    const [, conn2] = await openConnection(testServer, socket);

    socket.dispatch.mock.fake(() => Promise.resolve(0));
    socket.dispatch.mock.fakeOnce(() => Promise.reject(new Error('Wasted!')));

    testServer.subscribeTopic(conn1, 'foo');
    testServer.subscribeTopic(conn2, 'foo');

    const event = { type: 'warn', payload: 'DANGER' };
    await expect(
      testServer.dispatch({
        target: { type: 'topic', name: 'foo' },
        values: [event],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }]);

    expect(errorSpy.mock).toHaveBeenCalledTimes(1);

    socket.dispatch.mock.fake(() => Promise.reject(new Error('Wasted!')));
    await expect(
      testServer.dispatch({
        target: { type: 'topic', name: 'foo' },
        values: [event],
      })
    ).resolves.toEqual([]);
    expect(errorSpy.mock).toHaveBeenCalledTimes(3);

    errorSpy.mock.calls.forEach((call) => {
      expect(call.args[0]).toEqual(new Error('Wasted!'));
    });

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(2);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(4);
  });
});

test('handle remote dispatch', async () => {
  const server = new WebSocketServer(
    serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin
  );

  verifyLogin.mock.fake(() => ({
    success: true,
    user: { platform: 'test', uid: 'john_doe' },
  }));

  const [socket, conn] = await openConnection(server);
  server.subscribeTopic(conn, 'foo');

  expect(broker.onRemoteEvent.mock).toHaveBeenCalledTimes(1);
  const remoteEventHandler = broker.onRemoteEvent.mock.calls[0].args[0];

  socket.dispatch.mock.fake(async () => 5);

  remoteEventHandler({
    target: {
      type: 'connection',
      serverId,
      id: conn.id,
    },
    values: [{ type: 'greet', payload: 'Hi' }],
  });

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: conn.id,
    values: [{ type: 'greet', payload: 'Hi' }],
  });

  remoteEventHandler({
    target: { type: 'user', userUid: 'john_doe' },
    values: [{ type: 'greet', payload: 'Hi Hi' }],
  });

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: conn.id,
    values: [{ type: 'greet', payload: 'Hi Hi' }],
  });

  remoteEventHandler({
    target: { type: 'topic', name: 'foo' },
    values: [{ type: 'greet', payload: 'Hi Hi Hi' }],
  });

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(3);
  expect(socket.dispatch.mock).toHaveBeenNthCalledWith(3, {
    connId: conn.id,
    values: [{ type: 'greet', payload: 'Hi Hi Hi' }],
  });
});
