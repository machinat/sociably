import { moxy } from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import TwitterUser from '../../User.js';
import type { TwitterBot } from '../../Bot.js';
import { Photo } from '../../components/Media.js';
import { TwitterAssetsManager } from '../AssetsManager.js';

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

const bot = moxy<TwitterBot>({
  id: 123456,
  requestApi() {},
  uploadMedia() {},
  createWelcomeMessage() {},
} as never);

const agent = new TwitterUser('1234567890');

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  await expect(
    Promise.all([
      manager.getAssetId(agent, 'foo', 'bar'),
      manager.getMedia(agent, 'my_media'),
      manager.getCustomProfile(agent, 'my_custom_profile'),
      manager.getWelcomeMessage(agent, 'my_welcome_message'),
    ])
  ).resolves.toEqual([undefined, undefined, undefined, undefined]);

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map((c) => c.args[0]))
    .toMatchInlineSnapshot(`
    [
      "$twtr.foo.1234567890",
      "$twtr.media.1234567890",
      "$twtr.custom_profile.1234567890",
      "$twtr.welcome_message.1234567890",
    ]
  `);
  expect(state.get).toHaveBeenCalledTimes(4);
  expect(state.get.mock.calls.map(({ args }) => args[0])).toEqual([
    'bar',
    'my_media',
    'my_custom_profile',
    'my_welcome_message',
  ]);

  state.get.mock.fakeReturnValueOnce('_FOO_BAR_ID_');
  state.get.mock.fakeReturnValueOnce('_MEDIA_ID_');
  state.get.mock.fakeReturnValueOnce('_CUSTOM_PROFILE_ID_');
  state.get.mock.fakeReturnValueOnce('_WELCOME_MESSAGE_ID_');

  await expect(
    Promise.all([
      manager.getAssetId(agent, 'foo', 'bar'),
      manager.getMedia(agent, 'my_media'),
      manager.getCustomProfile(agent, 'my_custom_profile'),
      manager.getWelcomeMessage(agent, 'my_welcome_message'),
    ])
  ).resolves.toEqual([
    '_FOO_BAR_ID_',
    '_MEDIA_ID_',
    '_CUSTOM_PROFILE_ID_',
    '_WELCOME_MESSAGE_ID_',
  ]);

  expect(stateController.globalState).toHaveBeenCalledTimes(8);
  expect(state.get).toHaveBeenCalledTimes(8);
});

test('save asset id', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  await expect(
    Promise.all([
      manager.saveAssetId(agent, 'foo', 'bar', 'baz'),
      manager.saveMedia(agent, 'my_media', '_MEDIA_ID_'),
      manager.saveCustomProfile(
        agent,
        'my_custom_profile',
        '_CUSTOM_PROFILE_ID_'
      ),
      manager.saveWelcomeMessage(
        agent,
        'my_welcome_message',
        '_WELCOME_MESSAGE_ID_'
      ),
    ])
  ).resolves.toEqual([false, false, false, false]);

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    [
      "$twtr.foo.1234567890",
      "$twtr.media.1234567890",
      "$twtr.custom_profile.1234567890",
      "$twtr.welcome_message.1234567890",
    ]
  `);

  expect(state.set).toHaveBeenCalledTimes(4);
  expect(state.set.mock.calls.map(({ args }) => args)).toEqual([
    ['bar', 'baz'],
    ['my_media', '_MEDIA_ID_'],
    ['my_custom_profile', '_CUSTOM_PROFILE_ID_'],
    ['my_welcome_message', '_WELCOME_MESSAGE_ID_'],
  ]);

  state.set.mock.fake(async () => true);
  await expect(
    Promise.all([
      manager.saveAssetId(agent, 'foo', 'bar', 'baz'),
      manager.saveMedia(agent, 'my_media', '_MEDIA_ID_'),
      manager.saveCustomProfile(
        agent,
        'my_custom_profile',
        '_CUSTOM_PROFILE_ID_'
      ),
      manager.saveWelcomeMessage(
        agent,
        'my_welcome_message',
        '_WELCOME_MESSAGE_ID_'
      ),
    ])
  ).resolves.toEqual([true, true, true, true]);

  expect(stateController.globalState).toHaveBeenCalledTimes(8);
  expect(state.set).toHaveBeenCalledTimes(8);
});

test('get all assets', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  await expect(
    Promise.all([
      manager.getAllAssets(agent, 'foo'),
      manager.getAllMedia(agent),
      manager.getAllCustomProfiles(agent),
      manager.getAllWelcomeMessages(agent),
    ])
  ).resolves.toEqual([null, null, null, null]);

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    [
      "$twtr.foo.1234567890",
      "$twtr.media.1234567890",
      "$twtr.custom_profile.1234567890",
      "$twtr.welcome_message.1234567890",
    ]
  `);
  expect(state.getAll).toHaveBeenCalledTimes(4);

  const assetsMap = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => assetsMap);

  await expect(
    Promise.all([
      manager.getAllAssets(agent, 'foo'),
      manager.getAllMedia(agent),
      manager.getAllCustomProfiles(agent),
      manager.getAllWelcomeMessages(agent),
    ])
  ).resolves.toEqual([assetsMap, assetsMap, assetsMap, assetsMap]);

  expect(stateController.globalState).toHaveBeenCalledTimes(8);
  expect(state.getAll).toHaveBeenCalledTimes(8);
});

test('unsave asset id', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  await expect(
    Promise.all([
      manager.unsaveAssetId(agent, 'foo', 'bar'),
      manager.unsaveMedia(agent, 'my_media'),
      manager.unsaveCustomProfile(agent, 'my_custom_profile'),
      manager.unsaveWelcomeMessage(agent, 'my_welcome_message'),
    ])
  ).resolves.toEqual([true, true, true, true]);

  expect(stateController.globalState).toHaveBeenCalledTimes(4);
  expect(stateController.globalState.mock.calls.map(({ args }) => args[0]))
    .toMatchInlineSnapshot(`
    [
      "$twtr.foo.1234567890",
      "$twtr.media.1234567890",
      "$twtr.custom_profile.1234567890",
      "$twtr.welcome_message.1234567890",
    ]
  `);
  expect(state.delete).toHaveBeenCalledTimes(4);
  expect(state.delete.mock.calls.map(({ args }) => args[0])).toEqual([
    'bar',
    'my_media',
    'my_custom_profile',
    'my_welcome_message',
  ]);

  state.delete.mock.fake(async () => false);
  await expect(
    Promise.all([
      manager.unsaveAssetId(agent, 'foo', 'bar'),
      manager.unsaveMedia(agent, 'my_media'),
      manager.unsaveCustomProfile(agent, 'my_custom_profile'),
      manager.unsaveWelcomeMessage(agent, 'my_welcome_message'),
    ])
  ).resolves.toEqual([false, false, false, false]);

  expect(stateController.globalState).toHaveBeenCalledTimes(8);
  expect(state.delete).toHaveBeenCalledTimes(8);
});

describe('.uploadMedia(tag, media)', () => {
  it('render and save media', async () => {
    const manager = new TwitterAssetsManager(bot, stateController);
    const photo = <Photo url="https://sociably.io/img/foo.jpg" />;
    const uploadResponse = {
      type: 'photo',
      id: '111111111111111111',
      source: {
        type: 'url',
        url: 'https://sociably.io/img/foo.jpg',
        parameters: {},
      },
      result: {
        media_id: BigInt('111111111111111111'),
        media_id_string: '111111111111111111',
      },
    };
    bot.uploadMedia.mock.fake(async () => [uploadResponse]);

    await expect(manager.uploadMedia(agent, 'foo', photo)).resolves.toEqual(
      uploadResponse
    );

    expect(bot.uploadMedia).toHaveBeenCalledTimes(1);
    expect(bot.uploadMedia).toHaveBeenCalledWith(agent, photo);

    expect(
      stateController.globalState.mock.calls[0].args[0]
    ).toMatchInlineSnapshot(`"$twtr.media.1234567890"`);

    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith('foo', '111111111111111111');
  });

  it('throw if media is empty', async () => {
    const manager = new TwitterAssetsManager(bot, stateController);

    await expect(
      manager.uploadMedia(agent, 'foo', null)
    ).rejects.toThrowErrorMatchingInlineSnapshot(`"media content is empty"`);

    expect(state.set).not.toHaveBeenCalled();
  });
});

test('.createWelcomeMessage(name, message)', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  bot.createWelcomeMessage.mock.fake(async () => ({
    welcome_message: {
      id: '844385345234',
      created_timestamp: '1470182274821',
      name: 'my_welcome_message',
      message_data: { text: 'Hello World!' },
    },
  }));

  await expect(
    manager.createWelcomeMessage(
      agent,
      'my_welcome_message',
      <p>Hello World!</p>
    )
  ).resolves.toBe('844385345234');

  expect(bot.createWelcomeMessage).toHaveBeenCalledWith(
    agent,
    'my_welcome_message',
    <p>Hello World!</p>
  );

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"$twtr.welcome_message.1234567890"`);
  expect(state.set).toHaveBeenCalledWith('my_welcome_message', '844385345234');

  bot.createWelcomeMessage.mock.fake(async () => null);
  await expect(
    manager.createWelcomeMessage(agent, 'my_welcome_message', null)
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"message content is empty"`);

  expect(state.set).toHaveBeenCalledTimes(1);
  expect(bot.createWelcomeMessage).toHaveBeenCalledTimes(2);
});

test('.deleteWelcomeMessage(name)', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  state.get.mock.fake(async () => '1234567890');
  bot.requestApi.mock.fake(async () => ({}));

  await expect(
    manager.deleteWelcomeMessage(agent, 'my_welcome_message')
  ).resolves.toBe('1234567890');

  expect(bot.requestApi).toHaveBeenCalledWith({
    channel: agent,
    method: 'DELETE',
    url: '1.1/direct_messages/welcome_messages/destroy.json',
    params: { id: '1234567890' },
  });

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"$twtr.welcome_message.1234567890"`);
  expect(state.delete).toHaveBeenCalledWith('my_welcome_message');

  state.get.mock.fake(async () => undefined);
  await expect(
    manager.deleteCustomProfile(agent, 'my_welcome_message')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"custom profile [my_welcome_message] doesn't exist"`
  );

  expect(state.delete).toHaveBeenCalledTimes(1);
  expect(bot.requestApi).toHaveBeenCalledTimes(1);
});

test('.createCustomProfile(tag, name, img)', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  bot.requestApi.mock.fake(async () => ({
    custom_profile: {
      id: '1234567890',
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
      agent,
      'my_custom_profile',
      'Jon C, Partner Engineer',
      '9876543210'
    )
  ).resolves.toBe('1234567890');

  expect(bot.requestApi).toHaveBeenCalledWith({
    channel: agent,
    method: 'POST',
    url: '1.1/custom_profiles/new.json',
    params: {
      custom_profile: {
        name: 'Jon C, Partner Engineer',
        avatar: { media: { id: '9876543210' } },
      },
    },
  });

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"$twtr.custom_profile.1234567890"`);
  expect(state.set).toHaveBeenCalledWith('my_custom_profile', '1234567890');

  expect(bot.requestApi).toHaveBeenCalledTimes(1);
  expect(state.set).toHaveBeenCalledTimes(1);
});

test('.deleteCustomProfile(name)', async () => {
  const manager = new TwitterAssetsManager(bot, stateController);

  state.get.mock.fake(async () => '1234567890');
  bot.requestApi.mock.fake(async () => ({}));

  await expect(
    manager.deleteCustomProfile(agent, 'my_custom_profile')
  ).resolves.toBe('1234567890');

  expect(bot.requestApi).toHaveBeenCalledWith({
    channel: agent,
    method: 'DELETE',
    url: '1.1/custom_profiles/destroy.json',
    params: { id: '1234567890' },
  });

  expect(
    stateController.globalState.mock.calls[0].args[0]
  ).toMatchInlineSnapshot(`"$twtr.custom_profile.1234567890"`);
  expect(state.delete).toHaveBeenCalledWith('my_custom_profile');

  state.get.mock.fake(async () => undefined);
  await expect(
    manager.deleteCustomProfile(agent, 'my_custom_profile')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"custom profile [my_custom_profile] doesn't exist"`
  );

  expect(state.delete).toHaveBeenCalledTimes(1);
  expect(bot.requestApi).toHaveBeenCalledTimes(1);
});
