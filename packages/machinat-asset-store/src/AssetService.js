// @flow
import invariant from 'invariant';
import Machinat from 'machinat';
import type { ScopedAssetAccessor } from './types';

type ResourceConsumption = {|
  resource: string,
  name: string,
|};

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
  return async ({ resource, name }: ResourceConsumption) => {
    const id = await accessor.getAsset(resource, name);
    return id;
  };
});

export default AssetService;
