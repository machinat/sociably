import moxy from '@moxyjs/moxy';
import type StateControllerI from '@sociably/core/base/StateController';
import type { LineBot } from '../../Bot';
import { LineAssetsManager } from '../AssetsManager';

const state = moxy({
  get: async () => null,
  set: async () => true,
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

const bot = moxy<LineBot>({
  channelId: '_LINE_CHANNEL_ID_',
  makeApiCall: () => ({}),
} as never);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getLiffApp('my_liff_app')).resolves.toBe(undefined);
  await expect(manager.getRichMenu('my_rich_menu')).resolves.toBe(undefined);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.get).toHaveBeenCalledTimes(3);
  expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get).toHaveBeenNthCalledWith(2, 'my_liff_app');
  expect(state.get).toHaveBeenNthCalledWith(3, 'my_rich_menu');

  state.get.mock.fakeReturnValue('baz');
  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_LIFF_ID_');
  await expect(manager.getLiffApp('my_liff_app')).resolves.toBe('_LIFF_ID_');

  state.get.mock.fakeReturnValue('_RICH_MENU_ID_');
  await expect(manager.getRichMenu('my_rich_menu')).resolves.toBe(
    '_RICH_MENU_ID_'
  );

  expect(stateController.globalState).toHaveBeenCalledTimes(6);
  expect(state.get).toHaveBeenCalledTimes(6);
});

test('set asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(true);
  await expect(
    manager.saveLiffApp('my_liff_app', '_LIFF_APP_ID_')
  ).resolves.toBe(true);
  await expect(
    manager.saveRichMenu('my_rich_menu', '_RICH_MENU_ID_')
  ).resolves.toBe(true);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.set).toHaveBeenCalledTimes(3);
  expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
  expect(state.set).toHaveBeenNthCalledWith(2, 'my_liff_app', '_LIFF_APP_ID_');
  expect(state.set).toHaveBeenNthCalledWith(
    3,
    'my_rich_menu',
    '_RICH_MENU_ID_'
  );

  state.set.mock.fake(async () => false);
  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(false);
  await expect(
    manager.saveLiffApp('my_liff_app', '_LIFF_APP_ID_')
  ).resolves.toBe(false);
  await expect(
    manager.saveRichMenu('my_rich_menu', '_RICH_MENU_ID_')
  ).resolves.toBe(false);
  expect(state.set).toHaveBeenCalledTimes(6);
});

test('get all assets', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.getAllAssets('foo')).resolves.toBe(null);
  await expect(manager.getAllLiffApps()).resolves.toBe(null);
  await expect(manager.getAllRichMenus()).resolves.toBe(null);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.getAll).toHaveBeenCalledTimes(3);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(manager.getAllLiffApps()).resolves.toEqual(resources);
  await expect(manager.getAllRichMenus()).resolves.toEqual(resources);

  expect(stateController.globalState).toHaveBeenCalledTimes(6);
  expect(state.getAll).toHaveBeenCalledTimes(6);
});

test('unsave asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(true);
  await expect(manager.unsaveLiffApp('my_liff_app')).resolves.toBe(true);
  await expect(manager.unsaveRichMenu('my_rich_menu')).resolves.toBe(true);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.delete).toHaveBeenCalledTimes(3);
  expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete).toHaveBeenNthCalledWith(2, 'my_liff_app');
  expect(state.delete).toHaveBeenNthCalledWith(3, 'my_rich_menu');

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(false);
  await expect(manager.unsaveLiffApp('my_liff_app')).resolves.toBe(false);
  await expect(manager.unsaveRichMenu('my_rich_menu')).resolves.toBe(false);
  expect(state.delete).toHaveBeenCalledTimes(6);
});

test('#createRichMenu()', async () => {
  const manager = new LineAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(async () => ({
    richMenuId: '_RICH_MENU_ID_',
  }));

  const richMenuBody = {
    size: { width: 2500, height: 1686 },
    selected: false,
    name: 'Nice richmenu',
    chatBarText: 'Tap here',
    areas: [
      {
        bounds: { x: 0, y: 0, width: 2500, height: 1686 },
        action: { type: 'postback', data: 'action=buy&itemid=123' },
      },
    ],
  };

  await expect(
    manager.createRichMenu('my_rich_menu', richMenuBody)
  ).resolves.toBe('_RICH_MENU_ID_');

  expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall).toHaveBeenCalledWith(
    'POST',
    'v2/bot/richmenu',
    richMenuBody
  );

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ID_');
  await expect(
    manager.createRichMenu('my_rich_menu', richMenuBody)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich menu [ my_rich_menu ] already exist"`
  );

  expect(state.set).toHaveBeenCalledTimes(1);
  expect(state.set).toHaveBeenCalledWith('my_rich_menu', '_RICH_MENU_ID_');
});

test('#deleteRichMenu()', async () => {
  const manager = new LineAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(async () => ({}));

  await expect(manager.deleteRichMenu('my_rich_menu')).resolves.toBe(false);

  state.get.mock.fake(async () => '_RICH_MENU_ID_');
  await expect(manager.deleteRichMenu('my_rich_menu')).resolves.toBe(true);

  expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall).toHaveBeenCalledWith(
    'DELETE',
    'v2/bot/richmenu/_RICH_MENU_ID_',
    null
  );

  expect(state.delete).toHaveBeenCalledTimes(1);
  expect(state.delete).toHaveBeenCalledWith('my_rich_menu');
});
