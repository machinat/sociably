import moxy from '@moxyjs/moxy';
import nock from 'nock';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import type { WhatsAppBot } from '../../Bot.js';
import WhatsAppAgent from '../../Agent.js';
import { Image } from '../../components/Media.js';
import { WhatsAppAssetsManager } from '../AssetsManager.js';

const state = moxy({
  get: async () => null,
  set: async () => false,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const agent = new WhatsAppAgent('1111111111');

const stateController = moxy<StateControllerI>({
  globalState() {
    return state;
  },
} as never);

const bot = moxy<WhatsAppBot>({
  graphApiVersion: 'v17.0',
  accessToken: '_ROOT_ACCESS_TOKEN_',
  uploadMedia() {
    return { jobs: [{}], results: [{}] };
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
      const manager = new WhatsAppAssetsManager(stateController, bot);

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

    test('with constructor app settings options', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot, {
        appId: '_APP_ID_',
        webhookVerifyToken: '_VERIFY_TOKEN_',
        webhookUrl: 'https://foo.bar/baz/',
        subscriptionFields: ['messages', 'messaging_postbacks'],
      });

      await expect(manager.setAppSubscription({})).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi).toHaveBeenCalledWith({
        asApp: true,
        method: 'POST',
        url: '_APP_ID_/subscriptions',
        params: {
          object: 'whatsapp_business_account',
          callback_url: 'https://foo.bar/baz/',
          verify_token: '_VERIFY_TOKEN_',
          fields: ['messages', 'messaging_postbacks'],
          include_values: true,
        },
      });
    });

    test('default subscription fields', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot, {
        appId: '_APP_ID_',
        webhookVerifyToken: '_VERIFY_TOKEN_',
      });

      await expect(
        manager.setAppSubscription({ webhookUrl: 'https://foo.bar/baz/' }),
      ).resolves.toBe(undefined);

      expect(bot.requestApi).toHaveBeenCalledTimes(1);
      expect(bot.requestApi.mock.calls[0].args[0].params.fields)
        .toMatchInlineSnapshot(`
        [
          "messages",
        ]
      `);
    });

    it('throw if no appId available', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot);
      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, webhookUrl, webhookVerifyToken or fields is empty"`,
      );
      expect(bot.requestApi).not.toHaveBeenCalled();
    });

    it('throw if no webhookUrl available', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot);
      await expect(
        manager.setAppSubscription({
          appId: '_APP_ID_',
          webhookVerifyToken: '_VERIFY_TOKEN_',
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, webhookUrl, webhookVerifyToken or fields is empty"`,
      );
      expect(bot.requestApi).not.toHaveBeenCalled();
    });

    it('throw if no webhookVerifyToken available', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot);
      await expect(
        manager.setAppSubscription({
          webhookUrl: 'https://foo.bar/baz/',
          appId: '_APP_ID_',
        }),
      ).rejects.toThrowErrorMatchingInlineSnapshot(
        `"appId, webhookUrl, webhookVerifyToken or fields is empty"`,
      );
      expect(bot.requestApi).not.toHaveBeenCalled();
    });
  });

  describe('.deleteAppSubscription(options)', () => {
    it('call subscription API as application', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot, {
        appId: '_APP_ID_',
      });

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

    it('throw if no appId available', async () => {
      const manager = new WhatsAppAssetsManager(stateController, bot);

      await expect(
        manager.deleteAppSubscription(),
      ).rejects.toThrowErrorMatchingInlineSnapshot(`"appId is empty"`);

      expect(bot.requestApi).not.toHaveBeenCalled();
    });
  });
});

describe('assets management', () => {
  test('get asset id', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);

    await expect(manager.getAssetId(agent, 'foo', 'bar')).resolves.toBe(
      undefined,
    );
    await expect(manager.getMedia(agent, 'my_media')).resolves.toBe(undefined);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
          [
            "$wa.foo.1111111111",
            "$wa.media.1111111111",
          ]
      `);

    expect(state.get).toHaveBeenCalledTimes(2);
    expect(state.get).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.get).toHaveBeenNthCalledWith(2, 'my_media');

    state.get.mock.fakeReturnValue('baz');
    await expect(manager.getAssetId(agent, 'foo', 'bar')).resolves.toBe('baz');

    state.get.mock.fakeReturnValue('_MEDIA_ID_');
    await expect(manager.getMedia(agent, 'my_media')).resolves.toBe(
      '_MEDIA_ID_',
    );

    expect(stateController.globalState).toHaveBeenCalledTimes(4);
    expect(state.get).toHaveBeenCalledTimes(4);
  });

  test('set asset id', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);

    await expect(manager.saveAssetId(agent, 'foo', 'bar', 'baz')).resolves.toBe(
      false,
    );
    await expect(
      manager.saveMedia(agent, 'my_media', '_MEDIA_ID_'),
    ).resolves.toBe(false);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
          [
            "$wa.foo.1111111111",
            "$wa.media.1111111111",
          ]
      `);

    expect(state.set).toHaveBeenCalledTimes(2);
    expect(state.set).toHaveBeenNthCalledWith(1, 'bar', 'baz');
    expect(state.set).toHaveBeenNthCalledWith(2, 'my_media', '_MEDIA_ID_');

    state.set.mock.fake(async () => true);
    await expect(manager.saveAssetId(agent, 'foo', 'bar', 'baz')).resolves.toBe(
      true,
    );
    await expect(
      manager.saveMedia(agent, 'my_media', '_MEDIA_ID_'),
    ).resolves.toBe(true);
    expect(state.set).toHaveBeenCalledTimes(4);
  });

  test('get all assets', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);

    await expect(manager.getAllAssets(agent, 'foo')).resolves.toBe(null);
    await expect(manager.getAllMedias(agent)).resolves.toBe(null);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
          [
            "$wa.foo.1111111111",
            "$wa.media.1111111111",
          ]
      `);

    expect(state.getAll).toHaveBeenCalledTimes(2);

    const resources = new Map([
      ['bar', '1'],
      ['baz', '2'],
    ]);
    state.getAll.mock.fake(async () => resources);

    await expect(manager.getAllAssets(agent, 'foo')).resolves.toEqual(
      resources,
    );
    await expect(manager.getAllMedias(agent)).resolves.toEqual(resources);
  });

  test('remove asset id', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);

    await expect(manager.unsaveAssetId(agent, 'foo', 'bar')).resolves.toBe(
      true,
    );
    await expect(manager.unsaveMedia(agent, 'my_media')).resolves.toBe(true);

    expect(stateController.globalState).toHaveBeenCalledTimes(2);
    expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
      .toMatchInlineSnapshot(`
          [
            "$wa.foo.1111111111",
            "$wa.media.1111111111",
          ]
      `);

    expect(state.delete).toHaveBeenCalledTimes(2);
    expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
    expect(state.delete).toHaveBeenNthCalledWith(2, 'my_media');

    state.delete.mock.fake(async () => false);
    await expect(manager.unsaveAssetId(agent, 'foo', 'bar')).resolves.toBe(
      false,
    );
    await expect(manager.unsaveMedia(agent, 'my_media')).resolves.toBe(false);
    expect(state.delete).toHaveBeenCalledTimes(4);
  });

  test('.uploadMedia()', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);
    bot.uploadMedia.mock.fake(async () => ({ id: '1857777774821032' }));

    await expect(
      manager.uploadMedia(
        agent,
        'my_avatar',
        <Image file={{ data: Buffer.from(''), contentType: 'image/png' }} />,
      ),
    ).resolves.toBe('1857777774821032');

    expect(bot.uploadMedia).toHaveBeenCalledTimes(1);
    expect(bot.uploadMedia).toHaveBeenCalledWith(
      agent,
      <Image file={{ data: Buffer.from(''), contentType: 'image/png' }} />,
    );

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith('my_avatar', '1857777774821032');
  });
});

describe('.createPredefinedTemplate(businessAccountId, options)', () => {
  it('make POST /message_templates API call', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);
    bot.requestApi.mock.fake(async () => ({ id: '_TEMPLATE_ID_1_' }));

    await expect(
      manager.createPredefinedTemplate('_BUSINESS_ACCOUNT_ID_', {
        category: 'marketing',
        name: 'MyVeryGoodTemplate',
        language: 'en_US',
        header: {
          format: 'text',
          text: 'This is a {{1}} header',
          examples: ['cool', 'good', 'fantasy'],
        },
        body: {
          text: 'This is a {{1}} body for {{2}}',
          examples: [
            ['beautiful', 'you'],
            ['amazing', 'us'],
          ],
        },
        footer: { text: 'This is a footer' },
        buttons: [
          {
            type: 'url',
            text: 'Go to URL',
            url: 'https://foo.bar/baz/{{1}}',
            examples: ['bae.html'],
          },
          { type: 'quick_reply', text: 'Reply w/ Payload' },
          { type: 'catalog', text: 'Check Catalog' },
        ],
      }),
    ).resolves.toEqual({ id: '_TEMPLATE_ID_1_' });

    expect(bot.requestApi).toHaveBeenCalledTimes(1);
    expect(bot.requestApi).toHaveBeenCalledWith({
      method: 'POST',
      url: '_BUSINESS_ACCOUNT_ID_/message_templates',
      params: {
        category: 'marketing',
        name: 'MyVeryGoodTemplate',
        language: 'en_US',
        components: [
          {
            type: 'header',
            format: 'text',
            text: 'This is a {{1}} header',
            example: { header_text: ['cool', 'good', 'fantasy'] },
          },
          {
            type: 'body',
            text: 'This is a {{1}} body for {{2}}',
            example: {
              body_text: [
                ['beautiful', 'you'],
                ['amazing', 'us'],
              ],
            },
          },
          { type: 'footer', text: 'This is a footer' },
          {
            type: 'buttons',
            buttons: [
              {
                type: 'url',
                text: 'Go to URL',
                url: 'https://foo.bar/baz/{{1}}',
                example: ['bae.html'],
              },
              { type: 'quick_reply', text: 'Reply w/ Payload' },
              { type: 'catalog', text: 'Check Catalog' },
            ],
          },
        ],
      },
    });
  });

  test('with media header', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot, {
      appId: '_APP_ID_',
    });
    bot.requestApi.mock.fake(async () => ({ id: '_TEMPLATE_ID_2_' }));
    // mock uploading api
    bot.requestApi.mock.fakeOnce(async () => ({ id: '_UPLOAD_ID_' }));
    const uploadApiCall = nock(`https://graph.facebook.com`)
      .post(`/${bot.graphApiVersion}/_UPLOAD_ID_`, 'foo', {
        reqheaders: {
          Authorization: 'OAuth _ROOT_ACCESS_TOKEN_',
          'Content-Type': 'image/png',
          'Content-Length': '3',
          file_offset: '0',
        },
      })
      .reply(200, { h: '.....' });

    await expect(
      manager.createPredefinedTemplate('_BUSINESS_ACCOUNT_ID_', {
        category: 'marketing',
        name: 'MyVeryVeryGoodTemplate',
        language: 'zh_TW',
        header: {
          format: 'image',
          examples: [
            { url: 'http://foo.bar/baz.png' },
            {
              file: {
                data: Buffer.from('foo'),
                contentType: 'image/png',
                fileName: 'baz.png',
              },
            },
          ],
        },
        body: {
          text: 'This is a {{1}} body for {{2}}',
          examples: [['cool', 'me']],
        },
        buttons: [
          {
            type: 'copy_code',
            examples: ['_COUPON_CODE_'],
          },
          { type: 'phone_number', text: 'Call Me', phoneNumber: '+1234567890' },
          { type: 'mpm', text: 'Buy Products' },
        ],
      }),
    ).resolves.toEqual({ id: '_TEMPLATE_ID_2_' });

    expect(bot.requestApi).toHaveBeenCalledTimes(2);
    expect(bot.requestApi).toHaveBeenNthCalledWith(1, {
      method: 'POST',
      url: '_APP_ID_/uploads',
      params: {
        file_length: 3,
        file_type: 'image/png',
        file_name: 'baz.png',
      },
    });
    expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
      method: 'POST',
      url: '_BUSINESS_ACCOUNT_ID_/message_templates',
      params: {
        category: 'marketing',
        name: 'MyVeryVeryGoodTemplate',
        language: 'zh_TW',
        components: [
          {
            type: 'header',
            format: 'image',
            example: {
              header_handle: ['http://foo.bar/baz.png', '_UPLOAD_ID_'],
            },
          },
          {
            type: 'body',
            text: 'This is a {{1}} body for {{2}}',
            example: { body_text: [['cool', 'me']] },
          },
          {
            type: 'buttons',
            buttons: [
              {
                type: 'copy_code',
                example: ['_COUPON_CODE_'],
              },
              {
                type: 'phone_number',
                text: 'Call Me',
                phone_number: '+1234567890',
              },
              { type: 'mpm', text: 'Buy Products' },
            ],
          },
        ],
      },
    });

    expect(uploadApiCall.isDone()).toBe(true);
  });
});

describe('.deletePredefinedTemplate(businessAccountId, options)', () => {
  it('make calls to graph API', async () => {
    const manager = new WhatsAppAssetsManager(stateController, bot);
    bot.requestApi.mock.fake(async () => ({}));

    await expect(
      manager.deletePredefinedTemplate('_BUSINESS_ACCOUNT_ID_', {
        name: 'MyVeryGoodTemplate',
      }),
    ).resolves.toBe(undefined);
    await expect(
      manager.deletePredefinedTemplate('_BUSINESS_ACCOUNT_ID_', {
        name: 'MyGoooooodTemplate',
        id: '_TEMPLATE_ID_',
      }),
    ).resolves.toBe(undefined);

    expect(bot.requestApi).toHaveBeenCalledTimes(2);
    expect(bot.requestApi).toHaveBeenNthCalledWith(1, {
      method: 'DELETE',
      url: '_BUSINESS_ACCOUNT_ID_/message_templates',
      params: { name: 'MyVeryGoodTemplate' },
    });
    expect(bot.requestApi).toHaveBeenNthCalledWith(2, {
      method: 'DELETE',
      url: '_BUSINESS_ACCOUNT_ID_/message_templates',
      params: { name: 'MyGoooooodTemplate', hsm_id: '_TEMPLATE_ID_' },
    });
  });
});
