import moxy from 'moxy';
import Machinat from '@machinat/core';
import MessengerAssetRegistry from '../registry';

const state = moxy({
  get: async () => null,
  set: async () => true,
  getAll: async () => null,
  delete: async () => true,
  clear: () => {},
});

const stateManager = moxy({
  globalState() {
    return state;
  },
});

const bot = moxy({
  pageId: '_PAGE_ID_',
  renderAttachment() {
    return { jobs: [{}], results: [{}] };
  },
  dispatchAPICall() {},
});

beforeEach(() => {
  stateManager.mock.reset();
  state.mock.reset();
  bot.mock.reset();
});

test('get asset id', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);

  await expect(registry.getAssetId('foo', 'bar')).resolves.toBe(undefined);
  await expect(registry.getAttachmentId('my_attachment')).resolves.toBe(
    undefined
  );
  await expect(registry.getPersonaId('my_persona')).resolves.toBe(undefined);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets:_PAGE_ID_:foo",
      "messenger.assets:_PAGE_ID_:attachment",
      "messenger.assets:_PAGE_ID_:persona",
    ]
  `);

  expect(state.get.mock).toHaveBeenCalledTimes(3);
  expect(state.get.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.get.mock).toHaveBeenNthCalledWith(2, 'my_attachment');
  expect(state.get.mock).toHaveBeenNthCalledWith(3, 'my_persona');

  state.get.mock.fakeReturnValue('baz');
  await expect(registry.getAssetId('foo', 'bar')).resolves.toBe('baz');

  state.get.mock.fakeReturnValue('_ATTACHMENT_ID_');
  await expect(registry.getAttachmentId('my_attachment')).resolves.toBe(
    '_ATTACHMENT_ID_'
  );

  state.get.mock.fakeReturnValue('_PERSONA_ID_');
  await expect(registry.getPersonaId('my_persona')).resolves.toBe(
    '_PERSONA_ID_'
  );

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(6);
  expect(state.get.mock).toHaveBeenCalledTimes(6);
});

test('set asset id', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);

  await registry.setAssetId('foo', 'bar', 'baz');
  await registry.setAttachmentId('my_attachment', '_ATTACHMENT_ID_');
  await registry.setPersonaId('my_persona', '_PERSONA_ID_');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets:_PAGE_ID_:foo",
      "messenger.assets:_PAGE_ID_:attachment",
      "messenger.assets:_PAGE_ID_:persona",
    ]
  `);

  expect(state.set.mock).toHaveBeenCalledTimes(3);
  state.set.mock.calls.forEach(({ args: [key, updator] }, i) => {
    expect(key).toBe(
      i === 0 ? 'bar' : i === 1 ? 'my_attachment' : 'my_persona'
    );
    expect(updator(null)).toBe(
      i === 0 ? 'baz' : i === 1 ? '_ATTACHMENT_ID_' : '_PERSONA_ID_'
    );
  });

  state.set.mock.fake(async (_, updator) => {
    updator('_EXISTED_RESOURCE_ID_');
  });

  await expect(
    registry.setAssetId('foo', 'bar', 'baz')
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] already exist"`);

  await expect(
    registry.setAttachmentId('my_attachment', '_ATTACHMENT_ID_')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"attachment [ my_attachment ] already exist"`
  );

  await expect(
    registry.setPersonaId('my_persona', '_PERSONA_ID_')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"persona [ my_persona ] already exist"`
  );
});

test('get all assets', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);

  await expect(registry.getAllAssets('foo')).resolves.toBe(null);
  await expect(registry.getAllAttachments()).resolves.toBe(null);
  await expect(registry.getAllPersonas()).resolves.toBe(null);

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets:_PAGE_ID_:foo",
      "messenger.assets:_PAGE_ID_:attachment",
      "messenger.assets:_PAGE_ID_:persona",
    ]
  `);

  expect(state.getAll.mock).toHaveBeenCalledTimes(3);

  const resources = new Map([
    ['bar', '1'],
    ['baz', '2'],
  ]);
  state.getAll.mock.fake(async () => resources);

  await expect(registry.getAllAssets('foo')).resolves.toEqual(resources);
  await expect(registry.getAllAttachments()).resolves.toEqual(resources);
  await expect(registry.getAllPersonas()).resolves.toEqual(resources);
});

test('remove asset id', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);

  await registry.removeAssetId('foo', 'bar');
  await registry.removeAttachmentId('my_attachment');
  await registry.removePersonaId('my_persona');

  expect(stateManager.globalState.mock).toHaveBeenCalledTimes(3);
  expect(stateManager.globalState.mock.calls.map((call) => call.args[0]))
    .toMatchInlineSnapshot(`
    Array [
      "messenger.assets:_PAGE_ID_:foo",
      "messenger.assets:_PAGE_ID_:attachment",
      "messenger.assets:_PAGE_ID_:persona",
    ]
  `);

  expect(state.delete.mock).toHaveBeenCalledTimes(3);
  expect(state.delete.mock).toHaveBeenNthCalledWith(1, 'bar');
  expect(state.delete.mock).toHaveBeenNthCalledWith(2, 'my_attachment');
  expect(state.delete.mock).toHaveBeenNthCalledWith(3, 'my_persona');

  state.delete.mock.fake(async () => false);
  await expect(
    registry.removeAssetId('foo', 'bar')
  ).rejects.toThrowErrorMatchingInlineSnapshot(`"foo [ bar ] not exist"`);

  await expect(
    registry.removeAttachmentId('my_attachment')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"attachment [ my_attachment ] not exist"`
  );

  await expect(
    registry.removePersonaId('my_persona')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"persona [ my_persona ] not exist"`
  );
});

test('#renderAttachment()', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);
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
    registry.renderAttachment('my_avatar', <img src="http://foo.bar/avatar" />)
  ).resolves.toBe('1857777774821032');

  expect(bot.renderAttachment.mock).toHaveBeenCalledTimes(1);
  expect(bot.renderAttachment.mock).toHaveBeenCalledWith(
    <img src="http://foo.bar/avatar" />
  );

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_ATTACHMENT_');
  await expect(
    registry.renderAttachment('my_avatar', <img src="http://foo.bar/avatar" />)
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"attachment [ my_avatar ] already exist"`
  );
});

test('#createPersona()', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);
  bot.dispatchAPICall.mock.fake(() => ({
    jobs: [{ ...{} }],
    results: [
      {
        code: 201,
        headers: {},
        body: { id: '_PERSONA_ID_' },
      },
    ],
  }));

  await expect(
    registry.createPersona('cute_persona', {
      name: 'Baby Yoda',
      profile_picture_url: '_URL_',
    })
  ).resolves.toBe('_PERSONA_ID_');

  expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
  expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith('POST', 'me/personas', {
    name: 'Baby Yoda',
    profile_picture_url: '_URL_',
  });

  state.get.mock.fakeReturnValue('_ALREADY_EXISTED_PERSONA_');
  await expect(
    registry.createPersona('cute_persona', {
      name: 'BB8',
      profile_picture_url: '_URL_',
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"persona [ cute_persona ] already exist"`
  );
});

test('#deletePersona()', async () => {
  const registry = new MessengerAssetRegistry(stateManager, bot);
  bot.dispatchAPICall.mock.fake(() => ({
    jobs: [{ ...{} }],
    results: [
      {
        code: 200,
        headers: {},
        body: { id: '_PERSONA_ID_' },
      },
    ],
  }));

  await expect(
    registry.deletePersona('my_persona')
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"persona [ my_persona ] not exist"`
  );

  state.get.mock.fakeReturnValue('_PERSONA_ID_');
  await expect(registry.deletePersona('my_persona')).resolves.toBe(
    '_PERSONA_ID_'
  );

  expect(bot.dispatchAPICall.mock).toHaveBeenCalledTimes(1);
  expect(bot.dispatchAPICall.mock).toHaveBeenCalledWith(
    'DELETE',
    '_PERSONA_ID_'
  );
});
