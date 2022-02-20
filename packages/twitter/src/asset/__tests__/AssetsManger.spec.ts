import moxy from '@moxyjs/moxy';
import type StateControllerI from '@machinat/core/base/StateController';
import type { TwitterBot } from '../../Bot';
import { TwitterAssetsManager } from '../AssetsManager';

const state = moxy({
  get: async () => null,
  set: async () => false,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const appId = '__APP_ID__';

const stateController = moxy<StateControllerI>({
  globalState() {
    return state;
  },
} as never);

const bot = moxy<TwitterBot>({
  id: 123456,
  makeApiCall() {},
} as never);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.getAssetId('foo', 'bar'),
      manager.getMedia('my_media'),
      manager.getWebhook('my_webhook'),
    ])
  ).resolves.toEqual([undefined, undefined, undefined]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((c) => c.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
    ]
  `);
  expect(state.get.mock).toHaveBeenCalledTimes(3);
  expect(state.get.mock.calls.map(({ args }) => args[0])).toEqual([
    'bar',
    'my_media',
    'my_webhook',
  ]);

  state.get.mock.fakeReturnValueOnce('_FOO_BAR_ID_');
  state.get.mock.fakeReturnValueOnce('_MEDIA_ID_');
  state.get.mock.fakeReturnValueOnce('_WEBHOOK_ID_');

  await expect(
    Promise.all([
      manager.getAssetId('foo', 'bar'),
      manager.getMedia('my_media'),
      manager.getWebhook('my_webhook'),
    ])
  ).resolves.toEqual(['_FOO_BAR_ID_', '_MEDIA_ID_', '_WEBHOOK_ID_']);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.get.mock).toHaveBeenCalledTimes(6);
});

test('save asset id', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.saveAssetId('foo', 'bar', 'baz'),
      manager.saveMedia('my_media', '_MEDIA_ID_'),
      manager.saveWebhook('my_webhook', '_WEBHOOK_ID_'),
    ])
  ).resolves.toEqual([false, false, false]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(3);
  expect(state.set.mock.calls.map(({ args }) => args)).toEqual([
    ['bar', 'baz'],
    ['my_media', '_MEDIA_ID_'],
    ['my_webhook', '_WEBHOOK_ID_'],
  ]);

  state.set.mock.fake(async () => true);
  await expect(
    Promise.all([
      manager.saveAssetId('foo', 'bar', 'baz'),
      manager.saveMedia('my_media', '_MEDIA_ID_'),
      manager.saveWebhook('my_webhook', '_WEBHOOK_ID_'),
    ])
  ).resolves.toEqual([true, true, true]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.set.mock).toHaveBeenCalledTimes(6);
});

test('get all assets', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.getAllAssets('foo'),
      manager.getAllMedia(),
      manager.getAllWebhooks(),
    ])
  ).resolves.toEqual([null, null, null]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
    ]
  `);
  expect(state.getAll.mock).toHaveBeenCalledTimes(3);

  const assetsMap = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => assetsMap);

  await expect(
    Promise.all([
      manager.getAllAssets('foo'),
      manager.getAllMedia(),
      manager.getAllWebhooks(),
    ])
  ).resolves.toEqual([assetsMap, assetsMap, assetsMap]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.getAll.mock).toHaveBeenCalledTimes(6);
});

test('unsave asset id', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.unsaveAssetId('foo', 'bar'),
      manager.unsaveMedia('my_media'),
      manager.unsaveWebhook('my_webhook'),
    ])
  ).resolves.toEqual([true, true, true]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
    ]
  `);
  expect(state.delete.mock).toHaveBeenCalledTimes(3);
  expect(state.delete.mock.calls.map(({ args }) => args[0])).toEqual([
    'bar',
    'my_media',
    'my_webhook',
  ]);

  state.delete.mock.fake(async () => false);
  await expect(
    Promise.all([
      manager.unsaveAssetId('foo', 'bar'),
      manager.unsaveMedia('my_media'),
      manager.unsaveWebhook('my_webhook'),
    ])
  ).resolves.toEqual([false, false, false]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.delete.mock).toHaveBeenCalledTimes(6);
});

test('.createWebhook(name)', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);
  const url = 'https://your_domain.com/webhook/twitter';

  bot.makeApiCall.mock.fake(async () => ({
    id: '1234567890',
    url,
    valid: true,
    created_at: '2016-06-02T23:54:02Z',
  }));

  await expect(
    manager.createWebhook('production', 'my_app_webhook', url)
  ).resolves.toBe('1234567890');

  expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
    'POST',
    '1.1/account_activity/all/production/webhooks.json',
    { url }
  );

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.webhook"`);
  expect(state.set.mock).toHaveBeenCalledWith('my_app_webhook', '1234567890');

  state.get.mock.fake(async () => '1234567890');
  await expect(
    manager.createWebhook('production', 'my_app_webhook', url)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"webhook \\"my_app_webhook\\" already exists"`
  );

  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock).toHaveBeenCalledTimes(1);
});

test('.removeWebhook(name)', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  state.get.mock.fake(async () => '1234567890');
  bot.makeApiCall.mock.fake(async () => ({}));

  await expect(
    manager.removeWebhook('production', 'my_app_webhook')
  ).resolves.toBe('1234567890');

  expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
    'DELETE',
    '1.1/account_activity/all/production/webhooks/1234567890.json'
  );

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.webhook"`);
  expect(state.delete.mock).toHaveBeenCalledWith('my_app_webhook');

  state.get.mock.fake(async () => undefined);
  await expect(
    manager.removeWebhook('production', 'my_app_webhook')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"webhook \\"my_app_webhook\\" doesn't exist"`
  );

  expect(state.delete.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
});
