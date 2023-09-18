import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import { MetaApiChannel } from '@sociably/meta-api';
import { MessengerAssetsManager } from '../AssetsManager.js';
import { MessengerBot } from '../../types.js';

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

const bot = moxy<MessengerBot<MetaApiChannel>>({
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

const channelId = '12345';
const channel = {
  platform: 'test',
  id: channelId,
} as MetaApiChannel;

describe('page/app management', () => {
  describe('.setSubscribedApp(options)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new MessengerAssetsManager(stateController, bot, 'test');

      await expect(
        manager.setSubscribedApp(channel, {
          fields: ['messages', 'messaging_postbacks'],
          accessToken: '_ACCESS_TOKEN_',
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        channel,
        accessToken: '_ACCESS_TOKEN_',
        method: 'POST',
        url: 'me/subscribed_apps',
        params: {
          subscribed_fields: ['messages', 'messaging_postbacks'],
        },
      });
    });
  });

  describe('.deleteSubscribedApp(options)', () => {
    it('call subscribed_apps API as page', async () => {
      const manager = new MessengerAssetsManager(stateController, bot, 'test');
      await expect(manager.deleteSubscribedApp(channel)).resolves.toBe(
        undefined,
      );

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        channel,
        method: 'DELETE',
        url: 'me/subscribed_apps',
      });
    });

    test('with specified accessToken', async () => {
      const manager = new MessengerAssetsManager(stateController, bot, 'test');
      await expect(
        manager.deleteSubscribedApp(channel, { accessToken: '_ACCESS_TOKEN_' }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        channel,
        accessToken: '_ACCESS_TOKEN_',
        method: 'DELETE',
        url: 'me/subscribed_apps',
      });
    });
  });

  describe('.setMessengerProfile(page, settings)', () => {
    const messengerProfileFields = [
      'whitelisted_domains',
      'get_started',
      'greeting',
      'ice_breakers',
      'persistent_menu',
      'account_linking_url',
    ];

    it('call subscribed_apps API as page', async () => {
      const manager = new MessengerAssetsManager(stateController, bot, 'test');
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET' ? { data: [] } : {},
      );

      await expect(
        manager.setMessengerProfile(channel, {
          whitelistedDomains: ['https://foo.bar'],
          getStarted: { payload: 'GO!' },
          greeting: [{ locale: 'default', text: 'Hello World!' }],
          accessToken: '_ACCESS_TOKEN_',
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenNthCalledWith(1, {
        channel,
        method: 'GET',
        url: 'me/messenger_profile',
        params: {
          fields: expect.arrayContaining(messengerProfileFields),
        },
        accessToken: '_ACCESS_TOKEN_',
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel,
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
      const manager = new MessengerAssetsManager(stateController, bot, 'test');
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
          : {},
      );

      await expect(
        manager.setMessengerProfile(channel, {
          whitelistedDomains: ['https://foo.com', 'https://bar.com'],
          greeting: [
            { locale: 'zh_TW', text: '哈囉！' },
            { locale: 'default', text: 'Hello World!' },
          ],
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(3);
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel,
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: {
          fields: ['get_started', 'ice_breakers'],
        },
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(3, {
        channel,
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
      const manager = new MessengerAssetsManager(stateController, bot, 'test');
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
          : {},
      );

      await expect(
        manager.setMessengerProfile(channel, {
          whitelistedDomains: ['https://baz.com', 'https://foo.com'],
          greeting: [{ locale: 'default', text: 'Hello World!' }],
          getStarted: { payload: 'GO!' },
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
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(2);
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel,
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

    test('platform option on method', async () => {
      const manager = new MessengerAssetsManager(stateController, bot, 'test');
      bot.requestApi.mock.fake(async ({ method }) =>
        method === 'GET'
          ? {
              data: [
                {
                  ice_breakers: [
                    {
                      locale: 'default',
                      call_to_actions: [{ question: 'Yo?', payload: 'yo' }],
                    },
                  ],
                },
              ],
            }
          : {},
      );

      await expect(
        manager.setMessengerProfile(channel, {
          platform: 'instagram',
          persistentMenu: [
            {
              locale: 'default',
              callToActions: [
                { type: 'postback' as const, title: 'Yo!', payload: 'yo' },
              ],
            },
          ],
        }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(3);
      expect(bot.requestApi).toHaveBeenNthCalledWith(1, {
        channel,
        method: 'GET',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          fields: expect.arrayContaining(messengerProfileFields),
        },
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
        channel,
        method: 'DELETE',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          fields: ['ice_breakers'],
        },
      });
      expect(bot.requestApi).toHaveBeenNthCalledWith(3, {
        channel,
        method: 'POST',
        url: 'me/messenger_profile',
        params: {
          platform: 'instagram',
          persistent_menu: [
            {
              locale: 'default',
              call_to_actions: [
                { type: 'postback', title: 'Yo!', payload: 'yo' },
              ],
            },
          ],
        },
      });
    });
  });
});

describe('assets management', () => {
  test('get asset id', async () => {
    const manager = new MessengerAssetsManager(stateController, bot, 'test');

    await expect(manager.getAssetId(channel, 'foo', 'bar')).resolves.toBe(
      undefined,
    );
    await expect(manager.getAttachment(channel, 'my_attachment')).resolves.toBe(
      undefined,
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$test.foo.12345",
        "$test.attachment.12345",
      ]
    `);

    expect(state.get).toHaveBeenCalledTimes(2);
    expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.get).toHaveBeenNthCalledWith(2, 'my_attachment');

    state.get.mock.fakeReturnValue('baz');
    await expect(manager.getAssetId(channel, 'foo', 'bar')).resolves.toBe(
      'baz',
    );

    state.get.mock.fakeReturnValue('_ATTACHMENT_ID_');
    await expect(manager.getAttachment(channel, 'my_attachment')).resolves.toBe(
      '_ATTACHMENT_ID_',
    );

    state.get.mock.fakeReturnValue('_PERSONA_ID_');

    expect(stateController.globalState).toHaveBeenCalledTimes(4);
    expect(state.get).toHaveBeenCalledTimes(4);
  });

  test('set asset id', async () => {
    const manager = new MessengerAssetsManager(stateController, bot, 'test');

    await expect(
      manager.saveAssetId(channel, 'foo', 'bar', 'baz'),
    ).resolves.toBe(false);
    await expect(
      manager.saveAttachment(channel, 'my_attachment', '_ATTACHMENT_ID_'),
    ).resolves.toBe(false);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$test.foo.12345",
        "$test.attachment.12345",
      ]
    `);

    expect(state.set).toHaveBeenCalledTimes(2);
    expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
    expect(state.set).toHaveBeenNthCalledWith(
      2,
      'my_attachment',
      '_ATTACHMENT_ID_',
    );

    state.set.mock.fake(async () => true);
    await expect(
      manager.saveAssetId(channel, 'foo', 'bar', 'baz'),
    ).resolves.toBe(true);
    await expect(
      manager.saveAttachment(channel, 'my_attachment', '_ATTACHMENT_ID_'),
    ).resolves.toBe(true);
    expect(state.set).toHaveBeenCalledTimes(4);
  });

  test('get all assets', async () => {
    const manager = new MessengerAssetsManager(stateController, bot, 'test');

    await expect(manager.getAllAssets(channel, 'foo')).resolves.toBe(null);
    await expect(manager.getAllAttachments(channel)).resolves.toBe(null);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$test.foo.12345",
        "$test.attachment.12345",
      ]
    `);

    expect(state.getAll).toHaveBeenCalledTimes(2);

    const resources = new Map([
      ['bar', '1'],
      ['baz', '2'],
    ]);
    state.getAll.mock.fake(async () => resources);

    await expect(manager.getAllAssets(channel, 'foo')).resolves.toEqual(
      resources,
    );
    await expect(manager.getAllAttachments(channel)).resolves.toEqual(
      resources,
    );
  });

  test('remove asset id', async () => {
    const manager = new MessengerAssetsManager(stateController, bot, 'test');

    await expect(manager.unsaveAssetId(channel, 'foo', 'bar')).resolves.toBe(
      true,
    );
    await expect(
      manager.unsaveAttachment(channel, 'my_attachment'),
    ).resolves.toBe(true);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
      [
        "$test.foo.12345",
        "$test.attachment.12345",
      ]
    `);

    expect(state.delete).toHaveBeenCalledTimes(2);
    expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.delete).toHaveBeenNthCalledWith(2, 'my_attachment');

    state.delete.mock.fake(async () => false);
    await expect(manager.unsaveAssetId(channel, 'foo', 'bar')).resolves.toBe(
      false,
    );
    await expect(
      manager.unsaveAttachment(channel, 'my_attachment'),
    ).resolves.toBe(false);
    expect(state.delete).toHaveBeenCalledTimes(4);
  });

  test('.uploadChatAttachment()', async () => {
    const manager = new MessengerAssetsManager(stateController, bot, 'test');
    bot.uploadChatAttachment.mock.fake(async () => ({
      attachmentId: '1857777774821032',
    }));

    await expect(
      manager.uploadChatAttachment(
        channel,
        'my_avatar',
        <img src="http://foo.bar/avatar" />,
      ),
    ).resolves.toBe('1857777774821032');

    expect(bot.uploadChatAttachment).toHaveBeenCalledTimes(1);
    expect(bot.uploadChatAttachment).toHaveBeenCalledWith(
      channel,
      <img src="http://foo.bar/avatar" />,
    );

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith('my_avatar', '1857777774821032');
  });
});
