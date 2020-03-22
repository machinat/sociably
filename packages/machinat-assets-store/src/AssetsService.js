// @flow
import invariant from 'invariant';
import Machinat from '@machinat/core';
import type { AssetsProviderProps, AssetsConsumerProps } from './types';

type AssetIdResult = void | string | number;

const AssetsService = Machinat.createService<
  AssetIdResult,
  AssetsProviderProps,
  AssetsConsumerProps
>(({ repository }: AssetsProviderProps = {}) => {
  invariant(
    repository,
    'provide prop of AssetsService.Provider must not be empty'
  );

  return async ({
    fetch: { resource, name, invariant: isInvariant },
  }: AssetsConsumerProps) => {
    const id = await repository.getAsset(resource, name);

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
