import moxy from 'moxy';

import WS from 'ws';
import Distributor from '../distributor';
import Socket from '../socket';
import Channel from '../channel';
import { LocalOnlyBroker } from '../broker';

const delay = t => new Promise(resolve => setTimeout(resolve, t));

const request = {
  method: 'GET',
  url: '/somewhere',
  headers: { origin: 'www.machinat.com' },
};

const chanFoo = new Channel('foo', undefined, '1');
const chanBar = new Channel('bar', undefined, '2');

const info = { hello: 'world' };
const authenticator = moxy(async (_, { type }) => ({
  accepted: true,
  info,
  channel: type === 'foo' ? chanFoo : chanBar,
}));

const socketMoxyOpts = { excludeProps: ['_*'] };

const connectSpy = moxy();
const disconnectSpy = moxy();
const eventSpy = moxy();

const broker = moxy(new LocalOnlyBroker());

beforeEach(() => {
  broker.mock.reset();
  connectSpy.mock.reset();
  disconnectSpy.mock.reset();
  eventSpy.mock.reset();
});

test('consigning sockets', () => {
  const skt1 = new Socket(new WS(), '1', request);
  const skt2 = new Socket(new WS(), '2', request);
  const distributor = new Distributor(broker);

  expect(distributor.consignSocket(skt1)).toBe(true);
  expect(distributor.consignSocket(skt2)).toBe(true);

  // if duplicated
  expect(distributor.consignSocket(skt1)).toBe(false);
  expect(distributor.consignSocket(skt2)).toBe(false);
});

test('handle connection events and lifecycle', async () => {
  const distributor = new Distributor(broker);
  distributor.setAuthenticator(authenticator);
  distributor
    .on('event', eventSpy)
    .on('connect', connectSpy)
    .on('disconnect', disconnectSpy);

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  const skt2 = moxy(new Socket(new WS(), '2', request), socketMoxyOpts);
  distributor.consignSocket(skt1);
  distributor.consignSocket(skt2);

  skt1.emit('register', { type: 'foo' }, 3);
  skt1.emit('register', { type: 'bar' }, 4);
  skt2.emit('register', { type: 'foo' }, 3);

  await delay(10);

  expect(authenticator.mock).toHaveBeenCalledTimes(3);
  expect(authenticator.mock).toHaveBeenCalledWith(skt1, { type: 'foo' });
  expect(authenticator.mock).toHaveBeenCalledWith(skt1, { type: 'bar' });
  expect(authenticator.mock).toHaveBeenCalledWith(skt2, { type: 'foo' });

  expect(skt1.connect.mock).toHaveBeenCalledTimes(2);
  expect(skt1.connect.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    info,
    req: 3,
  });
  expect(skt1.connect.mock).toHaveBeenCalledWith({
    uid: chanBar.uid,
    info,
    req: 4,
  });

  expect(skt2.connect.mock).toHaveBeenCalledTimes(1);
  expect(skt2.connect.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    info,
    req: 3,
  });

  expect(connectSpy.mock).not.toHaveBeenCalled();
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt2.id)).toBe(
    undefined
  );

  skt1.emit('connect', { uid: chanFoo.uid, req: 5 }, 7);
  skt1.emit('connect', { uid: chanBar.uid, req: 6 }, 8);
  skt2.emit('connect', { uid: chanFoo.uid, req: 4 }, 5);

  expect(connectSpy.mock).toHaveBeenCalledTimes(3);
  expect(connectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt1, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(chanBar.uid, skt1, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt2, info);

  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt1.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt1.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt2.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt2.id)).toBe(
    undefined
  );

  expect(broker.updateConnected.mock).toHaveBeenCalledTimes(3);
  expect(broker.updateConnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt1.id, info);
  expect(broker.updateConnected.mock) //
    .toHaveBeenCalledWith(chanBar.uid, skt1.id, info);
  expect(broker.updateConnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt2.id, info);

  skt1.emit(
    'event',
    { uid: chanFoo.uid, type: 'greeting', payload: 'hello foo' },
    9
  );
  skt1.emit(
    'event',
    { uid: chanBar.uid, type: 'greeting', payload: 'hello bar' },
    10
  );

  skt2.emit(
    'event',
    { uid: chanFoo.uid, type: 'greeting', payload: 'hello foo' },
    6
  );

  expect(eventSpy.mock).toHaveBeenCalledTimes(3);
  expect(eventSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt1, info, {
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });
  expect(eventSpy.mock).toHaveBeenCalledWith(chanBar.uid, skt1, info, {
    uid: chanBar.uid,
    type: 'greeting',
    payload: 'hello bar',
  });
  expect(eventSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt2, info, {
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });

  skt1.emit('disconnect', { uid: chanFoo.uid }, 11);
  skt2.emit('disconnect', { uid: chanFoo.uid }, 7);

  expect(disconnectSpy.mock).toHaveBeenCalledTimes(2);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt1, info);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt2, info);

  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt1.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt2.id)).toBe(
    undefined
  );

  expect(broker.updateDisconnected.mock).toHaveBeenCalledTimes(2);
  expect(broker.updateDisconnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt1.id);
  expect(broker.updateDisconnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt2.id);

  skt1.emit('close', 3333, 'bye');

  // TODO: move closing logic to distributor and uncomment this
  // expect(disconnectSpy.mock).toHaveBeenCalledTimes(2);
  // expect(disconnectSpy.mock).toHaveBeenCalledWith(
  //   chanBar.uid,
  //   socket,
  //   info
  // );
  //
  // expect(distributor.getLocalConnectionInfo(chanBar.uid, socket.id)).toBe(
  //   undefined
  // );
});

test('manipulate lifecycle of connection', async () => {
  const distributor = new Distributor(broker);
  distributor.setAuthenticator(authenticator);
  distributor
    .on('event', eventSpy)
    .on('connect', connectSpy)
    .on('disconnect', disconnectSpy);

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  const skt2 = moxy(new Socket(new WS(), '2', request), socketMoxyOpts);
  distributor.consignSocket(skt1);
  distributor.consignSocket(skt2);
  ['connect', 'event', 'disconnect'].forEach(method => {
    skt1[method].mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus
    skt2[method].mock.fake(() => Promise.resolve(skt2._seq++)); // eslint-disable-line no-plusplus
  });

  let promises;
  promises = [
    distributor.connectSocket(chanFoo.uid, skt1.id, info),
    distributor.connectSocket(chanBar.uid, skt1.id, info),
    distributor.connectSocket(chanFoo.uid, skt2.id, info),
  ];

  expect(skt1.connect.mock).toHaveBeenCalledTimes(2);
  expect(skt1.connect.mock).toHaveBeenCalledWith({ uid: chanFoo.uid, info });
  expect(skt1.connect.mock).toHaveBeenCalledWith({ uid: chanBar.uid, info });
  expect(skt2.connect.mock).toHaveBeenCalledTimes(1);
  expect(skt2.connect.mock).toHaveBeenCalledWith({ uid: chanFoo.uid, info });

  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt2.id)).toBe(
    undefined
  );

  skt1.emit('connect', { uid: chanFoo.uid });
  skt1.emit('connect', { uid: chanBar.uid });
  skt2.emit('connect', { uid: chanFoo.uid });

  await expect(Promise.all(promises)).resolves.toEqual([true, true, true]);

  expect(connectSpy.mock).toHaveBeenCalledTimes(3);
  expect(connectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt1, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(chanBar.uid, skt1, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt2, info);

  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt1.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt1.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt2.id)).toBe(info);
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt2.id)).toBe(
    undefined
  );

  expect(broker.updateConnected.mock).toHaveBeenCalledTimes(3);
  expect(broker.updateConnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt1.id, info);
  expect(broker.updateConnected.mock) //
    .toHaveBeenCalledWith(chanBar.uid, skt1.id, info);
  expect(broker.updateConnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt2.id, info);

  await expect(
    distributor.broadcast({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello foo',
    })
  ).resolves.toEqual(expect.arrayContaining([skt1.id, skt2.id]));
  await expect(
    distributor.broadcast({
      uid: chanBar.uid,
      type: 'greeting',
      payload: 'hello bar',
    })
  ).resolves.toEqual([skt1.id]);

  expect(skt1.event.mock).toHaveBeenCalledTimes(2);
  expect(skt1.event.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });
  expect(skt1.event.mock).toHaveBeenCalledWith({
    uid: chanBar.uid,
    type: 'greeting',
    payload: 'hello bar',
  });
  expect(skt2.event.mock).toHaveBeenCalledTimes(1);
  expect(skt2.event.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });

  expect(broker.broadcastRemote.mock).toHaveBeenCalledTimes(2);
  expect(broker.broadcastRemote.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });
  expect(broker.broadcastRemote.mock).toHaveBeenCalledWith({
    uid: chanBar.uid,
    type: 'greeting',
    payload: 'hello bar',
  });

  expect(eventSpy.mock).not.toHaveBeenCalled();

  promises = [
    distributor.disconnectSocket(chanFoo.uid, skt1.id, 'bye'),
    distributor.disconnectSocket(chanBar.uid, skt1.id, 'bye'),
    distributor.disconnectSocket(chanFoo.uid, skt2.id, 'bye'),
  ];

  expect(skt1.disconnect.mock).toHaveBeenCalledTimes(2);
  expect(skt1.disconnect.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    reason: 'bye',
  });
  expect(skt1.disconnect.mock).toHaveBeenCalledWith({
    uid: chanBar.uid,
    reason: 'bye',
  });
  expect(skt2.disconnect.mock).toHaveBeenCalledTimes(1);
  expect(skt2.disconnect.mock).toHaveBeenCalledWith({
    uid: chanFoo.uid,
    reason: 'bye',
  });

  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanBar.uid, skt1.id)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(chanFoo.uid, skt2.id)).toBe(
    undefined
  );

  skt1.emit('disconnect', { uid: chanFoo.uid });
  skt1.emit('disconnect', { uid: chanBar.uid });
  skt2.emit('disconnect', { uid: chanFoo.uid });

  await expect(Promise.all(promises)).resolves.toEqual([true, true, true]);

  expect(disconnectSpy.mock).toHaveBeenCalledTimes(3);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt1, info);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(chanBar.uid, skt1, info);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(chanFoo.uid, skt2, info);

  expect(broker.updateDisconnected.mock).toHaveBeenCalledTimes(3);
  expect(broker.updateDisconnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt1.id);
  expect(broker.updateDisconnected.mock) //
    .toHaveBeenCalledWith(chanBar.uid, skt1.id);
  expect(broker.updateDisconnected.mock) //
    .toHaveBeenCalledWith(chanFoo.uid, skt2.id);
});

describe('connectSocket()', () => {
  it('return false when already connected', async () => {
    const distributor = new Distributor(broker);

    const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
    distributor.consignSocket(skt1);

    skt1.connect.mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus

    distributor.connectSocket(chanFoo.uid, '1', {});
    skt1.emit('connect', { uid: chanFoo.uid });

    await expect(distributor.connectSocket(chanFoo.uid, '1', {})).resolves.toBe(
      false
    );
  });

  it('delegate to broker if socket is not local', async () => {
    const distributor = new Distributor(broker);

    await expect(
      distributor.connectSocket(chanFoo.uid, '1', { hello: 'world' })
    ).resolves.toBe(false);

    expect(broker.connectRemoteSocket.mock).toHaveBeenCalledTimes(1);
    expect(broker.connectRemoteSocket.mock).toHaveBeenCalledWith(
      chanFoo.uid,
      '1',
      { hello: 'world' }
    );

    broker.connectRemoteSocket.mock.fake(() => Promise.resolve(true));

    await expect(
      distributor.connectSocket(chanFoo.uid, '2', { hello: 'world' })
    ).resolves.toBe(true);

    expect(broker.connectRemoteSocket.mock).toHaveBeenCalledTimes(2);
    expect(broker.connectRemoteSocket.mock).toHaveBeenCalledWith(
      chanFoo.uid,
      '2',
      { hello: 'world' }
    );
  });
});

describe('disconnectSocket()', () => {
  it('return false when not connected', async () => {
    const distributor = new Distributor(broker);

    const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
    distributor.consignSocket(skt1);

    await expect(
      distributor.disconnectSocket(chanFoo.uid, '1', {})
    ).resolves.toBe(false);
  });

  it('delegate to borker if socket is not local', async () => {
    const distributor = new Distributor(broker);

    await expect(
      distributor.disconnectSocket(chanFoo.uid, '1', { hello: 'world' })
    ).resolves.toBe(false);

    expect(broker.disconnectRemoteSocket.mock).toHaveBeenCalledTimes(1);
    expect(broker.disconnectRemoteSocket.mock).toHaveBeenCalledWith(
      chanFoo.uid,
      '1',
      { hello: 'world' }
    );

    broker.disconnectRemoteSocket.mock.fake(() => Promise.resolve(true));

    await expect(
      distributor.disconnectSocket(chanFoo.uid, '2', { hello: 'world' })
    ).resolves.toBe(true);

    expect(broker.disconnectRemoteSocket.mock).toHaveBeenCalledTimes(2);
    expect(broker.disconnectRemoteSocket.mock).toHaveBeenCalledWith(
      chanFoo.uid,
      '2',
      { hello: 'world' }
    );
  });
});

describe('broadcast()', () => {
  it('delegate to broker if no socket connected', async () => {
    const distributor = new Distributor(broker);

    const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
    distributor.consignSocket(skt1);

    await expect(
      distributor.broadcast({
        uid: chanFoo.uid,
        type: 'greeting',
        payload: 'hello nobody',
      })
    ).resolves.toBe(null);

    expect(broker.broadcastRemote.mock).toHaveBeenCalledTimes(1);
    expect(broker.broadcastRemote.mock).toHaveBeenCalledWith({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello nobody',
    });

    broker.broadcastRemote.mock.fake(() => Promise.resolve(['6', '7', '8']));

    await expect(
      distributor.broadcast({
        uid: chanBar.uid,
        type: 'greeting',
        payload: 'hello remote friends',
      })
    ).resolves.toEqual(['6', '7', '8']);

    expect(broker.broadcastRemote.mock).toHaveBeenCalledTimes(2);
    expect(broker.broadcastRemote.mock).toHaveBeenCalledWith({
      uid: chanBar.uid,
      type: 'greeting',
      payload: 'hello remote friends',
    });
  });

  it('return socket ids from both remote and local merged', async () => {
    const distributor = new Distributor(broker);

    const skt = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
    distributor.consignSocket(skt);
    skt.connect.mock.fake(() => Promise.resolve(skt._seq++)); // eslint-disable-line no-plusplus
    skt.event.mock.fake(() => Promise.resolve(skt._seq++)); // eslint-disable-line no-plusplus
    distributor.connectSocket(chanFoo.uid, '1', {});
    skt.emit('connect', { uid: chanFoo.uid });

    broker.broadcastRemote.mock.fake(() => Promise.resolve(['3', '4', '5']));

    await expect(
      distributor.broadcast({
        uid: chanFoo.uid,
        type: 'greeting',
        payload: 'hello world',
      })
    ).resolves.toEqual(expect.arrayContaining(['1', '3', '4', '5']));

    expect(broker.broadcastRemote.mock).toHaveBeenCalledTimes(1);
    expect(broker.broadcastRemote.mock).toHaveBeenCalledWith({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello world',
    });
  });

  it('filter socket to send with whitelist and blacklist', async () => {
    const distributor = new Distributor(broker);

    const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
    const skt2 = moxy(new Socket(new WS(), '2', request), socketMoxyOpts);
    const skt3 = moxy(new Socket(new WS(), '3', request), socketMoxyOpts);
    distributor.consignSocket(skt1);
    distributor.consignSocket(skt2);
    distributor.consignSocket(skt3);
    ['connect', 'event'].forEach(method => {
      skt1[method].mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus
      skt2[method].mock.fake(() => Promise.resolve(skt2._seq++)); // eslint-disable-line no-plusplus
      skt3[method].mock.fake(() => Promise.resolve(skt3._seq++)); // eslint-disable-line no-plusplus
    });

    distributor.connectSocket(chanFoo.uid, '1', {});
    distributor.connectSocket(chanFoo.uid, '2', {});
    distributor.connectSocket(chanFoo.uid, '3', {});

    skt1.emit('connect', { uid: chanFoo.uid });
    skt2.emit('connect', { uid: chanFoo.uid });
    skt3.emit('connect', { uid: chanFoo.uid });

    const whitelist = ['1', '2'];
    const blacklist = ['2', '3'];
    const job = { uid: chanFoo.uid, type: 'greeting', payload: 'hello foo' };

    await expect(distributor.broadcast(job)).resolves.toEqual(['1', '2', '3']);
    await expect(distributor.broadcast({ ...job, whitelist })).resolves.toEqual(
      ['1', '2']
    );
    await expect(distributor.broadcast({ ...job, blacklist })).resolves.toEqual(
      ['1']
    );
    await expect(
      distributor.broadcast({ ...job, whitelist, blacklist })
    ).resolves.toEqual(['1']);

    expect(broker.broadcastRemote.mock).toHaveBeenCalledTimes(4);

    expect(skt1.event.mock).toHaveBeenCalledTimes(4);
    expect(skt2.event.mock).toHaveBeenCalledTimes(2);
    expect(skt3.event.mock).toHaveBeenCalledTimes(1);
  });

  it('emit error when socket level error happen', async () => {
    const distributor = new Distributor(broker);

    const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
    const skt2 = moxy(new Socket(new WS(), '2', request), socketMoxyOpts);
    distributor.consignSocket(skt1);
    distributor.consignSocket(skt2);
    skt1.connect.mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus
    skt2.connect.mock.fake(() => Promise.resolve(skt2._seq++)); // eslint-disable-line no-plusplus
    distributor.connectSocket(chanFoo.uid, '1', {});
    distributor.connectSocket(chanFoo.uid, '2', {});
    skt1.emit('connect', { uid: chanFoo.uid });
    skt2.emit('connect', { uid: chanFoo.uid });

    const errorSpy = moxy();
    distributor.on('error', errorSpy);

    skt1.event.mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus
    skt2.event.mock.fake(() => Promise.reject(new Error('Wasted!')));

    await expect(
      distributor.broadcast({
        uid: chanFoo.uid,
        type: 'greeting',
        payload: 'hello dangerous',
      })
    ).resolves.toEqual(['1']);

    skt1.event.mock.fake(() => Promise.reject(new Error('Wasted!')));

    await expect(
      distributor.broadcast({
        uid: chanFoo.uid,
        type: 'greeting',
        payload: 'hello dangerous',
      })
    ).resolves.toBe(null);

    expect(broker.broadcastRemote.mock).toHaveBeenCalledTimes(2);

    expect(errorSpy.mock).toHaveBeenCalledTimes(3);
    errorSpy.mock.calls.forEach(call => {
      expect(call.args[0]).toEqual(new Error('Wasted!'));
    });
  });
});
