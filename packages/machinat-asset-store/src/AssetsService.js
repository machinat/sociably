// @flow
import invariant from 'invariant';
import Machinat from 'machinat';
import type { AssetsProviderProps, AssetsConsumerProps } from './types';

type AssetIdResult = void | string | number;

const AssetsService = Machinat.createService<
  AssetIdResult,
  AssetsProviderProps,
  AssetsConsumerProps
>(({ accessor }: AssetsProviderProps = {}) => {
  invariant(
    accessor,
    'provide prop of AssetsService.Provider must not be empty'
  );

  return async ({
    fetch: { resource, name, invariant: isInvariant },
  }: AssetsConsumerProps) => {
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

export default AssetsService;
