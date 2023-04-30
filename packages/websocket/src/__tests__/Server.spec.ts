import type { IncomingMessage } from 'http';
import type { Socket as NetSocket } from 'net';
import moxy, { Moxy } from '@moxyjs/moxy';
import Ws from 'ws';
import { WebSocketServer } from '../Server';
import _Socket from '../Socket';
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
  ok: true as const,
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

const marshaler = moxy({
  marshal: (x) => x,
  unmarshal: (x) => x,
});

beforeEach(async () => {
  testServer = new WebSocketServer({
    id: serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin,
    marshaler,
  });
  testServer.on('connect', connectSpy);
  testServer.on('disconnect', disconnectSpy);
  testServer.on('events', eventsSpy);
  testServer.on('error', errorSpy);

  Socket.mock.clear();
  broker.mock.reset();
  marshaler.mock.reset();

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

  expect(verifyUpgrade).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade).toHaveBeenCalledWith(expectedReqInfo);

  expect(wsServer.handleUpgrade).toHaveBeenCalledTimes(1);
  expect(wsServer.handleUpgrade.mock) //
    .toHaveBeenCalledWith(req, netSocket, head, expect.any(Function));

  expect(Socket).toHaveBeenCalledTimes(1);
  expect(Socket).toHaveBeenCalledWith(ws, {
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
  });

  verifyLogin.mock.fake(async () => ({
    ok: true,
    user: { john: 'doe' },
    authContext: { rookie: true },
  }));

  const socket: Socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  const credential = { type: 'some_auth', hello: 'login' };
  socket.emit('login', { credential }, 0, socket);
  await nextTick();

  expect(verifyLogin).toHaveBeenCalledTimes(1);
  expect(verifyLogin).toHaveBeenCalledWith(expectedReqInfo, credential);

  expect(socket.connect).toHaveBeenCalledTimes(1);
  expect(socket.connect).toHaveBeenCalledWith({
    connId: expect.any(String),
    seq: 0,
  });

  expect(connectSpy).not.toHaveBeenCalled();

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

  expect(connectSpy).toHaveBeenCalledTimes(1);
  expect(connectSpy).toHaveBeenCalledWith(expectedConnInfo);

  let eventValues = [
    { type: 'greeting', category: 'french', payload: 'bonjour' },
  ];
  socket.emit('events', { connId, values: eventValues }, 4, socket);

  expect(eventsSpy).toHaveBeenCalledTimes(1);
  expect(eventsSpy).toHaveBeenCalledWith(eventValues, expectedConnInfo);

  eventValues = [
    { category: 'any', type: 'foo', payload: 'hello' },
    { category: 'any', type: 'bar', payload: 'world' },
  ];
  socket.emit('events', { connId, values: eventValues }, 5, socket);

  expect(eventsSpy).toHaveBeenCalledTimes(2);
  expect(eventsSpy).toHaveBeenCalledWith(eventValues, expectedConnInfo);

  socket.emit('disconnect', { connId, reason: 'bye' }, 7, socket);
  await nextTick();

  expect(disconnectSpy).toHaveBeenCalledTimes(1);
  expect(disconnectSpy).toHaveBeenCalledWith(
    { reason: 'bye' },
    expectedConnInfo
  );

  socket.emit('close', 666, 'bye', socket);
  await nextTick();
});

test('multi sockets and connections', async () => {
  await testServer.handleUpgrade(req, netSocket, head);
  await testServer.handleUpgrade(req, netSocket, head);

  expect(wsServer.handleUpgrade).toHaveBeenCalledTimes(2);
  expect(verifyUpgrade).toHaveBeenCalledTimes(2);
  expect(verifyUpgrade).toHaveBeenCalledWith(expectedReqInfo);

  expect(Socket).toHaveBeenCalledTimes(2);
  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => 1);
  socket2.connect.mock.fake(async () => 1);

  expect(verifyLogin).not.toHaveBeenCalled();
  socket1.emit('login', { credential: { hi: 1 } }, 0, socket1);

  expect(verifyLogin).toHaveBeenCalledTimes(1);
  verifyLogin.mock.fake(async () => ({
    ok: true,
    user: { john: 'doe' },
    authContext: 'foo',
  }));

  socket1.emit('login', { credential: { hi: 2 } }, 2, socket1);
  await nextTick();

  expect(verifyLogin).toHaveBeenCalledTimes(2);
  verifyLogin.mock.fake(async () => ({
    ok: true,
    user: { jojo: 'doe' },
    authContext: 'bar',
  }));

  socket2.emit('login', { credential: { hi: 3 } }, 2, socket2);
  await nextTick();

  expect(verifyLogin).toHaveBeenCalledTimes(3);
  for (let i = 1; i <= 3; i += 1) {
    expect(verifyLogin).toHaveBeenNthCalledWith(i, expectedReqInfo, {
      hi: i,
    });
  }

  expect(eventsSpy).not.toHaveBeenCalled();

  expect(socket1.connect).toHaveBeenCalledTimes(2);
  expect(socket2.connect).toHaveBeenCalledTimes(1);

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

  expect(connectSpy).toHaveBeenCalledTimes(3);
  expect(connectSpy).toHaveBeenNthCalledWith(1, anoymousConnInfo);
  expect(connectSpy).toHaveBeenNthCalledWith(2, johnConnInfo);
  expect(connectSpy).toHaveBeenNthCalledWith(3, jojoConnInfo);

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

  expect(eventsSpy).toHaveBeenCalledTimes(3);
  expect(eventsSpy).toHaveBeenNthCalledWith(
    1,
    [{ type: 'a', payload: 0 }],
    anoymousConnInfo
  );
  expect(eventsSpy).toHaveBeenNthCalledWith(
    2,
    [
      { type: 'b', payload: 1 },
      { type: 'c', payload: 2 },
    ],
    johnConnInfo
  );
  expect(eventsSpy).toHaveBeenNthCalledWith(
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

  expect(disconnectSpy).toHaveBeenCalledTimes(3);
  expect(disconnectSpy).toHaveBeenNthCalledWith(
    1,
    { reason: 'bye0' },
    anoymousConnInfo
  );
  expect(disconnectSpy).toHaveBeenNthCalledWith(
    2,
    { reason: 'bye1' },
    johnConnInfo
  );
  expect(disconnectSpy).toHaveBeenNthCalledWith(
    3,
    { reason: 'bye2' },
    jojoConnInfo
  );

  socket1.emit('close', 666, 'bye', socket1);
  socket2.emit('close', 666, 'bye', socket2);
  await nextTick();
});

test('unmarshal payload', async () => {
  const [socket, conn] = await openConnection(testServer);

  marshaler.unmarshal.mock.fake((x) => ({ ...x, unmarshaled: true }));

  socket.emit(
    'events',
    {
      connId: conn.id,
      values: [
        { type: 'any', payload: { foo: 'bar' } },
        { type: 'any', payload: { foo: 'baz' } },
      ],
    },
    4,
    socket
  );

  expect(eventsSpy).toHaveBeenCalledTimes(1);
  expect(eventsSpy).toHaveBeenCalledWith(
    [
      { type: 'any', payload: { foo: 'bar', unmarshaled: true } },
      { type: 'any', payload: { foo: 'baz', unmarshaled: true } },
    ],
    {
      connId: expect.any(String),
      user: null,
      request: expectedReqInfo,
      authContext: null,
      expireAt: null,
    }
  );

  expect(marshaler.unmarshal).toHaveBeenCalledTimes(2);
  expect(marshaler.unmarshal).toHaveBeenNthCalledWith(1, { foo: 'bar' });
  expect(marshaler.unmarshal).toHaveBeenNthCalledWith(2, { foo: 'baz' });
});

it('generate uniq connection id', async () => {
  const ids = new Set();

  await testServer.handleUpgrade(req, netSocket, head);
  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  for (let i = 0; i < 500; i += 1) {
    socket.emit('login', { credential: { hello: 'socket' } }, 1, socket);
    await nextTick(); // eslint-disable-line no-await-in-loop

    expect(socket.connect).toHaveBeenCalledTimes(i + 1);
    const { connId } = socket.connect.mock.calls[i].args[0];

    expect(ids.has(connId)).toBe(false);
    ids.add(connId);

    ws.removeAllListeners();
  }
});

it('respond 404 if verifyUpgrade fn return false', async () => {
  verifyUpgrade.mock.fakeReturnValue(false);
  await testServer.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade).toHaveBeenCalledWith(expectedReqInfo);

  expect(wsServer.handleUpgrade).not.toHaveBeenCalled();
  expect(Socket).not.toHaveBeenCalled();

  expect(netSocket.write).toHaveBeenCalledTimes(1);
  expect(netSocket.write.mock.calls[0].args[0]).toMatchInlineSnapshot(`
                "HTTP/1.1 400 Bad Request
                Connection: close
                Content-Type: text/html
                Content-Length: 11

                Bad Request"
        `);

  expect(netSocket.destroy).toHaveBeenCalledTimes(1);
});

it('reject sign in if verifyLogin resolve not ok', async () => {
  await testServer.handleUpgrade(req, netSocket, head);

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  verifyLogin.mock.fake(async () => ({
    ok: false,
    code: 401,
    reason: 'no no no',
  }));

  socket.emit('login', { credential: { hello: 'login' } }, 11, socket);
  await nextTick();

  expect(verifyLogin).toHaveBeenCalledTimes(1);
  expect(socket.connect).not.toHaveBeenCalled();
  expect(socket.reject).toHaveBeenCalledTimes(1);
  expect(socket.reject).toHaveBeenCalledWith({
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

  expect(verifyLogin).toHaveBeenCalledTimes(1);
  expect(socket.connect).not.toHaveBeenCalled();
  expect(socket.reject).toHaveBeenCalledTimes(1);
  expect(socket.reject).toHaveBeenCalledWith({
    seq: 11,
    reason: 'noooooo',
  });
});

it('emit socket error', async () => {
  await testServer.handleUpgrade(req, netSocket, head);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('error', new Error("It's Bat Man!"));

  expect(errorSpy).toHaveBeenCalledTimes(1);
  expect(errorSpy).toHaveBeenCalledWith(new Error("It's Bat Man!"));
});

test('ping socket per heartbeatInterval', async () => {
  jest.useFakeTimers();

  const serverWithOptions = new WebSocketServer({
    id: serverId,
    wsServer,
    broker,
    marshaler,
    verifyUpgrade,
    verifyLogin,
    heartbeatInterval: 100,
  });

  await serverWithOptions.handleUpgrade(req, netSocket, head);
  await serverWithOptions.handleUpgrade(req, netSocket, head);

  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => 1);

  // test socket1 with connection
  await openConnection(testServer, socket1);

  jest.advanceTimersByTime(100);

  expect(socket1.ping).toHaveBeenCalledTimes(1);
  expect(socket2.ping).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(100);

  expect(socket1.ping).toHaveBeenCalledTimes(2);
  expect(socket2.ping).toHaveBeenCalledTimes(2);

  jest.advanceTimersByTime(100);

  expect(socket1.ping).toHaveBeenCalledTimes(3);
  expect(socket2.ping).toHaveBeenCalledTimes(3);

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
    expect(broker.subscribeTopicRemote).toHaveBeenCalledTimes(1);

    broker.subscribeTopicRemote.mock.fake(async () => false);
    await expect(testServer.subscribeTopic(remoteConn, 'foo')).resolves.toBe(
      false
    );
    expect(broker.subscribeTopicRemote).toHaveBeenCalledTimes(2);

    broker.unsubscribeTopicRemote.mock.fake(async () => true);
    await expect(testServer.unsubscribeTopic(remoteConn, 'foo')).resolves.toBe(
      true
    );
    expect(broker.unsubscribeTopicRemote).toHaveBeenCalledTimes(1);

    broker.unsubscribeTopicRemote.mock.fake(async () => false);
    await expect(testServer.unsubscribeTopic(remoteConn, 'foo')).resolves.toBe(
      false
    );
    expect(broker.unsubscribeTopicRemote).toHaveBeenCalledTimes(2);
  });
});

describe('disconnect()', () => {
  it('return whether a connected connection is disconnected', async () => {
    const [socket, conn] = await openConnection(testServer);

    socket.disconnect.mock.fake(async () => 0);

    await expect(testServer.disconnect(conn, 'bye')).resolves.toBe(true);
    await expect(testServer.disconnect(conn, 'bye')).resolves.toBe(false);
  });

  it('delegate to broker if connection is on remote', async () => {
    const remoteConn = {
      serverId: '#remote',
      id: '#conn_remote',
    };

    await expect(testServer.disconnect(remoteConn, 'bye')).resolves.toBe(false);

    broker.disconnectRemote.mock.fake(async () => true);
    await expect(testServer.disconnect(remoteConn, 'bye')).resolves.toBe(true);

    expect(broker.disconnectRemote).toHaveBeenCalledTimes(2);
    expect(broker.disconnectRemote).toHaveBeenCalledWith(remoteConn);
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
        values: [{ type: 'foo', category: 'bar', payload: 1 }],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }]);
    await expect(
      testServer.dispatch({
        target: conn2,
        values: [
          { type: 'foo', category: 'bar', payload: 2 },
          { type: 'foo', category: 'baz', payload: 3 },
        ],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }]);

    expect(socket.dispatch).toHaveBeenCalledTimes(2);
    expect(socket.dispatch).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      values: [{ type: 'foo', category: 'bar', payload: 1 }],
    });
    expect(socket.dispatch).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      values: [
        { type: 'foo', category: 'bar', payload: 2 },
        { type: 'foo', category: 'baz', payload: 3 },
      ],
    });
  });

  it('dispatch events to remote connection target', async () => {
    const eventValues = [
      { type: 'greet', payload: 'hello' },
      { type: 'message', category: 'text', payload: 'world' },
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

    expect(broker.dispatchRemote).toHaveBeenCalledTimes(2);
    expect(broker.dispatchRemote).toHaveBeenNthCalledWith(1, {
      target: remoteTarget,
      values: eventValues,
    });
    expect(broker.dispatchRemote).toHaveBeenNthCalledWith(2, {
      target: remoteTarget,
      values: eventValues,
    });
  });

  test('marshal payload', async () => {
    const [socket, conn] = await openConnection(testServer);

    socket.dispatch.mock.fake(async () => 5);
    marshaler.marshal.mock.fake((x) => ({ ...x, marshaled: true }));

    await testServer.dispatch({
      target: conn,
      values: [
        { type: 'any', payload: { foo: 'bar' } },
        { type: 'any', payload: { foo: 'baz' } },
      ],
    });

    expect(socket.dispatch).toHaveBeenCalledTimes(1);
    expect(socket.dispatch).toHaveBeenCalledWith({
      connId: conn.id,
      values: [
        { type: 'any', payload: { foo: 'bar', marshaled: true } },
        { type: 'any', payload: { foo: 'baz', marshaled: true } },
      ],
    });

    expect(marshaler.marshal).toHaveBeenCalledTimes(2);
    expect(marshaler.marshal).toHaveBeenNthCalledWith(1, { foo: 'bar' });
    expect(marshaler.marshal).toHaveBeenNthCalledWith(2, { foo: 'baz' });

    const remoteTarget = {
      type: 'connection' as const,
      serverId: '_REMOTE_SERVER_',
      id: '_CONN_ID_',
    };

    await testServer.dispatch({
      target: remoteTarget,
      values: [{ type: 'any', payload: { bar: 'baz' } }],
    });

    expect(broker.dispatchRemote).toHaveBeenCalledTimes(1);
    expect(broker.dispatchRemote).toHaveBeenCalledWith({
      target: remoteTarget,
      values: [
        {
          type: 'any',
          payload: { bar: 'baz', marshaled: true },
        },
      ],
    });

    expect(marshaler.marshal).toHaveBeenCalledTimes(3);
    expect(marshaler.marshal).toHaveBeenNthCalledWith(3, { bar: 'baz' });
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
        target: { type: 'topic', key: 'foo' },
        values: [{ type: 'greet', payload: 'good morning' }],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn1]);
    await expect(
      testServer.dispatch({
        target: { type: 'topic', key: 'bar' },
        values: [{ type: 'greet', payload: 'good afternoon' }],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }, remoteConn1]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn1, remoteConn2]);
    await expect(
      testServer.dispatch({
        target: { type: 'topic', key: 'baz' },
        values: [{ type: 'greet', payload: 'good evening' }],
      })
    ).resolves.toEqual([{ serverId, id: conn1.id }, remoteConn1, remoteConn2]);

    expect(socket.dispatch).toHaveBeenCalledTimes(3);
    expect(socket.dispatch).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      values: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(socket.dispatch).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      values: [{ type: 'greet', payload: 'good afternoon' }],
    });
    expect(socket.dispatch).toHaveBeenNthCalledWith(3, {
      connId: conn1.id,
      values: [{ type: 'greet', payload: 'good evening' }],
    });

    expect(broker.dispatchRemote).toHaveBeenCalledTimes(3);
    expect(broker.dispatchRemote).toHaveBeenNthCalledWith(1, {
      target: { type: 'topic', key: 'foo' },
      values: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(broker.dispatchRemote).toHaveBeenNthCalledWith(2, {
      target: { type: 'topic', key: 'bar' },
      values: [{ type: 'greet', payload: 'good afternoon' }],
    });
    expect(broker.dispatchRemote).toHaveBeenNthCalledWith(3, {
      target: { type: 'topic', key: 'baz' },
      values: [{ type: 'greet', payload: 'good evening' }],
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
        target: { type: 'topic', key: 'foo' },
        values: [event],
      })
    ).resolves.toEqual([{ serverId, id: conn2.id }]);

    expect(errorSpy).toHaveBeenCalledTimes(1);

    socket.dispatch.mock.fake(() => Promise.reject(new Error('Wasted!')));
    await expect(
      testServer.dispatch({
        target: { type: 'topic', key: 'foo' },
        values: [event],
      })
    ).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledTimes(3);

    errorSpy.mock.calls.forEach((call) => {
      expect(call.args[0]).toEqual(new Error('Wasted!'));
    });

    expect(broker.dispatchRemote).toHaveBeenCalledTimes(2);
    expect(socket.dispatch).toHaveBeenCalledTimes(4);
  });
});

test('handle remote dispatch', async () => {
  const server = new WebSocketServer({
    id: serverId,
    wsServer,
    broker,
    verifyUpgrade,
    verifyLogin,
    marshaler,
  });

  verifyLogin.mock.fake(() => ({
    ok: true,
    user: { platform: 'test', uid: 'john_doe' },
  }));

  const [socket, conn] = await openConnection(server);
  server.subscribeTopic(conn, 'foo');

  expect(broker.onRemoteEvent).toHaveBeenCalledTimes(1);
  const remoteEventHandler = broker.onRemoteEvent.mock.calls[0].args[0];

  socket.dispatch.mock.fake(async () => 5);

  remoteEventHandler({
    target: { type: 'connection', serverId, id: conn.id },
    values: [{ type: 'greet', payload: 'Hi' }],
  });

  expect(socket.dispatch).toHaveBeenCalledTimes(1);
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId: conn.id,
    values: [{ type: 'greet', payload: 'Hi' }],
  });

  remoteEventHandler({
    target: { type: 'topic', key: 'foo' },
    values: [{ type: 'greet', payload: 'Hi Hi' }],
  });

  expect(socket.dispatch).toHaveBeenCalledTimes(2);
  expect(socket.dispatch).toHaveBeenCalledWith({
    connId: conn.id,
    values: [{ type: 'greet', payload: 'Hi Hi' }],
  });

  remoteEventHandler({
    target: { type: 'connection', serverId, id: conn.id },
    values: [{ type: 'greet', payload: 'Hi Hi Hi' }],
  });

  expect(socket.dispatch).toHaveBeenCalledTimes(3);
  expect(socket.dispatch).toHaveBeenNthCalledWith(3, {
    connId: conn.id,
    values: [{ type: 'greet', payload: 'Hi Hi Hi' }],
  });
});
