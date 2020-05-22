import moxy from 'moxy';
import LineAssetRegistry from '../registry';

const state = moxy({
  get: async () => null,
  set: async () => true,
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
  botChannelId: '_LINE_CHANNEL_ID_',
  dispatchAPICall() {},
});

beforeEach(() => {
  stateManager.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const registry = new LineAssetRegistry(stateManager, bot);

  await expect(registry.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(registry.getLIFFAppId('my_liff_app')).resolves.toBe(undefined);
  await expect(registry.getRichMenuId('my_rich_menu')).resolves.toBe(undefined);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.get.mock).toHaveBeenCalledTimes(3);
  expect(state.get.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(2, 'my_liff_app');
  expect(state.get.mock).toHaveBeenNthCalledWith(3, 'my_rich_menu');

  state.get.mock.fakeReturnValue('baz');
  await expect(registry.getAssetId('foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_LIFF_ID_');
  await expect(registry.getLIFFAppId('my_liff_app')).resolves.toBe('_LIFF_ID_');

  state.get.mock.fakeReturnValue('_RICH_MENU_ID_');
  await expect(registry.getRichMenuId('my_rich_menu')).resolves.toBe(
    '_RICH_MENU_ID_'
  );

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.get.mock).toHaveBeenCalledTimes(6);
});

test('set asset id', async () => {
  const registry = new LineAssetRegistry(stateManager, bot);

  await registry.setAssetId('foo', 'bar', 'baz');
  await registry.setLIFFAppId('my_liff_app', '_LIFF_APP_ID_');
  await registry.setRichMenuId('my_rich_menu', '_RICH_MENU_ID_');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(3);
  state.set.mock.calls.forEach(({ args: [key, updator] }, i) => {
    if (i === 0) {
      expect(key).toBe('bar');
      expect(updator(null)).toBe('baz');
      expect(() =>
        updator('_EXISTED_BAR_RESOURCE_ID_')
      ).toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] already exist"`);
    } else if (i === 1) {
      expect(key).toBe('my_liff_app');
      expect(updator(null)).toBe('_LIFF_APP_ID_');
      expect(() =>
        updator('_EXISTED_LIFF_APP_ID_')
      ).toThrowErrorMatchingInlineSnapshot(
        `"liff [ my_liff_app ] already exist"`
      );
    } else if (i === 2) {
      expect(key).toBe('my_rich_menu');
      expect(updator(null)).toBe('_RICH_MENU_ID_');
      expect(() =>
        updator('_EXISTED_RICH_MENU_ID_')
      ).toThrowErrorMatchingInlineSnapshot(
        `"rich_menu [ my_rich_menu ] already exist"`
      );
    }
  });
});

test('get all assets', async () => {
  const registry = new LineAssetRegistry(stateManager, bot);

  await expect(registry.getAllAssets('foo')).resolves.toBe(null);
  await expect(registry.getAllLIFFApps()).resolves.toBe(null);
  await expect(registry.getAllRichMenus()).resolves.toBe(null);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.getAll.mock).toHaveBeenCalledTimes(3);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(registry.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(registry.getAllLIFFApps()).resolves.toEqual(resources);
  await expect(registry.getAllRichMenus()).resolves.toEqual(resources);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.getAll.mock).toHaveBeenCalledTimes(6);
});

test('remove asset id', async () => {
  const registry = new LineAssetRegistry(stateManager, bot);

  await registry.removeAssetId('foo', 'bar');
  await registry.removeLIFFAppId('my_liff_app');
  await registry.removeRichMenuId('my_rich_menu');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "line.assets._LINE_CHANNEL_ID_.foo",
      "line.assets._LINE_CHANNEL_ID_.liff",
      "line.assets._LINE_CHANNEL_ID_.rich_menu",
    ]
  `);

  expect(state.delete.mock).toHaveBeenCalledTimes(3);
  expect(state.delete.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(2, 'my_liff_app');
  expect(state.delete.mock).toHaveBeenNthCalledWith(3, 'my_rich_menu');

  state.delete.mock.fakeReturnValue(false);
  await expect(
    registry.removeAssetId('foo', 'bar')
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] not exist"`);
  await expect(
    registry.removeLIFFAppId('my_liff_app')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"liff [ my_liff_app ] not exist"`
  );
  await expect(
    registry.removeRichMenuId('my_rich_menu')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich_menu [ my_rich_menu ] not exist"`
  );
});

test('#createRichMenu()', async () => {
  const registry = new LineAssetRegistry(stateManager, bot);
  bot.dispatchAPICall.mock.fake(() => ({
    jobs: [{ ...{} }],
    results: [{ richMenuId: '_RICH_MENU_ID_' }],
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
    registry.createRichMenu('my_rich_menu', richMenuBody)
  ).resolves.toBe('_RICH_MENU_ID_');

  expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
  expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith(
    'POST',
    'v2/bot/richmenu',
    richMenuBody
  );

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ID_');
  await expect(
    registry.createRichMenu('my_rich_menu', richMenuBody)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich menu [ my_rich_menu ] already exist"`
  );
});

test('#deleteRichMenu()', async () => {
  const registry = new LineAssetRegistry(stateManager, bot);
  bot.dispatchAPICall.mock.fake(() => ({
    jobs: [{ ...{} }],
    results: [{}],
  }));

  await expect(
    registry.deleteRichMenu('my_rich_menu')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"rich menu [ my_rich_menu ] not exist"`
  );

  state.get.mock.fakeReturnValue('_RICH_MENU_ID_');
  await expect(registry.deleteRichMenu('my_rich_menu')).resolves.toBe(
    '_RICH_MENU_ID_'
  );

  expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
  expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith(
    'DELETE',
    'v2/bot/richmenu/_RICH_MENU_ID_'
  );
});
