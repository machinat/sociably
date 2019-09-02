// @flow
export interface AssetsStore {
  get(
    platform: string,
    entity: string,
    resource: string,
    name: string
  ): Promise<void | string | number>;

  set(
    platform: string,
    entity: string,
    resource: string,
    name: string,
    id: string | number
  ): Promise<boolean>;

  list(
    platform: string,
    entity: string,
    resource: string
  ): Promise<null | Map<string, string | number>>;

  delete(
    platform: string,
    entity: string,
    resource: string,
    name: string
  ): Promise<boolean>;

  deleteById(
    platform: string,
    entity: string,
    resource: string,
    id: string
  ): Promise<boolean>;
}

export interface AssetsRepository {
  getAsset(resource: string, name: string): Promise<void | string | number>;

  setAsset(
    resource: string,
    name: string,
    id: string | number
  ): Promise<boolean>;

  listAssets(resource: string): Promise<null | Map<string, string | number>>;
  deleteAsset(resource: string, name: string): Promise<boolean>;
  deleteAssetById(resource: string, id: string): Promise<boolean>;
}

export type AssetsProviderProps = {| repository: AssetsRepository |};

export type AssetsConsumerTarget = {|
  resource: string,
  name: string,
  invariant: boolean,
|};

export type AssetsConsumerProps = {| fetch: AssetsConsumerTarget |};
