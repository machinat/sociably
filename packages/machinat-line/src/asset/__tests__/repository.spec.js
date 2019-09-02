import moxy from 'moxy';
import LineAssetRepository from '../repository';

const store = moxy({
  get: async () => '_ID_',
  set: async () => true,
  list: async () => new Map([['bar', 'baz']]),
  delete: async () => true,
  deleteById: async () => true,
});

const bot = moxy({
  options: { channelId: '_LINE_CHANNEL_ID_' },
});

beforeEach(() => {
  store.mock.reset();
  bot.mock.reset();
});

test('#getAsset() delegate call to store.get', async () => {
  const repository = new LineAssetRepository(store, bot);

  await expect(repository.getAsset('foo', 'bar')).resolves.toBe('_ID_');
  expect(store.get.mock).toHaveBeenCalledTimes(1);
  expect(store.get.mock).toHaveBeenCalledWith(
    'line',
    '_LINE_CHANNEL_ID_',
    'foo',
    'bar'
  );

  store.get.mock.fake(async () => undefined);

  await expect(repository.getAsset('foo', 'bar')).resolves.toBe(undefined);
  expect(store.get.mock).toHaveBeenCalledTimes(2);
});

test('#setAsset() delegate call to store.set', async () => {
  const repository = new LineAssetRepository(store, bot);

  await expect(repository.setAsset('foo', 'bar', 'baz')).resolves.toBe(true);
  expect(store.set.mock).toHaveBeenCalledTimes(1);
  expect(store.set.mock).toHaveBeenCalledWith(
    'line',
    '_LINE_CHANNEL_ID_',
    'foo',
    'bar',
    'baz'
  );

  store.set.mock.fake(async () => false);

  await expect(repository.setAsset('foo', 'bar', 'baz')).resolves.toBe(false);
  expect(store.set.mock).toHaveBeenCalledTimes(2);
});

test('#listAssets() delegate call to store.list', async () => {
  const repository = new LineAssetRepository(store, bot);

  await expect(repository.listAssets('foo')).resolves.toEqual(
    new Map([['bar', 'baz']])
  );
  expect(store.list.mock).toHaveBeenCalledTimes(1);
  expect(store.list.mock).toHaveBeenCalledWith(
    'line',
    '_LINE_CHANNEL_ID_',
    'foo'
  );

  store.list.mock.fake(async () => null);

  await expect(repository.listAssets('foo')).resolves.toBe(null);
  expect(store.list.mock).toHaveBeenCalledTimes(2);
});

test('#deleteAsset() delegate call to store.delete', async () => {
  const repository = new LineAssetRepository(store, bot);

  await expect(repository.deleteAsset('foo', 'bar')).resolves.toBe(true);
  expect(store.delete.mock).toHaveBeenCalledTimes(1);
  expect(store.delete.mock).toHaveBeenCalledWith(
    'line',
    '_LINE_CHANNEL_ID_',
    'foo',
    'bar'
  );

  store.delete.mock.fake(async () => false);

  await expect(repository.deleteAsset('foo', 'bar')).resolves.toBe(false);
  expect(store.delete.mock).toHaveBeenCalledTimes(2);
});

test('#deleteAssetById() delegate call to store.delete', async () => {
  const repository = new LineAssetRepository(store, bot);

  await expect(repository.deleteAssetById('foo', 'baz')).resolves.toBe(true);
  expect(store.deleteById.mock).toHaveBeenCalledTimes(1);
  expect(store.deleteById.mock).toHaveBeenCalledWith(
    'line',
    '_LINE_CHANNEL_ID_',
    'foo',
    'baz'
  );

  store.deleteById.mock.fake(async () => false);

  await expect(repository.deleteAssetById('foo', 'baz')).resolves.toBe(false);
  expect(store.deleteById.mock).toHaveBeenCalledTimes(2);
});
