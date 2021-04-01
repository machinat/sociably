import type Ws from 'ws';
import moxy from '@moxyjs/moxy';
import { EventEmitter } from 'events';
import Socket from '../socket';

const delay = (t) => new Promise((resolve) => setTimeout(resolve, t));

const connId = 'conn#id';

const _ws = new EventEmitter() as Ws;
_ws.readyState = 1;

const clientWs = moxy(_ws);
const serverWs = moxy(_ws);

let clientTimeoutId;
let serverTimeoutId;
let closeTimeoutId;

const _close = moxy((code, reason) => {
  clientWs.mock.getter('readyState').fakeReturnValue(2);
  serverWs.mock.getter('readyState').fakeReturnValue(2);

  closeTimeoutId = setTimeout(() => {
    clientWs.mock.getter('readyState').fakeReturnValue(3);
    serverWs.mock.getter('readyState').fakeReturnValue(3);
    clientWs.emit('close', code, reason);
    serverWs.emit('close', code, reason);
  }, 10);
});

clientWs.close = _close;
clientWs.send = moxy((msg, cb) => {
  cb();
  clientTimeoutId = setTimeout(() => serverWs.emit('message', msg), 10);
});

serverWs.close = _close;
serverWs.send = moxy((msg, cb) => {
  cb();
  serverTimeoutId = setTimeout(() => clientWs.emit('message', msg), 10);
});

const request = {
  method: 'GET',
  url: './hello',
  headers: { foo: 'bar' },
};

let clientSocket: Socket;
let serverSocket: Socket;

beforeEach(() => {
  clearTimeout(clientTimeoutId);
  clearTimeout(serverTimeoutId);
  clearTimeout(closeTimeoutId);

  clientWs.mock.reset();
  clientWs.removeAllListeners();
  clientWs.send.mock.reset();
  clientWs.close.mock.reset();

  serverWs.mock.reset();
  serverWs.removeAllListeners();
  serverWs.send.mock.reset();
  serverWs.close.mock.reset();

  clientSocket = new Socket(clientWs);
  serverSocket = new Socket(serverWs, request);
});

afterEach(() => {
  clientWs.emit('close');
  serverWs.emit('close');
});

it('construct with request info', () => {
  expect(serverSocket.request).toBe(request);
  expect(serverSocket.isClient).toBe(false);
});

it('construct without request info', () => {
  expect(clientSocket.request).toBe(null);
  expect(clientSocket.isClient).toBe(true);
});

it('propagate "open" event', () => {
  const ws = new EventEmitter() as Ws;
  const socket = new Socket(ws);

  const openSpy = moxy();
  socket.on('open', openSpy);

  ws.emit('open');
  expect(openSpy.mock).toHaveBeenCalledTimes(1);
  expect(openSpy.mock).toHaveBeenCalledWith(socket);
});

it('propagate "error" event', () => {
  const ws = new EventEmitter() as Ws;
  const socket = new Socket(ws);

  const errorSpy = moxy();
  socket.on('error', errorSpy);

  const err = new Error('bad!');
  ws.emit('error', err);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock).toHaveBeenCalledWith(err, socket);
});

describe('login', () => {
  test('login in from client work', async () => {
    const singInSpy = moxy();
    serverSocket.on('login', singInSpy);

    await clientSocket.login({ credential: '***' });

    await delay(50);

    expect(singInSpy.mock).toHaveBeenCalledTimes(1);
    expect(singInSpy.mock).toHaveBeenCalledWith(
      { credential: '***' },
      expect.any(Number),
      serverSocket
    );

    const seq = singInSpy.mock.calls[0].args[1];
    expect(clientWs.send.mock).toHaveBeenCalledWith(
      JSON.stringify(['login', seq, { credential: '***' }]),
      expect.any(Function)
    );
  });

  it('throws if the socket is not ready', async () => {
    clientWs.mock.getter('readyState').fakeReturnValue(0);
    await expect(
      clientSocket.login({ credential: '***' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"socket is not ready"`);
  });

  it('throws when register on server side', async () => {
    await expect(
      serverSocket.login({ credential: '***' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"can't sign in on server side"`
    );
  });

  test('client reject if register frame received', async () => {
    clientWs.emit('message', JSON.stringify(['login', 1, { type: 'test' }]));

    await delay(50);

    expect(clientWs.send.mock).toHaveBeenCalledTimes(1);

    const [frame, , body] = JSON.parse(clientWs.send.mock.calls[0].args[0]);
    expect(frame).toBe('reject');
    expect(body).toMatchInlineSnapshot(`
      Object {
        "reason": "can't sign in to client",
        "seq": 1,
      }
    `);
  });
});

describe('connecting handshake', () => {
  const clientConnectSpy = moxy();
  const clientFailSpy = moxy();
  const serverConnectSpy = moxy();
  const serverFailSpy = moxy();

  beforeEach(() => {
    clientConnectSpy.mock.clear();
    clientFailSpy.mock.clear();
    serverConnectSpy.mock.clear();
    serverFailSpy.mock.clear();
    clientSocket.on('connect', clientConnectSpy);
    clientSocket.on('connect_fail', clientFailSpy);
    serverSocket.on('connect', serverConnectSpy);
    serverSocket.on('connect_fail', serverFailSpy);
  });

  test('handshake starting from server finished ok', async () => {
    const seq = await serverSocket.connect({ connId, seq: 1 });
    expect(serverSocket.isConnecting(connId)).toBe(true);
    expect(serverSocket.isConnected(connId)).toBe(false);

    await delay(50);

    expect(clientSocket.isConnected(connId)).toBe(true);
    expect(clientSocket.isConnecting(connId)).toBe(false);
    expect(serverSocket.isConnected(connId)).toBe(true);
    expect(serverSocket.isConnecting(connId)).toBe(false);

    expect(serverConnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverConnectSpy.mock).toHaveBeenCalledWith(
      { seq, connId },
      expect.any(Number),
      serverSocket
    );

    expect(clientConnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientConnectSpy.mock).toHaveBeenCalledWith(
      { connId, seq: 1 },
      expect.any(Number),
      clientSocket
    );

    expect(serverWs.send.mock).toHaveBeenCalledTimes(1);
    const serverPacket = JSON.parse(serverWs.send.mock.calls[0].args[0]);
    expect(serverPacket[0]).toBe('connect');
    expect(typeof serverPacket[1]).toBe('number');
    expect(serverPacket[2]).toEqual({ connId, seq: 1 });

    expect(clientWs.send.mock).toHaveBeenCalledTimes(1);
    const clientPacket = JSON.parse(clientWs.send.mock.calls[0].args[0]);
    expect(clientPacket[0]).toBe('connect');
    expect(typeof clientPacket[1]).toBe('number');
    expect(clientPacket[2]).toEqual({ seq, connId });

    expect(serverFailSpy.mock).not.toHaveBeenCalled();
    expect(clientFailSpy.mock).not.toHaveBeenCalled();
  });

  test('server respond disconnect if connect initiated by client', async () => {
    const seq = await clientSocket.connect({ connId, seq: 1 });
    await delay(50);

    expect(clientSocket.isConnected(connId)).toBe(false);
    expect(clientSocket.isConnecting(connId)).toBe(false);
    expect(serverSocket.isConnected(connId)).toBe(false);
    expect(serverSocket.isConnecting(connId)).toBe(false);

    expect(clientFailSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientFailSpy.mock).toHaveBeenCalledWith(
      { connId, seq, reason: expect.any(String) },
      expect.any(Number),
      clientSocket
    );
    expect(clientFailSpy.mock.calls[0].args[0].reason).toMatchInlineSnapshot(
      `"initiate connect handshake from client is not allowed"`
    );

    expect(serverFailSpy.mock).not.toHaveBeenCalled();
    expect(serverConnectSpy.mock).not.toHaveBeenCalled();
    expect(clientConnectSpy.mock).not.toHaveBeenCalled();
  });

  test('connect then disconnect immediatly', async () => {
    const clientDisconnectSpy = moxy();
    clientSocket.on('disconnect', clientDisconnectSpy);

    const connectReq = await serverSocket.connect({ connId, seq: 1 });
    const disconnectReq = await serverSocket.disconnect({
      connId,
      reason: 'sorry! wrong number',
    });

    expect(serverSocket.isConnecting(connId)).toBe(true);
    expect(serverSocket.isDisconnecting(connId)).toBe(true);

    await delay(50);

    expect(clientSocket.isConnected(connId)).toBe(false);
    expect(clientSocket.isConnecting(connId)).toBe(false);
    expect(serverSocket.isConnected(connId)).toBe(false);
    expect(serverSocket.isConnecting(connId)).toBe(false);

    expect(serverConnectSpy.mock).not.toHaveBeenCalled();
    expect(serverFailSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverFailSpy.mock).toHaveBeenCalledWith(
      { connId, reason: 'echo', seq: disconnectReq },
      expect.any(Number),
      serverSocket
    );

    expect(clientFailSpy.mock).not.toHaveBeenCalled();
    expect(clientConnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientConnectSpy.mock).toHaveBeenCalledWith(
      { connId, seq: 1 },
      connectReq,
      clientSocket
    );

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId, reason: 'sorry! wrong number' },
      disconnectReq,
      clientSocket
    );
  });

  it('throw if the socket is not ready', async () => {
    serverWs.mock.getter('readyState').fakeReturnValue(0);
    await expect(
      serverSocket.connect({ connId, seq: 1 })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"socket is not ready"`);
  });

  it('throw if already connected', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);
    await expect(
      serverSocket.connect({ connId, seq: 1 })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"connection [conn#id] is already connected"`
    );
  });
});

describe('disconnect handshake', () => {
  const clientDisconnectSpy = moxy();
  const serverDisconnectSpy = moxy();

  beforeEach(() => {
    clientDisconnectSpy.mock.reset();
    serverDisconnectSpy.mock.reset();
    clientSocket.on('disconnect', clientDisconnectSpy);
    serverSocket.on('disconnect', serverDisconnectSpy);
  });

  it('finish handshake when initiated by server', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);

    expect(serverSocket.isConnected(connId)).toBe(true);
    expect(clientSocket.isConnected(connId)).toBe(true);

    const seq = await serverSocket.disconnect({ connId, reason: 'bye!' });
    await delay(50);

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId, reason: 'bye!' },
      seq,
      clientSocket
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { seq, connId, reason: 'echo' },
      expect.any(Number),
      serverSocket
    );
  });

  it('finish handshake when initiated by client', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);

    expect(serverSocket.isConnected(connId)).toBe(true);
    expect(clientSocket.isConnected(connId)).toBe(true);

    const seq = await clientSocket.disconnect({ connId, reason: 'bye!' });
    await delay(50);

    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId, reason: 'bye!' },
      seq,
      serverSocket
    );
    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { seq, connId, reason: 'echo' },
      expect.any(Number),
      clientSocket
    );
  });

  it('throw if not connected', async () => {
    await expect(
      clientSocket.disconnect({ connId, reason: 'bye!' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"connection [conn#id] not existed or already disconnected"`
    );
  });

  it('do nothing if disconnect handshake alreay initiated', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);

    expect(serverSocket.isConnected(connId)).toBe(true);
    expect(clientSocket.isConnected(connId)).toBe(true);

    const seq = await serverSocket.disconnect({ connId, reason: 'bye' });
    await expect(
      serverSocket.disconnect({ connId, reason: 'bye2' })
    ).resolves.toBe(undefined);
    await delay(50);

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId, reason: 'bye' },
      seq,
      clientSocket
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { seq, connId, reason: 'echo' },
      expect.any(Number),
      serverSocket
    );
  });
});

describe('dispatch events', () => {
  const eventsBody = {
    connId,
    values: [
      { type: 'foo', category: 'bar', payload: 'baz' },
      { type: 'foo', category: 'bar', payload: 'baz' },
    ],
  };
  const serverDispatchSpy = moxy();
  const clientDispatchSpy = moxy();

  beforeEach(() => {
    serverDispatchSpy.mock.clear();
    clientDispatchSpy.mock.clear();
    serverSocket.on('events', serverDispatchSpy);
    clientSocket.on('events', clientDispatchSpy);
  });

  test('send events from client to server', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);

    const seq = await clientSocket.dispatch(eventsBody);
    await delay(50);

    expect(serverDispatchSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDispatchSpy.mock).toHaveBeenCalledWith(
      eventsBody,
      seq,
      serverSocket
    );

    expect(clientDispatchSpy.mock).not.toHaveBeenCalled();

    expect(clientWs.send.mock).toHaveBeenCalledTimes(2); // connect & event
    const packet = JSON.parse(clientWs.send.mock.calls[1].args[0]);

    expect(packet[0]).toBe('events');
    expect(typeof packet[1]).toBe('number');
    expect(packet[2]).toEqual(eventsBody);
  });

  test('send event from server to client', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);

    const seq = await serverSocket.dispatch(eventsBody);
    await delay(50);

    expect(clientDispatchSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDispatchSpy.mock).toHaveBeenCalledWith(
      eventsBody,
      seq,
      clientSocket
    );

    expect(serverDispatchSpy.mock).not.toHaveBeenCalled();

    expect(serverWs.send.mock).toHaveBeenCalledTimes(2); // connect & event
    const packet = JSON.parse(serverWs.send.mock.calls[1].args[0]);

    expect(packet[0]).toBe('events');
    expect(typeof packet[1]).toBe('number');
    expect(packet[2]).toEqual(eventsBody);
  });

  it('throw if not connected', async () => {
    expect(serverSocket.isConnected(connId)).toBe(false);
    await expect(
      serverSocket.dispatch(eventsBody)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"connection [conn#id] is not connected"`
    );
  });

  it('throw when connecting', async () => {
    await serverSocket.connect({ connId, seq: 1 });
    expect(serverSocket.isConnecting(connId)).toBe(true);

    await expect(
      serverSocket.dispatch(eventsBody)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"connection [conn#id] is not connected"`
    );
  });

  it('throw when connecting', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);
    await serverSocket.disconnect({ connId });
    expect(serverSocket.isDisconnecting(connId)).toBe(true);

    await expect(
      serverSocket.dispatch(eventsBody)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"connection [conn#id] is not connected"`
    );
  });
});

describe('reject', () => {
  const clientRejectSpy = moxy();
  const serverRejectSpy = moxy();

  beforeEach(() => {
    clientSocket.on('reject', clientRejectSpy);
    serverSocket.on('reject', serverRejectSpy);

    clientRejectSpy.mock.clear();
    serverRejectSpy.mock.clear();
  });

  test('propagate "reject" event', async () => {
    serverSocket.connect({ connId, seq: 1 });
    await delay(50);

    const seq1 = await serverSocket.reject({ seq: 2, reason: 'foo' });
    const seq2 = await clientSocket.reject({ seq: 3, reason: 'bar' });

    await delay(50);

    expect(clientRejectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientRejectSpy.mock).toHaveBeenCalledWith(
      { seq: 2, reason: 'foo' },
      seq1,
      clientSocket
    );

    expect(serverRejectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverRejectSpy.mock).toHaveBeenCalledWith(
      { seq: 3, reason: 'bar' },
      seq2,
      serverSocket
    );
  });
});

describe('closing', () => {
  const serverCloseSpy = moxy();
  const clientCloseSpy = moxy();

  beforeEach(() => {
    clientCloseSpy.mock.clear();
    serverCloseSpy.mock.clear();
    clientSocket.on('close', clientCloseSpy);
    serverSocket.on('close', serverCloseSpy);
  });

  test('close from server', async () => {
    expect(serverSocket.close(888, 'Bye!')).toBe(undefined);
    await delay(50);

    expect(serverCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverCloseSpy.mock).toHaveBeenCalledWith(888, 'Bye!', serverSocket);
    expect(clientCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientCloseSpy.mock).toHaveBeenCalledWith(888, 'Bye!', clientSocket);
  });

  test('close from client', async () => {
    expect(clientSocket.close(888, 'Bye!')).toBe(undefined);
    await delay(50);

    expect(serverCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverCloseSpy.mock).toHaveBeenCalledWith(888, 'Bye!', serverSocket);
    expect(clientCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientCloseSpy.mock).toHaveBeenCalledWith(888, 'Bye!', clientSocket);
  });

  it('emit disconnect of connected channel', async () => {
    const serverDisconnectSpy = moxy();
    const clientDisconnectSpy = moxy();
    serverSocket.on('disconnect', serverDisconnectSpy);
    clientSocket.on('disconnect', clientDisconnectSpy);

    serverSocket.connect({ connId: 'conn#1', seq: 2 });
    serverSocket.connect({ connId: 'conn#2', seq: 3 });
    await delay(50);

    expect(clientSocket.close(888, 'Bye!')).toBe(undefined);
    await delay(50);

    expect(serverCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverCloseSpy.mock).toHaveBeenCalledWith(888, 'Bye!', serverSocket);
    expect(clientCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientCloseSpy.mock).toHaveBeenCalledWith(888, 'Bye!', clientSocket);

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(2);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId: 'conn#1', reason: 'Bye!' },
      undefined,
      clientSocket
    );
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId: 'conn#2', reason: 'Bye!' },
      undefined,
      clientSocket
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(2);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId: 'conn#1', reason: 'Bye!' },
      undefined,
      serverSocket
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { connId: 'conn#2', reason: 'Bye!' },
      undefined,
      serverSocket
    );
  });
});
