import moxy from '@moxyjs/moxy';
import Sociably from '@sociably/core';
import type StateControllerI from '@sociably/core/base/StateController';
import type { FacebookBot } from '../../Bot';
import FacebookPage from '../../Page';
import { FacebookAssetsManager } from '../AssetsManager';

const state = moxy({
  get: async () => null,
  set: async () => false,
  update: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const page = new FacebookPage('__PAGE_ID__');

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

const pageSettings = {
  pageId: page.id,
  accessToken: '__ACCESS_TOKEN__',
};
const pageSettingsAccessor = {
  getChannelSettings: async () => pageSettings,
  getChannelSettingsBatch: async () => [pageSettings],
  listAllChannelSettings: async () => [pageSettings],
};

beforeEach(() => {
  stateController.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );

  await expect(manager.getAssetId(page, 'foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getAttachment(page, 'my_attachment')).resolves.toBe(
    undefined
  );
  await expect(manager.getPersona(page, 'my_persona')).resolves.toBe(undefined);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "fb.assets.__PAGE_ID__.foo",
      "fb.assets.__PAGE_ID__.attachment",
      "fb.assets.__PAGE_ID__.persona",
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
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );

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
    Array [
      "fb.assets.__PAGE_ID__.foo",
      "fb.assets.__PAGE_ID__.attachment",
      "fb.assets.__PAGE_ID__.persona",
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
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );

  await expect(manager.getAllAssets(page, 'foo')).resolves.toBe(null);
  await expect(manager.getAllAttachments(page)).resolves.toBe(null);
  await expect(manager.getAllPersonas(page)).resolves.toBe(null);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "fb.assets.__PAGE_ID__.foo",
      "fb.assets.__PAGE_ID__.attachment",
      "fb.assets.__PAGE_ID__.persona",
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
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );

  await expect(manager.unsaveAssetId(page, 'foo', 'bar')).resolves.toBe(true);
  await expect(manager.unsaveAttachment(page, 'my_attachment')).resolves.toBe(
    true
  );
  await expect(manager.unsavePersona(page, 'my_persona')).resolves.toBe(true);

  expect(stateController.globalState).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "fb.assets.__PAGE_ID__.foo",
      "fb.assets.__PAGE_ID__.attachment",
      "fb.assets.__PAGE_ID__.persona",
    ]
  `);

  expect(state.delete).toHaveBeenCalledTimes(3);
  expect(state.delete).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete).toHaveBeenNthCalledWith(2, 'my_attachment');
  expect(state.delete).toHaveBeenNthCalledWith(3, 'my_persona');

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId(page, 'foo', 'bar')).resolves.toBe(false);
  await expect(manager.unsaveAttachment(page, 'my_attachment')).resolves.toBe(
    false
  );
  await expect(manager.unsavePersona(page, 'my_persona')).resolves.toBe(false);
  expect(state.delete).toHaveBeenCalledTimes(6);
});

test('.uploadChatAttachment()', async () => {
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );
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

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ATTACHMENT_');
  await expect(
    manager.uploadChatAttachment(
      page,
      'my_avatar',
      <img src="http://foo.bar/avatar" />
    )
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"attachment [ my_avatar ] already exist"`
  );

  expect(state.set).toHaveBeenCalledTimes(1);
  expect(state.set).toHaveBeenCalledWith('my_avatar', '1857777774821032');
});

test('.createPersona()', async () => {
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );
  bot.requestApi.mock.fake(() => ({
    id: '_PERSONA_ID_',
  }));

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
    params: {
      name: 'Baby Yoda',
      profile_picture_url: '_URL_',
    },
  });

  state.get.mock.fake(async () => '_ALREADY_EXISTED_PERSONA_');
  await expect(
    manager.createPersona(page, 'cute_persona', {
      name: 'BB8',
      profilePictureUrl: '_URL_',
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"persona [ cute_persona ] already exist"`
  );

  expect(state.set).toHaveBeenCalledTimes(1);
  expect(state.set).toHaveBeenCalledWith('cute_persona', '_PERSONA_ID_');
});

test('.deletePersona()', async () => {
  const manager = new FacebookAssetsManager(
    stateController,
    bot,
    pageSettingsAccessor
  );
  bot.requestApi.mock.fake(() => ({
    id: '_PERSONA_ID_',
  }));

  await expect(manager.deletePersona(page, 'my_persona')).resolves.toBe(false);
  expect(bot.requestApi).not.toHaveBeenCalled();

  state.get.mock.fake(async () => '_PERSONA_ID_');
  await expect(manager.deletePersona(page, 'my_persona')).resolves.toBe(true);

  expect(bot.requestApi).toHaveBeenCalledTimes(1);
  expect(bot.requestApi).toHaveBeenCalledWith({
    page,
    method: 'DELETE',
    url: '_PERSONA_ID_',
  });
  expect(state.delete).toHaveBeenCalledTimes(1);
  expect(state.delete).toHaveBeenCalledWith('my_persona');
});
