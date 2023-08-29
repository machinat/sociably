import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import type { InstagramBot } from '../../Bot.js';
import InstagramAgent from '../../Agent.js';
import { InstagramAssetsManager } from '../AssetsManager.js';

const state = moxy({
  get: async () => null,
  set: async () => false,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const accountId = '__ACCOUNT_ID__';
const pageId = '__PAGE_ID__';
const accessToken = '__ACCESS_TOKEN__';
const username = '@agent.smith';

const agent = new InstagramAgent(accountId);
const agentSettings = { accountId, pageId, accessToken, username };
const agentSettingsAccessor = moxy({
  getAgentSettings: async () => agentSettings,
  getAgentSettingsBatch: async () => [agentSettings],
});

const stateController = moxy<StateControllerI>({
  globalState() {
    return state;
  },
} as never);

const bot = moxy<InstagramBot>({
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

describe('subscription management', () => {
  describe('.setAppSubscription(options)', () => {
    it('call subscription API as application', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );

      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          appId: '_APP_ID_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
          objectType: 'user',
          fields: ['foo_field', 'bar_field'],
        })
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

    test('with constructor app settings options', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor,
        {
          appId: '_APP_ID_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
          webhookUrl: 'https://foo.bar/baz/',
          subscriptionFields: ['messages', 'messaging_postbacks'],
        }
      );

      await expect(manager.setAppSubscription({})).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApp: true,
        method: 'POST',
        url: '_APP_ID_/subscriptions',
        params: {
          object: 'instagram',
          callback_url: 'https://foo.bar/baz/',
          verify_token: '_VERIFY_TOKEN_',
          fields: ['messages', 'messaging_postbacks'],
          include_values: true,
        },
      });
    });

    test('default subscription fields', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor,
        {
          appId: '_APP_ID_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }
      );

      await expect(
        manager.setAppSubscription({ webhookUrl: 'https://foo.bar/baz/' })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi.mock.calls[0].args[0].params.fields)
        .toMatchInlineSnapshot(`
        [
          "messages",
          "messaging_postbacks",
          "messaging_handover",
          "messaging_referral",
        ]
      `);
    });

    it('throw if no appId available', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, webhookUrl, webhookVerifyToken or fields is empty"`
      );
      expect(bot.requestApi).not.toHaveBeenCalled();
    });

    it('throw if no webhookUrl available', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      await expect(
        manager.setAppSubscription({
          appId: '_APP_ID_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, webhookUrl, webhookVerifyToken or fields is empty"`
      );
      expect(bot.requestApi).not.toHaveBeenCalled();
    });

    it('throw if no webhookVerifyToken available', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          appId: '_APP_ID_',
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, webhookUrl, webhookVerifyToken or fields is empty"`
      );
      expect(bot.requestApi).not.toHaveBeenCalled();
    });
  });

  describe('.deleteAppSubscription(options)', () => {
    it('call subscription API as application', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor,
        {
          appId: '_APP_ID_',
        }
      );

      await expect(manager.deleteAppSubscription()).resolves.toBe(undefined);

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
        })
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

    it('throw if no appId available', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );

      await expect(
        manager.deleteAppSubscription()
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"appId is empty"`);

      expect(bot.requestApi).not.toHaveBeenCalled();
    });
  });

  describe('.setSubscribedApp(options)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );

      await expect(
        manager.setSubscribedApp(agent, {
          fields: ['messages', 'messaging_postbacks'],
          accessToken: '_ACCESS_TOKEN_',
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        channel: agent,
        accessToken: '_ACCESS_TOKEN_',
        method: 'POST',
        url: 'me/subscribed_apps',
        params: {
          subscribed_fields: ['messages', 'messaging_postbacks'],
        },
      });
    });

    test('with constructor app settings options', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor,
        {
          subscriptionFields: [
            'messages',
            'messaging_postbacks',
            'messaging_optins',
          ],
        }
      );

      await expect(manager.setSubscribedApp(agent)).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        channel: agent,
        method: 'POST',
        url: 'me/subscribed_apps',
        params: {
          subscribed_fields: [
            'messages',
            'messaging_postbacks',
            'messaging_optins',
          ],
        },
      });
    });

    test('default subscribed fields', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      await expect(manager.setSubscribedApp(agent)).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi.mock.calls[0].args[0].params.subscribed_fields)
        .toMatchInlineSnapshot(`
        [
          "messages",
          "messaging_postbacks",
          "messaging_optins",
          "messaging_handovers",
          "messaging_policy_enforcement",
          "messaging_account_linking",
          "messaging_game_plays",
          "messaging_referrals",
        ]
      `);
    });
  });

  describe('.deleteSubscribedApp(options)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );

      await expect(manager.deleteSubscribedApp(agent)).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        channel: agent,
        method: 'DELETE',
        url: 'me/subscribed_apps',
      });
    });
  });

  describe('.setMessengerProfile(agent, settings)', () => {
    const messengerProfileParams = {
      iceBreakers: [
        {
          callToActions: [{ question: 'Yo?', payload: 'yo' }],
          locale: 'default',
        },
      ],
      persistentMenu: [
        {
          locale: 'default',
          callToActions: [
            {
              type: 'postback' as const,
              title: 'Talk to an agent',
              payload: 'CARE_HELP',
            },
            {
              type: 'web_url' as const,
              title: 'Shop now',
              url: 'https://www.originalcoastclothing.com/',
            },
          ],
        },
      ],
    };
    const messengerProfileRawData = {
      ice_breakers: [
        {
          call_to_actions: [{ question: 'Yo?', payload: 'yo' }],
          locale: 'default',
        },
      ],
      persistent_menu: [
        {
          locale: 'default',
          call_to_actions: [
            {
              type: 'postback',
              title: 'Talk to an agent',
              payload: 'CARE_HELP',
            },
            {
              type: 'web_url',
              title: 'Shop now',
              url: 'https://www.originalcoastclothing.com/',
            },
          ],
        },
      ],
    };

    it('call subscribed_apps API as page', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET' ? { data: [] } : {}
      );

      await expect(
        manager.setMessengerProfile(agent, {
          ...messengerProfileParams,
          accessToken: '_ACCESS_TOKEN_',
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenNthCalledWith(1, {
        channel: agent,
        method: 'GET',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          fields: expect.arrayContaining([
            'whitelisted_domains',
            'get_started',
            'greeting',
            'ice_breakers',
            'persistent_menu',
            'account_linking_url',
          ]),
        },
        accessToken: '_ACCESS_TOKEN_',
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel: agent,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          ...messengerProfileRawData,
          platform: 'instagram',
        },
        accessToken: '_ACCESS_TOKEN_',
      });
    });

    it('remove current fields if not exist on new settings', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET'
          ? {
              data: [
                {
                  ice_breakers: messengerProfileRawData.ice_breakers,
                },
              ],
            }
          : {}
      );

      await expect(
        manager.setMessengerProfile(agent, {
          persistentMenu: messengerProfileParams.persistentMenu,
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(3);
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel: agent,
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          fields: ['ice_breakers'],
        },
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(3, {
        channel: agent,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          persistent_menu: messengerProfileRawData.persistent_menu,
        },
      });
    });

    it('set fields if value has change', async () => {
      const manager = new InstagramAssetsManager(
        stateController,
        bot,
        agentSettingsAccessor
      );
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET' ? { data: [messengerProfileRawData] } : {}
      );

      await expect(
        manager.setMessengerProfile(agent, {
          persistentMenu: messengerProfileParams.persistentMenu,
          iceBreakers: [
            {
              callToActions: [{ question: 'Yo?', payload: 'yo' }],
              locale: 'default',
            },
            {
              callToActions: [{ question: '喲?', payload: '唷' }],
              locale: 'zh_TW',
            },
          ],
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel: agent,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          ice_breakers: [
            {
              call_to_actions: [{ question: 'Yo?', payload: 'yo' }],
              locale: 'default',
            },
            {
              call_to_actions: [{ question: '喲?', payload: '唷' }],
              locale: 'zh_TW',
            },
          ],
        },
      });
    });
  });
});

describe('assets management', () => {
  test('get asset id', async () => {
    const manager = new InstagramAssetsManager(
      stateController,
      bot,
      agentSettingsAccessor
    );

    await expect(manager.getAssetId(agent, 'foo', 'bar')).resolves.toBe(
      undefined
    );
    await expect(manager.getAttachment(agent, 'my_attachment')).resolves.toBe(
      undefined
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$ig.foo.__PAGE_ID__",
        "$ig.attachment.__PAGE_ID__",
      ]
    `);

    expect(state.get).toHaveBeenCalledTimes(2);
    expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.get).toHaveBeenNthCalledWith(2, 'my_attachment');

    state.get.mock.fakeReturnValue('baz');
    await expect(manager.getAssetId(agent, 'foo', 'bar')).resolves.toBe('baz');

    state.get.mock.fakeReturnValue('_ATTACHMENT_ID_');
    await expect(manager.getAttachment(agent, 'my_attachment')).resolves.toBe(
      '_ATTACHMENT_ID_'
    );

    state.get.mock.fakeReturnValue('_PERSONA_ID_');

    expect(stateController.globalState).toHaveBeenCalledTimes(4);
    expect(state.get).toHaveBeenCalledTimes(4);
  });

  test('set asset id', async () => {
    const manager = new InstagramAssetsManager(
      stateController,
      bot,
      agentSettingsAccessor
    );

    await expect(manager.saveAssetId(agent, 'foo', 'bar', 'baz')).resolves.toBe(
      false
    );
    await expect(
      manager.saveAttachment(agent, 'my_attachment', '_ATTACHMENT_ID_')
    ).resolves.toBe(false);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$ig.foo.__PAGE_ID__",
        "$ig.attachment.__PAGE_ID__",
      ]
    `);

    expect(state.set).toHaveBeenCalledTimes(2);
    expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
    expect(state.set).toHaveBeenNthCalledWith(
      2,
      'my_attachment',
      '_ATTACHMENT_ID_'
    );

    state.set.mock.fake(async () => true);
    await expect(manager.saveAssetId(agent, 'foo', 'bar', 'baz')).resolves.toBe(
      true
    );
    await expect(
      manager.saveAttachment(agent, 'my_attachment', '_ATTACHMENT_ID_')
    ).resolves.toBe(true);
    expect(state.set).toHaveBeenCalledTimes(4);
  });

  test('get all assets', async () => {
    const manager = new InstagramAssetsManager(
      stateController,
      bot,
      agentSettingsAccessor
    );

    await expect(manager.getAllAssets(agent, 'foo')).resolves.toBe(null);
    await expect(manager.getAllAttachments(agent)).resolves.toBe(null);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$ig.foo.__PAGE_ID__",
        "$ig.attachment.__PAGE_ID__",
      ]
    `);

    expect(state.getAll).toHaveBeenCalledTimes(2);

    const resources = new Map([
      ['bar', '1'],
      ['baz', '2'],
    ]);
    state.getAll.mock.fake(async () => resources);

    await expect(manager.getAllAssets(agent, 'foo')).resolves.toEqual(
      resources
    );
    await expect(manager.getAllAttachments(agent)).resolves.toEqual(resources);
  });

  test('remove asset id', async () => {
    const manager = new InstagramAssetsManager(
      stateController,
      bot,
      agentSettingsAccessor
    );

    await expect(manager.unsaveAssetId(agent, 'foo', 'bar')).resolves.toBe(
      true
    );
    await expect(
      manager.unsaveAttachment(agent, 'my_attachment')
    ).resolves.toBe(true);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$ig.foo.__PAGE_ID__",
        "$ig.attachment.__PAGE_ID__",
      ]
    `);

    expect(state.delete).toHaveBeenCalledTimes(2);
    expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.delete).toHaveBeenNthCalledWith(2, 'my_attachment');

    state.delete.mock.fake(async () => false);
    await expect(manager.unsaveAssetId(agent, 'foo', 'bar')).resolves.toBe(
      false
    );
    await expect(
      manager.unsaveAttachment(agent, 'my_attachment')
    ).resolves.toBe(false);
    expect(state.delete).toHaveBeenCalledTimes(4);
  });

  test('.uploadChatAttachment()', async () => {
    const manager = new InstagramAssetsManager(
      stateController,
      bot,
      agentSettingsAccessor
    );
    bot.uploadChatAttachment.mock.fake(async () => ({
      attachmentId: '1857777774821032',
    }));

    await expect(
      manager.uploadChatAttachment(
        agent,
        'my_avatar',
        <img src="http://foo.bar/avatar" />
      )
    ).resolves.toBe('1857777774821032');

    expect(bot.uploadChatAttachment).toHaveBeenCalledTimes(1);
    expect(bot.uploadChatAttachment).toHaveBeenCalledWith(
      agent,
      <img src="http://foo.bar/avatar" />
    );

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith('my_avatar', '1857777774821032');
  });
});
