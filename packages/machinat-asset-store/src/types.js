// @flow
export interface AssetStore {
  get(
    platform: string,
    entity: string,
    resource: string,
    tag: string
  ): Promise<void | string | number>;

  set(
    platform: string,
    entity: string,
    resource: string,
    tag: string,
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
    tag: string
  ): Promise<boolean>;

  deleteById(
    platform: string,
    entity: string,
    resource: string,
    id: string
  ): Promise<boolean>;
}

export interface ScopedAssetAccessor {
  getAsset(resource: string, tag: string): Promise<void | string | number>;

  setAsset(
    resource: string,
    tag: string,
    id: string | number
  ): Promise<boolean>;

  listAssets(resource: string): Promise<null | Map<string, string | number>>;
  deleteAsset(resource: string, tag: string): Promise<boolean>;
  deleteAssetById(resource: string, id: string): Promise<boolean>;
}

export type AssetConsumerTarget = {|
  resource: string,
  tag: string,
  invariant: boolean,
|};
