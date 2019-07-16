// @flow
import invariant from 'invariant';
import Machinat from 'machinat';
import type { ScopedAssetAccessor, ResourceConsumption } from './types';

const AssetService = Machinat.createService<
  void | string | number,
  ScopedAssetAccessor,
  ResourceConsumption
>((_accessor?: ScopedAssetAccessor) => {
  invariant(
    _accessor,
    'provide prop of AssetService.Provider must not be empty'
  );

  const accessor = _accessor; // NOTE: to satisfy flow
  return async ({
    resource,
    name,
    invariant: isInvariant,
  }: ResourceConsumption) => {
    const id = await accessor.getAsset(resource, name);

    if (isInvariant) {
      invariant(
        id !== undefined,
        `asset ( ${resource} [ ${name} ] ) not existed`
      );
    }

    return id;
  };
});

export default AssetService;
