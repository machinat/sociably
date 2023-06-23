import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import type { FacebookBot } from '../../Bot.js';
import FacebookPage from '../../Page.js';
import { FacebookAssetsManager } from '../AssetsManager.js';

const state = moxy({
  get: async () => null,
  set: async () => false,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const page = new FacebookPage('1234567890');

const stateController = moxy<StateControllerI>({
  globalState() {
    return state;
  },
} as never);

const bot = moxy<FacebookBot>({
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
      const manager = new FacebookAssetsManager(stateController, bot);

      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          appId: '_APP_ID_',
          verifyToken: '_VERIFY_TOKEN_',
          objectType: 'user',
          fields: ['foo_field', 'bar_field'],
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApplication: true,
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
      const manager = new FacebookAssetsManager(stateController, bot, {
        appId: '_APP_ID_',
        verifyToken: '_VERIFY_TOKEN_',
        pageSubscriptionFields: ['messages', 'messaging_postbacks'],
      });

      await expect(
        manager.setAppSubscription({ webhookUrl: 'https://foo.bar/baz/' })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApplication: true,
        method: 'POST',
        url: '_APP_ID_/subscriptions',
        params: {
          object: 'page',
          callback_url: 'https://foo.bar/baz/',
          verify_token: '_VERIFY_TOKEN_',
          fields: ['messages', 'messaging_postbacks'],
          include_values: true,
        },
      });
    });

    test('default subscription fields', async () => {
      const manager = new FacebookAssetsManager(stateController, bot, {
        appId: '_APP_ID_',
        verifyToken: '_VERIFY_TOKEN_',
      });

      await expect(
        manager.setAppSubscription({ webhookUrl: 'https://foo.bar/baz/' })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi.mock.calls[0].args[0].params.fields)
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

    it('throw if no appId available', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);

      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          verifyToken: '_VERIFY_TOKEN_',
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, url, verifyToken or fields is empty"`
      );

      expect(bot.requestApi).not.toHaveBeenCalled();
    });

    it('throw if no verifyToken available', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);

      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          appId: '_APP_ID_',
        })
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, url, verifyToken or fields is empty"`
      );

      expect(bot.requestApi).not.toHaveBeenCalled();
    });
  });

  describe('.deleteAppSubscription(options)', () => {
    it('call subscription API as application', async () => {
      const manager = new FacebookAssetsManager(stateController, bot, {
        appId: '_APP_ID_',
      });

      await expect(manager.deleteAppSubscription()).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApplication: true,
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
        asApplication: true,
        method: 'DELETE',
        url: '_ANOTHER_APP_ID_/subscriptions',
        params: {
          object: 'user',
          fields: ['foo_field', 'bar_field'],
        },
      });
    });

    it('throw if no appId available', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);

      await expect(
        manager.deleteAppSubscription()
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"appId is empty"`);

      expect(bot.requestApi).not.toHaveBeenCalled();
    });
  });

  describe('.setPageSubscribedApp(options)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);

      await expect(
        manager.setPageSubscribedApp(page, {
          fields: ['messages', 'messaging_postbacks'],
          accessToken: '_ACCESS_TOKEN_',
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        page,
        accessToken: '_ACCESS_TOKEN_',
        method: 'POST',
        url: 'me/subscribed_apps',
        params: {
          subscribed_fields: ['messages', 'messaging_postbacks'],
        },
      });
    });

    test('with constructor app settings options', async () => {
      const manager = new FacebookAssetsManager(stateController, bot, {
        pageSubscriptionFields: [
          'messages',
          'messaging_postbacks',
          'messaging_optins',
        ],
      });

      await expect(manager.setPageSubscribedApp(page)).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        page,
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
      const manager = new FacebookAssetsManager(stateController, bot);
      await expect(manager.setPageSubscribedApp(page)).resolves.toBe(undefined);

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

  describe('.deletePageSubscribedApp(options)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);

      await expect(manager.deletePageSubscribedApp(page)).resolves.toBe(
        undefined
      );

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        page,
        method: 'DELETE',
        url: 'me/subscribed_apps',
      });
    });
  });

  describe('.setPageMessengerProfile(page, settings)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET' ? { data: [] } : {}
      );

      await expect(
        manager.setPageMessengerProfile(
          page,
          {
            whitelistedDomains: ['https://foo.bar'],
            getStarted: { payload: 'GO!' },
            greeting: [{ locale: 'default', text: 'Hello World!' }],
          },
          { accessToken: '_ACCESS_TOKEN_' }
        )
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenNthCalledWith(1, {
        page,
        method: 'GET',
        url: 'me/messenger_profile',
        params: {
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
        page,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          whitelisted_domains: ['https://foo.bar'],
          get_started: { payload: 'GO!' },
          greeting: [{ locale: 'default', text: 'Hello World!' }],
        },
        accessToken: '_ACCESS_TOKEN_',
      });
    });

    it('remove current fields if not exist on new settings', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET'
          ? {
              data: [
                {
                  whitelisted_domains: ['https://bar.com', 'https://foo.com'],
                  get_started: { payload: 'GO!' },
                  ice_breakers: [
                    {
                      call_to_actions: [{ question: 'Yo?', payload: 'yo' }],
                      locale: 'default',
                    },
                  ],
                },
              ],
            }
          : {}
      );

      await expect(
        manager.setPageMessengerProfile(page, {
          whitelistedDomains: ['https://foo.com', 'https://bar.com'],
          greeting: [
            { locale: 'zh_TW', text: '哈囉！' },
            { locale: 'default', text: 'Hello World!' },
          ],
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(3);
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        page,
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: {
          fields: ['get_started', 'ice_breakers'],
        },
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(3, {
        page,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          greeting: [
            { locale: 'zh_TW', text: '哈囉！' },
            { locale: 'default', text: 'Hello World!' },
          ],
        },
      });
    });

    it('set fields if value has change', async () => {
      const manager = new FacebookAssetsManager(stateController, bot);
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET'
          ? {
              data: [
                {
                  whitelisted_domains: ['https://bar.com', 'https://foo.com'],
                  greeting: [
                    { locale: 'default', text: 'Hello World!' },
                    { locale: 'zh_TW', text: '哈囉！' },
                  ],
                  get_started: { payload: 'GO!' },
                  ice_breakers: [
                    {
                      call_to_actions: [{ question: 'Yo?', payload: 'yo' }],
                      locale: 'default',
                    },
                  ],
                },
              ],
            }
          : {}
      );

      await expect(
        manager.setPageMessengerProfile(page, {
          whitelistedDomains: ['https://baz.com', 'https://foo.com'],
          greeting: [{ locale: 'default', text: 'Hello World!' }],
          getStarted: { payload: 'GO!' },
          iceBreakers: [
            {
              call_to_actions: [{ question: 'Yo?', payload: 'yo' }],
              locale: 'default',
            },
            {
              call_to_actions: [{ question: '喲?', payload: '唷' }],
              locale: 'zh_TW',
            },
          ],
        })
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        page,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          whitelisted_domains: ['https://baz.com', 'https://foo.com'],
          greeting: [{ locale: 'default', text: 'Hello World!' }],
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
    const manager = new FacebookAssetsManager(stateController, bot);

    await expect(manager.getAssetId(page, 'foo', 'bar')).resolves.toBe(
      undefined
    );
    await expect(manager.getAttachment(page, 'my_attachment')).resolves.toBe(
      undefined
    );
    await expect(manager.getPersona(page, 'my_persona')).resolves.toBe(
      undefined
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(3);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$fb.foo.1234567890",
        "$fb.attachment.1234567890",
        "$fb.persona.1234567890",
      ]
    `);

    expect(state.get).toHaveBeenCalledTimes(3);
    expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.get).toHaveBeenNthCalledWith(2, 'my_attachment');
    expect(state.get).toHaveBeenNthCalledWith(3, 'my_persona');

    state.get.mock.fakeReturnValue('baz');
    await expect(manager.getAssetId(page, 'foo', 'bar')).resolves.toBe('baz');

    state.get.mock.fakeReturnValue('_ATTACHMENT_ID_');
    await expect(manager.getAttachment(page, 'my_attachment')).resolves.toBe(
      '_ATTACHMENT_ID_'
    );

    state.get.mock.fakeReturnValue('_PERSONA_ID_');
    await expect(manager.getPersona(page, 'my_persona')).resolves.toBe(
      '_PERSONA_ID_'
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(6);
    expect(state.get).toHaveBeenCalledTimes(6);
  });

  test('set asset id', async () => {
    const manager = new FacebookAssetsManager(stateController, bot);

    await expect(manager.saveAssetId(page, 'foo', 'bar', 'baz')).resolves.toBe(
      false
    );
    await expect(
      manager.saveAttachment(page, 'my_attachment', '_ATTACHMENT_ID_')
    ).resolves.toBe(false);
    await expect(
      manager.savePersona(page, 'my_persona', '_PERSONA_ID_')
    ).resolves.toBe(false);

    expect(stateController.globalState).toHaveBeenCalledTimes(3);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$fb.foo.1234567890",
        "$fb.attachment.1234567890",
        "$fb.persona.1234567890",
      ]
    `);

    expect(state.set).toHaveBeenCalledTimes(3);
    expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
    expect(state.set).toHaveBeenNthCalledWith(
      2,
      'my_attachment',
      '_ATTACHMENT_ID_'
    );
    expect(state.set).toHaveBeenNthCalledWith(3, 'my_persona', '_PERSONA_ID_');

    state.set.mock.fake(async () => true);
    await expect(manager.saveAssetId(page, 'foo', 'bar', 'baz')).resolves.toBe(
      true
    );
    await expect(
      manager.saveAttachment(page, 'my_attachment', '_ATTACHMENT_ID_')
    ).resolves.toBe(true);
    await expect(
      manager.savePersona(page, 'my_persona', '_PERSONA_ID_')
    ).resolves.toBe(true);
    expect(state.set).toHaveBeenCalledTimes(6);
  });

  test('get all assets', async () => {
    const manager = new FacebookAssetsManager(stateController, bot);

    await expect(manager.getAllAssets(page, 'foo')).resolves.toBe(null);
    await expect(manager.getAllAttachments(page)).resolves.toBe(null);
    await expect(manager.getAllPersonas(page)).resolves.toBe(null);

    expect(stateController.globalState).toHaveBeenCalledTimes(3);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$fb.foo.1234567890",
        "$fb.attachment.1234567890",
        "$fb.persona.1234567890",
      ]
    `);

    expect(state.getAll).toHaveBeenCalledTimes(3);

    const resources = new Map([
      ['bar', '1'],
      ['baz', '2'],
    ]);
    state.getAll.mock.fake(async () => resources);

    await expect(manager.getAllAssets(page, 'foo')).resolves.toEqual(resources);
    await expect(manager.getAllAttachments(page)).resolves.toEqual(resources);
    await expect(manager.getAllPersonas(page)).resolves.toEqual(resources);
  });

  test('remove asset id', async () => {
    const manager = new FacebookAssetsManager(stateController, bot);

    await expect(manager.unsaveAssetId(page, 'foo', 'bar')).resolves.toBe(true);
    await expect(manager.unsaveAttachment(page, 'my_attachment')).resolves.toBe(
      true
    );
    await expect(manager.unsavePersona(page, 'my_persona')).resolves.toBe(true);

    expect(stateController.globalState).toHaveBeenCalledTimes(3);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$fb.foo.1234567890",
        "$fb.attachment.1234567890",
        "$fb.persona.1234567890",
      ]
    `);

    expect(state.delete).toHaveBeenCalledTimes(3);
    expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.delete).toHaveBeenNthCalledWith(2, 'my_attachment');
    expect(state.delete).toHaveBeenNthCalledWith(3, 'my_persona');

    state.delete.mock.fake(async () => false);
    await expect(manager.unsaveAssetId(page, 'foo', 'bar')).resolves.toBe(
      false
    );
    await expect(manager.unsaveAttachment(page, 'my_attachment')).resolves.toBe(
      false
    );
    await expect(manager.unsavePersona(page, 'my_persona')).resolves.toBe(
      false
    );
    expect(state.delete).toHaveBeenCalledTimes(6);
  });

  test('.uploadChatAttachment()', async () => {
    const manager = new FacebookAssetsManager(stateController, bot);
    bot.uploadChatAttachment.mock.fake(async () => ({
      attachmentId: '1857777774821032',
    }));

    await expect(
      manager.uploadChatAttachment(
        page,
        'my_avatar',
        <img src="http://foo.bar/avatar" />
      )
    ).resolves.toBe('1857777774821032');

    expect(bot.uploadChatAttachment).toHaveBeenCalledTimes(1);
    expect(bot.uploadChatAttachment).toHaveBeenCalledWith(
      page,
      <img src="http://foo.bar/avatar" />
    );

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith('my_avatar', '1857777774821032');
  });

  test('.createPersona()', async () => {
    const manager = new FacebookAssetsManager(stateController, bot);
    bot.requestApi.mock.fake(() => ({ id: '_PERSONA_ID_' }));

    await expect(
      manager.createPersona(page, 'cute_persona', {
        name: 'Baby Yoda',
        profilePictureUrl: '_URL_',
      })
    ).resolves.toBe('_PERSONA_ID_');

    expect(bot.requestApi).toHaveBeenCalledTimes(1);
    expect(bot.requestApi).toHaveBeenCalledWith({
      page,
      method: 'POST',
      url: 'me/personas',
      params: { name: 'Baby Yoda', profile_picture_url: '_URL_' },
    });

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith('cute_persona', '_PERSONA_ID_');

    bot.requestApi.mock.fake(() => ({ id: '_PERSONA_ID_2_' }));
    await expect(
      manager.createPersona(page, 'mean_persona', {
        name: 'Boba Fett',
        profilePictureUrl: '_URL_2_',
        accessToken: '_MY_ACCESS_TOKEN_',
      })
    ).resolves.toBe('_PERSONA_ID_2_');

    expect(bot.requestApi).toHaveBeenCalledTimes(2);
    expect(bot.requestApi).toHaveBeenCalledWith({
      page,
      accessToken: '_MY_ACCESS_TOKEN_',
      method: 'POST',
      url: 'me/personas',
      params: { name: 'Boba Fett', profile_picture_url: '_URL_2_' },
    });

    expect(state.set).toHaveBeenCalledTimes(2);
    expect(state.set).toHaveBeenCalledWith('mean_persona', '_PERSONA_ID_2_');
  });

  test('.deletePersona()', async () => {
    const manager = new FacebookAssetsManager(stateController, bot);
    bot.requestApi.mock.fake(() => ({
      id: '_PERSONA_ID_',
    }));

    await expect(manager.deletePersona(page, 'my_persona')).resolves.toBe(
      false
    );
    expect(bot.requestApi).not.toHaveBeenCalled();

    state.get.mock.fake(async () => '_PERSONA_ID_');
    await expect(
      manager.deletePersona(page, 'my_persona', {
        accessToken: '_ACCESS_TOKEN_',
      })
    ).resolves.toBe(true);

    expect(bot.requestApi).toHaveBeenCalledTimes(1);
    expect(bot.requestApi).toHaveBeenCalledWith({
      page,
      accessToken: '_ACCESS_TOKEN_',
      method: 'DELETE',
      url: '_PERSONA_ID_',
    });
    expect(state.delete).toHaveBeenCalledTimes(1);
    expect(state.delete).toHaveBeenCalledWith('my_persona');
  });
});
