/* eslint-disable prefer-destructuring, no-await-in-loop */
import moxy from '@moxyjs/moxy';
import { RedisRepository } from '../repository';

const client = moxy({});

beforeEach(() => {
  client.mock.reset();
});

test('#get()', async () => {
  const hget = moxy((_, __, cb) => cb(null, null));
  client.mock.getter('hget').fakeReturnValue(hget);

  const repo = new RedisRepository(client);

  await expect(repo.get('my_resource', 'key1')).resolves.toBe(undefined);
  expect(hget.mock).toHaveBeenCalledTimes(1);
  expect(hget.mock).toHaveBeenCalledWith(
    'my_resource',
    'key1',
    expect.any(Function)
  );

  hget.mock.fake((_, __, cb) => cb(null, '"foo"'));
  await expect(repo.get('my_resource', 'key1')).resolves.toBe('foo');
  expect(client.hget.mock).toHaveBeenCalledTimes(2);

  hget.mock.fake((_, __, cb) => cb(null, '{"bar":"baz"}'));
  await expect(repo.get('my_resource', 'key1')).resolves.toEqual({
    bar: 'baz',
  });
  expect(client.hget.mock).toHaveBeenCalledTimes(3);
});

test('#set()', async () => {
  const hset = moxy((_, __, ___, cb) => cb(null, 1));
  client.mock.getter('hset').fakeReturnValue(hset);

  const repo = new RedisRepository(client);

  await expect(repo.set('my_resource', 'key1', 'foo')).resolves.toBe(true);
  expect(hset.mock).toHaveBeenCalledTimes(1);
  expect(hset.mock).toHaveBeenCalledWith(
    'my_resource',
    'key1',
    '"foo"',
    expect.any(Function)
  );

  hset.mock.fake((_, __, ___, cb) => cb(null, 0));

  await expect(repo.set('my_resource', 'key1', { bar: 'baz' })).resolves.toBe(
    false
  );
  expect(hset.mock).toHaveBeenCalledTimes(2);
  expect(hset.mock).toHaveBeenCalledWith(
    'my_resource',
    'key1',
    '{"bar":"baz"}',
    expect.any(Function)
  );
});

test('#delete()', async () => {
  const hdel = moxy((_, __, cb) => cb(null, 1));
  client.mock.getter('hdel').fakeReturnValue(hdel);

  const repo = new RedisRepository(client);

  await expect(repo.delete('my_resource', 'key1')).resolves.toBe(true);
  expect(hdel.mock).toHaveBeenCalledTimes(1);
  expect(hdel.mock).toHaveBeenCalledWith(
    'my_resource',
    'key1',
    expect.any(Function)
  );

  hdel.mock.fake((_, __, cb) => cb(null, 0));

  await expect(repo.delete('my_resource', 'key1')).resolves.toBe(false);
  expect(hdel.mock).toHaveBeenCalledTimes(2);
});

test('#clear()', async () => {
  const del = moxy((_, cb) => cb(null, 1));
  client.mock.getter('del').fakeReturnValue(del);

  const repo = new RedisRepository(client);

  await expect(repo.clear('my_resource')).resolves.toBe(undefined);
  expect(del.mock).toHaveBeenCalledTimes(1);
  expect(del.mock).toHaveBeenCalledWith('my_resource', expect.any(Function));

  del.mock.fake((_, cb) => cb(null, 0));

  await expect(repo.clear('my_resource')).resolves.toBe(undefined);
  expect(del.mock).toHaveBeenCalledTimes(2);
});

test('#getAll()', async () => {
  const hgetall = moxy((_, cb) => cb(null, null));
  client.mock.getter('hgetall').fakeReturnValue(hgetall);

  const repo = new RedisRepository(client);

  await expect(repo.getAll('my_resource')).resolves.toBe(null);
  expect(hgetall.mock).toHaveBeenCalledTimes(1);
  expect(hgetall.mock).toHaveBeenCalledWith(
    'my_resource',
    expect.any(Function)
  );

  hgetall.mock.fake((_, cb) =>
    cb(null, { key1: '"foo"', key2: '{"bar":["baz"]}' })
  );
  await expect(repo.getAll('my_resource')).resolves.toMatchInlineSnapshot(`
          Map {
            "key1" => "foo",
            "key2" => Object {
              "bar": Array [
                "baz",
              ],
            },
          }
        `);
  expect(hgetall.mock).toHaveBeenCalledTimes(2);
});
