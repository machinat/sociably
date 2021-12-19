/* eslint-disable prefer-destructuring, no-await-in-loop */
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
  hgetall: resolveCallback(null),
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
    '$channel',
    controller.channelState({ platform: 'test', uid: 'foo' }),
    controller.channelState({ platform: 'test', uid: 'bar' }),
  ],
  [
    'channel state using uid',
    '$channel',
    controller.channelState('foo'),
    controller.channelState('bar'),
  ],
  [
    'user state',
    '$user',
    controller.userState({ platform: 'test', uid: 'foo' }),
    controller.userState({ platform: 'test', uid: 'bar' }),
  ],
  [
    'user state using uid',
    '$user',
    controller.userState('foo'),
    controller.userState('bar'),
  ],
  [
    'global state',
    '$global',
    controller.globalState('foo'),
    controller.globalState('bar'),
  ],
])('%s', (_, prefix, fooState, barState) => {
  test('#get()', async () => {
    await expect(fooState.get('key1')).resolves.toBe(undefined);
    expect(client.hget.mock).toHaveBeenCalledTimes(1);
    expect(client.hget.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      expect.any(Function)
    );

    client.hget.mock.fake(resolveCallback('"foo"'));
    await expect(fooState.get('key2')).resolves.toBe('foo');
    expect(client.hget.mock).toHaveBeenCalledTimes(2);
    expect(client.hget.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key2',
      expect.any(Function)
    );

    client.hget.mock.fake(resolveCallback('{"bar":"baz"}'));
    await expect(barState.get('key3')).resolves.toEqual({
      bar: 'baz',
    });
    expect(client.hget.mock).toHaveBeenCalledTimes(3);
    expect(client.hget.mock).toHaveBeenCalledWith(
      `${prefix}:bar`,
      'key3',
      expect.any(Function)
    );
  });

  test('#set()', async () => {
    await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
    expect(client.hset.mock).toHaveBeenCalledTimes(1);
    expect(client.hset.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      '"foo"',
      expect.any(Function)
    );

    client.hset.mock.fake(resolveCallback(0));

    await expect(fooState.set('key2', { bar: 'baz' })).resolves.toBe(true);
    expect(client.hset.mock).toHaveBeenCalledTimes(2);
    expect(client.hset.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key2',
      '{"bar":"baz"}',
      expect.any(Function)
    );

    await expect(barState.set('key3', [1, 2, 3])).resolves.toBe(true);
    expect(client.hset.mock).toHaveBeenCalledTimes(3);
    expect(client.hset.mock).toHaveBeenCalledWith(
      `${prefix}:bar`,
      'key3',
      '[1,2,3]',
      expect.any(Function)
    );
  });

  describe('#update()', () => {
    it('update value', async () => {
      const updator = moxy(() => 'foo');
      await expect(fooState.update('key1', updator)).resolves.toBe('foo');

      expect(client.hget.mock).toHaveBeenCalledTimes(1);
      expect(client.hset.mock).toHaveBeenCalledTimes(1);
      expect(client.hset.mock).toHaveBeenCalledWith(
        `${prefix}:foo`,
        'key1',
        '"foo"',
        expect.any(Function)
      );

      expect(updator.mock).toHaveBeenCalledTimes(1);
      expect(updator.mock).toHaveBeenCalledWith(undefined);

      updator.mock.fakeReturnValue({ bar: 'baz' });
      client.hget.mock.fake(resolveCallback('"foo"'));
      client.hset.mock.fake(resolveCallback(0));

      await expect(fooState.update('key2', updator)).resolves.toEqual({
        bar: 'baz',
      });
      expect(client.hget.mock).toHaveBeenCalledTimes(2);
      expect(client.hset.mock).toHaveBeenCalledTimes(2);
      expect(client.hset.mock).toHaveBeenCalledWith(
        `${prefix}:foo`,
        'key2',
        '{"bar":"baz"}',
        expect.any(Function)
      );

      expect(updator.mock).toHaveBeenCalledTimes(2);
      expect(updator.mock).toHaveBeenCalledWith('foo');
    });

    it('update value', async () => {
      const updator = moxy(() => undefined);
      client.hget.mock.fake(resolveCallback('"foo"'));
      client.hdel.mock.fake(resolveCallback(1));

      await expect(barState.update('key1', updator)).resolves.toBe(undefined);
      expect(client.hget.mock).toHaveBeenCalledTimes(1);
      expect(client.hset.mock).toHaveBeenCalledTimes(0);
      expect(client.hdel.mock).toHaveBeenCalledTimes(1);
      expect(client.hdel.mock).toHaveBeenCalledWith(
        `${prefix}:bar`,
        'key1',
        expect.any(Function)
      );
    });

    it('make no change is the new value is the same (shallow comparation)', async () => {
      const updator = moxy((oldValue) => oldValue);
      client.hget.mock.fake(resolveCallback('{"foo":"bar"}'));

      await expect(barState.update('key1', updator)).resolves.toEqual({
        foo: 'bar',
      });
      expect(client.hget.mock).toHaveBeenCalledTimes(1);
      expect(client.hset.mock).toHaveBeenCalledTimes(0);
      expect(client.hdel.mock).toHaveBeenCalledTimes(0);
    });
  });

  test('#delete()', async () => {
    await expect(fooState.delete('key1')).resolves.toBe(true);
    expect(client.hdel.mock).toHaveBeenCalledTimes(1);
    expect(client.hdel.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      expect.any(Function)
    );

    await expect(barState.delete('key1')).resolves.toBe(true);
    expect(client.hdel.mock).toHaveBeenCalledTimes(2);
    expect(client.hdel.mock).toHaveBeenCalledWith(
      `${prefix}:bar`,
      'key1',
      expect.any(Function)
    );

    client.hdel.mock.fake(resolveCallback(0));

    await expect(fooState.delete('key2')).resolves.toBe(false);
    expect(client.hdel.mock).toHaveBeenCalledTimes(3);
    expect(client.hdel.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key2',
      expect.any(Function)
    );
  });

  test('#clear()', async () => {
    await expect(fooState.clear()).resolves.toBe(undefined);
    expect(client.del.mock).toHaveBeenCalledTimes(1);
    expect(client.del.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      expect.any(Function)
    );

    client.del.mock.fake(resolveCallback(0));

    await expect(barState.clear()).resolves.toBe(undefined);
    expect(client.del.mock).toHaveBeenCalledTimes(2);
    expect(client.del.mock).toHaveBeenCalledWith(
      `${prefix}:bar`,
      expect.any(Function)
    );
  });

  test('#getAll()', async () => {
    await expect(fooState.getAll()).resolves.toEqual(new Map());
    expect(client.hgetall.mock).toHaveBeenCalledTimes(1);
    expect(client.hgetall.mock).toHaveBeenCalledWith(
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
    expect(client.hgetall.mock).toHaveBeenCalledTimes(2);
    expect(client.hgetall.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      expect.any(Function)
    );

    client.hgetall.mock.fake(resolveCallback({ key1: '123' }));
    await expect(barState.getAll()).resolves.toEqual(new Map([['key1', 123]]));
    expect(client.hgetall.mock).toHaveBeenCalledTimes(3);
    expect(client.hgetall.mock).toHaveBeenCalledWith(
      `${prefix}:bar`,
      expect.any(Function)
    );
  });

  test('custom marshaler', async () => {
    marshaler.marshal.mock.fake((value) => ({ value }));
    marshaler.unmarshal.mock.fake(({ value }) => value);

    client.hget.mock.fake(resolveCallback('{"value":"foo"}'));
    await expect(fooState.get('key2')).resolves.toBe('foo');
    expect(marshaler.unmarshal.mock).toHaveBeenCalledWith({ value: 'foo' });

    await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
    expect(marshaler.marshal.mock).toHaveBeenCalledWith('foo');
    expect(client.hset.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      '{"value":"foo"}',
      expect.any(Function)
    );

    const updator = moxy(() => 'bar');
    await expect(fooState.update('key1', updator)).resolves.toBe('bar');
    expect(client.hset.mock).toHaveBeenCalledWith(
      `${prefix}:foo`,
      'key1',
      '{"value":"bar"}',
      expect.any(Function)
    );

    expect(updator.mock).toHaveBeenCalledTimes(1);
    expect(updator.mock).toHaveBeenCalledWith('foo');

    client.hgetall.mock.fake(
      resolveCallback({ key1: '{"value":1}', key2: '{"value":2}' })
    );
    await expect(fooState.getAll()).resolves.toEqual(
      new Map([
        ['key1', 1],
        ['key2', 2],
      ])
    );
    expect(marshaler.unmarshal.mock).toHaveBeenCalledWith({ value: 1 });
    expect(marshaler.unmarshal.mock).toHaveBeenCalledWith({ value: 2 });
  });
});
