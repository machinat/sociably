import { moxy } from '@moxyjs/moxy';
import { InMemoryStateController } from '../controller.js';

const controller = new InMemoryStateController();

const fooInstance = {
  $$typeofChannel: true as const,
  $$typeofThread: true as const,
  $$typeofUser: true as const,
  platform: 'test',
  uid: 'test.foo',
  uniqueIdentifier: {
    platform: 'test',
    id: 'foo',
  },
};

test.each([
  [
    'channel',
    controller.channelState(fooInstance),
    controller.channelState('teat.bar'),
  ],
  [
    'thread',
    controller.threadState(fooInstance),
    controller.threadState('teat.bar'),
  ],
  ['user', controller.userState(fooInstance), controller.userState('test.bar')],
  ['global', controller.globalState('FOO'), controller.globalState('BAR')],
])('%s state', async (_, fooState, barState) => {
  const updator = moxy(() => undefined);

  await expect(fooState.get('key1')).resolves.toBe(undefined);

  await expect(fooState.set('key1', 'foo')).resolves.toBe(false);
  await expect(fooState.get('key1')).resolves.toBe('foo');

  updator.mock.fakeReturnValue('bar');
  await expect(fooState.update('key1', updator)).resolves.toBe('bar');
  expect(updator).toHaveBeenNthCalledWith(1, 'foo');
  await expect(fooState.get('key1')).resolves.toBe('bar');

  updator.mock.fakeReturnValue('baz');
  await expect(fooState.update('key2', updator)).resolves.toBe('baz');
  expect(updator).toHaveBeenNthCalledWith(2, undefined);
  await expect(fooState.get('key2')).resolves.toBe('baz');
  await expect(fooState.keys()).resolves.toEqual(['key1', 'key2']);
  await expect(fooState.getAll()).resolves.toEqual(
    new Map([
      ['key1', 'bar'],
      ['key2', 'baz'],
    ])
  );

  await expect(
    barState.set('key1', { foo: { bar: { baz: 'bae' } } })
  ).resolves.toBe(false);
  await expect(barState.get('key1')).resolves.toEqual({
    foo: { bar: { baz: 'bae' } },
  });
  await expect(barState.keys()).resolves.toEqual(['key1']);
  await expect(barState.getAll()).resolves.toEqual(
    new Map([['key1', { foo: { bar: { baz: 'bae' } } }]])
  );

  await expect(fooState.delete('key2')).resolves.toBe(true);
  await expect(fooState.get('key2')).resolves.toBe(undefined);

  await expect(fooState.delete('key2')).resolves.toBe(false);
  await expect(fooState.keys()).resolves.toEqual(['key1']);
  await expect(fooState.getAll()).resolves.toEqual(new Map([['key1', 'bar']]));

  updator.mock.fakeReturnValue(undefined);
  await expect(fooState.update('key1', updator)).resolves.toBe(undefined);
  expect(updator).toHaveBeenCalledWith('bar');
  await expect(fooState.keys()).resolves.toEqual([]);
  await expect(fooState.getAll()).resolves.toEqual(new Map());

  await expect(barState.clear()).resolves.toBe(1);
  await expect(barState.get('key1')).resolves.toBe(undefined);
  await expect(barState.keys()).resolves.toEqual([]);
  await expect(barState.getAll()).resolves.toEqual(new Map());
});
