/* eslint-disable no-await-in-loop */
import type { RedisClient } from 'redis';
import moxy from '@moxyjs/moxy';
import { RedisStateController } from '../controller';

const resolveCallback =
  (result) =>
  (...args) => {
    args[args.length - 1](null, result);
  };

const client = moxy<RedisClient>({
  hget: resolveCallback(null),
  hset: resolveCallback(1),
  hdel: resolveCallback(1),
  del: resolveCallback(1),
  hkeys: resolveCallback([]),
  hgetall: resolveCallback(null),
  set: resolveCallback('OK'),
  expire: resolveCallback(1),
} as never);

const marshaler = moxy({
  marshal: (x) => x,
  unmarshal: (x) => x,
});

beforeEach(() => {
  client.mock.reset();
  marshaler.mock.reset();
});

const controller = new RedisStateController(client, marshaler);

describe.each([
  [
    'channel state',
    'C',
    controller.channelState({ platform: 'test', uid: 'foo' }),
    controller.channelState({ platform: 'test', uid: 'bar' }),
  ],
  [
    'channel state using uid',
    'C',
    controller.channelState('foo'),
    controller.channelState('bar'),
  ],
  [
    'user state',
    'U',
    controller.userState({ platform: 'test', uid: 'foo' }),
    controller.userState({ platform: 'test', uid: 'bar' }),
  ],
  [
    'user state using uid',
    'U',
    controller.userState('foo'),
    controller.userState('bar'),
  ],
  [
    'global state',
    'G',
    controller.globalState('foo'),
    controller.globalState('bar'),
  ],
])('%s', (_, prefix, fooState, barState) => {
  test('.get()', async () => {
    await expect(fooState.get('key1')).resolves.toBe(undefined);
    expect(client.hget).toHaveBeenCalledTimes(1);
    expect(client.hget).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      expect.any(Function)
    );

    client.hget.mock.fake(resolveCallback('"foo"'));
    await expect(fooState.get('key2')).resolves.toBe('foo');
    expect(client.hget).toHaveBeenCalledTimes(2);
    expect(client.hget).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key2',
      expect.any(Function)
    );

    client.hget.mock.fake(resolveCallback('{"bar":"baz"}'));
    await expect(barState.get('key3')).resolves.toEqual({
      bar: 'baz',
    });
    expect(client.hget).toHaveBeenCalledTimes(3);
    expect(client.hget).toHaveBeenCalledWith(
      `${prefix}:bar`,
      'key3',
      expect.any(Function)
    );
  });

  test('.set()', async () => {
    await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
    expect(client.hset).toHaveBeenCalledTimes(1);
    expect(client.hset).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      '"foo"',
      expect.any(Function)
    );

    client.hset.mock.fake(resolveCallback(0));

    await expect(fooState.set('key2', { bar: 'baz' })).resolves.toBe(true);
    expect(client.hset).toHaveBeenCalledTimes(2);
    expect(client.hset).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key2',
      '{"bar":"baz"}',
      expect.any(Function)
    );

    await expect(barState.set('key3', [1, 2, 3])).resolves.toBe(true);
    expect(client.hset).toHaveBeenCalledTimes(3);
    expect(client.hset).toHaveBeenCalledWith(
      `${prefix}:bar`,
      'key3',
      '[1,2,3]',
      expect.any(Function)
    );
  });

  describe('.update()', () => {
    it('update value', async () => {
      const updator = moxy(() => 'foo');
      await expect(fooState.update('key1', updator)).resolves.toBe('foo');

      expect(client.hget).toHaveBeenCalledTimes(1);
      expect(client.hset).toHaveBeenCalledTimes(1);
      expect(client.hset).toHaveBeenCalledWith(
        `${prefix}:foo`,
        'key1',
        '"foo"',
        expect.any(Function)
      );

      expect(updator).toHaveBeenCalledTimes(1);
      expect(updator).toHaveBeenCalledWith(undefined);

      updator.mock.fakeReturnValue({ bar: 'baz' });
      client.hget.mock.fake(resolveCallback('"foo"'));
      client.hset.mock.fake(resolveCallback(0));

      await expect(fooState.update('key2', updator)).resolves.toEqual({
        bar: 'baz',
      });
      expect(client.hget).toHaveBeenCalledTimes(2);
      expect(client.hset).toHaveBeenCalledTimes(2);
      expect(client.hset).toHaveBeenCalledWith(
        `${prefix}:foo`,
        'key2',
        '{"bar":"baz"}',
        expect.any(Function)
      );

      expect(updator).toHaveBeenCalledTimes(2);
      expect(updator).toHaveBeenCalledWith('foo');
    });

    it('delete value if updater returns `undefined`', async () => {
      const updator = moxy(() => undefined);
      client.hget.mock.fake(resolveCallback('"foo"'));
      client.hdel.mock.fake(resolveCallback(1));

      await expect(barState.update('key1', updator)).resolves.toBe(undefined);
      expect(client.hget).toHaveBeenCalledTimes(1);
      expect(client.hset).toHaveBeenCalledTimes(0);
      expect(client.hdel).toHaveBeenCalledTimes(1);
      expect(client.hdel).toHaveBeenCalledWith(
        `${prefix}:bar`,
        'key1',
        expect.any(Function)
      );
    });

    it('make no change if the new value is the identical', async () => {
      const updator = moxy((oldValue) => oldValue);
      client.hget.mock.fake(resolveCallback('{"foo":"bar"}'));

      await expect(barState.update('key1', updator)).resolves.toEqual({
        foo: 'bar',
      });
      expect(client.hget).toHaveBeenCalledTimes(1);
      expect(client.hset).toHaveBeenCalledTimes(0);
      expect(client.hdel).toHaveBeenCalledTimes(0);
    });
  });

  test('.delete()', async () => {
    await expect(fooState.delete('key1')).resolves.toBe(true);
    expect(client.hdel).toHaveBeenCalledTimes(1);
    expect(client.hdel).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      expect.any(Function)
    );

    await expect(barState.delete('key1')).resolves.toBe(true);
    expect(client.hdel).toHaveBeenCalledTimes(2);
    expect(client.hdel).toHaveBeenCalledWith(
      `${prefix}:bar`,
      'key1',
      expect.any(Function)
    );

    client.hdel.mock.fake(resolveCallback(0));

    await expect(fooState.delete('key2')).resolves.toBe(false);
    expect(client.hdel).toHaveBeenCalledTimes(3);
    expect(client.hdel).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key2',
      expect.any(Function)
    );
  });

  test('.clear()', async () => {
    await expect(fooState.clear()).resolves.toBe(undefined);
    expect(client.del).toHaveBeenCalledTimes(1);
    expect(client.del).toHaveBeenCalledWith(
      `${prefix}:foo`,
      expect.any(Function)
    );

    client.del.mock.fake(resolveCallback(0));

    await expect(barState.clear()).resolves.toBe(undefined);
    expect(client.del).toHaveBeenCalledTimes(2);
    expect(client.del).toHaveBeenCalledWith(
      `${prefix}:bar`,
      expect.any(Function)
    );
  });

  test('.keys()', async () => {
    await expect(fooState.keys()).resolves.toEqual([]);
    expect(client.hkeys).toHaveBeenCalledTimes(1);
    expect(client.hkeys).toHaveBeenCalledWith(
      `${prefix}:foo`,
      expect.any(Function)
    );

    client.hkeys.mock.fake(resolveCallback(['foo', 'bar']));
    await expect(fooState.keys()).resolves.toEqual(['foo', 'bar']);
    expect(client.hkeys).toHaveBeenCalledTimes(2);

    client.hkeys.mock.fake(resolveCallback(['bar', 'baz']));
    await expect(barState.keys()).resolves.toEqual(['bar', 'baz']);
    expect(client.hkeys).toHaveBeenCalledTimes(3);
    expect(client.hkeys).toHaveBeenCalledWith(
      `${prefix}:bar`,
      expect.any(Function)
    );
  });

  test('.getAll()', async () => {
    await expect(fooState.getAll()).resolves.toEqual(new Map());
    expect(client.hgetall).toHaveBeenCalledTimes(1);
    expect(client.hgetall).toHaveBeenCalledWith(
      `${prefix}:foo`,
      expect.any(Function)
    );

    client.hgetall.mock.fake(
      resolveCallback({ key1: '"foo"', key2: '{"bar":["baz"]}' })
    );
    await expect(fooState.getAll()).resolves.toEqual(
      new Map<string, any>([
        ['key1', 'foo'],
        ['key2', { bar: ['baz'] }],
      ])
    );
    expect(client.hgetall).toHaveBeenCalledTimes(2);

    client.hgetall.mock.fake(resolveCallback({ key1: '123' }));
    await expect(barState.getAll()).resolves.toEqual(new Map([['key1', 123]]));
    expect(client.hgetall).toHaveBeenCalledTimes(3);
    expect(client.hgetall).toHaveBeenCalledWith(
      `${prefix}:bar`,
      expect.any(Function)
    );
  });

  test('custom marshaler', async () => {
    marshaler.marshal.mock.fake((value) => ({ value }));
    marshaler.unmarshal.mock.fake(({ value }) => value);

    client.hget.mock.fake(resolveCallback('{"value":"foo"}'));
    await expect(fooState.get('key2')).resolves.toBe('foo');
    expect(marshaler.unmarshal).toHaveBeenCalledWith({ value: 'foo' });

    await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
    expect(marshaler.marshal).toHaveBeenCalledWith('foo');
    expect(client.hset).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      '{"value":"foo"}',
      expect.any(Function)
    );

    const updator = moxy(() => 'bar');
    await expect(fooState.update('key1', updator)).resolves.toBe('bar');
    expect(client.hset).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      '{"value":"bar"}',
      expect.any(Function)
    );

    expect(updator).toHaveBeenCalledTimes(1);
    expect(updator).toHaveBeenCalledWith('foo');

    client.hgetall.mock.fake(
      resolveCallback({ key1: '{"value":1}', key2: '{"value":2}' })
    );
    await expect(fooState.getAll()).resolves.toEqual(
      new Map([
        ['key1', 1],
        ['key2', 2],
      ])
    );
    expect(marshaler.unmarshal).toHaveBeenCalledWith({ value: 1 });
    expect(marshaler.unmarshal).toHaveBeenCalledWith({ value: 2 });
  });
});

test('.callClient(method, ...params)', async () => {
  await expect(controller.callClient('set', 'foo', 'bar')).resolves.toBe('OK');
  expect(client.set).toHaveBeenCalledTimes(1);
  expect(client.set).toHaveBeenCalledWith('foo', 'bar', expect.any(Function));

  await expect(controller.callClient('expire', 'foo', 100)).resolves.toBe(1);
  expect(client.expire).toHaveBeenCalledTimes(1);
  expect(client.expire).toHaveBeenCalledWith('foo', 100, expect.any(Function));
});
