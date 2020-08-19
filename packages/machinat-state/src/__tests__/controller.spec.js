import moxy from '@moxyjs/moxy';
import { StateController } from '../controller';

const repository = moxy({
  get: () => null,
  set: () => false,
  delete: () => false,
  getAll: () => null,
  clear: () => {},
});

beforeEach(() => {
  repository.mock.reset();
});

test('channel state', async () => {
  const manager = new StateController(repository);
  const channel = { uid: 'foo.channel' };

  const state = manager.channelState(channel);

  // get
  await expect(state.get('foo_status')).resolves.toBe(null);

  expect(repository.get.mock).toHaveBeenCalledTimes(1);
  expect(repository.get.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "chan:foo.channel",
      "foo_status",
    ]
  `);

  repository.get.mock.fake(async () => ({ bar: 'YEEEAAAH!' }));

  await expect(state.get('foo_status')).resolves.toEqual({ bar: 'YEEEAAAH!' });
  expect(repository.get.mock).toHaveBeenCalledTimes(2);

  // set
  const updator = moxy(() => ({ bar: 'BEER!' }));
  await expect(state.set('foo_status', updator)).resolves.toBe(false);

  expect(updator.mock).toHaveBeenCalledTimes(1);
  expect(updator.mock).toHaveBeenCalledWith({ bar: 'YEEEAAAH!' });

  expect(repository.set.mock).toHaveBeenCalledTimes(1);
  expect(repository.set.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "chan:foo.channel",
      "foo_status",
      Object {
        "bar": "BEER!",
      },
    ]
  `);

  repository.get.mock.fake(async () => null);
  repository.set.mock.fake(async () => true);
  updator.mock.fake(() => ({ bar: 'DRUNK' }));

  await expect(state.set('foo_status', updator)).resolves.toBe(true);
  expect(updator.mock).toHaveBeenCalledTimes(2);
  expect(updator.mock).toHaveBeenCalledWith(null);

  expect(repository.get.mock).toHaveBeenCalledTimes(4);
  expect(repository.set.mock).toHaveBeenCalledTimes(2);

  // delete
  await expect(state.delete('foo_status')).resolves.toBe(false);

  expect(repository.delete.mock).toHaveBeenCalledTimes(1);
  expect(repository.delete.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "chan:foo.channel",
      "foo_status",
    ]
  `);

  repository.delete.mock.fake(async () => true);

  await expect(state.delete('foo_status')).resolves.toBe(true);
  expect(repository.delete.mock).toHaveBeenCalledTimes(2);

  // getAll
  await expect(state.getAll()).resolves.toBe(null);

  expect(repository.getAll.mock).toHaveBeenCalledTimes(1);
  expect(repository.getAll.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "chan:foo.channel",
    ]
  `);

  repository.getAll.mock.fake(
    async () =>
      new Map([
        ['foo_status', 'HANGOVER'],
        ['bar_status', { revenue: '++' }],
      ])
  );

  await expect(state.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "foo_status" => "HANGOVER",
            "bar_status" => Object {
              "revenue": "++",
            },
          }
        `);
  expect(repository.getAll.mock).toHaveBeenCalledTimes(2);
});

test('user state', async () => {
  const manager = new StateController(repository);
  const user = { uid: 'john.doe' };

  const state = manager.userState(user);

  // get
  await expect(state.get('foo_status')).resolves.toBe(null);

  expect(repository.get.mock).toHaveBeenCalledTimes(1);
  expect(repository.get.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "user:john.doe",
      "foo_status",
    ]
  `);

  repository.get.mock.fake(async () => ({ bar: 'YEEEAAAH!' }));

  await expect(state.get('foo_status')).resolves.toEqual({ bar: 'YEEEAAAH!' });
  expect(repository.get.mock).toHaveBeenCalledTimes(2);

  // set
  const updator = moxy(() => ({ bar: 'BEER!' }));
  await expect(state.set('foo_status', updator)).resolves.toBe(false);

  expect(updator.mock).toHaveBeenCalledTimes(1);
  expect(updator.mock).toHaveBeenCalledWith({ bar: 'YEEEAAAH!' });

  expect(repository.set.mock).toHaveBeenCalledTimes(1);
  expect(repository.set.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "user:john.doe",
      "foo_status",
      Object {
        "bar": "BEER!",
      },
    ]
  `);

  repository.get.mock.fake(async () => null);
  repository.set.mock.fake(async () => true);
  updator.mock.fake(() => ({ bar: 'DRUNK' }));

  await expect(state.set('foo_status', updator)).resolves.toBe(true);
  expect(updator.mock).toHaveBeenCalledTimes(2);
  expect(updator.mock).toHaveBeenCalledWith(null);

  expect(repository.get.mock).toHaveBeenCalledTimes(4);
  expect(repository.set.mock).toHaveBeenCalledTimes(2);

  // delete
  await expect(state.delete('foo_status')).resolves.toBe(false);

  expect(repository.delete.mock).toHaveBeenCalledTimes(1);
  expect(repository.delete.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "user:john.doe",
      "foo_status",
    ]
  `);

  repository.delete.mock.fake(async () => true);

  await expect(state.delete('foo_status')).resolves.toBe(true);
  expect(repository.delete.mock).toHaveBeenCalledTimes(2);

  // getAll
  await expect(state.getAll()).resolves.toBe(null);

  expect(repository.getAll.mock).toHaveBeenCalledTimes(1);
  expect(repository.getAll.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "user:john.doe",
    ]
  `);

  repository.getAll.mock.fake(
    async () =>
      new Map([
        ['foo_status', 'HANGOVER'],
        ['bar_status', { revenue: '++' }],
      ])
  );

  await expect(state.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "foo_status" => "HANGOVER",
            "bar_status" => Object {
              "revenue": "++",
            },
          }
        `);
  expect(repository.getAll.mock).toHaveBeenCalledTimes(2);
});

test('named state', async () => {
  const manager = new StateController(repository);

  const state = manager.globalState('_HELLO_STATE_');

  // get
  await expect(state.get('foo_status')).resolves.toBe(null);

  expect(repository.get.mock).toHaveBeenCalledTimes(1);
  expect(repository.get.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "_HELLO_STATE_",
      "foo_status",
    ]
  `);

  repository.get.mock.fake(async () => ({ bar: 'YEEEAAAH!' }));

  await expect(state.get('foo_status')).resolves.toEqual({ bar: 'YEEEAAAH!' });
  expect(repository.get.mock).toHaveBeenCalledTimes(2);

  // set
  const updator = moxy(() => ({ bar: 'BEER!' }));
  await expect(state.set('foo_status', updator)).resolves.toBe(false);

  expect(updator.mock).toHaveBeenCalledTimes(1);
  expect(updator.mock).toHaveBeenCalledWith({ bar: 'YEEEAAAH!' });

  expect(repository.set.mock).toHaveBeenCalledTimes(1);
  expect(repository.set.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "_HELLO_STATE_",
      "foo_status",
      Object {
        "bar": "BEER!",
      },
    ]
  `);

  repository.get.mock.fake(async () => null);
  repository.set.mock.fake(async () => true);
  updator.mock.fake(() => ({ bar: 'DRUNK' }));

  await expect(state.set('foo_status', updator)).resolves.toBe(true);
  expect(updator.mock).toHaveBeenCalledTimes(2);
  expect(updator.mock).toHaveBeenCalledWith(null);

  expect(repository.get.mock).toHaveBeenCalledTimes(4);
  expect(repository.set.mock).toHaveBeenCalledTimes(2);

  // delete
  await expect(state.delete('foo_status')).resolves.toBe(false);

  expect(repository.delete.mock).toHaveBeenCalledTimes(1);
  expect(repository.delete.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "_HELLO_STATE_",
      "foo_status",
    ]
  `);

  repository.delete.mock.fake(async () => true);

  await expect(state.delete('foo_status')).resolves.toBe(true);
  expect(repository.delete.mock).toHaveBeenCalledTimes(2);

  // getAll
  await expect(state.getAll()).resolves.toBe(null);

  expect(repository.getAll.mock).toHaveBeenCalledTimes(1);
  expect(repository.getAll.mock.calls[0].args).toMatchInlineSnapshot(`
    Array [
      "_HELLO_STATE_",
    ]
  `);

  repository.getAll.mock.fake(
    async () =>
      new Map([
        ['foo_status', 'HANGOVER'],
        ['bar_status', { revenue: '++' }],
      ])
  );

  await expect(state.getAll()).resolves.toMatchInlineSnapshot(`
          Map {
            "foo_status" => "HANGOVER",
            "bar_status" => Object {
              "revenue": "++",
            },
          }
        `);
  expect(repository.getAll.mock).toHaveBeenCalledTimes(2);
});
