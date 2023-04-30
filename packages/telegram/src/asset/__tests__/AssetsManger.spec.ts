import moxy from '@moxyjs/moxy';
import type StateControllerI from '@sociably/core/base/StateController';
import TelegramUser from '../../User';
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

const botUser = new TelegramUser(12345, true);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
});

test('get asset id', async () => {
  const manager = new TelegramAssetsManager(stateController);

  await expect(manager.getAssetId(botUser, 'foo', 'bar')).resolves.toBe(
    undefined
  );
  await expect(manager.getFile(botUser, 'my_file')).resolves.toBe(undefined);

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(state.get).toHaveBeenCalledTimes(2);

  state.get.mock.fakeReturnValue('_FOO_BAR_ID_');
  await expect(manager.getAssetId(botUser, 'foo', 'bar')).resolves.toBe(
    '_FOO_BAR_ID_'
  );

  state.get.mock.fakeReturnValue('_FILE_ID_');
  await expect(manager.getFile(botUser, 'my_file')).resolves.toBe('_FILE_ID_');

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map((c) => c.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
    ]
  `);

  expect(state.get).toHaveBeenCalledTimes(4);
  expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get).toHaveBeenNthCalledWith(2, 'my_file');
  expect(state.get).toHaveBeenNthCalledWith(3, 'bar');
  expect(state.get).toHaveBeenNthCalledWith(4, 'my_file');
});

test('set asset id', async () => {
  const manager = new TelegramAssetsManager(stateController);

  await expect(manager.saveAssetId(botUser, 'foo', 'bar', 'baz')).resolves.toBe(
    false
  );
  await expect(manager.saveFile(botUser, 'my_file', '_FILE_ID_')).resolves.toBe(
    false
  );

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
    ]
  `);

  expect(state.set).toHaveBeenCalledTimes(2);
  expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
  expect(state.set).toHaveBeenNthCalledWith(2, 'my_file', '_FILE_ID_');

  state.set.mock.fake(async () => true);
  await expect(manager.saveAssetId(botUser, 'foo', 'bar', 'baz')).resolves.toBe(
    true
  );
  await expect(manager.saveFile(botUser, 'my_file', '_FILE_ID_')).resolves.toBe(
    true
  );
  expect(state.set).toHaveBeenCalledTimes(4);
});

test('get all assets', async () => {
  const manager = new TelegramAssetsManager(stateController);

  await expect(manager.getAllAssets(botUser, 'foo')).resolves.toBe(null);
  await expect(manager.getAllFiles(botUser)).resolves.toBe(null);

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(state.getAll).toHaveBeenCalledTimes(2);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets(botUser, 'foo')).resolves.toEqual(
    resources
  );
  await expect(manager.getAllFiles(botUser)).resolves.toEqual(resources);

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
    ]
  `);

  expect(state.getAll).toHaveBeenCalledTimes(4);
});

test('remove asset id', async () => {
  const manager = new TelegramAssetsManager(stateController);

  await expect(manager.unsaveAssetId(botUser, 'foo', 'bar')).resolves.toBe(
    true
  );
  await expect(manager.unsaveFile(botUser, 'my_file')).resolves.toBe(true);

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(state.delete).toHaveBeenCalledTimes(2);

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId(botUser, 'foo', 'bar')).resolves.toBe(
    false
  );
  await expect(manager.unsaveFile(botUser, 'my_file')).resolves.toBe(false);

  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
      "tg.assets.12345.foo",
      "tg.assets.12345.file",
    ]
  `);

  expect(state.delete).toHaveBeenCalledTimes(4);
  expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete).toHaveBeenNthCalledWith(2, 'my_file');
  expect(state.delete).toHaveBeenNthCalledWith(3, 'bar');
  expect(state.delete).toHaveBeenNthCalledWith(4, 'my_file');
});
