import moxy from '@moxyjs/moxy';
import { TelegramAssetsManager } from '../manager';

const state = moxy({
  get: async () => null,
  set: async () => true,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const stateManager = moxy({
  globalState() {
    return state;
  },
});

const bot = moxy({
  botId: 123456,
  dispatchAPICall() {},
});

beforeEach(() => {
  stateManager.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new TelegramAssetsManager(stateManager, bot);

  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getFileId('my_file')).resolves.toBe(undefined);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(2);
  expect(state.get.mock).toHaveBeenCalledTimes(2);

  state.get.mock.fakeReturnValue('_FOO_BAR_ID_');
  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe('_FOO_BAR_ID_');

  state.get.mock.fakeReturnValue('_FILE_ID_');
  await expect(manager.getFileId('my_file')).resolves.toBe('_FILE_ID_');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(4);
  expect(stateManager.globalState.mock.calls.map((c) => c.args[0]))
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
  const manager = new TelegramAssetsManager(stateManager, bot);

  await manager.saveAssetId('foo', 'bar', 'baz');
  await manager.saveFile('my_file', '_FILE_ID_');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(2);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "telegram.assets.123456.foo",
      "telegram.assets.123456.file",
    ]
  `);

  expect(state.update.mock).toHaveBeenCalledTimes(2);
  let [key, updator] = state.update.mock.calls[0].args;
  expect(key).toBe('bar');
  expect(updator(null)).toBe('baz');
  expect(() =>
    updator('_EXISTED_BAR_RESOURCE_ID_')
  ).toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] already exist"`);

  [key, updator] = state.update.mock.calls[1].args;
  expect(key).toBe('my_file');
  expect(updator(null)).toBe('_FILE_ID_');
  expect(() =>
    updator('_EXISTED_LIFF_APP_ID_')
  ).toThrowErrorMatchingInlineSnapshot(`"file [ my_file ] already exist"`);
});

test('get all assets', async () => {
  const manager = new TelegramAssetsManager(stateManager, bot);

  await expect(manager.getAllAssets('foo')).resolves.toBe(null);
  await expect(manager.getAllFiles()).resolves.toBe(null);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(2);
  expect(state.getAll.mock).toHaveBeenCalledTimes(2);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(manager.getAllFiles()).resolves.toEqual(resources);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(4);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
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
  const manager = new TelegramAssetsManager(stateManager, bot);

  await manager.discardAssetId('foo', 'bar');
  await manager.discardFile('my_file');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(2);
  expect(state.delete.mock).toHaveBeenCalledTimes(2);

  state.delete.mock.fakeReturnValue(false);
  await expect(
    manager.discardAssetId('foo', 'bar')
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] not exist"`);
  await expect(
    manager.discardFile('my_file')
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"file [ my_file ] not exist"`);

  expect(state.delete.mock).toHaveBeenCalledTimes(4);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
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
