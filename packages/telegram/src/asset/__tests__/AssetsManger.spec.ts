import moxy from '@moxyjs/moxy';
import type StateControllerI from '@machinat/core/base/StateController';
import type { TelegramBot } from '../../Bot';
import { TelegramAssetsManager } from '../AssetsManager';

const state = moxy({
  get: async () => null,
  set: async () => false,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const stateController = moxy<StateControllerI>({
  globalState() {
    return state;
  },
} as never);

const bot = moxy<TelegramBot>({
  id: 123456,
  makeApiCall() {},
} as never);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new TelegramAssetsManager(stateController, bot);

  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getFile('my_file')).resolves.toBe(undefined);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(state.get.mock).toHaveBeenCalledTimes(2);

  state.get.mock.fakeReturnValue('_FOO_BAR_ID_');
  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe('_FOO_BAR_ID_');

  state.get.mock.fakeReturnValue('_FILE_ID_');
  await expect(manager.getFile('my_file')).resolves.toBe('_FILE_ID_');

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map((c) => c.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
    ]
  `);

  expect(state.get.mock).toHaveBeenCalledTimes(4);
  expect(state.get.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(2, 'my_file');
  expect(state.get.mock).toHaveBeenNthCalledWith(3, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(4, 'my_file');
});

test('set asset id', async () => {
  const manager = new TelegramAssetsManager(stateController, bot);

  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(false);
  await expect(manager.saveFile('my_file', '_FILE_ID_')).resolves.toBe(false);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(2);
  expect(state.set.mock).toHaveBeenNthCalledWith(1, 'bar', 'baz');
  expect(state.set.mock).toHaveBeenNthCalledWith(2, 'my_file', '_FILE_ID_');

  state.set.mock.fake(async () => true);
  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(true);
  await expect(manager.saveFile('my_file', '_FILE_ID_')).resolves.toBe(true);
  expect(state.set.mock).toHaveBeenCalledTimes(4);
});

test('get all assets', async () => {
  const manager = new TelegramAssetsManager(stateController, bot);

  await expect(manager.getAllAssets('foo')).resolves.toBe(null);
  await expect(manager.getAllFiles()).resolves.toBe(null);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(state.getAll.mock).toHaveBeenCalledTimes(2);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(manager.getAllFiles()).resolves.toEqual(resources);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
    ]
  `);

  expect(state.getAll.mock).toHaveBeenCalledTimes(4);
});

test('remove asset id', async () => {
  const manager = new TelegramAssetsManager(stateController, bot);

  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(true);
  await expect(manager.unsaveFile('my_file')).resolves.toBe(true);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(state.delete.mock).toHaveBeenCalledTimes(2);

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(false);
  await expect(manager.unsaveFile('my_file')).resolves.toBe(false);

  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
    ]
  `);

  expect(state.delete.mock).toHaveBeenCalledTimes(4);
  expect(state.delete.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(2, 'my_file');
  expect(state.delete.mock).toHaveBeenNthCalledWith(3, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(4, 'my_file');
});
