import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import type { WhatsAppBot } from '../../Bot';
import { Image } from '../../components/Media';
import { WhatsAppAssetsManager } from '../AssetsManager';

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

const bot = moxy<WhatsAppBot>({
  pageId: '_PAGE_ID_',
  uploadMedia() {
    return { jobs: [{}], results: [{}] };
  },
  makeApiCall() {},
} as never);

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new WhatsAppAssetsManager(stateController, bot);

  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getMedia('my_media')).resolves.toBe(undefined);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "whatsapp.assets.undefined.foo",
      "whatsapp.assets.undefined.media",
    ]
  `);

  expect(state.get.mock).toHaveBeenCalledTimes(2);
  expect(state.get.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(2, 'my_media');

  state.get.mock.fakeReturnValue('baz');
  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_MEDIA_ID_');
  await expect(manager.getMedia('my_media')).resolves.toBe('_MEDIA_ID_');

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(4);
  expect(state.get.mock).toHaveBeenCalledTimes(4);
});

test('set asset id', async () => {
  const manager = new WhatsAppAssetsManager(stateController, bot);

  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(false);
  await expect(manager.saveMedia('my_media', '_MEDIA_ID_')).resolves.toBe(
    false
  );

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "whatsapp.assets.undefined.foo",
      "whatsapp.assets.undefined.media",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(2);
  expect(state.set.mock).toHaveBeenNthCalledWith(1, 'bar', 'baz');
  expect(state.set.mock).toHaveBeenNthCalledWith(2, 'my_media', '_MEDIA_ID_');

  state.set.mock.fake(async () => true);
  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(true);
  await expect(manager.saveMedia('my_media', '_MEDIA_ID_')).resolves.toBe(true);
  expect(state.set.mock).toHaveBeenCalledTimes(4);
});

test('get all assets', async () => {
  const manager = new WhatsAppAssetsManager(stateController, bot);

  await expect(manager.getAllAssets('foo')).resolves.toBe(null);
  await expect(manager.getAllMedias()).resolves.toBe(null);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "whatsapp.assets.undefined.foo",
      "whatsapp.assets.undefined.media",
    ]
  `);

  expect(state.getAll.mock).toHaveBeenCalledTimes(2);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(manager.getAllMedias()).resolves.toEqual(resources);
});

test('remove asset id', async () => {
  const manager = new WhatsAppAssetsManager(stateController, bot);

  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(true);
  await expect(manager.unsaveMedia('my_media')).resolves.toBe(true);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(2);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "whatsapp.assets.undefined.foo",
      "whatsapp.assets.undefined.media",
    ]
  `);

  expect(state.delete.mock).toHaveBeenCalledTimes(2);
  expect(state.delete.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(2, 'my_media');

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(false);
  await expect(manager.unsaveMedia('my_media')).resolves.toBe(false);
  expect(state.delete.mock).toHaveBeenCalledTimes(4);
});

test('#uploadMedia()', async () => {
  const manager = new WhatsAppAssetsManager(stateController, bot);
  bot.uploadMedia.mock.fake(async () => ({ id: '1857777774821032' }));

  await expect(
    manager.uploadMedia('my_avatar', <Image fileData={Buffer.from('')} />)
  ).resolves.toBe('1857777774821032');

  expect(bot.uploadMedia.mock).toHaveBeenCalledTimes(1);
  expect(bot.uploadMedia.mock).toHaveBeenCalledWith(
    <Image fileData={Buffer.from('')} />
  );

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ATTACHMENT_');
  await expect(
    manager.uploadMedia('my_avatar', <Image fileData={Buffer.from('')} />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"attachment [ my_avatar ] already exist"`
  );

  expect(state.set.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock).toHaveBeenCalledWith('my_avatar', '1857777774821032');
});
