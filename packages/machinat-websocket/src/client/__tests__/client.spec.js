import url from 'url';
import moxy from 'moxy';
import WS from 'ws';
import Socket from '../../socket';
import { ConnectionChannel } from '../../channel';
import Client from '../client';

const location = url.parse('https://machinat.com/hello');
global.location = location;

jest.mock('../../socket');

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const authorize = moxy(async () => ({
  user: { john: 'doe' },
  credential: { foo: 'bar' },
}));

const eventSpy = moxy();

beforeEach(() => {
  Socket.mock.reset();
  WS.mock.clear();
  authorize.mock.clear();
  eventSpy.mock.clear();
});

it('initiate ok', () => {
  const client = new Client({ authorize }); // eslint-disable-line no-unused-vars

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

test('specify url', () => {
  const client = new Client({ url: 'ws://machinat.io/entry', authorize }); // eslint-disable-line no-unused-vars

  expect(WS.mock).toHaveBeenCalledTimes(1);
  expect(WS.mock).toHaveBeenCalledWith(
    'ws://machinat.io/entry',
    'machinat-websocket-v0'
  );
});

it('sign in end emit "connect" when connected', async () => {
  const client = new Client();
  client.onEvent(eventSpy);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.signIn.mock).not.toHaveBeenCalled();

  expect(client.user).toBe(null);

  socket.emit('open');
  await delay();

  expect(socket.signIn.mock).toHaveBeenCalledTimes(1);
  expect(socket.signIn.mock).toHaveBeenCalledWith({
    credential: null,
  });
  expect(client.user).toEqual(null);

  const regSeq = await socket.signIn.mock.calls[0].result;
  socket.emit('connect', { connId: '#conn', seq: regSeq });
  await delay();

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({ type: 'connect' }, client);

  expect(client.channel).toEqual(new ConnectionChannel('*', '#conn'));
});

it('signIn with credential from options.authorize()', async () => {
  const client = new Client({ authorize });
  client.onEvent(eventSpy);

  const socket = Socket.mock.calls[0].instance;
  expect(socket.signIn.mock).not.toHaveBeenCalled();

  expect(client.user).toBe(null);

  socket.emit('open');
  await delay();

  expect(authorize.mock).toHaveBeenCalledTimes(1);
  expect(authorize.mock).toHaveBeenCalledWith(/* empty */);

  expect(socket.signIn.mock).toHaveBeenCalledTimes(1);
  expect(socket.signIn.mock).toHaveBeenCalledWith({
    credential: { foo: 'bar' },
  });

  expect(client.user).toEqual({ john: 'doe' });
  expect(client.channel).toBe(null);

  const regSeq = await socket.signIn.mock.calls[0].result;
  socket.emit('connect', { connId: '#conn', seq: regSeq });
  await delay();

  expect(eventSpy.mock).toHaveBeenCalledTimes(1);
  expect(eventSpy.mock).toHaveBeenCalledWith({ type: 'connect' }, client);

  expect(client.channel).toEqual(new ConnectionChannel('*', '#conn'));
});

it('emit "error" if sign in rejected when socket is already open', async () => {
  const errorSpy = moxy();
  const client = new Client({ authorize });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.signIn.mock.fake(() => Promise.resolve(3));

  socket.emit('open');
  await delay();

  expect(socket.signIn.mock).toHaveBeenCalledTimes(1);
  await delay();

  socket.emit('reject', { seq: 3, reason: 'you are fired' }, 5);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[SocketError: you are fired]`
  );
});

it('emit "event" when dispatched events received', async () => {
  const client = new Client({ authorize });
  const socket = Socket.mock.calls[0].instance;

  socket.emit('open');
  socket.emit('connect', { connId: '#conn' });
  await delay();

  client.onEvent(eventSpy);

  socket.emit('dispatch', {
    connId: '#conn',
    events: [
      { type: 'start', payload: 'Welcome to Hyrule' },
      {
        type: 'reaction',
        subtype: 'wasted',
        payload: 'Link is down! Legend over.',
      },
    ],
  });

  expect(eventSpy.mock).toHaveBeenCalledTimes(2);
  expect(eventSpy.mock).toHaveBeenNthCalledWith(
    1,
    { type: 'start', payload: 'Welcome to Hyrule' },
    client
  );
  expect(eventSpy.mock).toHaveBeenNthCalledWith(
    2,
    {
      type: 'reaction',
      subtype: 'wasted',
      payload: 'Link is down! Legend over.',
    },
    client
  );

  socket.emit('dispatch', {
    connId: '#conn',
    events: [{ type: 'resurrect', payload: 'Hero never die!' }],
  });

  expect(eventSpy.mock).toHaveBeenCalledTimes(3);
  expect(eventSpy.mock).toHaveBeenCalledWith(
    { type: 'resurrect', payload: 'Hero never die!' },
    client
  );
});

it('send events when already connected', async () => {
  const client = new Client({ authorize });
  const socket = Socket.mock.calls[0].instance;
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  socket.emit('open');
  socket.emit('connect', { connId: '#conn' });
  await delay();

  await expect(
    client.send(
      { type: 'foo', payload: 1 },
      { type: 'bar', subtype: 'beer', payload: 2 }
    )
  ).resolves.toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [
      { type: 'foo', payload: 1 },
      { type: 'bar', subtype: 'beer', payload: 2 },
    ],
  });

  await expect(client.send({ type: 'baz', payload: 3 })).resolves.toBe(
    undefined
  );
  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [{ type: 'baz', payload: 3 }],
  });
});

it('queue dispatches if not ready and fire after connected', async () => {
  const client = new Client({ authorize });

  const socket = Socket.mock.calls[0].instance;
  socket.signIn.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus
  socket.dispatch.mock.fake(async () => ++socket._seq); // eslint-disable-line no-plusplus

  const done = moxy();
  const promise1 = client.send({ type: 'greeting', payload: 'hi' }).then(done);
  const promise2 = client
    .send({ type: 'greeting', payload: 'how are you' })
    .then(done);

  await delay(5);
  expect(done.mock).not.toHaveBeenCalled();
  expect(socket.dispatch.mock).not.toHaveBeenCalled();

  socket.emit('open');
  await delay();

  const seq = await socket.signIn.mock.calls[0].result;
  socket.emit('connect', { connId: '#conn', seq }, 3);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [{ type: 'greeting', payload: 'hi' }],
  });
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn',
    events: [{ type: 'greeting', payload: 'how are you' }],
  });

  await promise1;
  await promise2;
  expect(done.mock).toHaveBeenCalledTimes(2);
});

test('disconnect by server', async () => {
  const client = new Client({ authorize });
  const socket = Socket.mock.calls[0].instance;

  socket.emit('open');
  socket.emit('connect', { connId: '#conn' });
  await delay();

  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  socket.emit('disconnect', { connId: '#conn', reason: 'See ya!' });

  expect(client.connected).toBe(false);
  expect(eventSpy.mock).toHaveBeenLastCalledWith(
    { type: 'disconnect' },
    client
  );
});

test('#disconnect()', async () => {
  const client = new Client({ authorize });
  const socket = Socket.mock.calls[0].instance;
  socket.disconnect.mock.fake(() => Promise.resolve(++socket._seq)); // eslint-disable-line no-plusplus

  socket.emit('open');
  socket.emit('connect', { connId: '#conn' });
  await delay();

  client.onEvent(eventSpy);

  expect(client.connected).toBe(true);
  expect(client.disconnect('You are chicken attacked!')).toBe(undefined);

  expect(socket.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(socket.disconnect.mock).toHaveBeenCalledWith({
    connId: '#conn',
    reason: 'You are chicken attacked!',
  });

  expect(client.connected).toBe(false);

  socket.emit('disconnect', { connId: '#conn', reason: 'See ya!' });

  expect(eventSpy.mock).toHaveBeenLastCalledWith(
    { type: 'disconnect' },
    client
  );
});

it('emit errer if connect_fail', () => {
  const errorSpy = moxy();
  const client = new Client({ authorize });
  client.onError(errorSpy);

  const socket = Socket.mock.calls[0].instance;
  socket.emit('connect_fail', { connId: '#conn', reason: 'FAILED' }, 3);

  expect(errorSpy.mock).toHaveBeenCalledTimes(1);
  expect(errorSpy.mock.calls[0].args[0]).toMatchInlineSnapshot(
    `[SocketError: connect handshake fail]`
  );
});
