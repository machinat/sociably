// @flow
import invariant from 'invariant';
import Machinat from 'machinat';
import type { AssetProviderProps, AssetConsumerProps } from './types';

type AssetIdResult = void | string | number;

const AssetService = Machinat.createService<
  AssetIdResult,
  AssetProviderProps,
  AssetConsumerProps
>(({ accessor }: AssetProviderProps = {}) => {
  invariant(
    accessor,
    'provide prop of AssetService.Provider must not be empty'
  );

  return async ({
    fetch: { resource, name, invariant: isInvariant },
  }: AssetConsumerProps) => {
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
