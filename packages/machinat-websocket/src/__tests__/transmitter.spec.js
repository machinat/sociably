import moxy from '@moxyjs/moxy';
import WS from 'ws';
import { WebSocketTransmitter } from '../transmitter';
import Socket from '../socket';
import LocalOnlyBroker from '../broker/localOnlyBroker';
import { ConnectionChannel, TopicChannel, UserChannel } from '../channel';

const request = {
  method: 'GET',
  url: '/somewhere',
  headers: { origin: 'www.machinat.com' },
};

const broker = moxy(new LocalOnlyBroker());
const errorHandler = moxy();

const socket = moxy(new Socket('ID', new WS(), request));

const serverId = 'MY_SERVER';

const john = { name: 'john', uid: 'john_doe' };
const jane = { name: 'jane', uid: 'jane_doe' };

beforeEach(() => {
  broker.mock.reset();
  socket.mock.reset();
});

test('addLocalConnection() and removeLocalConnection()', () => {
  const transmitter = new WebSocketTransmitter(serverId, broker, errorHandler);
  const fooConn = new ConnectionChannel('#server', '#foo');
  const barConn = new ConnectionChannel('#server', '#bar');

  expect(transmitter.addLocalConnection(fooConn, socket, john)).toBe(true);
  expect(transmitter.addLocalConnection(barConn, socket, jane)).toBe(true);
  // if duplicated
  expect(transmitter.addLocalConnection(fooConn, socket, john)).toBe(false);
  expect(transmitter.addLocalConnection(barConn, socket, jane)).toBe(false);

  expect(transmitter.removeLocalConnection(fooConn)).toBe(true);
  expect(transmitter.removeLocalConnection(barConn)).toBe(true);
  // if not connected already
  expect(transmitter.removeLocalConnection(fooConn)).toBe(false);
  expect(transmitter.removeLocalConnection(barConn)).toBe(false);
});

describe('subscribeTopic() and unsubscribeTopic()', () => {
  it('return boolean indicate whether connection is connected', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    const conn = new ConnectionChannel(serverId, '#conn');

    transmitter.addLocalConnection(conn, socket, john);

    await expect(transmitter.subscribeTopic(conn, 'foo')).resolves.toBe(true);
    await expect(transmitter.subscribeTopic(conn, 'bar')).resolves.toBe(true);

    await expect(transmitter.unsubscribeTopic(conn, 'foo')).resolves.toBe(true);
    await expect(transmitter.unsubscribeTopic(conn, 'bar')).resolves.toBe(true);

    transmitter.removeLocalConnection(conn);
    await expect(transmitter.subscribeTopic(conn, 'foo')).resolves.toBe(false);
    await expect(transmitter.unsubscribeTopic(conn, 'foo')).resolves.toBe(
      false
    );
  });

  it('delegate to broker if socket is not local', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    const remoteConn = new ConnectionChannel('#remote', '#conn');

    broker.subscribeTopicRemote.mock.fake(async () => true);
    await expect(transmitter.subscribeTopic(remoteConn, 'foo')).resolves.toBe(
      true
    );
    expect(broker.subscribeTopicRemote.mock).toHaveBeenCalledTimes(1);

    broker.subscribeTopicRemote.mock.fake(async () => false);
    await expect(transmitter.subscribeTopic(remoteConn, 'foo')).resolves.toBe(
      false
    );
    expect(broker.subscribeTopicRemote.mock).toHaveBeenCalledTimes(2);

    broker.unsubscribeTopicRemote.mock.fake(async () => true);
    await expect(transmitter.unsubscribeTopic(remoteConn, 'foo')).resolves.toBe(
      true
    );
    expect(broker.unsubscribeTopicRemote.mock).toHaveBeenCalledTimes(1);

    broker.unsubscribeTopicRemote.mock.fake(async () => false);
    await expect(transmitter.unsubscribeTopic(remoteConn, 'foo')).resolves.toBe(
      false
    );
    expect(broker.unsubscribeTopicRemote.mock).toHaveBeenCalledTimes(2);
  });
});

describe('disconnect()', () => {
  it('return boolean indicate is updated or not', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    const conn = new ConnectionChannel(serverId, '#conn');

    socket.disconnect.mock.fake(async () => 0);
    transmitter.addLocalConnection(conn, socket, jane);

    await expect(transmitter.disconnect(conn, 'bye')).resolves.toBe(true);
    await expect(transmitter.disconnect(conn, 'bye')).resolves.toBe(false);
  });

  it('delegate to borker if socket is not local', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    const remoteConn = {
      serverId: '#remote',
      socketId: 'xxx',
      id: '#conn_remote',
      user: { john: 'doe' },
    };

    await expect(transmitter.disconnect(remoteConn, 'bye')).resolves.toBe(
      false
    );

    broker.disconnectRemote.mock.fake(async () => true);
    await expect(transmitter.disconnect(remoteConn, 'bye')).resolves.toBe(true);

    expect(broker.disconnectRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.disconnectRemote.mock).toHaveBeenCalledWith(remoteConn);
  });
});

describe('dispatch()', () => {
  const conn1 = new ConnectionChannel(serverId, 'conn#1');
  const conn2 = new ConnectionChannel(serverId, 'conn#2');

  it('dispatch events to local connection target', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    socket.dispatch.mock.fake(async () => 0);

    transmitter.addLocalConnection(conn1, socket, jane);
    transmitter.addLocalConnection(conn2, socket, john);

    await expect(
      transmitter.dispatch({
        target: conn1,
        events: [{ type: 'foo', subtype: 'bar', payload: 1 }],
      })
    ).resolves.toEqual([conn1]);
    await expect(
      transmitter.dispatch({
        target: conn2,
        events: [
          { type: 'foo', subtype: 'bar', payload: 2 },
          { type: 'foo', subtype: 'baz', payload: 3 },
        ],
      })
    ).resolves.toEqual([conn2]);

    expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(1, {
      connId: 'conn#1',
      events: [{ type: 'foo', subtype: 'bar', payload: 1 }],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(2, {
      connId: 'conn#2',
      events: [
        { type: 'foo', subtype: 'bar', payload: 2 },
        { type: 'foo', subtype: 'baz', payload: 3 },
      ],
    });
  });

  it('dispatch events to remote connection target', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    const remoteConn = new ConnectionChannel('#remote', '#conn_remote');

    const events = [
      { type: 'greet', payload: 'hello' },
      { type: 'message', subtype: 'text', payload: 'world' },
    ];

    await expect(
      transmitter.dispatch({ target: remoteConn, events })
    ).resolves.toBe(null);

    broker.dispatchRemote.mock.fake(async () => [remoteConn]);
    await expect(
      transmitter.dispatch({ target: remoteConn, events })
    ).resolves.toEqual([remoteConn]);

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: remoteConn,
      events,
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: remoteConn,
      events,
    });
  });

  it('dispatch with topic channel', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    socket.dispatch.mock.fake(async () => 0);

    const remoteConn1 = new ConnectionChannel('#remote', '#conn1');
    const remoteConn2 = new ConnectionChannel('#remote', '#conn2');

    transmitter.addLocalConnection(conn1, socket, john);
    transmitter.addLocalConnection(conn2, socket, jane);

    const fooChannel = new TopicChannel('foo');
    const barChannel = new TopicChannel('bar');
    const bazChannel = new TopicChannel('baz');

    transmitter.subscribeTopic(conn1, fooChannel);
    transmitter.subscribeTopic(conn2, fooChannel);
    transmitter.subscribeTopic(conn1, barChannel);

    await expect(
      transmitter.dispatch({
        target: fooChannel,
        events: [{ type: 'greet', payload: 'good morning' }],
      })
    ).resolves.toEqual([conn1, conn2]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn1]);
    await expect(
      transmitter.dispatch({
        target: barChannel,
        events: [{ type: 'greet', payload: 'good afternoon' }],
      })
    ).resolves.toEqual([conn1, remoteConn1]);

    broker.dispatchRemote.mock.fake(async () => [remoteConn1, remoteConn2]);
    await expect(
      transmitter.dispatch({
        target: bazChannel,
        events: [{ type: 'greet', payload: 'good evening' }],
      })
    ).resolves.toEqual([remoteConn1, remoteConn2]);

    expect(socket.dispatch.mock).toHaveBeenCalledTimes(3);
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      events: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      events: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(3, {
      connId: conn1.id,
      events: [{ type: 'greet', payload: 'good afternoon' }],
    });

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(3);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: fooChannel,
      events: [{ type: 'greet', payload: 'good morning' }],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: barChannel,
      events: [{ type: 'greet', payload: 'good afternoon' }],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(3, {
      target: bazChannel,
      events: [{ type: 'greet', payload: 'good evening' }],
    });
  });

  it('dispatch with user channel', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    socket.dispatch.mock.fake(async () => 0);

    const remoteConn = new ConnectionChannel('#remote', '#conn');

    transmitter.addLocalConnection(conn1, socket, john);
    transmitter.addLocalConnection(conn2, socket, jane);

    const johnChannel = new UserChannel(john);
    const janeChannel = new UserChannel(jane);
    const jojoChannel = new UserChannel({ name: 'jojo', uid: 'jojo_doe' });

    const events = [{ type: 'greet', payload: 'good morning' }];

    await expect(
      transmitter.dispatch({ target: johnChannel, events })
    ).resolves.toEqual([conn1]);

    await expect(
      transmitter.dispatch({ target: jojoChannel, events })
    ).resolves.toEqual(null);

    broker.dispatchRemote.mock.fake(async () => [remoteConn]);
    await expect(
      transmitter.dispatch({ target: janeChannel, events })
    ).resolves.toEqual([conn2, remoteConn]);

    await expect(
      transmitter.dispatch({ target: jojoChannel, events })
    ).resolves.toEqual([remoteConn]);

    expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(1, {
      connId: conn1.id,
      events,
    });
    expect(socket.dispatch.mock).toHaveBeenNthCalledWith(2, {
      connId: conn2.id,
      events,
    });

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(4);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: johnChannel,
      events,
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: jojoChannel,
      events,
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(3, {
      target: janeChannel,
      events,
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(4, {
      target: jojoChannel,
      events,
    });
  });

  test('filter connection send to topic', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    socket.dispatch.mock.fake(async () => 0);
    const conn3 = new ConnectionChannel(serverId, 'conn#3');

    transmitter.addLocalConnection(conn1, socket, jane);
    transmitter.addLocalConnection(conn2, socket, john);
    transmitter.addLocalConnection(conn3, socket, john);

    const fooChannel = new TopicChannel('foo');

    transmitter.subscribeTopic(conn1, fooChannel);
    transmitter.subscribeTopic(conn2, fooChannel);
    transmitter.subscribeTopic(conn3, fooChannel);

    const events = [{ type: 'greet', payload: 'hi' }];

    await expect(
      transmitter.dispatch({
        target: fooChannel,
        events,
        whitelist: [conn1, conn2],
      })
    ).resolves.toEqual([conn1, conn2]);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);

    await expect(
      transmitter.dispatch({
        target: fooChannel,
        events,
        blacklist: [conn2, conn3],
      })
    ).resolves.toEqual([conn1]);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(3);

    await expect(
      transmitter.dispatch({
        target: fooChannel,
        events,
        whitelist: [conn1, conn2],
        blacklist: [conn2, conn3],
      })
    ).resolves.toEqual([conn1]);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(4);

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(3);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: fooChannel,
      events,
      whitelist: [conn1, conn2],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: fooChannel,
      events,
      blacklist: [conn2, conn3],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(3, {
      target: fooChannel,
      events,
      whitelist: [conn1, conn2],
      blacklist: [conn2, conn3],
    });
  });

  test('filter connection send to user', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );
    socket.dispatch.mock.fake(async () => 0);
    const conn3 = new ConnectionChannel(serverId, 'conn#3');

    transmitter.addLocalConnection(conn1, socket, john);
    transmitter.addLocalConnection(conn2, socket, john);
    transmitter.addLocalConnection(conn3, socket, john);

    const johnChannel = new UserChannel(john);
    const events = [{ type: 'greet', payload: 'hi' }];

    await expect(
      transmitter.dispatch({
        target: johnChannel,
        events,
        whitelist: [conn1, conn2],
      })
    ).resolves.toEqual([conn1, conn2]);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(2);

    await expect(
      transmitter.dispatch({
        target: johnChannel,
        events,
        blacklist: [conn2, conn3],
      })
    ).resolves.toEqual([conn1]);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(3);

    await expect(
      transmitter.dispatch({
        target: johnChannel,
        events,
        whitelist: [conn1, conn2],
        blacklist: [conn2, conn3],
      })
    ).resolves.toEqual([conn1]);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(4);

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(3);
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(1, {
      target: johnChannel,
      events,
      whitelist: [conn1, conn2],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(2, {
      target: johnChannel,
      events,
      blacklist: [conn2, conn3],
    });
    expect(broker.dispatchRemote.mock).toHaveBeenNthCalledWith(3, {
      target: johnChannel,
      events,
      whitelist: [conn1, conn2],
      blacklist: [conn2, conn3],
    });
  });

  it('emit error when socket level error happen', async () => {
    const transmitter = new WebSocketTransmitter(
      serverId,
      broker,
      errorHandler
    );

    transmitter.addLocalConnection(conn1, socket, jane);
    transmitter.addLocalConnection(conn2, socket, john);

    socket.dispatch.mock.fake(() => Promise.resolve(0));
    socket.dispatch.mock.fakeOnce(() => Promise.reject(new Error('Wasted!')));

    const fooChannel = new TopicChannel('foo');
    transmitter.subscribeTopic(conn1, fooChannel);
    transmitter.subscribeTopic(conn2, fooChannel);

    const event = { type: 'greet', payload: 'hi danger' };
    await expect(
      transmitter.dispatch({ target: fooChannel, events: [event] })
    ).resolves.toEqual([conn2]);
    expect(errorHandler.mock).toHaveBeenCalledTimes(1);

    socket.dispatch.mock.fake(() => Promise.reject(new Error('Wasted!')));
    await expect(
      transmitter.dispatch({ target: fooChannel, events: [event] })
    ).resolves.toBe(null);
    expect(errorHandler.mock).toHaveBeenCalledTimes(3);

    errorHandler.mock.calls.forEach((call) => {
      expect(call.args[0]).toEqual(new Error('Wasted!'));
    });

    expect(broker.dispatchRemote.mock).toHaveBeenCalledTimes(2);
    expect(socket.dispatch.mock).toHaveBeenCalledTimes(4);
  });
});

test('handle remote dispatch', () => {
  const transmitter = new WebSocketTransmitter(serverId, broker, errorHandler);
  const conn1 = new ConnectionChannel(serverId, '#conn1');
  const conn2 = new ConnectionChannel(serverId, '#conn2');

  transmitter.addLocalConnection(conn1, socket, john);
  transmitter.addLocalConnection(conn2, socket, john);

  const fooChannel = new TopicChannel('foo');
  transmitter.subscribeTopic(conn1, fooChannel);

  expect(broker.onRemoteEvent.mock).toHaveBeenCalledTimes(1);
  const remoteEventHandler = broker.onRemoteEvent.mock.calls[0].args[0];
  const events = [{ type: 'greeting', payload: 'world' }];

  expect(
    remoteEventHandler({
      target: { type: 'connection', serverId, connectionId: '#conn1' },
      events,
    })
  ).toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(1);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn1',
    events,
  });

  expect(
    remoteEventHandler({
      target: { type: 'user', userUId: 'john_doe' },
      events,
    })
  ).toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(3);
  expect(socket.dispatch.mock).toHaveBeenCalledWith({
    connId: '#conn2',
    events,
  });

  expect(
    remoteEventHandler({
      target: { type: 'topic', name: 'foo' },
      events,
    })
  ).toBe(undefined);

  expect(socket.dispatch.mock).toHaveBeenCalledTimes(4);
  expect(socket.dispatch.mock).toHaveBeenNthCalledWith(4, {
    connId: '#conn1',
    events,
  });
});
