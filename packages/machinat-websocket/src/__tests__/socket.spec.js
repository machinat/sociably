import moxy from 'moxy';
import EventEmitter from 'events';
import Socket from '../socket';

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const uid = 'my:channel:_type_:_subtype_';

const _ws = new EventEmitter();
_ws.readyState = 1;

const moxyOpts = { includeProps: ['emit'] };
const clientWS = moxy(_ws, moxyOpts);
const serverWS = moxy(_ws, moxyOpts);

let clientTimeoutId;
let serverTimeoutId;
let closeTimeoutId;

const _close = moxy((code, reason) => {
  clientWS.mock.getter('readyState').fakeReturnValue(2);
  serverWS.mock.getter('readyState').fakeReturnValue(2);
  closeTimeoutId = setTimeout(() => {
    clientWS.mock.getter('readyState').fakeReturnValue(3);
    serverWS.mock.getter('readyState').fakeReturnValue(3);
    clientWS.emit('close', code, reason);
    serverWS.emit('close', code, reason);
  }, 10);
});

clientWS.close = _close;
clientWS.send = moxy((msg, cb) => {
  cb();
  clientTimeoutId = setTimeout(() => serverWS.emit('message', msg), 10);
});

serverWS.close = _close;
serverWS.send = moxy((msg, cb) => {
  cb();
  serverTimeoutId = setTimeout(() => clientWS.emit('message', msg), 10);
});

const request = {
  method: 'GET',
  url: './hello',
  headers: { foo: 'bar' },
};

let clientSocket;
let serverSocket;

beforeEach(() => {
  clearTimeout(clientTimeoutId);
  clearTimeout(serverTimeoutId);
  clearTimeout(closeTimeoutId);

  clientWS.mock.reset();
  clientWS.removeAllListeners();
  clientWS.send.mock.reset();
  clientWS.close.mock.reset();

  serverWS.mock.reset();
  serverWS.removeAllListeners();
  serverWS.send.mock.reset();
  serverWS.close.mock.reset();

  clientSocket = new Socket(clientWS, '_id_');
  serverSocket = new Socket(serverWS, '_id_', request);
});

it('init basic props at client side (with reqest)', () => {
  expect(serverSocket.id).toBe('_id_');
  expect(serverSocket.request).toBe(request);
  expect(serverSocket.isClient).toBe(false);
});

it('init basic props at client side (without reqest)', () => {
  expect(clientSocket.id).toBe('_id_');
  expect(clientSocket.request).toBe(undefined);
  expect(clientSocket.isClient).toBe(true);
});

it('add ws listeners', () => {
  const ws = moxy(new EventEmitter());
  const socket = new Socket(ws, '_id_'); // eslint-disable-line no-unused-vars

  expect(ws.on.mock).toHaveBeenCalledWith('open', expect.any(Function));
  expect(ws.on.mock).toHaveBeenCalledWith('close', expect.any(Function));
  expect(ws.on.mock).toHaveBeenCalledWith('message', expect.any(Function));
  expect(ws.on.mock).toHaveBeenCalledWith('error', expect.any(Function));
});

it('propagate "open" event', () => {
  const ws = moxy(new EventEmitter());
  const socket = new Socket(ws, '_id_');

  const openSpy = moxy();
  socket.on('open', openSpy);

  ws.emit('open');
  expect(openSpy.mock).toHaveBeenCalledTimes(1);
  expect(openSpy.mock).toHaveBeenCalledWith();
});

it('propagate "error" event', () => {
  const ws = moxy(new EventEmitter());
  const socket = new Socket(ws, '_id_');

  const errorSpy = moxy();
  socket.on('error', errorSpy);

  const err = new Error('bad!');
  ws.emit('error', err);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock).toHaveBeenCalledWith(err);
});

describe('registration', () => {
  test('register from client work', async () => {
    const registerSpy = moxy();
    serverSocket.on('register', registerSpy);

    await clientSocket.register({ type: 'test' });

    await delay(100);

    expect(registerSpy.mock).toHaveBeenCalledTimes(1);
    expect(registerSpy.mock).toHaveBeenCalledWith(
      { type: 'test' },
      expect.any(Number)
    );

    const seq = registerSpy.mock.calls[0].args[1];
    expect(clientWS.send.mock).toHaveBeenCalledWith(
      JSON.stringify(['register', seq, { type: 'test' }]),
      expect.any(Function)
    );
  });

  it('throws if the socket is not ready', async () => {
    clientWS.mock.getter('readyState').fakeReturnValue(0);
    await expect(
      clientSocket.register({ type: 'test' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"socket is not ready"`);
  });

  it('throws when register on server side', async () => {
    await expect(
      serverSocket.register({ type: 'test' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"can't register on server side"`
    );
  });

  test('client reject if register frame received', async () => {
    clientWS.emit('message', JSON.stringify(['register', 1, { type: 'test' }]));

    await delay(100);

    expect(clientWS.send.mock).toHaveBeenCalledTimes(1);

    const [frame, , body] = JSON.parse(clientWS.send.mock.calls[0].args[0]);
    expect(frame).toBe('reject');
    expect(body.req).toBe(1);
    expect(body.reason).toMatchInlineSnapshot(`"can't register to client"`);
  });
});

describe('connecting handshake', () => {
  const info = { hello: 'world' };

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
    const req = await serverSocket.connect({ uid, info });
    expect(serverSocket.isConnectingTo(uid)).toBe(true);
    expect(serverSocket.isConnectedTo(uid)).toBe(false);

    await delay(100);

    expect(clientSocket.isConnectedTo(uid)).toBe(true);
    expect(clientSocket.isConnectingTo(uid)).toBe(false);
    expect(serverSocket.isConnectedTo(uid)).toBe(true);
    expect(serverSocket.isConnectingTo(uid)).toBe(false);

    expect(serverConnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverConnectSpy.mock).toHaveBeenCalledWith(
      { req, uid },
      expect.any(Number)
    );

    expect(clientConnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientConnectSpy.mock).toHaveBeenCalledWith(
      { uid, info },
      expect.any(Number)
    );

    expect(serverWS.send.mock).toHaveBeenCalledTimes(1);
    const serverPacket = JSON.parse(serverWS.send.mock.calls[0].args[0]);
    expect(serverPacket[0]).toBe('connect');
    expect(typeof serverPacket[1]).toBe('number');
    expect(serverPacket[2]).toEqual({ uid, info });

    expect(clientWS.send.mock).toHaveBeenCalledTimes(1);
    const clientPacket = JSON.parse(clientWS.send.mock.calls[0].args[0]);
    expect(clientPacket[0]).toBe('connect');
    expect(typeof clientPacket[1]).toBe('number');
    expect(clientPacket[2]).toEqual({ req, uid });

    expect(serverFailSpy.mock).not.toHaveBeenCalled();
    expect(clientFailSpy.mock).not.toHaveBeenCalled();
  });

  test('server respond disconnect if connect initiated by client', async () => {
    const req = await clientSocket.connect({ uid, info });
    await delay(100);

    expect(clientSocket.isConnectedTo(uid)).toBe(false);
    expect(clientSocket.isConnectingTo(uid)).toBe(false);
    expect(serverSocket.isConnectedTo(uid)).toBe(false);
    expect(serverSocket.isConnectingTo(uid)).toBe(false);

    expect(clientFailSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientFailSpy.mock).toHaveBeenCalledWith(
      { uid, req, reason: expect.any(String) },
      expect.any(Number)
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

    const connectReq = await serverSocket.connect({ uid, info });
    const disconnectReq = await serverSocket.disconnect({
      uid,
      reason: 'sorry! wrong number',
    });

    expect(serverSocket.isConnectingTo(uid)).toBe(true);
    expect(serverSocket.isDisconnectingTo(uid)).toBe(true);

    await delay(100);

    expect(clientSocket.isConnectedTo(uid)).toBe(false);
    expect(clientSocket.isConnectingTo(uid)).toBe(false);
    expect(serverSocket.isConnectedTo(uid)).toBe(false);
    expect(serverSocket.isConnectingTo(uid)).toBe(false);

    expect(serverConnectSpy.mock).not.toHaveBeenCalled();
    expect(serverFailSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverFailSpy.mock).toHaveBeenCalledWith(
      { uid, reason: 'echo', req: disconnectReq },
      expect.any(Number)
    );

    expect(clientFailSpy.mock).not.toHaveBeenCalled();
    expect(clientConnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientConnectSpy.mock).toHaveBeenCalledWith(
      { uid, info },
      connectReq
    );

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid, reason: 'sorry! wrong number' },
      disconnectReq
    );
  });

  it('throw if the socket is not ready', async () => {
    serverWS.mock.getter('readyState').fakeReturnValue(0);
    await expect(
      serverSocket.connect({ uid, info })
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"socket is not ready"`);
  });

  it('throw if already connected', async () => {
    serverSocket.connect({ uid });
    await delay(100);
    await expect(
      serverSocket.connect({ uid, info })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"channel [my:channel:_type_:_subtype_] is already connected"`
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
    serverSocket.connect({ uid });
    await delay(100);

    expect(serverSocket.isConnectedTo(uid)).toBe(true);
    expect(clientSocket.isConnectedTo(uid)).toBe(true);

    const req = await serverSocket.disconnect({ uid, reason: 'bye!' });
    await delay(100);

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid, reason: 'bye!' },
      req
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { req, uid, reason: 'echo' },
      expect.any(Number)
    );
  });

  it('finish handshake when initiated by client', async () => {
    serverSocket.connect({ uid });
    await delay(100);

    expect(serverSocket.isConnectedTo(uid)).toBe(true);
    expect(clientSocket.isConnectedTo(uid)).toBe(true);

    const req = await clientSocket.disconnect({ uid, reason: 'bye!' });
    await delay(100);

    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid, reason: 'bye!' },
      req
    );
    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { req, uid, reason: 'echo' },
      expect.any(Number)
    );
  });

  it('throw if not connected', async () => {
    await expect(
      clientSocket.disconnect({ uid, reason: 'bye!' })
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"socket is not connected to channel [my:channel:_type_:_subtype_]"`
    );
  });

  it('do nothing if disconnect handshake alreay initiated', async () => {
    serverSocket.connect({ uid });
    await delay(100);

    expect(serverSocket.isConnectedTo(uid)).toBe(true);
    expect(clientSocket.isConnectedTo(uid)).toBe(true);

    const req = await serverSocket.disconnect({ uid, reason: 'bye' });
    await expect(
      serverSocket.disconnect({ uid, reason: 'bye2' })
    ).resolves.toBe(undefined);
    await delay(100);

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid, reason: 'bye' },
      req
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { req, uid, reason: 'echo' },
      expect.any(Number)
    );
  });
});

describe('sending event', () => {
  const eventBody = { uid, type: 'foo', subtype: 'bar', payload: 'baz' };
  const serverEventSpy = moxy();
  const clientEventSpy = moxy();

  beforeEach(() => {
    serverEventSpy.mock.clear();
    clientEventSpy.mock.clear();
    serverSocket.on('event', serverEventSpy);
    clientSocket.on('event', clientEventSpy);
  });

  test('send event from client to server', async () => {
    serverSocket.connect({ uid });
    await delay(100);

    const seq = await clientSocket.event(eventBody);
    await delay(50);

    expect(serverEventSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverEventSpy.mock).toHaveBeenCalledWith(eventBody, seq);

    expect(clientEventSpy.mock).not.toHaveBeenCalled();

    expect(clientWS.send.mock).toHaveBeenCalledTimes(2); // connect & event
    const packet = JSON.parse(clientWS.send.mock.calls[1].args[0]);

    expect(packet[0]).toBe('event');
    expect(typeof packet[1]).toBe('number');
    expect(packet[2]).toEqual(eventBody);
  });

  test('send event from server to client', async () => {
    serverSocket.connect({ uid });
    await delay(100);

    const seq = await serverSocket.event(eventBody);
    await delay(50);

    expect(clientEventSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientEventSpy.mock).toHaveBeenCalledWith(eventBody, seq);

    expect(serverEventSpy.mock).not.toHaveBeenCalled();

    expect(serverWS.send.mock).toHaveBeenCalledTimes(2); // connect & event
    const packet = JSON.parse(serverWS.send.mock.calls[1].args[0]);

    expect(packet[0]).toBe('event');
    expect(typeof packet[1]).toBe('number');
    expect(packet[2]).toEqual(eventBody);
  });

  it('throw if not connected', async () => {
    expect(serverSocket.isConnectedTo(uid)).toBe(false);
    await expect(
      serverSocket.event(eventBody)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"channel [my:channel:_type_:_subtype_] is not connected"`
    );
  });

  it('throw when connecting', async () => {
    await serverSocket.connect({ uid });
    expect(serverSocket.isConnectingTo(uid)).toBe(true);

    await expect(
      serverSocket.event(eventBody)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"channel [my:channel:_type_:_subtype_] is not connected"`
    );
  });

  it('throw when connecting', async () => {
    serverSocket.connect({ uid });
    await delay(100);
    await serverSocket.disconnect({ uid });
    expect(serverSocket.isDisconnectingTo(uid)).toBe(true);

    await expect(
      serverSocket.event(eventBody)
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"channel [my:channel:_type_:_subtype_] is not connected"`
    );
  });
});

describe('reject and answer', () => {
  const clientRejectSpy = moxy();
  const clientAnswerSpy = moxy();
  const serverRejectSpy = moxy();
  const serverAnswerSpy = moxy();

  beforeEach(() => {
    clientSocket.on('reject', clientRejectSpy);
    serverSocket.on('reject', serverRejectSpy);
    clientSocket.on('answer', clientAnswerSpy);
    serverSocket.on('answer', serverAnswerSpy);
    clientRejectSpy.mock.clear();
    clientAnswerSpy.mock.clear();
    serverRejectSpy.mock.clear();
    serverAnswerSpy.mock.clear();
  });

  test('propagate "reject" event', async () => {
    serverSocket.connect({ uid });
    await delay(100);

    const seq1 = await serverSocket.reject({ req: 1, reason: 'foo' });
    const seq2 = await clientSocket.reject({ req: 2, reason: 'bar' });

    await delay(100);

    expect(clientRejectSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientRejectSpy.mock).toHaveBeenCalledWith(
      { req: 1, reason: 'foo' },
      seq1
    );

    expect(serverRejectSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverRejectSpy.mock).toHaveBeenCalledWith(
      { req: 2, reason: 'bar' },
      seq2
    );
  });

  test('propagate "answer" event', async () => {
    serverSocket.connect({ uid });
    await delay(100);

    const seq1 = await serverSocket.answer({ req: 1, payload: 'foo' });
    const seq2 = await clientSocket.answer({ req: 2, payload: 'bar' });

    await delay(100);

    expect(clientAnswerSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientAnswerSpy.mock).toHaveBeenCalledWith(
      { req: 1, payload: 'foo' },
      seq1
    );

    expect(serverAnswerSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverAnswerSpy.mock).toHaveBeenCalledWith(
      { req: 2, payload: 'bar' },
      seq2
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
    expect(serverSocket.close(666, 'Die!')).toBe(undefined);
    await delay(100);

    expect(serverCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverCloseSpy.mock).toHaveBeenCalledWith(666, 'Die!');
    expect(clientCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientCloseSpy.mock).toHaveBeenCalledWith(666, 'Die!');
  });

  test('close from client', async () => {
    expect(clientSocket.close(666, 'Die!')).toBe(undefined);
    await delay(100);

    expect(serverCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverCloseSpy.mock).toHaveBeenCalledWith(666, 'Die!');
    expect(clientCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientCloseSpy.mock).toHaveBeenCalledWith(666, 'Die!');
  });

  it('emit disconnect of connected channel', async () => {
    const serverDisconnectSpy = moxy();
    const clientDisconnectSpy = moxy();
    serverSocket.on('disconnect', serverDisconnectSpy);
    clientSocket.on('disconnect', clientDisconnectSpy);

    serverSocket.connect({ uid: 'my:channel:foo' });
    serverSocket.connect({ uid: 'my:channel:bar' });
    await delay(100);

    expect(clientSocket.close(666, 'Die!')).toBe(undefined);
    await delay(100);

    expect(serverCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(serverCloseSpy.mock).toHaveBeenCalledWith(666, 'Die!');
    expect(clientCloseSpy.mock).toHaveBeenCalledTimes(1);
    expect(clientCloseSpy.mock).toHaveBeenCalledWith(666, 'Die!');

    expect(clientDisconnectSpy.mock).toHaveBeenCalledTimes(2);
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid: 'my:channel:foo', reason: 'Die!' },
      undefined
    );
    expect(clientDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid: 'my:channel:bar', reason: 'Die!' },
      undefined
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledTimes(2);
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid: 'my:channel:foo', reason: 'Die!' },
      undefined
    );
    expect(serverDisconnectSpy.mock).toHaveBeenCalledWith(
      { uid: 'my:channel:bar', reason: 'Die!' },
      undefined
    );
  });
});
