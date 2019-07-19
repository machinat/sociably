// @flow
export interface AssetStore {
  get(
    platform: string,
    entity: string,
    resource: string,
    label: string
  ): Promise<void | string | number>;

  set(
    platform: string,
    entity: string,
    resource: string,
    label: string,
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
    label: string
  ): Promise<boolean>;

  deleteById(
    platform: string,
    entity: string,
    resource: string,
    id: string
  ): Promise<boolean>;
}

export interface ScopedAssetAccessor {
  getAsset(resource: string, label: string): Promise<void | string | number>;

  setAsset(
    resource: string,
    label: string,
    id: string | number
  ): Promise<boolean>;

  listAssets(resource: string): Promise<null | Map<string, string | number>>;
  deleteAsset(resource: string, label: string): Promise<boolean>;
  deleteAssetById(resource: string, id: string): Promise<boolean>;
}

export type ResourceConsumption = {|
  resource: string,
  label: string,
  invariant: boolean,
|};
