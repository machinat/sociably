// @flow
import invariant from 'invariant';
import Machinat from 'machinat';
import type { ScopedAssetAccessor, AssetConsumerTarget } from './types';

const AssetService = Machinat.createService<
  void | string | number,
  ScopedAssetAccessor,
  AssetConsumerTarget
>((_accessor?: ScopedAssetAccessor) => {
  invariant(
    _accessor,
    'provide prop of AssetService.Provider must not be empty'
  );

  const accessor = _accessor; // NOTE: to satisfy flow
  return async ({
    resource,
    tag,
    invariant: isInvariant,
  }: AssetConsumerTarget) => {
    const id = await accessor.getAsset(resource, tag);

    if (isInvariant) {
      invariant(
        id !== undefined,
        `asset ( ${resource} [ ${tag} ] ) not existed`
      );
    }

    return id;
  };
});

export default AssetService;
