import moxy from 'moxy';
import { MACHINAT_SERVICE_TYPE } from 'machinat';
import AssetsService from '../AssetsService';

const assetsRepository = moxy({
  getAsset: async () => '_stored_asset_id_',
});

beforeEach(() => {
  assetsRepository.mock.reset();
});

it('is machinat service', () => {
  expect(AssetsService.$$typeof).toBe(MACHINAT_SERVICE_TYPE);
});

it('return stored id', async () => {
  await expect(
    AssetsService._serve({ repository: assetsRepository })({
      fetch: { resource: 'villager', name: 'John' },
    })
  ).resolves.toBe('_stored_asset_id_');

  expect(assetsRepository.getAsset.mock).toHaveBeenCalledTimes(1);
  expect(assetsRepository.getAsset.mock).toHaveBeenCalledWith(
    'villager',
    'John'
  );
});

it('return undefined if asset not existed', async () => {
  assetsRepository.getAsset.mock.fake(async () => undefined);

  await expect(
    AssetsService._serve({ repository: assetsRepository })({
      fetch: { resource: 'villager', name: 'Mary' },
    })
  ).resolves.toBe(undefined);

  expect(assetsRepository.getAsset.mock).toHaveBeenCalledTimes(1);
  expect(assetsRepository.getAsset.mock).toHaveBeenCalledWith(
    'villager',
    'Mary'
  );
});

it('throw if consumption.invariant set to true and asset not existed', async () => {
  assetsRepository.getAsset.mock.fake(async () => undefined);

  await expect(
    AssetsService._serve({ repository: assetsRepository })({
      fetch: { resource: 'villager', name: 'Joe', invariant: true },
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"asset ( villager [ Joe ] ) not existed"`
  );
});

it('throw if repository not given', () => {
  expect(() =>
    AssetsService._serve()({ fetch: { resource: 'villager', name: 'Mary' } })
  ).toThrowErrorMatchingInlineSnapshot(
    `"provide prop of AssetsService.Provider must not be empty"`
  );
});
