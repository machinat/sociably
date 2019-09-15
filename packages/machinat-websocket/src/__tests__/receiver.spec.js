import { BaseReceiver } from 'machinat-base';
import WS from 'ws';
import moxy from 'moxy';
import Socket from '../socket';
import Receiver from '../receiver';
import { connectionScope } from '../channel';

jest.mock('../socket');

const nextTick = () => new Promise(process.nextTick);

const distributor = moxy({
  onRemoteEvent() {},
  addLocalConnection() {},
  removeLocalConnection() {},
});

const ws = new WS(/* I'm mocked */);
const webSocketServer = moxy({
  handleUpgrade(req, skt, head, callback) {
    callback(ws);
  },
});

const req = moxy({
  get method() {
    return 'GET';
  },
  get url() {
    return '/hello';
  },
  get headers() {
    return { foo: 'bar' };
  },
  get connection() {
    return { encrypted: false };
  },
});

const netSocket = moxy({
  write() {},
  destroy() {},
});

const serverId = 'MY_SERVER';

const head = '_';

const issueEvent = moxy(() => Promise.resolve());
const issueError = moxy();

beforeEach(() => {
  Socket.mock.clear();
  distributor.mock.clear();

  webSocketServer.mock.clear();
  ws.removeAllListeners();
  netSocket.mock.clear();

  req.mock.reset();

  issueEvent.mock.reset();
  issueError.mock.reset();
});

it('extends BaseReceiver', () => {
  expect(
    new Receiver(serverId, webSocketServer, distributor, {})
  ).toBeInstanceOf(BaseReceiver);
});

it('handle sockets and connections lifecycle', async () => {
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  expect(receiver.handleUpgrade(req, netSocket, head)).toBe(undefined);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledWith(
    req,
    netSocket,
    head,
    expect.any(Function)
  );

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(expect.any(String), ws, {
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
    encrypted: false,
  });

  expect(issueEvent.mock).not.toHaveBeenCalled();
  issueEvent.mock.fake(async () => ({
    accepted: true,
    user: { john: 'doe' },
  }));

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});
  socket.emit('register', { type: 'some_auth', hello: 'login' });
  await nextTick();

  const expectedMetadata = {
    source: 'websocket',
    connection: {
      id: expect.any(String),
      serverId,
      socketId: socket.id,
      user: { john: 'doe' },
      tags: null,
    },
    request: {
      encrypted: false,
      headers: { foo: 'bar' },
      method: 'GET',
      url: '/hello',
    },
  };

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    connectionScope({
      id: expect.any(String),
      serverId,
      socketId: socket.id,
      user: null,
      tags: null,
    }),
    null,
    {
      payload: { hello: 'login', type: 'some_auth' },
      subtype: undefined,
      type: '@auth',
    },
    {
      source: 'websocket',
      connection: {
        id: expect.any(String),
        serverId,
        socketId: socket.id,
        user: null,
        tags: null,
      },
      request: {
        encrypted: false,
        headers: { foo: 'bar' },
        method: 'GET',
        url: '/hello',
      },
    }
  );

  expect(socket.connect.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).toHaveBeenCalledWith({
    connectionId: expect.any(String),
    user: { john: 'doe' },
  });

  const { connectionId } = socket.connect.mock.calls[0].args[0];
  socket.emit('connect', { connectionId });
  await nextTick();

  expect(distributor.addLocalConnection.mock).toHaveBeenCalledTimes(1);
  expect(distributor.addLocalConnection.mock).toHaveBeenCalledWith(socket, {
    serverId,
    socketId: socket.id,
    id: connectionId,
    user: { john: 'doe' },
    tags: null,
  });

  const expectedConnectionChannel = connectionScope({
    id: expect.any(String),
    serverId,
    socketId: socket.id,
    user: { john: 'doe' },
    tags: null,
  });

  expect(issueEvent.mock).toHaveBeenCalledTimes(2);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    expectedConnectionChannel,
    { john: 'doe' },
    { type: '@connect' },
    expectedMetadata
  );

  socket.emit('event', {
    connectionId,
    type: 'greeting',
    subtype: 'french',
    payload: 'bonjour',
  });

  expect(issueEvent.mock).toHaveBeenCalledTimes(3);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    expectedConnectionChannel,
    { john: 'doe' },
    { type: 'greeting', subtype: 'french', payload: 'bonjour' },
    expectedMetadata
  );

  socket.emit('disconnect', { connectionId, reason: 'bye' });
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(4);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    expectedConnectionChannel,
    { john: 'doe' },
    { type: '@disconnect', payload: { reason: 'bye' } },
    expectedMetadata
  );

  socket.emit('close', 666, 'wth');
  await nextTick();
});

test('multi sockets and connections', async () => {
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  receiver.handleUpgrade(req, netSocket, head);
  receiver.handleUpgrade(req, netSocket, head);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(2);

  expect(Socket.mock).toHaveBeenCalledTimes(2);
  const socket1 = Socket.mock.calls[0].instance;
  const socket2 = Socket.mock.calls[1].instance;
  socket1.connect.mock.fake(async () => {});
  socket2.connect.mock.fake(async () => {});

  expect(issueEvent.mock).not.toHaveBeenCalled();
  issueEvent.mock.fake(async () => ({ accepted: true, user: { john: 'doe' } }));
  socket1.emit('register', { type: 'auth', t: 1 });
  socket2.emit('register', { type: 'auth', t: 2 });
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(2);

  issueEvent.mock.fake(async () => ({ accepted: true, user: { jojo: 'doe' } }));
  socket1.emit('register', { type: 'auth', t: 3 });
  socket2.emit('register', { type: 'auth', t: 4 });
  await nextTick();

  // expect(issueEvent.mock).toHaveBeenCalledTimes(4);
  // expect(issueEvent.mock.calls.map(c => c.args[0])).toEqual(
  //   [socket1.id, socket2.id, socket1.id, socket2.id].map(id =>
  //     connectionScope({
  //       platform: 'websocket',
  //       type: '@socket',
  //       id,
  //       uid: `websocket:@socket:*:${id}`,
  //     })
  //   )
  // );
  // expect(issueEvent.mock.calls.map(c => c.args[2])).toEqual(
  //   [1, 2, 3, 4].map(t => ({
  //     type: '@auth',
  //     payload: { type: 'auth', t },
  //   }))
  // );

  expect(socket1.connect.mock).toHaveBeenCalledTimes(2);
  expect(socket2.connect.mock).toHaveBeenCalledTimes(2);

  const johnConn1 = {
    serverId,
    socketId: socket1.id,
    id: socket1.connect.mock.calls[0].args[0].connectionId,
    user: { john: 'doe' },
    tags: null,
  };
  const johnConn2 = {
    serverId,
    socketId: socket2.id,
    id: socket2.connect.mock.calls[0].args[0].connectionId,
    user: { john: 'doe' },
    tags: null,
  };
  const jojoConn1 = {
    serverId,
    socketId: socket1.id,
    id: socket1.connect.mock.calls[1].args[0].connectionId,
    user: { jojo: 'doe' },
    tags: null,
  };
  const jojoConn2 = {
    serverId,
    socketId: socket2.id,
    id: socket2.connect.mock.calls[1].args[0].connectionId,
    user: { jojo: 'doe' },
    tags: null,
  };

  socket1.emit('connect', { connectionId: johnConn1.id });
  socket2.emit('connect', { connectionId: johnConn2.id });
  socket1.emit('connect', { connectionId: jojoConn1.id });
  socket2.emit('connect', { connectionId: jojoConn2.id });
  await nextTick();

  expect(distributor.addLocalConnection.mock).toHaveBeenCalledTimes(4);
  expect(distributor.addLocalConnection.mock).toHaveBeenNthCalledWith(
    1,
    socket1,
    johnConn1
  );
  expect(distributor.addLocalConnection.mock).toHaveBeenNthCalledWith(
    2,
    socket2,
    johnConn2
  );
  expect(distributor.addLocalConnection.mock).toHaveBeenNthCalledWith(
    3,
    socket1,
    jojoConn1
  );
  expect(distributor.addLocalConnection.mock).toHaveBeenNthCalledWith(
    4,
    socket2,
    jojoConn2
  );

  const expectedRequest = {
    encrypted: false,
    headers: { foo: 'bar' },
    method: 'GET',
    url: '/hello',
  };

  expect(issueEvent.mock).toHaveBeenCalledTimes(8);
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    5,
    connectionScope(johnConn1),
    { john: 'doe' },
    { type: '@connect' },
    { source: 'websocket', request: expectedRequest, connection: johnConn1 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    6,
    connectionScope(johnConn2),
    { john: 'doe' },
    { type: '@connect' },
    { source: 'websocket', request: expectedRequest, connection: johnConn2 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    7,
    connectionScope(jojoConn1),
    { jojo: 'doe' },
    { type: '@connect' },
    { source: 'websocket', request: expectedRequest, connection: jojoConn1 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    8,
    connectionScope(jojoConn2),
    { jojo: 'doe' },
    { type: '@connect' },
    { source: 'websocket', request: expectedRequest, connection: jojoConn2 }
  );

  socket1.emit('event', { connectionId: johnConn1.id, type: 'a', payload: 1 });
  socket2.emit('event', { connectionId: johnConn2.id, type: 'b', payload: 2 });
  socket1.emit('event', { connectionId: jojoConn1.id, type: 'c', payload: 3 });
  socket2.emit('event', { connectionId: jojoConn2.id, type: 'd', payload: 4 });

  expect(issueEvent.mock).toHaveBeenCalledTimes(12);
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    9,
    connectionScope(johnConn1),
    { john: 'doe' },
    { type: 'a', payload: 1 },
    { source: 'websocket', request: expectedRequest, connection: johnConn1 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    10,
    connectionScope(johnConn2),
    { john: 'doe' },
    { type: 'b', payload: 2 },
    { source: 'websocket', request: expectedRequest, connection: johnConn2 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    11,
    connectionScope(jojoConn1),
    { jojo: 'doe' },
    { type: 'c', payload: 3 },
    { source: 'websocket', request: expectedRequest, connection: jojoConn1 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    12,
    connectionScope(jojoConn2),
    { jojo: 'doe' },
    { type: 'd', payload: 4 },
    { source: 'websocket', request: expectedRequest, connection: jojoConn2 }
  );

  socket1.emit('disconnect', { connectionId: johnConn1.id, reason: 'bye1' });
  socket2.emit('disconnect', { connectionId: jojoConn2.id, reason: 'bye2' });
  await nextTick();

  socket1.emit('disconnect', { connectionId: jojoConn1.id, reason: 'bye3' });
  socket2.emit('disconnect', { connectionId: johnConn2.id, reason: 'bye4' });
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(16);
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    13,
    connectionScope(johnConn1),
    { john: 'doe' },
    { type: '@disconnect', payload: { reason: 'bye1' } },
    { source: 'websocket', request: expectedRequest, connection: johnConn1 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    14,
    connectionScope(jojoConn2),
    { jojo: 'doe' },
    { type: '@disconnect', payload: { reason: 'bye2' } },
    { source: 'websocket', request: expectedRequest, connection: jojoConn2 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    15,
    connectionScope(jojoConn1),
    { jojo: 'doe' },
    { type: '@disconnect', payload: { reason: 'bye3' } },
    { source: 'websocket', request: expectedRequest, connection: jojoConn1 }
  );
  expect(issueEvent.mock).toHaveBeenNthCalledWith(
    16,
    connectionScope(johnConn2),
    { john: 'doe' },
    { type: '@disconnect', payload: { reason: 'bye4' } },
    { source: 'websocket', request: expectedRequest, connection: johnConn2 }
  );

  socket1.emit('close', 666, 'wth');
  socket2.emit('close', 666, 'wth');
  await nextTick();
});

it('set socket.request.encrypted to true if socket is encrypted', () => {
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  req.mock.getter('connection').fakeReturnValue({ encrypted: true });
  expect(receiver.handleUpgrade(req, netSocket, head)).toBe(undefined);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(expect.any(String), ws, {
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
    encrypted: true,
  });
});

it('generate uniq socket id', () => {
  const ids = new Set();
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  for (let i = 0; i < 500; i += 1) {
    receiver.handleUpgrade(req, netSocket, head);
    const socket = Socket.mock.calls[i].instance;

    expect(typeof socket.id).toBe('string');
    expect(ids.has(socket.id)).toBe(false);
    ids.add(socket.id);

    ws.removeAllListeners();
  }
});

it('generate uniq connection id', async () => {
  const ids = new Set();
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  receiver.handleUpgrade(req, netSocket, head);
  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});

  for (let i = 0; i < 500; i += 1) {
    socket.emit('register', { type: 'some_auth', hello: 'login' });
    await nextTick(); // eslint-disable-line no-await-in-loop

    expect(issueEvent.mock).toHaveBeenCalledTimes(i + 1);
    const { connection } = issueEvent.mock.calls[i].args[0];

    expect(connection.serverId).toBe(serverId);
    expect(connection.socketId).toBe(socket.id);
    expect(typeof connection.id).toBe('string');
    expect(ids.has(connection.id)).toBe(false);
    ids.add(connection.id);

    ws.removeAllListeners();
  }
});

it('verify upgrade if options.verifyUpgrade provided', () => {
  const verifyUpgrade = moxy(() => true);
  const receiver = new Receiver(serverId, webSocketServer, distributor, {
    verifyUpgrade,
  });
  receiver.bindIssuer(issueEvent, issueError);

  receiver.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
    encrypted: false,
  });

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledTimes(1);

  verifyUpgrade.mock.fakeReturnValue(false);

  receiver.handleUpgrade(req, netSocket, head);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledTimes(1);

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

it('reject register if auth rejected', async () => {
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  expect(receiver.handleUpgrade(req, netSocket, head)).toBe(undefined);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).not.toHaveBeenCalled();
  issueEvent.mock.fake(async () => ({
    accepted: false,
    reason: 'no no no',
  }));

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});
  socket.emit('register', { type: 'some_auth', hello: 'login' }, 11);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).not.toHaveBeenCalled();
  expect(socket.reject.mock).toHaveBeenCalledTimes(1);
  expect(socket.reject.mock).toHaveBeenCalledWith({
    req: 11,
    reason: 'no no no',
  });
});

it('reject register if auth thrown', async () => {
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  expect(receiver.handleUpgrade(req, netSocket, head)).toBe(undefined);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).not.toHaveBeenCalled();
  issueEvent.mock.fake(async () => {
    throw new Error('noooooo');
  });

  const socket = Socket.mock.calls[0].instance;
  socket.connect.mock.fake(async () => {});
  socket.emit('register', { type: 'some_auth', hello: 'login' }, 11);
  await nextTick();

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(socket.connect.mock).not.toHaveBeenCalled();
  expect(socket.reject.mock).toHaveBeenCalledTimes(1);
  expect(socket.reject.mock).toHaveBeenCalledWith({
    req: 11,
    reason: 'noooooo',
  });
});

it('issue socket error', () => {
  const receiver = new Receiver(serverId, webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  receiver.handleUpgrade(req, netSocket, head);
  issueEvent.mock.fakeOnce(async () => ({
    accepted: true,
    user: { john: 'doe' },
  }));

  const socket = Socket.mock.calls[0].instance;
  socket.emit('error', new Error("It's Bat Man!"));

  expect(issueError.mock).toHaveBeenCalledTimes(1);
  expect(issueError.mock).toHaveBeenCalledWith(new Error("It's Bat Man!"));
});
