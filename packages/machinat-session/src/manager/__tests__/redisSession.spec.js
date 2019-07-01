/* eslint-disable prefer-destructuring */
import moxy from 'moxy';
import redis from 'redis';
import RedisSessionManager from '../redisSession';

jest.mock('redis');

beforeEach(() => {
  redis.mock.reset();
  redis.createClient.mock.fake(() => moxy());
});

it('work', async () => {
  const options = {
    host: 'www.myredis.io',
    port: '6666',
    password: '_too_many_secrets',
    db: 7,
  };
  const manager = new RedisSessionManager(options);
  expect(manager.options).toBe(options);

  expect(redis.createClient.mock).toHaveBeenCalledTimes(1);
  expect(redis.createClient.mock).toHaveBeenCalledWith({
    host: 'www.myredis.io',
    port: '6666',
    password: '_too_many_secrets',
    db: 7,
  });

  const client = redis.createClient.mock.calls[0].result;

  client.mock.getter('hset').fakeReturnValue(moxy());
  client.mock.getter('hget').fakeReturnValue(moxy());
  client.mock.getter('hdel').fakeReturnValue(moxy());
  client.mock.getter('del').fakeReturnValue(moxy());

  const uid = 'so:many:tests:to:write';
  const session = manager.getSession({
    platform: 'test',
    type: 'test',
    uid,
  });

  // #set with string value
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

  // #get with string value
  promise = session.get('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(1);
  expect(client.hget.mock).toHaveBeenCalledWith(
    uid,
    'foo',
    expect.any(Function)
  );

  callback = client.hget.mock.calls[0].args[2];
  callback(null, '"bar"');
  await expect(promise).resolves.toBe('bar');

  // #set with object value
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

  // #get with object value
  promise = session.get('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(2);

  callback = client.hget.mock.calls[1].args[2];
  callback(null, '{"bar":"baz"}');
  await expect(promise).resolves.toEqual({ bar: 'baz' });

  // #delete successfully
  promise = session.delete('foo');
  expect(client.hdel.mock).toHaveBeenCalledTimes(1);
  expect(client.hdel.mock).toHaveBeenCalledWith(
    uid,
    'foo',
    expect.any(Function)
  );

  callback = client.hdel.mock.calls[0].args[2];
  callback(null, 1);
  await expect(promise).resolves.toBe(true);

  // #delete with key not existed
  promise = session.delete('foo');
  expect(client.hdel.mock).toHaveBeenCalledTimes(2);

  callback = client.hdel.mock.calls[1].args[2];
  callback(null, 0);
  await expect(promise).resolves.toBe(false);

  // #get with key not existed
  promise = session.get('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(3);

  callback = client.hget.mock.calls[2].args[2];
  callback(null, null);
  await expect(promise).resolves.toBe(undefined);

  // #clear
  promise = session.clear();
  expect(client.del.mock).toHaveBeenCalledTimes(1);
  expect(client.del.mock).toHaveBeenCalledWith(uid, expect.any(Function));

  callback = client.del.mock.calls[0].args[1];
  callback(null, 1);
  await expect(promise).resolves.toBe(undefined);
});
