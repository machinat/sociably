import moxy from 'moxy';

import WS from 'ws';
import Distributor from '../distributor';
import Socket from '../socket';
import { LocalOnlyBroker } from '../broker';
import { TopicScopeChannel, ConnectionChannel } from '../channel';

const request = {
  method: 'GET',
  url: '/somewhere',
  headers: { origin: 'www.machinat.com' },
};

const broker = moxy(new LocalOnlyBroker());
const errorHandler = moxy();

const socketMoxyOpts = { excludeProps: ['_*'] };
const socket = moxy(new Socket('ID', new WS(), request), socketMoxyOpts);

const serverId = 'MY_SERVER';

const scope = {
  paltform: 'websocket',
  type: 'topic',
  name: 'my_room',
  id: 1408,
  uid: 'websocket:topic:my_room:1408',
};

const john = { john: 'doe' };
const jane = { jane: 'doe' };
const conn = {
  serverId,
  socketId: socket.id,
  id: '#conn',
};

beforeEach(() => {
  broker.mock.reset();
  socket.mock.reset();
});

test('addLocalConnection() and removeLocalConnection()', () => {
  const distributor = new Distributor(serverId, broker, errorHandler);
  const fooConn = {
    serverId: '#server',
    socketId: socket.id,
    id: '#foo',
  };
  const barConn = {
    serverId: '#server',
    socketId: socket.id,
    id: '#bar',
  };

  expect(distributor.addLocalConnection(socket, john, fooConn)).toBe(true);
  expect(distributor.addLocalConnection(socket, jane, barConn)).toBe(true);
  // if duplicated
  expect(distributor.addLocalConnection(socket, john, fooConn)).toBe(false);
  expect(distributor.addLocalConnection(socket, jane, barConn)).toBe(false);

  expect(distributor.removeLocalConnection(fooConn)).toBe(true);
  expect(distributor.removeLocalConnection(barConn)).toBe(true);
  // if not connected already
  expect(distributor.removeLocalConnection(fooConn)).toBe(false);
  expect(distributor.removeLocalConnection(barConn)).toBe(false);
});

describe('attachTopic() and detachTopic()', () => {
  it('return boolean indicate whether connection is still connected', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);

    distributor.addLocalConnection(socket, john, conn);

    await expect(distributor.attachTopic(conn, scope)).resolves.toBe(true);
    await expect(distributor.attachTopic(conn, scope)).resolves.toBe(true);

    await expect(distributor.detachTopic(conn, scope)).resolves.toBe(true);
    await expect(distributor.detachTopic(conn, scope)).resolves.toBe(true);

    distributor.removeLocalConnection(conn);
    await expect(distributor.attachTopic(conn, scope)).resolves.toBe(false);
    await expect(distributor.detachTopic(conn, scope)).resolves.toBe(false);
  });

  it('delegate to broker if socket is not local', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    const remoteConnId = 'conn#remote';

    broker.attachTopicRemote.mock.fake(async () => true);
    await expect(distributor.attachTopic(remoteConnId, scope)).resolves.toBe(
      true
    );
    expect(broker.attachTopicRemote.mock).toHaveBeenCalledTimes(1);

    broker.attachTopicRemote.mock.fake(async () => false);
    await expect(distributor.attachTopic(remoteConnId, scope)).resolves.toBe(
      false
    );
    expect(broker.attachTopicRemote.mock).toHaveBeenCalledTimes(2);

    broker.detachTopicRemote.mock.fake(async () => true);
    await expect(distributor.detachTopic(remoteConnId, scope)).resolves.toBe(
      true
    );
    expect(broker.detachTopicRemote.mock).toHaveBeenCalledTimes(1);

    broker.detachTopicRemote.mock.fake(async () => false);
    await expect(distributor.detachTopic(remoteConnId, scope)).resolves.toBe(
      false
    );
    expect(broker.detachTopicRemote.mock).toHaveBeenCalledTimes(2);
  });
});

describe('disconnect()', () => {
  it('return boolean indicate is updated or not', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    socket.disconnect.mock.fake(async () => 0);
    distributor.addLocalConnection(socket, jane, conn);

    await expect(distributor.disconnect(conn, 'bye')).resolves.toBe(true);
    await expect(distributor.disconnect(conn, 'bye')).resolves.toBe(false);
  });

  it('delegate to borker if socket is not local', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    const remoteConn = {
      serverId: '#remote',
      socketId: 'xxx',
      id: '#conn_remote',
      user: { john: 'doe' },
    };

    await expect(distributor.disconnect(remoteConn, 'bye')).resolves.toBe(
      false
    );

    broker.disconnectRemote.mock.fake(async () => true);
    await expect(distributor.disconnect(remoteConn, 'bye')).resolves.toBe(true);

    expect(broker.disconnectRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.disconnectRemote.mock).toHaveBeenCalledWith(remoteConn);
  });
});

describe('send()', () => {
  const conn1 = {
    id: 'conn#1',
    serverId,
    socketId: socket.id,
  };

  const conn2 = {
    id: 'conn#2',
    serverId,
    socketId: socket.id,
  };

  it('send event with local connection scope', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    socket.event.mock.fake(async () => 0);

    distributor.addLocalConnection(socket, jane, conn1);
    distributor.addLocalConnection(socket, john, conn2);

    await expect(
      distributor.send(new ConnectionChannel(conn1), {
        type: 'foo',
        subtype: 'bar',
        payload: 1,
      })
    ).resolves.toEqual([conn1]);
    await expect(
      distributor.send(new ConnectionChannel(conn2), {
        type: 'foo',
        subtype: 'baz',
        payload: 2,
      })
    ).resolves.toEqual([conn2]);

    expect(socket.event.mock).toHaveBeenCalledTimes(2);
    expect(socket.event.mock).toHaveBeenNthCalledWith(1, {
      connectionId: 'conn#1',
      type: 'foo',
      subtype: 'bar',
      payload: 1,
    });
    expect(socket.event.mock).toHaveBeenNthCalledWith(2, {
      connectionId: 'conn#2',
      type: 'foo',
      subtype: 'baz',
      payload: 2,
    });
  });

  it('delegate to broker if connection is not local with connection scope', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    const remoteConn = {
      serverId: '#remote',
      socketId: 'xxx',
      id: '#conn_remote',
    };
    const connChannel = new ConnectionChannel(remoteConn);

    await expect(
      distributor.send(connChannel, { type: 'greet', payload: 'hello nobody' })
    ).resolves.toBe(null);

    broker.sendRemote.mock.fake(async () => [remoteConn]);
    await expect(
      distributor.send(connChannel, {
        type: 'greet',
        payload: 'hello somebody',
      })
    ).resolves.toEqual([remoteConn]);

    const connectionTarget = {
      type: 'connection',
      connectionId: '#conn_remote',
      serverId: '#remote',
    };
    expect(broker.sendRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      1,
      connectionTarget,
      { type: 'greet', payload: 'hello nobody' }
    );
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      2,
      connectionTarget,
      { type: 'greet', payload: 'hello somebody' }
    );
  });

  it('send with topic scope channel', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    socket.event.mock.fake(async () => 0);

    const remoteConn1 = {
      serverId: '#remote',
      socketId: 'xxx',
      id: '#conn1',
    };
    const remoteConn2 = {
      serverId: '#remote',
      socketId: 'zzz',
      id: '#conn2',
    };

    distributor.addLocalConnection(socket, john, conn1);
    distributor.addLocalConnection(socket, jane, conn2);

    const fooScope = new TopicScopeChannel('foo', 'oof');
    const barScope = new TopicScopeChannel('bar', 'rab');
    const bazScope = new TopicScopeChannel('baz', 'zab');

    distributor.attachTopic(conn1, fooScope);
    distributor.attachTopic(conn2, fooScope);
    distributor.attachTopic(conn1, barScope);

    await expect(
      distributor.send(fooScope, {
        type: 'greet',
        payload: 'good morning',
      })
    ).resolves.toEqual([conn1, conn2]);

    broker.sendRemote.mock.fake(async () => [remoteConn1]);
    await expect(
      distributor.send(barScope, {
        type: 'greet',
        payload: 'good afternoon',
      })
    ).resolves.toEqual([conn1, remoteConn1]);

    broker.sendRemote.mock.fake(async () => [remoteConn1, remoteConn2]);
    await expect(
      distributor.send(bazScope, {
        type: 'greet',
        payload: 'good evening',
      })
    ).resolves.toEqual([remoteConn1, remoteConn2]);

    expect(socket.event.mock).toHaveBeenCalledTimes(3);
    expect(socket.event.mock).toHaveBeenNthCalledWith(1, {
      connectionId: conn1.id,
      scopeUId: fooScope.uid,
      type: 'greet',
      payload: 'good morning',
    });
    expect(socket.event.mock).toHaveBeenNthCalledWith(2, {
      connectionId: conn2.id,
      scopeUId: fooScope.uid,
      type: 'greet',
      payload: 'good morning',
    });
    expect(socket.event.mock).toHaveBeenNthCalledWith(3, {
      connectionId: conn1.id,
      scopeUId: barScope.uid,
      type: 'greet',
      payload: 'good afternoon',
    });

    expect(broker.sendRemote.mock).toHaveBeenCalledTimes(3);
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      1,
      { type: 'topic', uid: fooScope.uid },
      { type: 'greet', payload: 'good morning' }
    );
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      2,
      { type: 'topic', uid: barScope.uid },
      { type: 'greet', payload: 'good afternoon' }
    );
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      3,
      { type: 'topic', uid: bazScope.uid },
      { type: 'greet', payload: 'good evening' }
    );
  });

  it('filter connection to send with whitelist and blacklist', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);
    socket.event.mock.fake(async () => 0);
    const jojo = { jojo: 'doe' };
    const conn3 = {
      id: 'conn#3',
      socket,
      channel: new ConnectionChannel('conn#3'),
    };

    distributor.addLocalConnection(socket, jane, conn1);
    distributor.addLocalConnection(socket, john, conn2);
    distributor.addLocalConnection(socket, jojo, conn3);

    const fooScope = new TopicScopeChannel('foo', 'oof');

    distributor.attachTopic(conn1, fooScope);
    distributor.attachTopic(conn2, fooScope);
    distributor.attachTopic(conn3, fooScope);

    await expect(
      distributor.send(fooScope, {
        type: 'greet',
        payload: 'hi',
        only: [conn1.id, conn2.id],
      })
    ).resolves.toEqual([conn1, conn2]);
    expect(socket.event.mock).toHaveBeenCalledTimes(2);

    await expect(
      distributor.send(fooScope, {
        type: 'greet',
        payload: 'hi',
        except: [conn2.id, conn3.id],
      })
    ).resolves.toEqual([conn1]);
    expect(socket.event.mock).toHaveBeenCalledTimes(3);

    await expect(
      distributor.send(fooScope, {
        type: 'greet',
        payload: 'hi',
        only: [conn1.id, conn2.id],
        except: [conn2.id, conn3.id],
      })
    ).resolves.toEqual([conn1]);
    expect(socket.event.mock).toHaveBeenCalledTimes(4);

    expect(broker.sendRemote.mock).toHaveBeenCalledTimes(3);
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      1,
      { type: 'topic', uid: fooScope.uid },
      { type: 'greet', payload: 'hi', only: [conn1.id, conn2.id] }
    );
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      2,
      { type: 'topic', uid: fooScope.uid },
      { type: 'greet', payload: 'hi', except: [conn2.id, conn3.id] }
    );
    expect(broker.sendRemote.mock).toHaveBeenNthCalledWith(
      3,
      { type: 'topic', uid: fooScope.uid },
      {
        type: 'greet',
        payload: 'hi',
        only: [conn1.id, conn2.id],
        except: [conn2.id, conn3.id],
      }
    );
  });

  it('emit error and remove errored connection when socket level error happen', async () => {
    const distributor = new Distributor(serverId, broker, errorHandler);

    distributor.addLocalConnection(socket, jane, conn1);
    distributor.addLocalConnection(socket, john, conn2);

    socket.event.mock.fake(() => Promise.resolve(0));
    socket.event.mock.fakeOnce(() => Promise.reject(new Error('Wasted!')));

    const fooScope = new TopicScopeChannel('foo', 'ofo', 'oof');
    distributor.attachTopic(conn1, fooScope);
    distributor.attachTopic(conn2, fooScope);

    const event = { type: 'greet', payload: 'hi danger' };
    await expect(distributor.send(fooScope, event)).resolves.toEqual([conn2]);
    expect(errorHandler.mock).toHaveBeenCalledTimes(1);

    socket.event.mock.fake(() => Promise.reject(new Error('Wasted!')));
    await expect(distributor.send(fooScope, event)).resolves.toBe(null);
    expect(errorHandler.mock).toHaveBeenCalledTimes(2);

    socket.event.mock.fake(() => Promise.resolve(0));
    await expect(distributor.send(fooScope, event)).resolves.toBe(null);
    expect(errorHandler.mock).toHaveBeenCalledTimes(2);

    errorHandler.mock.calls.forEach(call => {
      expect(call.args[0]).toEqual(new Error('Wasted!'));
    });

    expect(broker.sendRemote.mock).toHaveBeenCalledTimes(3);

    expect(socket.event.mock).toHaveBeenCalledTimes(3);
    expect(socket.event.mock).toHaveBeenNthCalledWith(1, {
      connectionId: conn1.id,
      scopeUId: fooScope.uid,
      ...event,
    });
    expect(socket.event.mock).toHaveBeenNthCalledWith(2, {
      connectionId: conn2.id,
      scopeUId: fooScope.uid,
      ...event,
    });
    expect(socket.event.mock).toHaveBeenNthCalledWith(3, {
      connectionId: conn2.id,
      scopeUId: fooScope.uid,
      ...event,
    });
  });
});
