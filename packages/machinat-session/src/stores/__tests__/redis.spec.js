/* eslint-disable prefer-destructuring, no-await-in-loop */
import moxy from 'moxy';
import RedisSessionManager from '../redis';

const nextTick = () => new Promise(resolve => process.nextTick(resolve));

const client = moxy({});

beforeEach(() => {
  client.mock.reset();
});

const uid = 'so:many:tests:to:write';
const channel = {
  platform: 'test',
  type: 'test',
  uid,
};

test('#get()', async () => {
  const manager = new RedisSessionManager(client);
  const session = manager.getSession(channel);

  client.mock.getter('hget').fakeReturnValue(moxy());

  // get string value
  let promise = session.get('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(1);
  expect(client.hget.mock).toHaveBeenCalledWith(
    uid,
    'foo',
    expect.any(Function)
  );

  let callback = client.hget.mock.calls[0].args[2];
  callback(null, '"bar"');
  await expect(promise).resolves.toBe('bar');

  // get object value
  promise = session.get('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(2);

  callback = client.hget.mock.calls[1].args[2];
  callback(null, '{"bar":"baz"}');
  await expect(promise).resolves.toEqual({ bar: 'baz' });

  // key not existed
  promise = session.get('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(3);

  callback = client.hget.mock.calls[2].args[2];
  callback(null, null);
  await expect(promise).resolves.toBe(undefined);
});

test('#set()', async () => {
  const manager = new RedisSessionManager(client);
  const session = manager.getSession(channel);

  client.mock.getter('hset').fakeReturnValue(moxy());

  // with string value
  let promise = session.set('foo', 'bar');
  expect(client.hset.mock).toHaveBeenCalledTimes(1);
  expect(client.hset.mock).toHaveBeenCalledWith(
    uid,
    'foo',
    '"bar"',
    expect.any(Function)
  );

  let callback = client.hset.mock.calls[0].args[3];
  callback(null, 1);
  await expect(promise).resolves.toBe(undefined);

  // with object value
  promise = session.set('foo', { bar: 'baz' });
  expect(client.hset.mock).toHaveBeenCalledTimes(2);
  expect(client.hset.mock).toHaveBeenCalledWith(
    uid,
    'foo',
    '{"bar":"baz"}',
    expect.any(Function)
  );

  callback = client.hset.mock.calls[1].args[3];
  callback(null, 0);
  await expect(promise).resolves.toBe(undefined);
});

test('#delete()', async () => {
  const manager = new RedisSessionManager(client);
  const session = manager.getSession(channel);

  client.mock.getter('hdel').fakeReturnValue(moxy());

  // key existed
  let promise = session.delete('foo');
  expect(client.hdel.mock).toHaveBeenCalledTimes(1);
  expect(client.hdel.mock).toHaveBeenCalledWith(
    uid,
    'foo',
    expect.any(Function)
  );

  let callback = client.hdel.mock.calls[0].args[2];
  callback(null, 1);
  await expect(promise).resolves.toBe(true);

  // key not existed
  promise = session.delete('foo');
  expect(client.hdel.mock).toHaveBeenCalledTimes(2);

  callback = client.hdel.mock.calls[1].args[2];
  callback(null, 0);
  await expect(promise).resolves.toBe(false);
});

test('#clear()', async () => {
  const manager = new RedisSessionManager(client);
  const session = manager.getSession(channel);

  client.mock.getter('del').fakeReturnValue(moxy());

  const promise = session.clear();
  expect(client.del.mock).toHaveBeenCalledTimes(1);
  expect(client.del.mock).toHaveBeenCalledWith(uid, expect.any(Function));

  const callback = client.del.mock.calls[0].args[1];
  callback(null, 1);
  await expect(promise).resolves.toBe(undefined);
});

describe('#update()', () => {
  beforeEach(() => {
    client.mock.getter('watch').fakeReturnValue(moxy());
    client.mock.getter('hget').fakeReturnValue(moxy());
    client.mock.getter('multi').fakeReturnValue(() =>
      moxy({
        hset() {
          return this;
        },
        exec() {},
      })
    );
  });

  it('update state with what update fn return and watch the key', async () => {
    const manager = new RedisSessionManager(client);
    const session = manager.getSession(channel);

    const updator = moxy(() => ({ bar: 'baz' }));
    const promise = session.update('foo', updator);

    expect(client.watch.mock).toHaveBeenCalledTimes(1);
    expect(client.watch.mock).toHaveBeenCalledWith(
      'so:many:tests:to:write',
      expect.any(Function)
    );
    let callback = client.watch.mock.calls[0].args[1];
    callback(null);
    await nextTick();

    expect(client.hget.mock).toHaveBeenCalledTimes(1);
    expect(client.hget.mock).toHaveBeenCalledWith(
      'so:many:tests:to:write',
      'foo',
      expect.any(Function)
    );
    callback = client.hget.mock.calls[0].args[2];
    callback(null, '{"abc":123}');
    await nextTick();

    expect(client.multi.mock).toHaveBeenCalledTimes(1);
    const mulitObj = client.multi.mock.calls[0].result;
    expect(mulitObj.hset.mock).toHaveBeenCalledTimes(1);
    expect(mulitObj.hset.mock).toHaveBeenCalledWith(
      'so:many:tests:to:write',
      'foo',
      '{"bar":"baz"}'
    );
    expect(mulitObj.exec.mock).toHaveBeenCalledTimes(1);
    callback = mulitObj.exec.mock.calls[0].args[0];
    callback(null, [1]);

    await expect(promise).resolves.toBe(undefined);

    expect(updator.mock).toHaveBeenCalledTimes(1);
    expect(updator.mock).toHaveBeenCalledWith({ abc: 123 });
  });

  it('retry until exec not disturbed', async () => {
    const manager = new RedisSessionManager(client);
    const session = manager.getSession(channel);

    const updator = moxy(() => ({ bar: 'baz' }));
    const promise = session.update('foo', updator);

    for (let i = 0; i < 5; i += 1) {
      expect(client.watch.mock).toHaveBeenCalledTimes(i + 1);
      let callback = client.watch.mock.calls[i].args[1];
      callback(null);
      await nextTick();

      expect(client.hget.mock).toHaveBeenCalledTimes(i + 1);
      callback = client.hget.mock.calls[i].args[2];
      callback(null, '{"abc":123}');
      await nextTick();

      expect(client.multi.mock).toHaveBeenCalledTimes(i + 1);
      const mulitObj = client.multi.mock.calls[i].result;
      callback = mulitObj.exec.mock.calls[0].args[0];
      callback(null, i < 4 ? null : [1]);
      await nextTick();
    }

    expect(client.watch.mock).toHaveBeenCalledTimes(5);
    expect(client.hget.mock).toHaveBeenCalledTimes(5);
    expect(client.multi.mock).toHaveBeenCalledTimes(5);

    await expect(promise).resolves.toBe(undefined);
    expect(updator.mock).toHaveBeenCalledTimes(5);
    expect(updator.mock).toHaveBeenCalledWith({ abc: 123 });
  });
});
