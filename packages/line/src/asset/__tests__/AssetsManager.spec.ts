import moxy from '@moxyjs/moxy';
import type StateControllerI from '@sociably/core/base/StateController';
import LineChannel from '../../Channel';
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
  channelId: '_CHANNEL_ID_',
  makeApiCall: () => ({}),
} as never);

const channel = new LineChannel('_CHANNEL_ID_');

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.getAssetId(channel, 'foo', 'bar')).resolves.toBe(
    undefined
  );
  await expect(manager.getRichMenu(channel, 'my_rich_menu')).resolves.toBe(
    undefined
  );

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._CHANNEL_ID_.foo",
      "line.assets._CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.get).toHaveBeenCalledTimes(2);
  expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get).toHaveBeenNthCalledWith(2, 'my_rich_menu');

  state.get.mock.fakeReturnValue('baz');
  await expect(manager.getAssetId(channel, 'foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_RICH_MENU_ID_');
  await expect(manager.getRichMenu(channel, 'my_rich_menu')).resolves.toBe(
    '_RICH_MENU_ID_'
  );

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(state.get).toHaveBeenCalledTimes(4);
});

test('set asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.saveAssetId(channel, 'foo', 'bar', 'baz')).resolves.toBe(
    true
  );

  await expect(
    manager.saveRichMenu(channel, 'my_rich_menu', '_RICH_MENU_ID_')
  ).resolves.toBe(true);

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._CHANNEL_ID_.foo",
      "line.assets._CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.set).toHaveBeenCalledTimes(2);
  expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
  expect(state.set).toHaveBeenNthCalledWith(
    2,
    'my_rich_menu',
    '_RICH_MENU_ID_'
  );

  state.set.mock.fake(async () => false);
  await expect(manager.saveAssetId(channel, 'foo', 'bar', 'baz')).resolves.toBe(
    false
  );

  await expect(
    manager.saveRichMenu(channel, 'my_rich_menu', '_RICH_MENU_ID_')
  ).resolves.toBe(false);
  expect(state.set).toHaveBeenCalledTimes(4);
});

test('get all assets', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.getAllAssets(channel, 'foo')).resolves.toBe(null);
  await expect(manager.getAllRichMenus(channel)).resolves.toBe(null);

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._CHANNEL_ID_.foo",
      "line.assets._CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.getAll).toHaveBeenCalledTimes(2);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets(channel, 'foo')).resolves.toEqual(
    resources
  );
  await expect(manager.getAllRichMenus(channel)).resolves.toEqual(resources);

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(state.getAll).toHaveBeenCalledTimes(4);
});

test('unsave asset id', async () => {
  const manager = new LineAssetsManager(stateController, bot);

  await expect(manager.unsaveAssetId(channel, 'foo', 'bar')).resolves.toBe(
    true
  );
  await expect(manager.unsaveRichMenu(channel, 'my_rich_menu')).resolves.toBe(
    true
  );

  expect(stateController.globalState).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._CHANNEL_ID_.foo",
      "line.assets._CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.delete).toHaveBeenCalledTimes(2);
  expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete).toHaveBeenNthCalledWith(2, 'my_rich_menu');

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId(channel, 'foo', 'bar')).resolves.toBe(
    false
  );
  await expect(manager.unsaveRichMenu(channel, 'my_rich_menu')).resolves.toBe(
    false
  );
  expect(state.delete).toHaveBeenCalledTimes(4);
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
    manager.createRichMenu(channel, 'my_rich_menu', richMenuBody)
  ).resolves.toBe('_RICH_MENU_ID_');

  expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall).toHaveBeenCalledWith({
    channel,
    method: 'POST',
    path: 'v2/bot/richmenu',
    body: richMenuBody,
  });

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ID_');
  await expect(
    manager.createRichMenu(channel, 'my_rich_menu', richMenuBody)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich menu [ my_rich_menu ] already exist"`
  );

  expect(state.set).toHaveBeenCalledTimes(1);
  expect(state.set).toHaveBeenCalledWith('my_rich_menu', '_RICH_MENU_ID_');
});

test('#deleteRichMenu()', async () => {
  const manager = new LineAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(async () => ({}));

  await expect(manager.deleteRichMenu(channel, 'my_rich_menu')).resolves.toBe(
    false
  );

  state.get.mock.fake(async () => '_RICH_MENU_ID_');
  await expect(manager.deleteRichMenu(channel, 'my_rich_menu')).resolves.toBe(
    true
  );

  expect(bot.makeApiCall).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall).toHaveBeenCalledWith({
    channel,
    method: 'DELETE',
    path: 'v2/bot/richmenu/_RICH_MENU_ID_',
  });

  expect(state.delete).toHaveBeenCalledTimes(1);
  expect(state.delete).toHaveBeenCalledWith('my_rich_menu');
});
