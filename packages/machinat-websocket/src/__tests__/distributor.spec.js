import moxy from 'moxy';

import WS from 'ws';
import Distributor from '../distributor';
import Socket from '../socket';
import Channel from '../channel';

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

beforeEach(() => {
  connectSpy.mock.clear();
  disconnectSpy.mock.clear();
  eventSpy.mock.clear();
});

test('consigning sockets', () => {
  const skt1 = new Socket(new WS(), '1', request);
  const skt2 = new Socket(new WS(), '2', request);
  const distributor = new Distributor();

  expect(distributor.consignSocket(skt1)).toBe(true);
  expect(distributor.consignSocket(skt2)).toBe(true);

  // if duplicated
  expect(distributor.consignSocket(skt1)).toBe(false);
  expect(distributor.consignSocket(skt2)).toBe(false);
});

test('handle connection events and lifecycle', async () => {
  const distributor = new Distributor();
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
  expect(distributor.getLocalConnectionInfo(skt1.id, chanFoo.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt1.id, chanBar.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt2.id, chanFoo.uid)).toBe(
    undefined
  );

  skt1.emit('connect', { uid: chanFoo.uid, req: 5 }, 7);
  skt1.emit('connect', { uid: chanBar.uid, req: 6 }, 8);
  skt2.emit('connect', { uid: chanFoo.uid, req: 4 }, 5);

  expect(connectSpy.mock).toHaveBeenCalledTimes(3);
  expect(connectSpy.mock).toHaveBeenCalledWith(skt1, chanFoo.uid, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(skt1, chanBar.uid, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(skt2, chanFoo.uid, info);

  expect(distributor.getLocalConnectionInfo(skt1.id, chanFoo.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt1.id, chanBar.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt2.id, chanFoo.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt2.id, chanBar.uid)).toBe(
    undefined
  );

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
  expect(eventSpy.mock).toHaveBeenCalledWith(skt1, chanFoo.uid, info, {
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });
  expect(eventSpy.mock).toHaveBeenCalledWith(skt1, chanBar.uid, info, {
    uid: chanBar.uid,
    type: 'greeting',
    payload: 'hello bar',
  });
  expect(eventSpy.mock).toHaveBeenCalledWith(skt2, chanFoo.uid, info, {
    uid: chanFoo.uid,
    type: 'greeting',
    payload: 'hello foo',
  });

  skt1.emit('disconnect', { uid: chanFoo.uid }, 11);
  skt2.emit('disconnect', { uid: chanFoo.uid }, 7);

  expect(disconnectSpy.mock).toHaveBeenCalledTimes(2);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(skt1, chanFoo.uid, info);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(skt2, chanFoo.uid, info);

  expect(distributor.getLocalConnectionInfo(skt1.id, chanFoo.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt1.id, chanBar.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt2.id, chanFoo.uid)).toBe(
    undefined
  );

  skt1.emit('close', 3333, 'bye');

  // TODO: move closing logic to distributor and uncomment this
  // expect(disconnectSpy.mock).toHaveBeenCalledTimes(2);
  // expect(disconnectSpy.mock).toHaveBeenCalledWith(
  //   socket,
  //   chanBar.uid,
  //   info
  // );
  //
  // expect(distributor.getLocalConnectionInfo(socket.id, chanBar.uid)).toBe(
  //   undefined
  // );
});

test('manipulate lifecycle of connection', async () => {
  const distributor = new Distributor();
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
    distributor.linkLocalConnection(skt1.id, chanFoo.uid, info),
    distributor.linkLocalConnection(skt1.id, chanBar.uid, info),
    distributor.linkLocalConnection(skt2.id, chanFoo.uid, info),
  ];

  expect(skt1.connect.mock).toHaveBeenCalledTimes(2);
  expect(skt1.connect.mock).toHaveBeenCalledWith({ uid: chanFoo.uid, info });
  expect(skt1.connect.mock).toHaveBeenCalledWith({ uid: chanBar.uid, info });
  expect(skt2.connect.mock).toHaveBeenCalledTimes(1);
  expect(skt2.connect.mock).toHaveBeenCalledWith({ uid: chanFoo.uid, info });

  expect(distributor.getLocalConnectionInfo(skt1.id, chanFoo.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt1.id, chanBar.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt2.id, chanFoo.uid)).toBe(
    undefined
  );

  skt1.emit('connect', { uid: chanFoo.uid });
  skt1.emit('connect', { uid: chanBar.uid });
  skt2.emit('connect', { uid: chanFoo.uid });

  await expect(Promise.all(promises)).resolves.toEqual([true, true, true]);

  expect(connectSpy.mock).toHaveBeenCalledTimes(3);
  expect(connectSpy.mock).toHaveBeenCalledWith(skt1, chanFoo.uid, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(skt1, chanBar.uid, info);
  expect(connectSpy.mock).toHaveBeenCalledWith(skt2, chanFoo.uid, info);

  expect(distributor.getLocalConnectionInfo(skt1.id, chanFoo.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt1.id, chanBar.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt2.id, chanFoo.uid)).toBe(info);
  expect(distributor.getLocalConnectionInfo(skt2.id, chanBar.uid)).toBe(
    undefined
  );

  await expect(
    distributor.broadcastLocal({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello foo',
    })
  ).resolves.toEqual(expect.arrayContaining([skt1.id, skt2.id]));
  await expect(
    distributor.broadcastLocal({
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

  expect(eventSpy.mock).not.toHaveBeenCalled();

  promises = [
    distributor.unlinkLocalConnection(skt1.id, chanFoo.uid, 'bye'),
    distributor.unlinkLocalConnection(skt1.id, chanBar.uid, 'bye'),
    distributor.unlinkLocalConnection(skt2.id, chanFoo.uid, 'bye'),
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

  expect(distributor.getLocalConnectionInfo(skt1.id, chanFoo.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt1.id, chanBar.uid)).toBe(
    undefined
  );
  expect(distributor.getLocalConnectionInfo(skt2.id, chanFoo.uid)).toBe(
    undefined
  );

  skt1.emit('disconnect', { uid: chanFoo.uid });
  skt1.emit('disconnect', { uid: chanBar.uid });
  skt2.emit('disconnect', { uid: chanFoo.uid });

  await expect(Promise.all(promises)).resolves.toEqual([true, true, true]);

  expect(disconnectSpy.mock).toHaveBeenCalledTimes(3);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(skt1, chanFoo.uid, info);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(skt1, chanBar.uid, info);
  expect(disconnectSpy.mock).toHaveBeenCalledWith(skt2, chanFoo.uid, info);
});

test('linkLocalConnection() return false when already connected', async () => {
  const distributor = new Distributor();

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  distributor.consignSocket(skt1);

  skt1.connect.mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus

  distributor.linkLocalConnection('1', chanFoo.uid, {});
  skt1.emit('connect', { uid: chanFoo.uid });

  await expect(
    distributor.linkLocalConnection('1', chanFoo.uid, {})
  ).resolves.toBe(false);
});

test('unlinkLocalConnection() return false when not connected', async () => {
  const distributor = new Distributor();

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  distributor.consignSocket(skt1);

  await expect(
    distributor.unlinkLocalConnection('1', chanFoo.uid, {})
  ).resolves.toBe(false);
});

test('broadcastLocal() return null when not connected', async () => {
  const distributor = new Distributor();

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  distributor.consignSocket(skt1);

  await expect(
    distributor.broadcastLocal({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello nobody',
    })
  ).resolves.toBe(null);
});

test('broadcastLocal() with whitelist and blacklist', async () => {
  const distributor = new Distributor();

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

  distributor.linkLocalConnection('1', chanFoo.uid, {});
  distributor.linkLocalConnection('2', chanFoo.uid, {});
  distributor.linkLocalConnection('3', chanFoo.uid, {});

  skt1.emit('connect', { uid: chanFoo.uid });
  skt2.emit('connect', { uid: chanFoo.uid });
  skt3.emit('connect', { uid: chanFoo.uid });

  const whitelist = ['1', '2'];
  const blacklist = ['2', '3'];
  const job = { uid: chanFoo.uid, type: 'greeting', payload: 'hello foo' };

  await expect(distributor.broadcastLocal(job)).resolves.toEqual([
    '1',
    '2',
    '3',
  ]);
  await expect(
    distributor.broadcastLocal({ ...job, whitelist })
  ).resolves.toEqual(['1', '2']);
  await expect(
    distributor.broadcastLocal({ ...job, blacklist })
  ).resolves.toEqual(['1']);
  await expect(
    distributor.broadcastLocal({ ...job, whitelist, blacklist })
  ).resolves.toEqual(['1']);

  expect(skt1.event.mock).toHaveBeenCalledTimes(4);
  expect(skt2.event.mock).toHaveBeenCalledTimes(2);
  expect(skt3.event.mock).toHaveBeenCalledTimes(1);
});

test('broadcastLocal() return null when not connected', async () => {
  const distributor = new Distributor();

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  distributor.consignSocket(skt1);

  await expect(
    distributor.broadcastLocal({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello nobody',
    })
  ).resolves.toBe(null);
});

test('broadcastLocal() socket level error happen', async () => {
  const distributor = new Distributor();

  const skt1 = moxy(new Socket(new WS(), '1', request), socketMoxyOpts);
  const skt2 = moxy(new Socket(new WS(), '2', request), socketMoxyOpts);
  distributor.consignSocket(skt1);
  distributor.consignSocket(skt2);
  skt1.connect.mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus
  skt2.connect.mock.fake(() => Promise.resolve(skt2._seq++)); // eslint-disable-line no-plusplus
  distributor.linkLocalConnection('1', chanFoo.uid, {});
  distributor.linkLocalConnection('2', chanFoo.uid, {});
  skt1.emit('connect', { uid: chanFoo.uid });
  skt2.emit('connect', { uid: chanFoo.uid });

  const errorSpy = moxy();
  distributor.on('error', errorSpy);

  skt1.event.mock.fake(() => Promise.resolve(skt1._seq++)); // eslint-disable-line no-plusplus
  skt2.event.mock.fake(() => Promise.reject(new Error('Wasted!')));

  await expect(
    distributor.broadcastLocal({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello dangerous',
    })
  ).resolves.toEqual(['1']);

  skt1.event.mock.fake(() => Promise.reject(new Error('Wasted!')));

  await expect(
    distributor.broadcastLocal({
      uid: chanFoo.uid,
      type: 'greeting',
      payload: 'hello dangerous',
    })
  ).resolves.toBe(null);

  expect(errorSpy.mock).toHaveBeenCalledTimes(3);
  errorSpy.mock.calls.forEach(call => {
    expect(call.args[0]).toEqual(new Error('Wasted!'));
  });
});
