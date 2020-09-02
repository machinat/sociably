import WS from 'ws';
import moxy, { Mock } from '@moxyjs/moxy';
import Socket from '../socket';
import { WebSocketReceiver } from '../receiver';
import { ConnectionChannel } from '../channel';

jest.mock(
  '../socket',
  () =>
    jest.requireActual('@moxyjs/moxy').default(jest.requireActual('../socket')) // eslint-disable-line global-require
);

const nextTick = () => new Promise(process.nextTick);

const bot = moxy();

const transmitter = moxy({
  serverId: '#server',
  onRemoteEvent() {},
  addLocalConnection() {},
  removeLocalConnection() {},
});

const ws = new WS(/* I'm mocked */);
const wsServer = moxy({
  handleUpgrade(req, skt, head, callback) {
    callback(ws);
  },
});

const verifyLogin = moxy(async () => ({
  success: true,
  user: null,
  authInfo: null,
}));
const verifyUpgrade = moxy(() => true);

const req = moxy({
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
  connection: { encrypted: false },
});

const netSocket = moxy({
  write() {},
  destroy() {},
});

const head = '_';

const popEventMock = new Mock();
const popEventWrapper = moxy((finalHandler) =>
  popEventMock.proxify(finalHandler)
);
const popError = moxy();

const expectedRequest = {
  method: 'GET',
  url: '/hello',
  headers: { foo: 'bar' },
};

beforeEach(() => {
  Socket.mock.clear();
  transmitter.mock.clear();

  wsServer.mock.clear();
  ws.removeAllListeners();
  netSocket.mock.clear();

  req.mock.reset();

  popEventMock.reset();
  popEventWrapper.mock.reset();
  popError.mock.reset();

  verifyLogin.mock.reset();
  verifyUpgrade.mock.reset();
});

it('handle sockets and connections lifecycle', async () => {
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError,
    { verifyLogin, verifyUpgrade }
  );

  await receiver.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith(expectedRequest);

  expect(wsServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(wsServer.handleUpgrade.mock) //
    .toHaveBeenCalledWith(req, netSocket, head, expect.any(Function));

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(expect.any(String), ws, {
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
  });

  verifyLogin.mock.fake(async () => ({
    success: true,
    user: { john: 'doe' },
    authInfo: { rookie: true },
  }));

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  const credential = { type: 'some_auth', hello: 'login' };
  socket.emit('login', { credential }, 0, socket);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(1);
  expect(verifyLogin.mock).toHaveBeenCalledWith(expectedRequest, credential);

  expect(socket.connect.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).toHaveBeenCalledWith({
    connId: expect.any(String),
    seq: 0,
  });

  const expectedMetadata = {
    source: 'web_socket',
    request: expectedRequest,
    auth: { rookie: true },
  };

  expect(popEventMock).not.toHaveBeenCalled();

  const { connId } = socket.connect.mock.calls[0].args[0];
  socket.emit('connect', { connId }, 2, socket);
  await nextTick();

  const channel = new ConnectionChannel('#server', connId);
  expect(transmitter.addLocalConnection.mock).toHaveBeenCalledTimes(1);
  expect(transmitter.addLocalConnection.mock).toHaveBeenCalledWith(
    channel,
    socket,
    { john: 'doe' }
  );

  expect(popEventMock).toHaveBeenCalledTimes(1);
  expect(popEventMock).toHaveBeenCalledWith({
    platform: 'web_socket',
    channel,
    bot,
    user: { john: 'doe' },
    event: { type: 'connect' },
    metadata: expectedMetadata,
  });

  socket.emit(
    'dispatch',
    {
      connId,
      events: [{ type: 'greeting', subtype: 'french', payload: 'bonjour' }],
    },
    4,
    socket
  );

  expect(popEventMock).toHaveBeenCalledTimes(2);
  expect(popEventMock).toHaveBeenNthCalledWith(2, {
    platform: 'web_socket',
    channel,
    bot,
    user: { john: 'doe' },
    event: { type: 'greeting', subtype: 'french', payload: 'bonjour' },
    metadata: expectedMetadata,
  });

  socket.emit(
    'dispatch',
    {
      connId,
      events: [
        { type: 'foo', payload: 123 },
        { type: 'bar', payload: 456 },
      ],
    },
    5,
    socket
  );
  expect(popEventMock).toHaveBeenCalledTimes(4);
  expect(popEventMock).toHaveBeenNthCalledWith(3, {
    platform: 'web_socket',
    channel,
    bot,
    user: { john: 'doe' },
    event: { type: 'foo', payload: 123 },
    metadata: expectedMetadata,
  });
  expect(popEventMock).toHaveBeenNthCalledWith(4, {
    platform: 'web_socket',
    channel,
    bot,
    user: { john: 'doe' },
    event: { type: 'bar', payload: 456 },
    metadata: expectedMetadata,
  });

  socket.emit('disconnect', { connId, reason: 'bye' }, 7, socket);
  await nextTick();

  expect(popEventMock).toHaveBeenCalledTimes(5);
  expect(popEventMock).toHaveBeenNthCalledWith(5, {
    platform: 'web_socket',
    channel,
    bot,
    user: { john: 'doe' },
    event: { type: 'disconnect', payload: { reason: 'bye' } },
    metadata: expectedMetadata,
  });

  socket.emit('close', 666, 'bye', socket);
  await nextTick();
});

test('default verifyUpgrade and verifyLogin', async () => {
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError
  );

  await receiver.handleUpgrade(req, netSocket, head);

  // accept upgrade by default
  expect(wsServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});
  socket.emit('login', { credential: null }, 0, socket);
  await nextTick();

  const { connId } = socket.connect.mock.calls[0].args[0];
  socket.emit('connect', { connId }, 2, socket);
  await nextTick();

  expect(popEventMock).toHaveBeenCalledTimes(1);
  // accept auth with null user and null auth data
  expect(popEventMock).toHaveBeenCalledWith({
    platform: 'web_socket',
    channel: new ConnectionChannel('#server', connId),
    bot,
    user: null,
    event: { type: 'connect' },
    metadata: {
      source: 'web_socket',
      request: expectedRequest,
      auth: null,
    },
  });
});

test('multi sockets and connections', async () => {
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError,
    { verifyLogin, verifyUpgrade }
  );

  await receiver.handleUpgrade(req, netSocket, head);
  await receiver.handleUpgrade(req, netSocket, head);

  expect(wsServer.handleUpgrade.mock).toHaveBeenCalledTimes(2);
  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(2);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith(expectedRequest);

  expect(Socket.mock).toHaveBeenCalledTimes(2);
  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => {});
  socket2.connect.mock.fake(async () => {});

  expect(verifyLogin.mock).not.toHaveBeenCalled();
  socket1.emit('login', { credential: { hi: 1 } }, 0, socket1);

  expect(verifyLogin.mock).toHaveBeenCalledTimes(1);
  verifyLogin.mock.fake(async () => ({
    success: true,
    user: { john: 'doe' },
    authInfo: 'foo',
  }));

  socket1.emit('login', { credential: { hi: 2 } }, 1, socket1);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(2);
  verifyLogin.mock.fake(async () => ({
    success: true,
    user: { jojo: 'doe' },
    authInfo: 'kokoko',
  }));

  socket2.emit('login', { credential: { hi: 3 } }, 1, socket2);
  await nextTick();

  expect(verifyLogin.mock).toHaveBeenCalledTimes(3);
  for (let i = 1; i <= 3; i += 1) {
    expect(verifyLogin.mock).toHaveBeenNthCalledWith(i, expectedRequest, {
      hi: i,
    });
  }

  expect(popEventMock).not.toHaveBeenCalled();

  expect(socket1.connect.mock).toHaveBeenCalledTimes(2);
  expect(socket2.connect.mock).toHaveBeenCalledTimes(1);

  const noUserConn = new ConnectionChannel(
    '#server',
    socket1.connect.mock.calls[0].args[0].connId
  );
  const johnConn = new ConnectionChannel(
    '#server',
    socket1.connect.mock.calls[1].args[0].connId
  );
  const jojoConn = new ConnectionChannel(
    '#server',
    socket2.connect.mock.calls[0].args[0].connId
  );

  socket1.emit('connect', { connId: noUserConn.id }, 4, socket1);
  socket1.emit('connect', { connId: johnConn.id }, 5, socket1);
  socket2.emit('connect', { connId: jojoConn.id }, 3, socket2);
  await nextTick();

  expect(transmitter.addLocalConnection.mock).toHaveBeenCalledTimes(3);
  expect(transmitter.addLocalConnection.mock) //
    .toHaveBeenNthCalledWith(1, noUserConn, socket1, null);
  expect(transmitter.addLocalConnection.mock) //
    .toHaveBeenNthCalledWith(2, johnConn, socket1, { john: 'doe' });
  expect(transmitter.addLocalConnection.mock) //
    .toHaveBeenNthCalledWith(3, jojoConn, socket2, { jojo: 'doe' });

  expect(popEventMock).toHaveBeenCalledTimes(3);
  expect(popEventMock).toHaveBeenNthCalledWith(1, {
    platform: 'web_socket',
    bot,
    channel: noUserConn,
    user: null,
    event: { type: 'connect' },
    metadata: { source: 'web_socket', request: expectedRequest, auth: null },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(2, {
    platform: 'web_socket',
    bot,
    channel: johnConn,
    user: { john: 'doe' },
    event: { type: 'connect' },
    metadata: { source: 'web_socket', request: expectedRequest, auth: 'foo' },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(3, {
    platform: 'web_socket',
    bot,
    channel: jojoConn,
    user: { jojo: 'doe' },
    event: { type: 'connect' },
    metadata: {
      source: 'web_socket',
      request: expectedRequest,
      auth: 'kokoko',
    },
  });

  socket1.emit(
    'dispatch',
    {
      connId: noUserConn.id,
      events: [{ type: 'a', payload: 0 }],
    },
    7,
    socket1
  );
  socket1.emit(
    'dispatch',
    {
      connId: johnConn.id,
      events: [
        { type: 'b', payload: 1 },
        { type: 'c', payload: 2 },
      ],
    },
    9,
    socket1
  );
  socket2.emit(
    'dispatch',
    {
      connId: jojoConn.id,
      events: [
        { type: 'd', payload: 3 },
        { type: 'e', payload: 4 },
      ],
    },
    5,
    socket2
  );

  expect(popEventMock).toHaveBeenCalledTimes(8);
  expect(popEventMock).toHaveBeenNthCalledWith(4, {
    platform: 'web_socket',
    bot,
    channel: noUserConn,
    user: null,
    event: { type: 'a', payload: 0 },
    metadata: { source: 'web_socket', request: expectedRequest, auth: null },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(5, {
    platform: 'web_socket',
    bot,
    channel: johnConn,
    user: { john: 'doe' },
    event: { type: 'b', payload: 1 },
    metadata: { source: 'web_socket', request: expectedRequest, auth: 'foo' },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(6, {
    platform: 'web_socket',
    bot,
    channel: johnConn,
    user: { john: 'doe' },
    event: { type: 'c', payload: 2 },
    metadata: { source: 'web_socket', request: expectedRequest, auth: 'foo' },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(7, {
    platform: 'web_socket',
    bot,
    channel: jojoConn,
    user: { jojo: 'doe' },
    event: { type: 'd', payload: 3 },
    metadata: {
      source: 'web_socket',
      request: expectedRequest,
      auth: 'kokoko',
    },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(8, {
    platform: 'web_socket',
    bot,
    channel: jojoConn,
    user: { jojo: 'doe' },
    event: { type: 'e', payload: 4 },
    metadata: {
      source: 'web_socket',
      request: expectedRequest,
      auth: 'kokoko',
    },
  });

  socket1.emit(
    'disconnect',
    { connId: noUserConn.id, reason: 'bye0' },
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

  expect(popEventMock).toHaveBeenCalledTimes(11);
  expect(popEventMock).toHaveBeenNthCalledWith(9, {
    platform: 'web_socket',
    bot,
    channel: noUserConn,
    user: null,
    event: { type: 'disconnect', payload: { reason: 'bye0' } },
    metadata: { source: 'web_socket', request: expectedRequest, auth: null },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(10, {
    platform: 'web_socket',
    bot,
    channel: johnConn,
    user: { john: 'doe' },
    event: { type: 'disconnect', payload: { reason: 'bye1' } },
    metadata: { source: 'web_socket', request: expectedRequest, auth: 'foo' },
  });
  expect(popEventMock).toHaveBeenNthCalledWith(11, {
    platform: 'web_socket',
    bot,
    channel: jojoConn,
    user: { jojo: 'doe' },
    event: { type: 'disconnect', payload: { reason: 'bye2' } },
    metadata: {
      source: 'web_socket',
      request: expectedRequest,
      auth: 'kokoko',
    },
  });

  socket1.emit('close', 666, 'bye', socket1);
  socket2.emit('close', 666, 'bye', socket2);
  await nextTick();
});

it('generate uniq socket id', async () => {
  const ids = new Set();
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError
  );

  for (let i = 0; i < 500; i += 1) {
    await receiver.handleUpgrade(req, netSocket, head); // eslint-disable-line no-await-in-loop
    const socket = Socket.mock.calls[i].instance;

    expect(typeof socket.id).toBe('string');
    expect(ids.has(socket.id)).toBe(false);
    ids.add(socket.id);

    ws.removeAllListeners();
  }
});

it('generate uniq connection id', async () => {
  const ids = new Set();
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError
  );

  await receiver.handleUpgrade(req, netSocket, head);
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
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError,
    { verifyUpgrade }
  );

  verifyUpgrade.mock.fakeReturnValue(false);
  await receiver.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith(expectedRequest);

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

it('reject sign in if verifyLogin resolve not sucess', async () => {
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError,
    { verifyLogin }
  );
  await receiver.handleUpgrade(req, netSocket, head);

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  verifyLogin.mock.fake(async () => ({
    success: false,
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
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError,
    { verifyLogin }
  );
  await receiver.handleUpgrade(req, netSocket, head);

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

it('pop socket error', async () => {
  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError
  );

  await receiver.handleUpgrade(req, netSocket, head);
  popEventMock.fakeOnce(async () => ({
    success: true,
    user: { john: 'doe' },
  }));

  const socket = Socket.mock.calls[0].instance;
  socket.emit('error', new Error("It's Bat Man!"));

  expect(popError.mock).toHaveBeenCalledTimes(1);
  expect(popError.mock).toHaveBeenCalledWith(new Error("It's Bat Man!"));
});

test('ping socket per heartbeatInterval', async () => {
  jest.useFakeTimers();

  const receiver = new WebSocketReceiver(
    bot,
    wsServer,
    transmitter,
    popEventWrapper,
    popError,
    { heartbeatInterval: 100 }
  );

  await receiver.handleUpgrade(req, netSocket, head);
  await receiver.handleUpgrade(req, netSocket, head);

  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => {});

  // test socket1 with connection
  socket1.emit('login', { credential: { hi: 1 } }, 0, socket1);
  await nextTick();
  const { connId } = socket1.connect.mock.calls[0].args[0];
  socket1.emit('connect', { connId }, 2, socket1);
  await nextTick();

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
