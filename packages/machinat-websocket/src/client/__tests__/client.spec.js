import url from 'url';
import moxy from 'moxy';
import WS from 'ws';
import Socket from '../../socket';
import { ConnectionChannel, TopicScopeChannel } from '../../channel';
import Client from '../client';

const location = url.parse('https://machinat.com/hello');
global.location = location;

jest.mock('../../socket');

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const connectionChannel = new ConnectionChannel({
  serverId: '$',
  socketId: '$',
  id: '#conn',
  expiredAt: null,
});

const registrator = moxy(async () => ({
  user: { john: 'doe' },
  data: { foo: 'bar' },
}));

beforeEach(() => {
  Socket.mock.reset();
  registrator.mock.clear();
  WS.mock.clear();
});

it('initiate ok', () => {
  const client = new Client({ registrator }); // eslint-disable-line no-unused-vars

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith(
    'wss://machinat.com',
    'machinat-websocket-v0'
  );

  expect(Socket.mock).toHaveBeenCalledTimes(1);
  expect(Socket.mock).toHaveBeenCalledWith(
    expect.any(String),
    WS.mock.calls[0].instance,
    null
  );
});

it('throw if options.registrator is missing', () => {
  expect(() => new Client()).toThrowErrorMatchingInlineSnapshot(
    `"options.registrator should not be empty"`
  );
  expect(() => new Client({})).toThrowErrorMatchingInlineSnapshot(
    `"options.registrator should not be empty"`
  );
});

test('specify url', () => {
  const client = new Client({ url: 'ws://machinat.io/entry', registrator }); // eslint-disable-line no-unused-vars

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith(
    'ws://machinat.io/entry',
    'machinat-websocket-v0'
  );
});

it('register with data from options.registrator()', async () => {
  const eventSpy = moxy();
  const client = new Client({ registrator });
  client.onEvent(eventSpy);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.register.mock).not.toHaveBeenCalled();

  socket.emit('open');
  await delay();

  expect(registrator.mock).toHaveBeenCalledTimes(1);
  expect(registrator.mock).toHaveBeenCalledWith(/* empty */);

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  expect(socket.register.mock).toHaveBeenCalledWith({
    data: { foo: 'bar' },
  });
});

it('emit error if register rejected when socket is already open', async () => {
  const errorSpy = moxy();
  const client = new Client({ registrator });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.register.mock.fake(() => Promise.resolve(3));

  socket.emit('open');
  await delay();

  expect(socket.register.mock).toHaveBeenCalledTimes(1);
  await delay();

  socket.emit('reject', { req: 3, reason: 'you are fired' }, 5);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: you are fired]`
  );
});

it('emit event when received', async () => {
  const client = new Client({ registrator });
  const socket = Socket.mock.calls[0].instance;

  socket.emit('open');
  socket.emit('connect', { connectionId: '#conn' });
  await delay();

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  socket.emit('event', {
    connectionId: '#conn',
    type: 'reaction',
    subtype: 'wasted',
    payload: 'Link is down! Legend over.',
  });

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    event: {
      type: 'reaction',
      subtype: 'wasted',
      payload: 'Link is down! Legend over.',
    },
    channel: connectionChannel,
    user: { john: 'doe' },
  });

  socket.emit('event', {
    connectionId: '#conn',
    scopeUId: 'websocket:topic:game:world',
    type: 'resurrect',
    payload: 'Hero never die!',
  });

  expect(eventSpy.mock).toHaveBeenCalledTimes(2);
  expect(eventSpy.mock).toHaveBeenCalledWith({
    event: { type: 'resurrect', payload: 'Hero never die!' },
    channel: new TopicScopeChannel('game', 'world'),
    user: { john: 'doe' },
  });
});

it('send event when connected', async () => {
  const client = new Client({ registrator });
  const socket = Socket.mock.calls[0].instance;
  socket.event.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  socket.emit('open');
  socket.emit('connect', { connectionId: '#conn' });
  await delay();

  await expect(
    client.send({
      type: 'attack',
      subtype: 'chicken',
      payload: 'Chicken Attack! A~AA~AAAA~~',
    })
  ).resolves.toBe(undefined);

  expect(socket.event.mock).toHaveBeenCalledTimes(1);
  expect(socket.event.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
    type: 'attack',
    subtype: 'chicken',
    payload: 'Chicken Attack! A~AA~AAAA~~',
  });
});

it('queue the sendings when not ready and fire after connected', async () => {
  const client = new Client({ registrator });

  const socket = Socket.mock.calls[0].instance;
  socket.register.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.event.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  const done = moxy();
  const promise1 = client.send({ type: 'greeting', payload: 'hi' }).then(done);
  const promise2 = client
    .send({ type: 'greeting', payload: 'how are you' })
    .then(done);

  await delay(5);
  expect(done.mock).not.toHaveBeenCalled();
  expect(socket.event.mock).not.toHaveBeenCalled();

  socket.emit('open');
  await delay();

  const req = await socket.register.mock.calls[0].result;
  socket.emit(
    'connect',
    { connectionId: '#conn', req, user: { id: 'xxx', name: 'john doe' } },
    3
  );

  expect(socket.event.mock).toHaveBeenCalledTimes(2);
  expect(socket.event.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
    type: 'greeting',
    payload: 'hi',
  });
  expect(socket.event.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
    type: 'greeting',
    payload: 'how are you',
  });

  await promise1;
  await promise2;
  expect(done.mock).toHaveBeenCalledTimes(2);
});

test('disconnect by server', async () => {
  const client = new Client({ registrator });
  const socket = Socket.mock.calls[0].instance;

  socket.emit('open');
  socket.emit('connect', { connectionId: '#conn' });
  await delay();

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  socket.emit('disconnect', { connectionId: '#conn', reason: 'See ya!' });

  expect(client.connected).toBe(false);
  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    event: { type: '@disconnect' },
    channel: connectionChannel,
    user: { john: 'doe' },
  });
});

test('#disconnect()', async () => {
  const client = new Client({ registrator });
  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  socket.emit('open');
  socket.emit('connect', { connectionId: '#conn' });
  await delay();

  const eventSpy = moxy();
  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  expect(client.disconnect('You are chicken attacked!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    connectionId: '#conn',
    reason: 'You are chicken attacked!',
  });

  expect(client.connected).toBe(false);

  socket.emit('disconnect', { connectionId: '#conn', reason: 'See ya!' });

  expect(eventSpy.mock).toHaveBeenLastCalledWith({
    event: { type: '@disconnect' },
    channel: connectionChannel,
    user: { john: 'doe' },
  });
});

it('emit errer if connect_fail', () => {
  const errorSpy = moxy();
  const client = new Client({ registrator });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('connect_fail', { connectionId: '#conn', reason: 'FAILED' }, 3);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[ConnectionError: connect handshake fail]`
  );
});
