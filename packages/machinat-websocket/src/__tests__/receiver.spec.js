import { IncomingMessage } from 'http';
import { BaseReceiver } from 'machinat-base';
import WS from 'ws';
import moxy from 'moxy';
import Distributor from '../distributor';
import Socket from '../socket';
import Receiver from '../receiver';
import Channel from '../channel';

const distributor = moxy(new Distributor());
distributor.consignSocket.mock.fake(() => true);

const ws = new WS(/* I'm mocked */);
const webSocketServer = moxy({
  handleUpgrade(req, skt, head, callback) {
    callback(ws);
  },
});

const req = moxy(new IncomingMessage());
req.mock.getter('method').fakeReturnValue('GET');
req.mock.getter('url').fakeReturnValue('/hello');
req.mock.getter('headers').fakeReturnValue({ foo: 'bar' });

const netSocket = moxy({
  write() {},
  destroy() {},
});

const head = '_';

const issueEvent = moxy(() => Promise.resolve());
const issueError = moxy();

beforeEach(() => {
  distributor.removeAllListeners();
  distributor.mock.clear();
  webSocketServer.mock.clear();
  netSocket.mock.clear();
  req.mock.clear();
  issueEvent.mock.reset();
  issueError.mock.reset();
});

it('extends BaseReceiver', () => {
  expect(new Receiver(webSocketServer, distributor, {})).toBeInstanceOf(
    BaseReceiver
  );
});

it('handle upgrade and pass Socket to distributor', () => {
  const receiver = new Receiver(webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  expect(receiver.handleUpgrade(req, netSocket, head)).toBe(undefined);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledWith(
    req,
    netSocket,
    head,
    expect.any(Function)
  );

  expect(distributor.consignSocket.mock).toHaveBeenCalledTimes(1);
  const socket = distributor.consignSocket.mock.calls[0].args[0];
  expect(socket).toBeInstanceOf(Socket);
  expect(socket.request).toEqual({
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
  });
  expect(typeof socket.id).toBe('string');

  expect(ws.on.mock).toHaveBeenCalled();
});

it('generate uniq socket id', () => {
  const ids = new Set();
  const receiver = new Receiver(webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  for (let i = 0; i < 500; i += 1) {
    receiver.handleUpgrade(req, netSocket, head);
    const socket = distributor.consignSocket.mock.calls[i].args[0];
    expect(typeof socket.id).toBe('string');
    expect(ids.has(socket.id)).toBe(false);
    ids.add(socket.id);
  }
});

it('verify upgrade if options.verifyUpgrade provided', () => {
  const verifyUpgrade = moxy(() => true);
  const receiver = new Receiver(webSocketServer, distributor, {
    verifyUpgrade,
  });
  receiver.bindIssuer(issueEvent, issueError);

  receiver.handleUpgrade(req, netSocket, head);

  expect(verifyUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(verifyUpgrade.mock).toHaveBeenCalledWith({
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
  });

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(distributor.consignSocket.mock).toHaveBeenCalledTimes(1);

  verifyUpgrade.mock.fakeReturnValue(false);

  receiver.handleUpgrade(req, netSocket, head);

  expect(webSocketServer.handleUpgrade.mock).toHaveBeenCalledTimes(1);
  expect(distributor.consignSocket.mock).toHaveBeenCalledTimes(1);

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

describe('authenticating registration', () => {
  const request = {
    method: 'GET',
    url: '/hello',
    headers: { foo: 'bar' },
  };
  const socket = new Socket(new WS(/* mocked */), '_id_', request);

  it('call Distributor#setAuthenticator()', () => {
    const receiver = new Receiver(webSocketServer, distributor, {});
    receiver.bindIssuer(issueEvent, issueError);

    expect(distributor.setAuthenticator.mock).toHaveBeenCalledTimes(1);
    expect(distributor.setAuthenticator.mock).toHaveBeenCalledWith(
      expect.any(Function)
    );
  });

  it('pass "@register" event and handle auth response', async () => {
    const receiver = new Receiver(webSocketServer, distributor, {});
    receiver.bindIssuer(issueEvent, issueError);
    const authenticator = distributor.setAuthenticator.mock.calls[0].args[0];

    await expect(authenticator(socket, { type: 'test' })).resolves
      .toMatchInlineSnapshot(`
Object {
  "accepted": false,
  "reason": "no registration middleware",
}
`);
    expect(issueEvent.mock).toHaveBeenCalledTimes(1);
    expect(issueEvent.mock).toHaveBeenCalledWith(
      new Channel('@socket', undefined, socket.id),
      { type: '@register', payload: { type: 'test' } },
      { source: 'websocket', socketId: socket.id, request }
    );
  });

  test('auth accepted by middlewares', async () => {
    issueEvent.mock.fake(() =>
      Promise.resolve({
        accepted: true,
        channel: new Channel('foo', 'bar', 'baz'),
        info: { hello: 'world' },
      })
    );

    const receiver = new Receiver(webSocketServer, distributor, {});
    receiver.bindIssuer(issueEvent, issueError);
    const authenticator = distributor.setAuthenticator.mock.calls[0].args[0];

    await expect(authenticator(socket, { type: 'test' })).resolves
      .toMatchInlineSnapshot(`
Object {
  "accepted": true,
  "channel": WebSocketChannel {
    "id": "baz",
    "platform": "websocket",
    "subtype": "bar",
    "type": "foo",
    "uid": "websocket:foo:bar:baz",
  },
  "info": Object {
    "hello": "world",
  },
}
`);
  });

  test('auth not accepted by middlewares', async () => {
    issueEvent.mock.fake(() =>
      Promise.resolve({
        accepted: false,
        reason: "No! I don't love you.",
      })
    );

    const receiver = new Receiver(webSocketServer, distributor, {});
    receiver.bindIssuer(issueEvent, issueError);
    const authenticator = distributor.setAuthenticator.mock.calls[0].args[0];

    await expect(authenticator(socket, { type: 'test' })).resolves
      .toMatchInlineSnapshot(`
Object {
  "accepted": false,
  "reason": "No! I don't love you.",
}
`);
  });

  test('when event handler thrown', async () => {
    issueEvent.mock.fake(() => Promise.reject(new Error('NOOOOOO!')));

    const receiver = new Receiver(webSocketServer, distributor, {});
    receiver.bindIssuer(issueEvent, issueError);
    const authenticator = distributor.setAuthenticator.mock.calls[0].args[0];

    await expect(authenticator(socket, { type: 'test' })).resolves
      .toMatchInlineSnapshot(`
Object {
  "accepted": false,
  "reason": "NOOOOOO!",
}
`);
  });
});

it('issue @connect event', () => {
  const request = {
    method: 'GET',
    url: '/hello',
    headers: {},
  };
  const socket = new Socket(new WS(/* mocked */), '_id_', request);

  const receiver = new Receiver(webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  const connectionInfo = { hello: 'world' };
  distributor.emit('connect', 'websocket:foo:bar:baz', socket, connectionInfo);

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    new Channel('foo', 'bar', 'baz'),
    { type: '@connect' },
    { source: 'websocket', socketId: socket.id, request, connectionInfo }
  );
});

it('issue @disconnect event', () => {
  const request = {
    method: 'GET',
    url: '/hello',
    headers: {},
  };
  const socket = new Socket(new WS(/* mocked */), '_id_', request);

  const receiver = new Receiver(webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  const connectionInfo = { hello: 'world' };
  distributor.emit(
    'disconnect',
    'websocket:foo:bar:baz',
    socket,
    connectionInfo
  );

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    new Channel('foo', 'bar', 'baz'),
    { type: '@disconnect' },
    { source: 'websocket', socketId: socket.id, request, connectionInfo }
  );
});

it('issue customized event', () => {
  const request = {
    method: 'GET',
    url: '/hello',
    headers: {},
  };
  const socket = new Socket(new WS(/* mocked */), '_id_', request);

  const receiver = new Receiver(webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  const connectionInfo = { hello: 'world' };

  distributor.emit('event', 'websocket:foo:bar:baz', socket, connectionInfo, {
    type: 'greeting',
    subtype: 'french',
    payload: 'bonjour',
  });

  expect(issueEvent.mock).toHaveBeenCalledTimes(1);
  expect(issueEvent.mock).toHaveBeenCalledWith(
    new Channel('foo', 'bar', 'baz'),
    { type: 'greeting', subtype: 'french', payload: 'bonjour' },
    { source: 'websocket', socketId: socket.id, request, connectionInfo }
  );
});

it('issue distributer error', () => {
  const receiver = new Receiver(webSocketServer, distributor, {});
  receiver.bindIssuer(issueEvent, issueError);

  distributor.emit('error', new Error("It's Bat Man!"));

  expect(issueError.mock).toHaveBeenCalledTimes(1);
  expect(issueError.mock).toHaveBeenCalledWith(new Error("It's Bat Man!"));
});
