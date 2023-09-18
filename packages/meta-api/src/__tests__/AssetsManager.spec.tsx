import moxy from '@moxyjs/moxy';
import type StateControllerI from '@sociably/core/base/StateController';
import { MetaAssetsManager } from '../AssetsManager.js';
import { MetaApiBot } from '../types.js';

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

const bot = moxy<MetaApiBot>({
  uploadChatAttachment() {
    return {};
  },
  requestApi() {},
} as never);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

describe('page/app management', () => {
  describe('.setAppSubscription(options)', () => {
    it('call subscription API as application', async () => {
      const manager = new MetaAssetsManager(stateController, bot, 'test');

      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          appId: '_APP_ID_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
          objectType: 'user',
          fields: ['foo_field', 'bar_field'],
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApp: true,
        method: 'POST',
        url: '_APP_ID_/subscriptions',
        params: {
          object: 'user',
          callback_url: 'https://foo.bar/baz/',
          verify_token: '_VERIFY_TOKEN_',
          fields: ['foo_field', 'bar_field'],
          include_values: true,
        },
      });
    });
  });

  describe('.deleteAppSubscription(options)', () => {
    it('call subscription API as application', async () => {
      const manager = new MetaAssetsManager(stateController, bot, 'test');

      await expect(
        manager.deleteAppSubscription({
          appId: '_APP_ID_',
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApp: true,
        method: 'DELETE',
        url: '_APP_ID_/subscriptions',
        params: {},
      });

      await expect(
        manager.deleteAppSubscription({
          objectType: 'user',
          fields: ['foo_field', 'bar_field'],
          appId: '_ANOTHER_APP_ID_',
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApp: true,
        method: 'DELETE',
        url: '_ANOTHER_APP_ID_/subscriptions',
        params: {
          object: 'user',
          fields: ['foo_field', 'bar_field'],
        },
      });
    });
  });
});

describe('assets management', () => {
  test('get asset id', async () => {
    const manager = new MetaAssetsManager(stateController, bot, 'test');

    await expect(manager.getAssetId('_AGENT_ID_', 'foo', 'bar')).resolves.toBe(
      undefined,
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(1);
    expect(
      stateController.globalState.mock.calls[0].args[0],
    ).toMatchInlineSnapshot(`"$test.foo._AGENT_ID_"`);

    expect(state.get).toHaveBeenCalledTimes(1);
    expect(state.get).toHaveBeenCalledWith('bar');

    state.get.mock.fakeReturnValue('baz');
    await expect(manager.getAssetId('_AGENT_ID_', 'foo', 'bar')).resolves.toBe(
      'baz',
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(state.get).toHaveBeenCalledTimes(2);
  });

  test('set asset id', async () => {
    const manager = new MetaAssetsManager(stateController, bot, 'test');

    await expect(
      manager.saveAssetId('_AGENT_ID_', 'foo', 'bar', 'baz'),
    ).resolves.toBe(false);

    expect(stateController.globalState).toHaveBeenCalledTimes(1);
    expect(
      stateController.globalState.mock.calls[0].args[0],
    ).toMatchInlineSnapshot(`"$test.foo._AGENT_ID_"`);

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');

    state.set.mock.fake(async () => true);
    await expect(
      manager.saveAssetId('_AGENT_ID_', 'foo', 'bar', 'baz'),
    ).resolves.toBe(true);

    expect(state.set).toHaveBeenCalledTimes(2);
  });

  test('get all assets', async () => {
    const manager = new MetaAssetsManager(stateController, bot, 'test');

    await expect(manager.getAllAssets('_AGENT_ID_', 'foo')).resolves.toBe(null);

    expect(stateController.globalState).toHaveBeenCalledTimes(1);
    expect(
      stateController.globalState.mock.calls[0].args[0],
    ).toMatchInlineSnapshot(`"$test.foo._AGENT_ID_"`);

    expect(state.getAll).toHaveBeenCalledTimes(1);

    const resources = new Map([
      ['bar', '1'],
      ['baz', '2'],
    ]);
    state.getAll.mock.fake(async () => resources);

    await expect(manager.getAllAssets('_AGENT_ID_', 'foo')).resolves.toEqual(
      resources,
    );

    expect(state.getAll).toHaveBeenCalledTimes(2);
  });

  test('remove asset id', async () => {
    const manager = new MetaAssetsManager(stateController, bot, 'test');

    await expect(
      manager.unsaveAssetId('_AGENT_ID_', 'foo', 'bar'),
    ).resolves.toBe(true);

    expect(stateController.globalState).toHaveBeenCalledTimes(1);
    expect(
      stateController.globalState.mock.calls[0].args[0],
    ).toMatchInlineSnapshot(`"$test.foo._AGENT_ID_"`);

    expect(state.delete).toHaveBeenCalledTimes(1);
    expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');

    state.delete.mock.fake(async () => false);
    await expect(
      manager.unsaveAssetId('_AGENT_ID_', 'foo', 'bar'),
    ).resolves.toBe(false);

    expect(state.delete).toHaveBeenCalledTimes(2);
  });
});
