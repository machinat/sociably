import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import type StateControllerI from '@machinat/core/base/StateController';
import type { TwitterBot } from '../../Bot';
import { Photo } from '../../components/Media';
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
  renderMedia() {},
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
      manager.getCustomProfile('my_custom_profile'),
      manager.getWelcomeMessage('my_welcome_message'),
    ])
  ).resolves.toEqual([undefined, undefined, undefined, undefined, undefined]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(5);
  expect(stateController.globalState.mock.calls.map((c) => c.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
      "twitter.assets.__APP_ID__.custom_profile",
      "twitter.assets.__APP_ID__.welcome_message",
    ]
  `);
  expect(state.get.mock).toHaveBeenCalledTimes(5);
  expect(state.get.mock.calls.map(({ args }) => args[0])).toEqual([
    'bar',
    'my_media',
    'my_webhook',
    'my_custom_profile',
    'my_welcome_message',
  ]);

  state.get.mock.fakeReturnValueOnce('_FOO_BAR_ID_');
  state.get.mock.fakeReturnValueOnce('_MEDIA_ID_');
  state.get.mock.fakeReturnValueOnce('_WEBHOOK_ID_');
  state.get.mock.fakeReturnValueOnce('_CUSTOM_PROFILE_ID_');
  state.get.mock.fakeReturnValueOnce('_WELCOME_MESSAGE_ID_');

  await expect(
    Promise.all([
      manager.getAssetId('foo', 'bar'),
      manager.getMedia('my_media'),
      manager.getWebhook('my_webhook'),
      manager.getCustomProfile('my_custom_profile'),
      manager.getWelcomeMessage('my_welcome_message'),
    ])
  ).resolves.toEqual([
    '_FOO_BAR_ID_',
    '_MEDIA_ID_',
    '_WEBHOOK_ID_',
    '_CUSTOM_PROFILE_ID_',
    '_WELCOME_MESSAGE_ID_',
  ]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(10);
  expect(state.get.mock).toHaveBeenCalledTimes(10);
});

test('save asset id', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.saveAssetId('foo', 'bar', 'baz'),
      manager.saveMedia('my_media', '_MEDIA_ID_'),
      manager.saveWebhook('my_webhook', '_WEBHOOK_ID_'),
      manager.saveWebhook('my_custom_profile', '_CUSTOM_PROFILE_ID_'),
      manager.saveWebhook('my_welcome_message', '_WELCOME_MESSAGE_ID_'),
    ])
  ).resolves.toEqual([false, false, false, false, false]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(5);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
      "twitter.assets.__APP_ID__.webhook",
      "twitter.assets.__APP_ID__.webhook",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(5);
  expect(state.set.mock.calls.map(({ args }) => args)).toEqual([
    ['bar', 'baz'],
    ['my_media', '_MEDIA_ID_'],
    ['my_webhook', '_WEBHOOK_ID_'],
    ['my_custom_profile', '_CUSTOM_PROFILE_ID_'],
    ['my_welcome_message', '_WELCOME_MESSAGE_ID_'],
  ]);

  state.set.mock.fake(async () => true);
  await expect(
    Promise.all([
      manager.saveAssetId('foo', 'bar', 'baz'),
      manager.saveMedia('my_media', '_MEDIA_ID_'),
      manager.saveWebhook('my_webhook', '_WEBHOOK_ID_'),
      manager.saveWebhook('my_custom_profile', '_CUSTOM_PROFILE_ID_'),
      manager.saveWebhook('my_welcome_message', '_WELCOME_MESSAGE_ID_'),
    ])
  ).resolves.toEqual([true, true, true, true, true]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(10);
  expect(state.set.mock).toHaveBeenCalledTimes(10);
});

test('get all assets', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.getAllAssets('foo'),
      manager.getAllMedia(),
      manager.getAllWebhooks(),
      manager.getAllCustomProfiles(),
      manager.getAllWelcomeMessages(),
    ])
  ).resolves.toEqual([null, null, null, null, null]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(5);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
      "twitter.assets.__APP_ID__.custom_profile",
      "twitter.assets.__APP_ID__.welcome_message",
    ]
  `);
  expect(state.getAll.mock).toHaveBeenCalledTimes(5);

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
      manager.getAllCustomProfiles(),
      manager.getAllWelcomeMessages(),
    ])
  ).resolves.toEqual([assetsMap, assetsMap, assetsMap, assetsMap, assetsMap]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(10);
  expect(state.getAll.mock).toHaveBeenCalledTimes(10);
});

test('unsave asset id', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  await expect(
    Promise.all([
      manager.unsaveAssetId('foo', 'bar'),
      manager.unsaveMedia('my_media'),
      manager.unsaveWebhook('my_webhook'),
      manager.unsaveCustomProfile('my_custom_profile'),
      manager.unsaveWelcomeMessage('my_welcome_message'),
    ])
  ).resolves.toEqual([true, true, true, true, true]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(5);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "twitter.assets.__APP_ID__.foo",
      "twitter.assets.__APP_ID__.media",
      "twitter.assets.__APP_ID__.webhook",
      "twitter.assets.__APP_ID__.custom_profile",
      "twitter.assets.__APP_ID__.welcome_message",
    ]
  `);
  expect(state.delete.mock).toHaveBeenCalledTimes(5);
  expect(state.delete.mock.calls.map(({ args }) => args[0])).toEqual([
    'bar',
    'my_media',
    'my_webhook',
    'my_custom_profile',
    'my_welcome_message',
  ]);

  state.delete.mock.fake(async () => false);
  await expect(
    Promise.all([
      manager.unsaveAssetId('foo', 'bar'),
      manager.unsaveMedia('my_media'),
      manager.unsaveWebhook('my_webhook'),
      manager.unsaveCustomProfile('my_custom_profile'),
      manager.unsaveWelcomeMessage('my_welcome_message'),
    ])
  ).resolves.toEqual([false, false, false, false, false]);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(10);
  expect(state.delete.mock).toHaveBeenCalledTimes(10);
});

describe('.renderMedia(tag, media)', () => {
  it('render and save media', async () => {
    const manager = new TwitterAssetsManager(appId, stateController, bot);
    const photo = <Photo url="https://machinat.io/img/foo.jpg" />;
    const uploadResponse = {
      type: 'photo',
      id: '111111111111111111',
      source: {
        type: 'url',
        url: 'https://machinat.io/img/foo.jpg',
        parameters: {},
      },
      result: {
        media_id: BigInt('111111111111111111'),
        media_id_string: '111111111111111111',
      },
    };
    bot.renderMedia.mock.fake(async () => [uploadResponse]);

    await expect(manager.renderMedia('foo', photo)).resolves.toEqual(
      uploadResponse
    );

    expect(bot.renderMedia.mock).toHaveBeenCalledTimes(1);
    expect(bot.renderMedia.mock).toHaveBeenCalledWith(photo);

    expect(stateController.globalState.mock).toHaveBeenCalledTimes(1);
    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.media"`);

    expect(state.set.mock).toHaveBeenCalledTimes(1);
    expect(state.set.mock).toHaveBeenCalledWith('foo', '111111111111111111');
  });

  it('throw if media is empty', async () => {
    const manager = new TwitterAssetsManager(appId, stateController, bot);

    await expect(
      manager.renderMedia('foo', null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"media content is empty"`);

    expect(state.set.mock).not.toHaveBeenCalled();
  });
});

describe('.setUpWebhook(tag, env, url)', () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);
  const url = 'https://your_domain.com/webhook/twitter';
  const envName = 'production';
  const tagName = 'my_app_webhook';

  test('return saved webhook', async () => {
    state.get.mock.fake(async () => '1234567890');

    await expect(manager.setUpWebhook(tagName, envName, url)).resolves.toBe(
      '1234567890'
    );

    expect(bot.makeApiCall.mock).not.toHaveBeenCalled();
    expect(state.set.mock).not.toHaveBeenCalled();
  });

  test('save existed webhook if the url is matched', async () => {
    bot.makeApiCall.mock.fake(async () => ({
      environments: [
        {
          environment_name: envName,
          webhooks: [
            {
              id: '1234567890',
              url: 'https://your_domain.com/webhook/twitter',
              valid: true,
              created_at: '2017-06-02T23:54:02Z',
            },
          ],
        },
      ],
    }));

    await expect(manager.setUpWebhook(tagName, envName, url)).resolves.toBe(
      '1234567890'
    );

    expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
      'GET',
      '1.1/account_activity/all/webhooks.json',
      undefined,
      { asApplication: true }
    );

    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.webhook"`);
    expect(state.set.mock).toHaveBeenCalledWith(tagName, '1234567890');

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
    expect(state.set.mock).toHaveBeenCalledTimes(1);
  });

  test('create a new webhook if no existed one', async () => {
    bot.makeApiCall.mock.fakeOnce(async () => ({
      environments: [
        {
          environment_name: envName,
          webhooks: [],
        },
      ],
    }));
    bot.makeApiCall.mock.fakeOnce(async () => ({
      id: '1234567890',
      url,
      valid: true,
      created_at: '2016-06-02T23:54:02Z',
    }));

    await expect(manager.setUpWebhook(tagName, envName, url)).resolves.toBe(
      '1234567890'
    );

    expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
      'POST',
      '1.1/account_activity/all/production/webhooks.json',
      { url }
    );

    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.webhook"`);
    expect(state.set.mock).toHaveBeenCalledWith(tagName, '1234567890');

    expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(2);
    expect(state.set.mock).toHaveBeenCalledTimes(1);
  });
});

test('.deleteWebhook(tag, env)', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  state.get.mock.fake(async () => '1234567890');
  bot.makeApiCall.mock.fake(async () => ({}));

  await expect(
    manager.deleteWebhook('my_app_webhook', 'production')
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
    manager.deleteWebhook('my_app_webhook', 'production')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"webhook \\"my_app_webhook\\" doesn't exist"`
  );

  expect(state.delete.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
});

test('.createCustomProfile(tag, name, img)', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  bot.makeApiCall.mock.fake(async () => ({
    custom_profile: {
      id: '11111',
      created_timestamp: '1479767168196',
      name: 'Jon C, Partner Engineer',
      avatar: {
        media: {
          url: 'https://pbs.twimg.com/media/Cr7HZpvVYAAYZIX.jpg',
        },
      },
    },
  }));

  await expect(
    manager.createCustomProfile(
      'my_custom_profile',
      'Jon C, Partner Engineer',
      '77777'
    )
  ).resolves.toBe('11111');

  expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
    'POST',
    '1.1/custom_profiles/new.json',
    {
      custom_profile: {
        name: 'Jon C, Partner Engineer',
        avatar: { media: { id: '77777' } },
      },
    }
  );

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.custom_profile"`);
  expect(state.set.mock).toHaveBeenCalledWith('my_custom_profile', '11111');

  state.get.mock.fake(async () => '11111');
  await expect(
    manager.createCustomProfile(
      'my_custom_profile',
      'Jon C, Partner Engineer',
      '77777'
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"custom profile [my_custom_profile] already exists"`
  );

  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock).toHaveBeenCalledTimes(1);
});

test('.deleteCustomProfile(name)', async () => {
  const manager = new TwitterAssetsManager(appId, stateController, bot);

  state.get.mock.fake(async () => '11111');
  bot.makeApiCall.mock.fake(async () => ({}));

  await expect(manager.deleteCustomProfile('my_custom_profile')).resolves.toBe(
    '11111'
  );

  expect(bot.makeApiCall.mock).toHaveBeenCalledWith(
    'DELETE',
    '1.1/custom_profiles/destroy.json',
    { id: '11111' }
  );

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"twitter.assets.__APP_ID__.custom_profile"`);
  expect(state.delete.mock).toHaveBeenCalledWith('my_custom_profile');

  state.get.mock.fake(async () => undefined);
  await expect(
    manager.deleteCustomProfile('my_custom_profile')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"custom profile [my_custom_profile] doesn't exist"`
  );

  expect(state.delete.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
});
