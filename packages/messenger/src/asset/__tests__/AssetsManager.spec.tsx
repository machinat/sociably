import moxy from '@moxyjs/moxy';
import Machinat from '@machinat/core';
import type StateControllerI from '@machinat/core/base/StateController';
import type { MessengerBot } from '../../Bot';
import { MessengerAssetsManager } from '../AssetsManager';

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

const bot = moxy<MessengerBot>({
  pageId: '_PAGE_ID_',
  renderAttachment() {
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
  const manager = new MessengerAssetsManager(stateController, bot);

  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(manager.getAttachment('my_attachment')).resolves.toBe(undefined);
  await expect(manager.getPersona('my_persona')).resolves.toBe(undefined);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets._PAGE_ID_.foo",
      "messenger.assets._PAGE_ID_.attachment",
      "messenger.assets._PAGE_ID_.persona",
    ]
  `);

  expect(state.get.mock).toHaveBeenCalledTimes(3);
  expect(state.get.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(2, 'my_attachment');
  expect(state.get.mock).toHaveBeenNthCalledWith(3, 'my_persona');

  state.get.mock.fakeReturnValue('baz');
  await expect(manager.getAssetId('foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_ATTACHMENT_ID_');
  await expect(manager.getAttachment('my_attachment')).resolves.toBe(
    '_ATTACHMENT_ID_'
  );

  state.get.mock.fakeReturnValue('_PERSONA_ID_');
  await expect(manager.getPersona('my_persona')).resolves.toBe('_PERSONA_ID_');

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.get.mock).toHaveBeenCalledTimes(6);
});

test('set asset id', async () => {
  const manager = new MessengerAssetsManager(stateController, bot);

  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(false);
  await expect(
    manager.saveAttachment('my_attachment', '_ATTACHMENT_ID_')
  ).resolves.toBe(false);
  await expect(manager.savePersona('my_persona', '_PERSONA_ID_')).resolves.toBe(
    false
  );

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets._PAGE_ID_.foo",
      "messenger.assets._PAGE_ID_.attachment",
      "messenger.assets._PAGE_ID_.persona",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(3);
  expect(state.set.mock).toHaveBeenNthCalledWith(1, 'bar', 'baz');
  expect(state.set.mock).toHaveBeenNthCalledWith(
    2,
    'my_attachment',
    '_ATTACHMENT_ID_'
  );
  expect(state.set.mock).toHaveBeenNthCalledWith(
    3,
    'my_persona',
    '_PERSONA_ID_'
  );

  state.set.mock.fake(async () => true);
  await expect(manager.saveAssetId('foo', 'bar', 'baz')).resolves.toBe(true);
  await expect(
    manager.saveAttachment('my_attachment', '_ATTACHMENT_ID_')
  ).resolves.toBe(true);
  await expect(manager.savePersona('my_persona', '_PERSONA_ID_')).resolves.toBe(
    true
  );
  expect(state.set.mock).toHaveBeenCalledTimes(6);
});

test('get all assets', async () => {
  const manager = new MessengerAssetsManager(stateController, bot);

  await expect(manager.getAllAssets('foo')).resolves.toBe(null);
  await expect(manager.getAllAttachments()).resolves.toBe(null);
  await expect(manager.getAllPersonas()).resolves.toBe(null);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets._PAGE_ID_.foo",
      "messenger.assets._PAGE_ID_.attachment",
      "messenger.assets._PAGE_ID_.persona",
    ]
  `);

  expect(state.getAll.mock).toHaveBeenCalledTimes(3);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(manager.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(manager.getAllAttachments()).resolves.toEqual(resources);
  await expect(manager.getAllPersonas()).resolves.toEqual(resources);
});

test('remove asset id', async () => {
  const manager = new MessengerAssetsManager(stateController, bot);

  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(true);
  await expect(manager.unsaveAttachment('my_attachment')).resolves.toBe(true);
  await expect(manager.unsavePersona('my_persona')).resolves.toBe(true);

  expect(stateController.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateController.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets._PAGE_ID_.foo",
      "messenger.assets._PAGE_ID_.attachment",
      "messenger.assets._PAGE_ID_.persona",
    ]
  `);

  expect(state.delete.mock).toHaveBeenCalledTimes(3);
  expect(state.delete.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(2, 'my_attachment');
  expect(state.delete.mock).toHaveBeenNthCalledWith(3, 'my_persona');

  state.delete.mock.fake(async () => false);
  await expect(manager.unsaveAssetId('foo', 'bar')).resolves.toBe(false);
  await expect(manager.unsaveAttachment('my_attachment')).resolves.toBe(false);
  await expect(manager.unsavePersona('my_persona')).resolves.toBe(false);
  expect(state.delete.mock).toHaveBeenCalledTimes(6);
});

test('#renderAttachment()', async () => {
  const manager = new MessengerAssetsManager(stateController, bot);
  bot.renderAttachment.mock.fake(async () => ({
    jobs: [{ ...{} }],
    results: [
      {
        code: 201,
        headers: {},
        body: { attachment_id: '1857777774821032' },
      },
    ],
  }));

  await expect(
    manager.renderAttachment('my_avatar', <img src="http://foo.bar/avatar" />)
  ).resolves.toBe('1857777774821032');

  expect(bot.renderAttachment.mock).toHaveBeenCalledTimes(1);
  expect(bot.renderAttachment.mock).toHaveBeenCalledWith(
    <img src="http://foo.bar/avatar" />
  );

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ATTACHMENT_');
  await expect(
    manager.renderAttachment('my_avatar', <img src="http://foo.bar/avatar" />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"attachment [ my_avatar ] already exist"`
  );

  expect(state.set.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock).toHaveBeenCalledWith('my_avatar', '1857777774821032');
});

test('#createPersona()', async () => {
  const manager = new MessengerAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(() => ({
    id: '_PERSONA_ID_',
  }));

  await expect(
    manager.createPersona('cute_persona', {
      name: 'Baby Yoda',
      profile_picture_url: '_URL_',
    })
  ).resolves.toBe('_PERSONA_ID_');

  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledWith('POST', 'me/personas', {
    name: 'Baby Yoda',
    profile_picture_url: '_URL_',
  });

  state.get.mock.fake(async () => '_ALREADY_EXISTED_PERSONA_');
  await expect(
    manager.createPersona('cute_persona', {
      name: 'BB8',
      profile_picture_url: '_URL_',
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"persona [ cute_persona ] already exist"`
  );

  expect(state.set.mock).toHaveBeenCalledTimes(1);
  expect(state.set.mock).toHaveBeenCalledWith('cute_persona', '_PERSONA_ID_');
});

test('#deletePersona()', async () => {
  const manager = new MessengerAssetsManager(stateController, bot);
  bot.makeApiCall.mock.fake(() => ({
    id: '_PERSONA_ID_',
  }));

  await expect(manager.deletePersona('my_persona')).resolves.toBe(false);
  expect(bot.makeApiCall.mock).not.toHaveBeenCalled();

  state.get.mock.fake(async () => '_PERSONA_ID_');
  await expect(manager.deletePersona('my_persona')).resolves.toBe(true);

  expect(bot.makeApiCall.mock).toHaveBeenCalledTimes(1);
  expect(bot.makeApiCall.mock).toHaveBeenCalledWith('DELETE', '_PERSONA_ID_');
  expect(state.delete.mock).toHaveBeenCalledTimes(1);
  expect(state.delete.mock).toHaveBeenCalledWith('my_persona');
});
