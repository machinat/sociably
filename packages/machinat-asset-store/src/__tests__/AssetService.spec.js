import moxy from 'moxy';
import { MACHINAT_SERVICE_TYPE } from 'machinat';
import AssetService from '../AssetService';

const assetsAccessor = moxy({
  getAsset: async () => '_stored_asset_id_',
});

beforeEach(() => {
  assetsAccessor.mock.reset();
});

it('is machinat service', () => {
  expect(AssetService.$$typeof).toBe(MACHINAT_SERVICE_TYPE);
});

it('return stored id', async () => {
  await expect(
    AssetService._serve(assetsAccessor)({ resource: 'villager', tag: 'John' })
  ).resolves.toBe('_stored_asset_id_');

  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledTimes(1);
  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledWith('villager', 'John');
});

it('return undefined if asset not existed', async () => {
  assetsAccessor.getAsset.mock.fake(async () => undefined);

  await expect(
    AssetService._serve(assetsAccessor)({ resource: 'villager', tag: 'Mary' })
  ).resolves.toBe(undefined);

  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledTimes(1);
  expect(assetsAccessor.getAsset.mock).toHaveBeenCalledWith('villager', 'Mary');
});

it('throw if consumption.invariant set to true and asset not existed', async () => {
  assetsAccessor.getAsset.mock.fake(async () => undefined);

  await expect(
    AssetService._serve(assetsAccessor)({
      resource: 'villager',
      tag: 'Joe',
      invariant: true,
    })
  ).rejects.toThrowErrorMatchingInlineSnapshot(
    `"asset ( villager [ Joe ] ) not existed"`
  );
});

it('throw if accessor not given', () => {
  expect(() =>
    AssetService._serve()({ resource: 'villager', tag: 'Mary' })
  ).toThrowErrorMatchingInlineSnapshot(
    `"provide prop of AssetService.Provider must not be empty"`
  );
});
