// @flow
export interface AssetStore {
  getAsset(
    platform: string,
    entity: string,
    resource: string,
    name: string
  ): Promise<void | string | number>;

  setAsset(
    platform: string,
    entity: string,
    resource: string,
    name: string,
    id: string | number
  ): Promise<boolean>;

  listAssets(
    platform: string,
    entity: string,
    resource: string
  ): Promise<null | Map<string, string | number>>;

  deleteAsset(
    platform: string,
    entity: string,
    resource: string,
    name: string
  ): Promise<boolean>;
}

export interface ScopedAssetAccessor {
  getAsset(resource: string, name: string): Promise<void | string | number>;

  setAsset(
    resource: string,
    name: string,
    id: string | number
  ): Promise<boolean>;

  listAssets(resource: string): Promise<null | Map<string, string | number>>;

  deleteAsset(
    resource: string,
    name: string,
    id: string | number
  ): Promise<boolean>;
}
