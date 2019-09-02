import moxy from 'moxy';
import { MACHINAT_SERVICE_TYPE } from 'machinat';
import AssetsService from '../AssetsService';

const assetsAccessor = moxy({
  getAsset: async () => '_stored_asset_id_',
});

beforeEach(() => {
  assetsAccessor.mock.reset();
});

it('is machinat service', () => {
  expect(AssetsService.$$typeof).toBe(MACHINAT_SERVICE_TYPE);
});

it('return stored id', async () => {
  await expect(
    AssetsService._serve({ accessor: assetsAccessor })({
      fetch: { resource: 'villager', name: 'John' },
    })
  ).resolves.toBe('_stored_asset_id_');

  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledTimes(1);
  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledWith('villager', 'John');
});

it('return undefined if asset not existed', async () => {
  assetsAccessor.getAsset.mock.fake(async () => undefined);

  await expect(
    AssetsService._serve({ accessor: assetsAccessor })({
      fetch: { resource: 'villager', name: 'Mary' },
    })
  ).resolves.toBe(undefined);

  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledTimes(1);
  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledWith('villager', 'Mary');
});

it('throw if consumption.invariant set to true and asset not existed', async () => {
  assetsAccessor.getAsset.mock.fake(async () => undefined);

  await expect(
    AssetsService._serve({ accessor: assetsAccessor })({
      fetch: { resource: 'villager', name: 'Joe', invariant: true },
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"asset ( villager [ Joe ] ) not existed"`
  );
});

it('throw if accessor not given', () => {
  expect(() =>
    AssetsService._serve()({ fetch: { resource: 'villager', name: 'Mary' } })
  ).toThrowErrorMatchingInlineSnapshot(
    `"provide prop of AssetsService.Provider must not be empty"`
  );
});
