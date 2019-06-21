import moxy from 'moxy';
import ws from 'ws';
import Machinat from 'machinat';
import Renderer from 'machinat-renderer';
import BaseBot from 'machinat-base/src/bot';
import WebSocketBot from '../bot';
import Receiver from '../receiver';
import Distributor from '../distributor';
import Worker from '../worker';
import Channel from '../channel';
import { Event } from '../component';

jest.mock('machinat-base/src/bot');
jest.mock('../receiver');
jest.mock('../worker');
jest.mock('../distributor');

beforeEach(() => {
  BaseBot.mock.clear();
  Receiver.mock.clear();
  Worker.mock.clear();
  Distributor.mock.clear();
});

it('extends BaseBot', () => {
  expect(new WebSocketBot()).toBeInstanceOf(BaseBot);
});

it('initiate BaseBot', () => {
  const plugins = [moxy(() => ({})), moxy(() => ({})), moxy(() => ({}))];
  const bot = new WebSocketBot({ plugins });

  expect(bot.plugins).toEqual(plugins);

  expect(BaseBot.mock).toHaveBeenCalledTimes(1);
  expect(BaseBot.mock).toHaveBeenCalledWith(
    'websocket',
    expect.any(Receiver),
    expect.any(Renderer),
    expect.any(Worker),
    plugins
  );
});

it('pass ws server, distributor and options to receiver', () => {
  const bot = new WebSocketBot({ verifyUpgrade: moxy() });
  expect(Receiver.mock).toHaveBeenCalledWith(
    expect.any(ws.Server),
    expect.any(Distributor),
    bot.options
  );
});

it('pass distributor to worker', () => {
  const bot = new WebSocketBot(); // eslint-disable-line
  expect(Worker.mock).toHaveBeenCalledWith(expect.any(Distributor));
});

test('send(channel, event) work', async () => {
  const bot = new WebSocketBot();
  const distributor = Distributor.mock.calls[0].instance;

  distributor.broadcast.mock.fakeReturnValue(['1', '2', '3']);

  const channel = new Channel();
  await expect(
    bot.send(channel, [<Event />, <Event type="foo" />, <Event type="bar" />])
  ).resolves.toEqual([
    { sockets: ['1', '2', '3'] },
    { sockets: ['1', '2', '3'] },
    { sockets: ['1', '2', '3'] },
  ]);

  expect(distributor.broadcast.mock).toHaveBeenCalledTimes(3);
  expect(distributor.broadcast.mock).toHaveBeenCalledWith({
    uid: channel.uid,
    type: 'default',
  });
  expect(distributor.broadcast.mock).toHaveBeenCalledWith({
    uid: channel.uid,
    type: 'foo',
  });
  expect(distributor.broadcast.mock).toHaveBeenCalledWith({
    uid: channel.uid,
    type: 'bar',
  });
});

test('disconnectSocket(channel, socketId, reason) work', async () => {
  const bot = new WebSocketBot();
  const distributor = Distributor.mock.calls[0].instance;

  distributor.disconnectSocket.mock.fake(() => Promise.resolve(false));

  const channel = new Channel('foo');
  await expect(bot.disconnectSocket(channel, '1', 'bye')).resolves.toBe(false);

  distributor.disconnectSocket.mock.fake(() => Promise.resolve(true));
  await expect(bot.disconnectSocket(channel, '2', 'bye')).resolves.toBe(true);

  expect(distributor.disconnectSocket.mock).toHaveBeenCalledTimes(2);
  expect(distributor.disconnectSocket.mock) //
    .toHaveBeenCalledWith(channel.uid, '1', 'bye');
  expect(distributor.disconnectSocket.mock) //
    .toHaveBeenCalledWith(channel.uid, '2', 'bye');
});
