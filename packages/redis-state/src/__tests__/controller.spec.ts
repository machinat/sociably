/* eslint-disable prefer-destructuring, no-await-in-loop */
import moxy from '@moxyjs/moxy';
import { RedisStateController } from '../controller';

const client = moxy({});

beforeEach(() => {
  client.mock.reset();
});

const controller = new RedisStateController(client);

describe.each([
  [
    'channel',
    controller.channelState({ platform: 'x', uid: 'foo' }),
    controller.channelState({ platform: 'x', uid: 'bar' }),
  ],
  [
    'user',
    controller.userState({ platform: 'x', uid: 'foo' }),
    controller.userState({ platform: 'x', uid: 'bar' }),
  ],
  ['global', controller.globalState('foo'), controller.globalState('bar')],
])('%s state', (type, fooState, barState) => {
  test('#get()', async () => {
    const hget = moxy((_, __, cb) => cb(null, null));
    client.mock.getter('hget').fakeReturnValue(hget);

    await expect(fooState.get('key1')).resolves.toBe(undefined);
    expect(hget.mock).toHaveBeenCalledTimes(1);
    expect(hget.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      'key1',
      expect.any(Function)
    );

    hget.mock.fake((_, __, cb) => cb(null, '"foo"'));
    await expect(fooState.get('key2')).resolves.toBe('foo');
    expect(client.hget.mock).toHaveBeenCalledTimes(2);
    expect(hget.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      'key2',
      expect.any(Function)
    );

    hget.mock.fake((_, __, cb) => cb(null, '{"bar":"baz"}'));
    await expect(barState.get('key3')).resolves.toEqual({
      bar: 'baz',
    });
    expect(client.hget.mock).toHaveBeenCalledTimes(3);
    expect(hget.mock).toHaveBeenCalledWith(
      `${type}:bar`,
      'key3',
      expect.any(Function)
    );
  });

  test('#set()', async () => {
    const hset = moxy((_, __, ___, cb) => cb(null, 1));
    client.mock.getter('hset').fakeReturnValue(hset);

    await expect(fooState.set('key1', 'foo')).resolves.toBe(true);
    expect(hset.mock).toHaveBeenCalledTimes(1);
    expect(hset.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      'key1',
      '"foo"',
      expect.any(Function)
    );

    hset.mock.fake((_, __, ___, cb) => cb(null, 0));

    await expect(fooState.set('key2', { bar: 'baz' })).resolves.toBe(false);
    expect(hset.mock).toHaveBeenCalledTimes(2);
    expect(hset.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      'key2',
      '{"bar":"baz"}',
      expect.any(Function)
    );

    await expect(barState.set('key3', [1, 2, 3])).resolves.toBe(false);
    expect(hset.mock).toHaveBeenCalledTimes(3);
    expect(hset.mock).toHaveBeenCalledWith(
      `${type}:bar`,
      'key3',
      '[1,2,3]',
      expect.any(Function)
    );
  });

  test('#delete()', async () => {
    const hdel = moxy((_, __, cb) => cb(null, 1));
    client.mock.getter('hdel').fakeReturnValue(hdel);

    await expect(fooState.delete('key1')).resolves.toBe(true);
    expect(hdel.mock).toHaveBeenCalledTimes(1);
    expect(hdel.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      'key1',
      expect.any(Function)
    );

    await expect(barState.delete('key1')).resolves.toBe(true);
    expect(hdel.mock).toHaveBeenCalledTimes(2);
    expect(hdel.mock).toHaveBeenCalledWith(
      `${type}:bar`,
      'key1',
      expect.any(Function)
    );

    hdel.mock.fake((_, __, cb) => cb(null, 0));

    await expect(fooState.delete('key2')).resolves.toBe(false);
    expect(hdel.mock).toHaveBeenCalledTimes(3);
    expect(hdel.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      'key2',
      expect.any(Function)
    );
  });

  test('#clear()', async () => {
    const del = moxy((_, cb) => cb(null, 1));
    client.mock.getter('del').fakeReturnValue(del);

    await expect(fooState.clear()).resolves.toBe(undefined);
    expect(del.mock).toHaveBeenCalledTimes(1);
    expect(del.mock).toHaveBeenCalledWith(`${type}:foo`, expect.any(Function));

    del.mock.fake((_, cb) => cb(null, 0));

    await expect(barState.clear()).resolves.toBe(undefined);
    expect(del.mock).toHaveBeenCalledTimes(2);
    expect(del.mock).toHaveBeenCalledWith(`${type}:bar`, expect.any(Function));
  });

  test('#getAll()', async () => {
    const hgetall = moxy((_, cb) => cb(null, null));
    client.mock.getter('hgetall').fakeReturnValue(hgetall);

    await expect(fooState.getAll()).resolves.toEqual(new Map());
    expect(hgetall.mock).toHaveBeenCalledTimes(1);
    expect(hgetall.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      expect.any(Function)
    );

    hgetall.mock.fake((_, cb) =>
      cb(null, { key1: '"foo"', key2: '{"bar":["baz"]}' })
    );
    await expect(fooState.getAll()).resolves.toEqual(
      new Map<string, any>([
        ['key1', 'foo'],
        ['key2', { bar: ['baz'] }],
      ])
    );
    expect(hgetall.mock).toHaveBeenCalledTimes(2);
    expect(hgetall.mock).toHaveBeenCalledWith(
      `${type}:foo`,
      expect.any(Function)
    );

    hgetall.mock.fake((_, cb) => cb(null, { key1: '123' }));
    await expect(barState.getAll()).resolves.toEqual(new Map([['key1', 123]]));
    expect(hgetall.mock).toHaveBeenCalledTimes(3);
    expect(hgetall.mock).toHaveBeenCalledWith(
      `${type}:bar`,
      expect.any(Function)
    );
  });
});
